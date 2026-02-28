const router = require('express').Router();
const multer = require('multer');
const mongoose = require('mongoose');
const { GridFsStorage } = require('multer-gridfs-storage');

// Configure GridFS Storage
const storage = new GridFsStorage({
    url: process.env.MONGO_CONNETION_URL,
    options: { useNewUrlParser: true, useUnifiedTopology: true },
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
            const fileInfo = {
                filename: filename,
                bucketName: 'uploads' 
            };
            resolve(fileInfo);
        });
    }
});

let upload = multer({ storage, limits: { fileSize: 1000000 * 200 } });

router.post('/fileupload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Create file metadata document
        const file = new File({
            filename: req.file.originalname,
            gridFsId: req.file.id, // ID from GridFS
            size: req.file.size,
            originalName: req.file.originalname,
            uuid: Math.random().toString(36).substring(2, 15), // basic uuid requirement
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
