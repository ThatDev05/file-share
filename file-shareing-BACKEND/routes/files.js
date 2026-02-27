const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const File = require('../model/file');
const { v4: uuid4 } = require('uuid');
const { put } = require('@vercel/blob');
const QRCode = require('qrcode');

const os = require('os');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
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
        const pin = Math.floor(100000 + Math.random() * 900000).toString();

        //store into db
        const file = new File({
            filename: req.file.filename,
            uuid: uuid,
            path: req.file.path,
            size: req.file.size,
            pin: pin
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
                const qrCodeDataUrl = await QRCode.toDataURL(fileUrl);
                console.log('Generated URL:', fileUrl);
                console.log('APP_BASE_URL:', process.env.APP_BASE_URL);
                
                return res.json({ 
                    file: fileUrl,
                    uuid: response.uuid, // Include UUID in response for email step
                    pin: response.pin,
                    qrCode: qrCodeDataUrl
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

router.get('/pin/:pin', async (req, res) => {
    try {
        const file = await File.findOne({ pin: req.params.pin });
        if (!file) {
            return res.status(404).json({ error: 'Invalid PIN' });
        }
        return res.json({ uuid: file.uuid });
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error while looking up PIN' });
    }
});

module.exports = router;