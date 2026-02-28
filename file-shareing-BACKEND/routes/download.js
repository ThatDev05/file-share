const router = require('express').Router();
const File = require('../model/file');
const connectDB = require('../config/db');

const mongoose = require('mongoose');

router.get('/:uuid', async (req, res) => {
    try {
        const file = await File.findOne({ uuid: req.params.uuid });
        if (!file) {
            return res.status(404).json({ error: 'Link has expired or file not found' });
        }

        // Ensure MongoDB is connected
        await connectDB();

        // Initialize GridFS bucket
        const db = mongoose.connection.db;
        const bucket = new mongoose.mongo.GridFSBucket(db, {
            bucketName: 'uploads'
        });

        // Set Headers for Download
        res.set({
            'Content-Type': 'application/octet-stream', // Generic binary, GridFS doesn't store mime natively without extra effort
            'Content-Length': file.size,
            'Content-Disposition': `attachment; filename="${file.filename}"`
        });

        // Create read stream from GridFS and pipe it to response
        const downloadStream = bucket.openDownloadStream(file.gridFsId);
        
        downloadStream.on('error', (err) => {
            console.error('Error downloading from GridFS:', err);
            return res.status(500).json({ error: 'Could not stream file from database.' });
        });

        downloadStream.pipe(res);
        
    } catch(err) {
        console.error('Download error:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;