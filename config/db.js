require('dotenv').config();
const mongoose = require('mongoose');

async function connectDB() {
    try {
        // Use mongoose.connect with async/await and let mongoose apply sensible defaults.
        await mongoose.connect(process.env.MONGO_CONNETION_URL);
        console.log('MongoDB database connection established successfully');
    } catch (err) {
        console.error('Connection failed', err);
    }
}

module.exports = connectDB;