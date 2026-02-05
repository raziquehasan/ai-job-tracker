const mongoose = require('mongoose');

async function connectDB() {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-job-tracker';

        await mongoose.connect(mongoURI);

        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        throw error;
    }
}

module.exports = connectDB;
