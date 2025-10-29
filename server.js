const express = require('express');
const app = express();
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

// Initialize MongoDB connection
const connectDB = require('./config/db');
connectDB().catch(console.error);

// Middleware
const publicPath = path.join(__dirname, 'public');
console.log('Serving static files from:', publicPath);
app.use(express.static(publicPath));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const corsOptions = {
    origin: process.env.ALLOWED_CLINTS ? process.env.ALLOWED_CLINTS.split(',') : ['http://localhost:3000'],
    optionsSuccessStatus: 200
}

app.use(cors(corsOptions));

// Template engine setup
app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');
app.set('views', path.resolve('./views'));

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

// Default route to render upload form
app.get('/', (req, res) => {
    res.redirect('/fileupload');
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