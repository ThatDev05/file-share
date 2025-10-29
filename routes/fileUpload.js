const router = require('express').Router();
const multer = require('multer');
const File = require('../model/file');
const path = require('path');

const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 1000000 * 100 // 100MB limit
    }
});

router.get('/fileupload', (req, res) => {
    res.render('fileUpload');
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
            originalName: req.file.originalname
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
