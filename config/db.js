require('dotenv').config();
const mongoose = require('mongoose');

async function connectDB() {
    try {
        console.log('Connecting to MongoDB...', process.env.MONGO_CONNETION_URL ? 'URL exists' : 'URL missing');
        // Use mongoose.connect with async/await and let mongoose apply sensible defaults.
        await mongoose.connect(process.env.MONGO_CONNETION_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000
        });
        console.log('MongoDB database connection established successfully');
        
        // Test the connection by trying to get the collections
        const collections = await mongoose.connection.db.collections();
        console.log('Collections accessible:', collections.length);
        
        return true;
    } catch (err) {
        console.error('MongoDB Connection Error:', {
            message: err.message,
            code: err.code,
            name: err.name
        });
        // Re-throw to ensure the error is handled by the caller
        throw err;
    }
}

module.exports = connectDB;