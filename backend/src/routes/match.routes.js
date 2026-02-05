const User = require('../models/User');
const Job = require('../models/Job');
const MatchScore = require('../models/MatchScore');
const matchingService = require('../services/matching.service');

async function matchRoutes(fastify, options) {

    /**
     * POST /api/match/recalculate
     * Recalculate match scores for test@gmail.com user
     * 
     * Flow:
     * 1. Load user resume
     * 2. Fetch all jobs
     * 3. Check cache validity (resume hash)
     * 4. Run batch matching with concurrency limit
     * 5. Save/update MatchScore documents
     * 6. Return top 8 jobs by score
     */
    fastify.post('/recalculate', async (request, reply) => {
        const startTime = Date.now();

        try {
            // Step 1: Load user resume
            const testEmail = 'test@gmail.com';
            const user = await User.findOne({ email: testEmail });

            if (!user || !user.resumeText) {
                return reply.code(400).send({
                    success: false,
                    message: 'No resume found for test@gmail.com. Please upload a resume first.'
                });
            }

            const resumeText = user.resumeText;
            const resumeHash = matchingService.generateResumeHash(resumeText);

            fastify.log.info(`Starting match calculation for user: ${testEmail}`);
            fastify.log.info(`Resume hash: ${resumeHash}`);

            // Step 2: Fetch all jobs
            const jobs = await Job.find().lean();

            if (jobs.length === 0) {
                return reply.code(400).send({
                    success: false,
                    message: 'No jobs found in database. Please fetch jobs first using /api/jobs'
                });
            }

            fastify.log.info(`Found ${jobs.length} jobs to match`);

            // Step 3: Check cache validity
            // Get existing match scores for this user
            const existingScores = await MatchScore.find({ userId: user._id }).lean();
            const existingScoreMap = new Map(
                existingScores.map(score => [score.jobId.toString(), score])
            );

            // Determine which jobs need recalculation
            const jobsToMatch = [];
            const cachedResults = [];

            for (const job of jobs) {
                const jobIdStr = job._id.toString();
                const existingScore = existingScoreMap.get(jobIdStr);

                // Use cache if resume hasn't changed
                if (existingScore && existingScore.resumeHash === resumeHash) {
                    cachedResults.push({
                        jobId: job._id,
                        job: job,
                        score: existingScore.score,
                        matchedSkills: existingScore.matchedSkills,
                        missingSkills: existingScore.missingSkills,
                        reasoning: existingScore.reasoning,
                        cached: true
                    });
                } else {
                    jobsToMatch.push(job);
                }
            }

            fastify.log.info(`Using cache for ${cachedResults.length} jobs, calculating ${jobsToMatch.length} jobs`);

            // Step 4: Run batch matching for jobs that need calculation
            let newMatchResults = [];
            if (jobsToMatch.length > 0) {
                newMatchResults = await matchingService.batchMatchJobs(
                    resumeText,
                    jobsToMatch,
                    {
                        concurrency: 3,
                        onProgress: (progress) => {
                            fastify.log.info(`Matching progress: ${progress.completed}/${progress.total} (${progress.percentage}%)`);
                        }
                    }
                );
            }

            // Step 5: Save/update MatchScore documents
            const savePromises = newMatchResults.map(result =>
                MatchScore.findOneAndUpdate(
                    { userId: user._id, jobId: result.jobId },
                    {
                        userId: user._id,
                        jobId: result.jobId,
                        score: result.score,
                        matchedSkills: result.matchedSkills,
                        missingSkills: result.missingSkills,
                        reasoning: result.reasoning,
                        resumeHash: resumeHash
                    },
                    { upsert: true, new: true }
                )
            );

            await Promise.all(savePromises);

            // Combine cached and new results
            const allResults = [...cachedResults, ...newMatchResults];

            // Sort by score descending
            allResults.sort((a, b) => b.score - a.score);

            // Step 6: Get top 8 jobs
            const topMatches = allResults.slice(0, 8).map(result => ({
                _id: result.job._id,
                title: result.job.title,
                company: result.job.company,
                location: result.job.location,
                type: result.job.type,
                remote: result.job.remote,
                description: result.job.description.substring(0, 200) + '...',
                postedAt: result.job.postedAt,
                score: result.score,
                matchedSkills: result.matchedSkills,
                missingSkills: result.missingSkills,
                reasoning: result.reasoning
            }));

            // Calculate stats
            const endTime = Date.now();
            const processingTime = ((endTime - startTime) / 1000).toFixed(1);
            const averageScore = matchingService.calculateAverageScore(allResults);

            return reply.code(200).send({
                success: true,
                data: {
                    topMatches,
                    stats: {
                        totalJobs: jobs.length,
                        matchesCalculated: newMatchResults.length,
                        cached: cachedResults.length,
                        averageScore,
                        processingTime: `${processingTime}s`
                    }
                }
            });

        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({
                success: false,
                message: 'Error calculating match scores',
                error: error.message
            });
        }
    });

    /**
     * GET /api/match/scores
     * Get all match scores for test@gmail.com user
     * Supports pagination and filtering
     */
    fastify.get('/scores', async (request, reply) => {
        try {
            const {
                page = 1,
                limit = 20,
                minScore = 0
            } = request.query;

            const testEmail = 'test@gmail.com';
            const user = await User.findOne({ email: testEmail });

            if (!user) {
                return reply.code(400).send({
                    success: false,
                    message: 'User not found'
                });
            }

            const pageNum = Math.max(1, parseInt(page) || 1);
            const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
            const skip = (pageNum - 1) * limitNum;

            const filter = {
                userId: user._id,
                score: { $gte: parseInt(minScore) || 0 }
            };

            const [scores, totalCount] = await Promise.all([
                MatchScore.find(filter)
                    .populate('jobId')
                    .sort({ score: -1 })
                    .skip(skip)
                    .limit(limitNum)
                    .lean(),
                MatchScore.countDocuments(filter)
            ]);

            // Format response
            const formattedScores = scores.map(score => ({
                _id: score._id,
                job: score.jobId ? {
                    _id: score.jobId._id,
                    title: score.jobId.title,
                    company: score.jobId.company,
                    location: score.jobId.location,
                    type: score.jobId.type,
                    remote: score.jobId.remote
                } : null,
                score: score.score,
                matchedSkills: score.matchedSkills,
                missingSkills: score.missingSkills,
                reasoning: score.reasoning,
                updatedAt: score.updatedAt
            }));

            return reply.code(200).send({
                success: true,
                data: {
                    scores: formattedScores,
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total: totalCount,
                        totalPages: Math.ceil(totalCount / limitNum)
                    }
                }
            });

        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({
                success: false,
                message: 'Error fetching match scores',
                error: error.message
            });
        }
    });

    /**
     * GET /api/match/stats
     * Get statistics about match scores
     */
    fastify.get('/stats', async (request, reply) => {
        try {
            const testEmail = 'test@gmail.com';
            const user = await User.findOne({ email: testEmail });

            if (!user) {
                return reply.code(400).send({
                    success: false,
                    message: 'User not found'
                });
            }

            const scores = await MatchScore.find({ userId: user._id }).lean();

            if (scores.length === 0) {
                return reply.code(200).send({
                    success: true,
                    data: {
                        totalMatches: 0,
                        averageScore: 0,
                        highestScore: 0,
                        lowestScore: 0,
                        distribution: {}
                    }
                });
            }

            const scoreValues = scores.map(s => s.score);
            const averageScore = Math.round(
                scoreValues.reduce((sum, score) => sum + score, 0) / scores.length
            );

            // Score distribution
            const distribution = {
                excellent: scores.filter(s => s.score >= 90).length,
                strong: scores.filter(s => s.score >= 75 && s.score < 90).length,
                good: scores.filter(s => s.score >= 60 && s.score < 75).length,
                moderate: scores.filter(s => s.score >= 45 && s.score < 60).length,
                weak: scores.filter(s => s.score < 45).length
            };

            return reply.code(200).send({
                success: true,
                data: {
                    totalMatches: scores.length,
                    averageScore,
                    highestScore: Math.max(...scoreValues),
                    lowestScore: Math.min(...scoreValues),
                    distribution
                }
            });

        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({
                success: false,
                message: 'Error fetching match statistics',
                error: error.message
            });
        }
    });
}

module.exports = matchRoutes;
