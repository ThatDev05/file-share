const router = require('express').Router();
const multer = require('multer');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const path = require('path');
const File = require('../model/file');

const { Readable } = require('stream');

// Use simple memory storage. We will stream this to GridFS manually.
const storage = multer.memoryStorage();
let upload = multer({ storage, limits: { fileSize: 1000000 * 200 } });

router.post('/fileupload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // 0. Ensure MongoDB is connected
        await connectDB();

        // 1. Initialize GridFS Bucket
        const db = mongoose.connection.db;
        const bucket = new mongoose.mongo.GridFSBucket(db, {
            bucketName: 'uploads'
        });

        // 2. Create the upload stream
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname)}`;
        const uploadStream = bucket.openUploadStream(uniqueName, {
            contentType: req.file.mimetype,
            metadata: { originalName: req.file.originalname }
        });

        // 3. Convert buffer to readable stream and pipe it to GridFS
        const readableFileStream = new Readable();
        readableFileStream.push(req.file.buffer);
        readableFileStream.push(null); // End of stream

        await new Promise((resolve, reject) => {
            readableFileStream.pipe(uploadStream)
                .on('error', reject)
                .on('finish', resolve);
        });

        // Create file metadata document
        const file = new File({
            filename: req.file.originalname,
            gridFsId: uploadStream.id, // ID from GridFS
            size: req.file.size,
            originalName: req.file.originalname,
            uuid: Math.random().toString(36).substring(2, 15), // basic uuid requirement
            pin: Math.floor(100000 + Math.random() * 900000).toString()
        });

        // Save to database
        const response = await file.save();
        return res.json({ 
            file: `${process.env.APP_BASE_URL}/download?uuid=${response.uuid}`
        });
    } catch (err) {
        console.error('Error in file upload:', err);
        return res.status(500).json({ error: 'Something went wrong' });
    }
});

module.exports = router;
