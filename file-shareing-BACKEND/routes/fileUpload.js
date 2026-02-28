const router = require('express').Router();
const multer = require('multer');
const os = require('os');
const File = require('../model/file');
const path = require('path');
const { put } = require('@vercel/blob');

// Use memory storage in serverless environments to avoid disk writes
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 1000000 * 100 // 100MB limit
    }
});

router.post('/fileupload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Upload to Vercel Blob
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname)}`;
        const blob = await put(`fileupload/${uniqueName}`, req.file.buffer, {
            access: 'public',
            contentType: req.file.mimetype
        });

        // Create file document
        const file = new File({
            filename: req.file.originalname,
            path: blob.url,
            url: blob.url,
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
