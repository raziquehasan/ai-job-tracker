const Job = require('../models/Job');
const adzunaService = require('../services/adzuna.service');
const fs = require('fs').promises;
const path = require('path');

async function jobsRoutes(fastify, options) {

    /**
     * GET /api/jobs
     * Fetch jobs from Adzuna or fallback, store in MongoDB, and return filtered results
     * 
     * Query Parameters:
     * - title: Filter by job title (case-insensitive partial match)
     * - skills: Comma-separated skills to match in description
     * - location: Filter by location (case-insensitive partial match)
     * - type: Filter by job type (full-time, part-time, internship, contract)
     * - remote: Filter for remote jobs (true/false)
     * - postedWithinDays: Only show jobs posted within N days
     * - page: Page number for pagination (default: 1)
     * - limit: Results per page (default: 20, max: 100)
     */
    fastify.get('/jobs', async (request, reply) => {
        try {
            const {
                title,
                skills,
                location,
                type,
                remote,
                postedWithinDays,
                page = 1,
                limit = 20
            } = request.query;

            let jobs = [];
            let sourceUsed = 'local'; // Track which source was used

            // Step 1: Try fetching from Adzuna
            try {
                fastify.log.info('Attempting to fetch jobs from Adzuna API...');
                jobs = await adzunaService.fetchJobs({
                    what: title || 'software engineer',
                    where: location || '',
                    results_per_page: 20
                });
                sourceUsed = 'adzuna';
                fastify.log.info(`Successfully fetched ${jobs.length} jobs from Adzuna`);
            } catch (adzunaError) {
                // Step 2: Fallback to local JSON if Adzuna fails
                fastify.log.warn(`Adzuna API failed: ${adzunaError.message}. Using fallback data.`);

                const fallbackPath = path.join(__dirname, '../../data/jobs.json');
                const fallbackData = await fs.readFile(fallbackPath, 'utf-8');
                jobs = JSON.parse(fallbackData);
                sourceUsed = 'local';
                fastify.log.info(`Loaded ${jobs.length} jobs from fallback dataset`);
            }

            // Step 3: Upsert jobs to MongoDB
            if (jobs.length > 0) {
                const upsertPromises = jobs.map(job =>
                    Job.findOneAndUpdate(
                        { externalId: job.externalId, source: job.source },
                        job,
                        { upsert: true, new: true, setDefaultsOnInsert: true }
                    )
                );

                await Promise.all(upsertPromises);
                fastify.log.info(`Upserted ${jobs.length} jobs to MongoDB`);
            }

            // Step 4: Build filter query for MongoDB
            const filter = {};

            // Title filter (case-insensitive partial match)
            if (title) {
                filter.title = { $regex: title, $options: 'i' };
            }

            // Skills filter (check if any skill appears in description)
            if (skills) {
                const skillArray = skills.split(',').map(s => s.trim());
                const skillRegexes = skillArray.map(skill => ({
                    description: { $regex: skill, $options: 'i' }
                }));
                filter.$or = skillRegexes;
            }

            // Location filter (case-insensitive partial match)
            if (location) {
                filter.location = { $regex: location, $options: 'i' };
            }

            // Type filter (exact match)
            if (type) {
                const validTypes = ['full-time', 'part-time', 'internship', 'contract'];
                if (validTypes.includes(type.toLowerCase())) {
                    filter.type = type.toLowerCase();
                }
            }

            // Remote filter (boolean)
            if (remote !== undefined) {
                filter.remote = remote === 'true' || remote === true;
            }

            // Posted within days filter
            if (postedWithinDays) {
                const days = parseInt(postedWithinDays);
                if (!isNaN(days) && days > 0) {
                    const cutoffDate = new Date();
                    cutoffDate.setDate(cutoffDate.getDate() - days);
                    filter.postedAt = { $gte: cutoffDate };
                }
            }

            // Step 5: Query MongoDB with filters and pagination
            const pageNum = Math.max(1, parseInt(page) || 1);
            const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
            const skip = (pageNum - 1) * limitNum;

            const [filteredJobs, totalCount] = await Promise.all([
                Job.find(filter)
                    .sort({ postedAt: -1 }) // Sort by newest first
                    .skip(skip)
                    .limit(limitNum)
                    .lean(),
                Job.countDocuments(filter)
            ]);

            // Step 6: Return response
            return reply.code(200).send({
                success: true,
                data: {
                    jobs: filteredJobs,
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total: totalCount,
                        totalPages: Math.ceil(totalCount / limitNum)
                    },
                    meta: {
                        sourceUsed,
                        filtersApplied: {
                            title: title || null,
                            skills: skills || null,
                            location: location || null,
                            type: type || null,
                            remote: remote !== undefined ? (remote === 'true' || remote === true) : null,
                            postedWithinDays: postedWithinDays || null
                        }
                    }
                }
            });

        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({
                success: false,
                message: 'Error fetching jobs',
                error: error.message
            });
        }
    });

    /**
     * GET /api/jobs/stats
     * Get statistics about jobs in the database
     */
    fastify.get('/jobs/stats', async (request, reply) => {
        try {
            const [total, byType, bySource, remoteCount] = await Promise.all([
                Job.countDocuments(),
                Job.aggregate([
                    { $group: { _id: '$type', count: { $sum: 1 } } }
                ]),
                Job.aggregate([
                    { $group: { _id: '$source', count: { $sum: 1 } } }
                ]),
                Job.countDocuments({ remote: true })
            ]);

            return reply.code(200).send({
                success: true,
                data: {
                    total,
                    byType: byType.reduce((acc, item) => {
                        acc[item._id] = item.count;
                        return acc;
                    }, {}),
                    bySource: bySource.reduce((acc, item) => {
                        acc[item._id] = item.count;
                        return acc;
                    }, {}),
                    remote: remoteCount,
                    onSite: total - remoteCount
                }
            });
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({
                success: false,
                message: 'Error fetching job statistics',
                error: error.message
            });
        }
    });
}

module.exports = jobsRoutes;
