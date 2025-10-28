const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const File = require('../model/file');
const { v4: uuid4 } = require('uuid');

//storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

let upload = multer({ storage, limits: { fileSize: 1000000 * 200 } }).single('file');

router.post('/', (req, res) => {
    //store file
    upload(req, res, async (err) => {
        if (err) {
            return res.status(500).send({ error: err.message });
        }
        
        // validate request
        if (!req.file) {
            return res.json({ message: 'No file uploaded' });
        }

        //store into db
        const file = new File({
            filename: req.file.filename,
            uuid: uuid4(),
            path: req.file.path,
            size: req.file.size               
        });

      //responce --> link
            const response = await file.save();
            return res.json({ file: `${process.env.APP_BASE_URL}/files/${response.uuid}` });
       
    });
});


router.post('/send', async (req, res) => { 
    const { uuid, emailTo, emailFrom } = req.body;

    // validate request
    if (!uuid || !emailTo || !emailFrom) {
        return res.status(422).send({ error: 'All fields are required.' });
    }
    const file = await File.findOne({ uuid: uuid });
    if (file.sender) {
        return res.status(422).send({ error: 'Email already sent once.' });
    }
    file.sender = emailFrom;
    file.receiver = emailTo;
    const response = await file.save();

    // send email
    const sendEmail = require('../services/emailService');
    sendEmail({
        from: emailFrom,
        to: emailTo,
        subject: 'INShare File Sharing',
        text: `${emailFrom} shared a file with you.`,
        html: require('../services/emailTemplate')({
            emailFrom: emailFrom,
            downloadLink: `${process.env.APP_BASE_URL}/files/${file.uuid}`,
            size: (file.size / 1000).toFixed(2) + ' KB',
            expires: '48 hours'
        })
    });
    return res.send({ success: true });

})



module.exports = router;