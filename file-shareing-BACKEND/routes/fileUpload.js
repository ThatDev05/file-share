const router = require('express').Router();
const multer = require('multer');
const os = require('os');
const File = require('../model/file');
const path = require('path');

// Use system temp directory in serverless environments (writable).
const upload = multer({
    dest: os.tmpdir(),
    limits: {
        fileSize: 1000000 * 100 // 100MB limit
    }
});

router.post('/fileupload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Create file document
        const file = new File({
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size,
            originalName: req.file.originalname,
            uuid: Math.random().toString(36).substring(2, 15), // add basic uuid just in case since required
            pin: Math.floor(100000 + Math.random() * 900000).toString()
        });

        // Save to database
        const response = await file.save();
        return res.json({ 
            file: `${process.env.APP_BASE_URL}/files/${response._id}`
        });
    } catch (err) {
        console.error('Error in file upload:', err);
        return res.status(500).json({ error: 'Something went wrong' });
    }
});

module.exports = router;
