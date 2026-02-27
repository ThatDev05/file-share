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
    origin: process.env.ALLOWED_CLINTS ? process.env.ALLOWED_CLINTS.split(',') : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500', 'http://127.0.0.1:8080', 'http://localhost:8080', 'http://localhost:5173', 'http://127.0.0.1:5173'],
    optionsSuccessStatus: 200
}

app.use(cors(corsOptions));


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




// For local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

// Export for serverless
module.exports = app;