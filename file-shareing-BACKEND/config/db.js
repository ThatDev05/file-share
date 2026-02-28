require('dotenv').config();
const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
    if (isConnected) {
        return;
    }

    try {
        console.log('Connecting to MongoDB...', process.env.MONGO_CONNETION_URL ? 'URL exists' : 'URL missing');
        const db = await mongoose.connect(process.env.MONGO_CONNETION_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000
        });
        
        isConnected = db.connections[0].readyState === 1;
        console.log('MongoDB database connection established successfully');
        return db;
    } catch (err) {
        console.error('MongoDB Connection Error:', {
            message: err.message,
            code: err.code,
            name: err.name
        });
        throw err;
    }
}

module.exports = connectDB;