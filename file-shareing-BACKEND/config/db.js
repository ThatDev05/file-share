require('dotenv').config();
const mongoose = require('mongoose');

// Global cache for serverless environments
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        console.log('Connecting to MongoDB...', process.env.MONGO_CONNETION_URL ? 'URL exists' : 'URL missing');
        
        cached.promise = mongoose.connect(process.env.MONGO_CONNETION_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000
        }).then((mongoose) => {
            console.log('MongoDB database connection established successfully');
            return mongoose;
        }).catch(err => {
            console.error('MongoDB Connection Error:', {
                message: err.message,
                code: err.code,
                name: err.name
            });
            cached.promise = null; // Clear cache on failure
            throw err;
        });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}

module.exports = connectDB;