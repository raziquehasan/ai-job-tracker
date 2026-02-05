const Application = require('../models/Application');
const User = require('../models/User');
const Job = require('../models/Job');

async function confirmApplication(request, reply) {
    try {
        const { jobId, applied } = request.body;

        if (!jobId) {
            return reply.status(400).send({ error: 'jobId is required' });
        }

        // Get test user (test@gmail.com)
        const user = await User.findOne({ email: 'test@gmail.com' });
        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }

        // Verify job exists
        const job = await Job.findById(jobId);
        if (!job) {
            return reply.status(404).send({ error: 'Job not found' });
        }

        if (applied === false) {
            // User didn't apply, do nothing
            return reply.send({ message: 'No action taken' });
        }

        // Check if application already exists
        let application = await Application.findOne({
            userId: user._id,
            jobId
        });

        const now = new Date();

        if (application) {
            // Update existing application
            if (applied === 'earlier') {
                // Mark as applied earlier (e.g., 1 24 hours ago)
                const earlierDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                application.appliedAt = earlierDate;
                application.timeline[0].date = earlierDate;
            }
            await application.save();
        } else {
            // Create new application
            const appliedDate = applied === 'earlier'
                ? new Date(now.getTime() - 24 * 60 * 60 * 1000)
                : now;

            application = new Application({
                userId: user._id,
                jobId,
                status: 'applied',
                appliedAt: appliedDate,
                timeline: [{
                    status: 'applied',
                    date: appliedDate
                }]
            });
            await application.save();
        }

        // Populate job details for response
        await application.populate('jobId');

        return reply.status(201).send(application);
    } catch (error) {
        console.error('Error confirming application:', error);
        return reply.status(500).send({ error: 'Failed to confirm application' });
    }
}

async function updateApplicationStatus(request, reply) {
    try {
        const { id } = request.params;
        const { status } = request.body;

        if (!status || !['interview', 'offer', 'rejected'].includes(status)) {
            return reply.status(400).send({
                error: 'Valid status is required (interview, offer, rejected)'
            });
        }

        const application = await Application.findById(id);
        if (!application) {
            return reply.status(404).send({ error: 'Application not found' });
        }

        // Update status
        application.status = status;

        // Add timeline entry
        application.timeline.push({
            status,
            date: new Date()
        });

        await application.save();
        await application.populate('jobId');

        return reply.send(application);
    } catch (error) {
        console.error('Error updating application status:', error);
        return reply.status(500).send({ error: 'Failed to update application status' });
    }
}

async function getAllApplications(request, reply) {
    try {
        // Get test user
        const user = await User.findOne({ email: 'test@gmail.com' });
        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }

        // Get all applications for this user
        const applications = await Application.find({ userId: user._id })
            .populate('jobId')
            .sort({ appliedAt: -1 });

        return reply.send(applications);
    } catch (error) {
        console.error('Error fetching applications:', error);
        return reply.status(500).send({ error: 'Failed to fetch applications' });
    }
}

async function routes(fastify, options) {
    // POST /api/applications/confirm
    fastify.post('/confirm', confirmApplication);

    // PATCH /api/applications/:id/status
    fastify.patch('/:id/status', updateApplicationStatus);

    // GET /api/applications
    fastify.get('/', getAllApplications);
}

module.exports = routes;
