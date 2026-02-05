const { PDFParse } = require('pdf-parse');
const User = require('../models/User');

async function resumeRoutes(fastify, options) {

    // POST /api/resume/upload
    fastify.post('/upload', async (request, reply) => {
        try {
            // Get the uploaded file
            const data = await request.file();

            if (!data) {
                return reply.code(400).send({
                    success: false,
                    message: 'No file uploaded. Please upload a PDF or TXT file.'
                });
            }

            // Check file type
            const allowedTypes = ['application/pdf', 'text/plain'];
            if (!allowedTypes.includes(data.mimetype)) {
                return reply.code(400).send({
                    success: false,
                    message: 'Only PDF and TXT files are allowed'
                });
            }

            // Read file buffer
            const buffer = await data.toBuffer();

            // Check file size (10MB limit)
            if (buffer.length > 10 * 1024 * 1024) {
                return reply.code(400).send({
                    success: false,
                    message: 'File size must be less than 10MB'
                });
            }

            let resumeText = '';

            // Parse based on file type
            if (data.mimetype === 'application/pdf') {
                // Parse PDF
                const parser = new PDFParse({ data: buffer });
                const result = await parser.getText();
                resumeText = result.text;
            } else if (data.mimetype === 'text/plain') {
                // Parse TXT
                resumeText = buffer.toString('utf-8');
            }

            // Validate extracted text
            if (!resumeText || resumeText.trim().length === 0) {
                return reply.code(400).send({
                    success: false,
                    message: 'Could not extract text from the file. Please ensure the file contains readable text.'
                });
            }

            // Upsert user (use test@gmail.com as default)
            const testEmail = 'test@gmail.com';

            const user = await User.findOneAndUpdate(
                { email: testEmail },
                {
                    resumeText: resumeText,
                    resumeUpdatedAt: new Date()
                },
                {
                    new: true,
                    upsert: true,
                    setDefaultsOnInsert: true
                }
            );

            // Return success response
            return reply.code(200).send({
                success: true,
                message: 'Resume uploaded and processed successfully',
                data: {
                    email: user.email,
                    resumeLength: resumeText.length,
                    resumeUpdatedAt: user.resumeUpdatedAt,
                    preview: resumeText.substring(0, 200) + '...'
                }
            });

        } catch (error) {
            fastify.log.error(error);

            // Handle multer errors
            if (error.message === 'Only PDF and TXT files are allowed') {
                return reply.code(400).send({
                    success: false,
                    message: 'Invalid file type. Only PDF and TXT files are allowed.'
                });
            }

            if (error.code === 'LIMIT_FILE_SIZE') {
                return reply.code(400).send({
                    success: false,
                    message: 'File too large. Maximum size is 10MB.'
                });
            }

            // Generic error
            return reply.code(500).send({
                success: false,
                message: 'An error occurred while processing the resume',
                error: error.message
            });
        }
    });

    // GET /api/resume/status - Check if resume exists for test user
    fastify.get('/status', async (request, reply) => {
        try {
            const user = await User.findOne({ email: 'test@gmail.com' });

            if (!user || !user.resumeText) {
                return reply.code(200).send({
                    success: true,
                    hasResume: false,
                    message: 'No resume uploaded yet'
                });
            }

            return reply.code(200).send({
                success: true,
                hasResume: true,
                data: {
                    email: user.email,
                    resumeLength: user.resumeText.length,
                    resumeUpdatedAt: user.resumeUpdatedAt
                }
            });
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({
                success: false,
                message: 'Error checking resume status',
                error: error.message
            });
        }
    });
}

module.exports = resumeRoutes;
