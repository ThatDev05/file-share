const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const File = require('../model/file');
const { v4: uuid4 } = require('uuid');
const { put } = require('@vercel/blob');

const os = require('os');

//storage — write to system temp dir in serverless environments
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, os.tmpdir()),
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

let upload = multer({ storage, limits: { fileSize: 1000000 * 200 } }).single('file');

router.post('/', (req, res) => {
    // Set JSON content type
    res.setHeader('Content-Type', 'application/json');

    console.log('File upload started', {
        contentType: req.get('content-type'),
        bodySize: req.get('content-length')
    });

    //store file
    upload(req, res, async (err) => {
        if (err) {
            console.error('Upload error:', {
                message: err.message,
                code: err.code,
                field: err.field
            });
            return res.status(500).json({ error: err.message });
        }
        
        // validate request
        if (!req.file) {
            console.log('No file in request. Request body:', req.body);
            return res.json({ message: 'No file uploaded' });
        }

        console.log('File received:', {
            filename: req.file.filename,
            size: req.file.size,
            mimetype: req.file.mimetype,
            path: req.file.path
        });

        const uuid = uuid4();

        // Upload to Vercel Blob for persistent storage
        let blobUrl = null;
        try {
            const fileBuffer = await fs.readFile(req.file.path);
            const blobName = `uploads/${uuid}-${req.file.originalname || req.file.filename}`;
            const blob = await put(blobName, fileBuffer, {
                access: 'public',
                contentType: req.file.mimetype,
                token: process.env.BLOB_READ_WRITE_TOKEN
            });
            blobUrl = blob.url;
            console.log('Uploaded to Blob:', blobUrl);
        } catch (uploadErr) {
            console.error('Blob upload failed:', uploadErr);
            return res.status(500).json({ error: 'Failed to persist file to storage' });
        }

        //store into db
        const file = new File({
            filename: req.file.filename,
            uuid: uuid,
            path: req.file.path,
            url: blobUrl,
            size: req.file.size
        });

      //response --> link
            try {
                console.log('Attempting to save file to DB...');
                const response = await file.save();
                console.log('File saved successfully:', {
                    uuid: response.uuid,
                    id: response._id,
                    filename: response.filename
                });
                
                const fileUrl = `${process.env.APP_BASE_URL}/files/${response.uuid}`;
                console.log('Generated URL:', fileUrl);
                console.log('APP_BASE_URL:', process.env.APP_BASE_URL);
                
                return res.json({ 
                    file: fileUrl,
                    uuid: response.uuid // Include UUID in response for email step
                });
            } catch (dbError) {
                console.error('Database save error:', {
                    message: dbError.message,
                    code: dbError.code,
                    name: dbError.name
                });
                return res.status(500).json({ 
                    error: 'Failed to save file information',
                    details: dbError.message
                });
            }
       
    });
});


router.post('/send', async (req, res) => { 
    const { uuid, emailTo, emailFrom } = req.body;

    // validate request
    if (!uuid || !emailTo || !emailFrom) {
        return res.status(422).send({ error: 'All fields are required.' });
    }
    try {
        const file = await File.findOne({ uuid: uuid });
        if (!file) return res.status(404).send({ error: 'File not found.' });

        if (file.sender) {
            return res.status(422).send({ error: 'Email already sent once.' });
        }

        file.sender = emailFrom;
        file.receiver = emailTo;
        const response = await file.save();

        // send email (await and catch errors)
        const sendEmail = require('../services/emailService');
        await sendEmail({
            from: emailFrom,
            to: emailTo,
            subject: 'INShare File Sharing',
            text: `${emailFrom} shared a file with you.`,
            html: require('../services/emailTemplate')({
                emailFrom: emailFrom,
                downloadLink: `${process.env.APP_BASE_URL}/files/${file.uuid}`,
                size: (file.size / 1000).toFixed(2) + ' KB',
                expires: '24 hours'
            })
        });

        return res.send({ success: true });
    } catch (err) {
        console.error('Error in /api/files/send:', err);
        return res.status(500).send({ error: 'Internal server error' });
    }

})



module.exports = router;