require('dotenv').config();
const buildApp = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 4000;

async function start() {
    try {
        // Connect to MongoDB
        await connectDB();

        // Build and start Fastify app
        const app = buildApp();

        await app.listen({ port: PORT, host: '0.0.0.0' });
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    } catch (err) {
        console.error('Error starting server:', err);
        process.exit(1);
    }
}

start();
