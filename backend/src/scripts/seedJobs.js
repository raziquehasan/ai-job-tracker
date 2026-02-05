const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Job = require('../models/Job');

const seedJobs = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📦 Connected to MongoDB');

        // Read jobs data
        const jobsPath = path.join(__dirname, '../../data/jobs.json');
        const jobs = JSON.parse(fs.readFileSync(jobsPath, 'utf8'));

        // Clear existing jobs
        await Job.deleteMany({});
        console.log('🗑️  Cleared existing jobs');

        // Insert new jobs
        await Job.insertMany(jobs);
        console.log(`✅ Successfully seeded ${jobs.length} jobs`);

        // Disconnect
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedJobs();
