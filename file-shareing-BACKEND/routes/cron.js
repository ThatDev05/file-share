const router = require('express').Router();
const File = require('../model/file');
const connectDB = require('../config/db');
const mongoose = require('mongoose');

router.get('/cleanup', async (req, res) => {
    try {
        // Ensure MongoDB is connected
        const client = await connectDB();
        const db = client.connection.db;
        const bucket = new mongoose.mongo.GridFSBucket(db, {
            bucketName: 'uploads'
        });

        // Find files older than 24 hours
        const past24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const expiredFiles = await File.find({
            createdAt: { $lt: past24Hours }
        });

        console.log(`Found ${expiredFiles.length} expired files. Deleting...`);

        let deletedCount = 0;
        let errors = [];

        for (const file of expiredFiles) {
            try {
                // Delete from GridFS (this removes BOTH fs.files and fs.chunks)
                await new Promise((resolve, reject) => {
                    bucket.delete(file.gridFsId, (err) => {
                        if (err && err.message !== 'FileNotFound') return reject(err);
                        resolve();
                    });
                });
                
                // Delete the File Document metadata
                await file.deleteOne();
                deletedCount++;
                console.log(`Deleted file: ${file.filename} (${file.uuid})`);
            } catch (err) {
                console.error(`Error deleting file ${file.uuid}:`, err);
                errors.push({ uuid: file.uuid, error: err.message });
            }
        }

        return res.json({ 
            message: 'Cleanup completed',
            deletedCount,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (err) {
        console.error('Cron cleanup error:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
