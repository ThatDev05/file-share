const express = require('express');
const app = express();
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

// Log environment status (without exposing values)
console.log('Environment Check:', {
    MONGO_URL_SET: !!process.env.MONGO_CONNETION_URL,
    APP_BASE_URL_SET: !!process.env.APP_BASE_URL,
    ALLOWED_CLINTS_SET: !!process.env.ALLOWED_CLINTS,
    SMTP_CONFIG_SET: !!(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER)
});

// Initialize MongoDB connection
const connectDB = require('./config/db');
connectDB().catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    // In production, we might want to continue running even if DB fails
    if (process.env.NODE_ENV === 'production') {
        console.log('Continuing despite MongoDB connection failure');
    }
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const corsOptions = {
    origin: process.env.ALLOWED_CLINTS ? process.env.ALLOWED_CLINTS.split(',') : '*', // Allow all by default if env is not set
    optionsSuccessStatus: 200
}

console.log('CORS Settings:', { origin: corsOptions.origin });

app.use(cors(corsOptions));

// Request logger for debugging in serverless
app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.url}`);
    next();
});


// Routes
// Use routers as middleware with proper mounting points
const fileUploadRouter = require('./routes/fileUpload');
const filesRouter = require('./routes/files');
const showRouter = require('./routes/show');
const downloadRouter = require('./routes/download');

app.use('/', fileUploadRouter);  // This will handle /fileupload routes
app.use('/api/files', filesRouter);
app.use('/files', showRouter);
app.use('/files/download', downloadRouter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Cron endpoint for GridFS cleanup
const cronRouter = require('./routes/cron');
app.use('/api/cron', cronRouter);

const cron = require('node-cron');
// Run automatically at 3:00 AM every day locally (Vercel will ping the endpoint instead)
cron.schedule('0 3 * * *', async () => {
    console.log('Running local cron: Deleting files older than 24 hours');
    try {
        const result = await fetch(`http://localhost:${process.env.PORT || 3000}/api/cron/cleanup`);
        const json = await result.json();
        console.log('Local Cleanup Result:', json);
    } catch(err) {
        console.log('Local Cleanup Error:', err);
    }
});




// For local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

// Export for serverless
module.exports = app;