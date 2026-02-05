const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { ChatOpenAI } = require('@langchain/openai');
const { jobMatchPromptTemplate } = require('../ai/prompts/jobMatch.prompt');
const crypto = require('crypto');

class MatchingService {
    constructor() {
        this.llm = null;
        this.initializeLLM();
    }

    /**
     * Initialize LLM based on available API keys
     * Priority: Google Gemini (cheaper) → OpenAI
     */
    initializeLLM() {
        const geminiKey = process.env.GOOGLE_AI_API_KEY;
        const openaiKey = process.env.OPENAI_API_KEY;

        if (geminiKey) {
            this.llm = new ChatGoogleGenerativeAI({
                apiKey: geminiKey,
                model: 'gemini-1.5-pro',
                temperature: 0.3,
                maxOutputTokens: 500
            });
            console.log('✅ Initialized LLM: Google Gemini 1.5 Pro');
        } else if (openaiKey) {
            this.llm = new ChatOpenAI({
                apiKey: openaiKey,
                modelName: 'gpt-3.5-turbo',
                temperature: 0.3,
                maxTokens: 500
            });
            console.log('✅ Initialized LLM: OpenAI GPT-3.5');
        } else {
            throw new Error('No LLM API key configured. Please set GOOGLE_AI_API_KEY or OPENAI_API_KEY in .env');
        }
    }

    /**
     * Generate hash of resume text for caching
     * @param {string} resumeText - Resume text
     * @returns {string} - SHA256 hash
     */
    generateResumeHash(resumeText) {
        return crypto.createHash('sha256').update(resumeText).digest('hex');
    }

    /**
     * Match a single job to a resume using LLM
     * @param {string} resumeText - Candidate's resume text
     * @param {Object} job - Job object with title, company, description
     * @returns {Promise<Object>} - Match analysis with score, skills, reasoning
     */
    async matchJobToResume(resumeText, job) {
        try {
            if (!this.llm) {
                throw new Error('LLM not initialized');
            }

            // Prepare prompt with resume and job details
            const prompt = await jobMatchPromptTemplate.formatMessages({
                resumeText: resumeText.substring(0, 3000), // Limit to 3000 chars for cost
                jobTitle: job.title,
                jobCompany: job.company,
                jobDescription: job.description.substring(0, 2000) // Limit description
            });

            // Call LLM
            const response = await this.llm.invoke(prompt);
            const content = response.content;

            // Parse JSON response
            let matchResult;
            try {
                // Remove markdown code blocks if present
                const cleanContent = content
                    .replace(/```json\n?/g, '')
                    .replace(/```\n?/g, '')
                    .trim();

                matchResult = JSON.parse(cleanContent);
            } catch (parseError) {
                console.error('Failed to parse LLM response:', content);
                // Fallback: create a basic match result
                matchResult = {
                    score: 50,
                    matchedSkills: [],
                    missingSkills: [],
                    reasoning: 'Unable to parse detailed analysis. Manual review recommended.'
                };
            }

            // Validate and sanitize the result
            return {
                score: Math.min(100, Math.max(0, matchResult.score || 50)),
                matchedSkills: Array.isArray(matchResult.matchedSkills)
                    ? matchResult.matchedSkills.slice(0, 15)
                    : [],
                missingSkills: Array.isArray(matchResult.missingSkills)
                    ? matchResult.missingSkills.slice(0, 10)
                    : [],
                reasoning: matchResult.reasoning || 'No reasoning provided'
            };

        } catch (error) {
            console.error(`Error matching job ${job.title}:`, error.message);

            // Return a fallback result instead of failing
            return {
                score: 0,
                matchedSkills: [],
                missingSkills: [],
                reasoning: `Error during analysis: ${error.message}`
            };
        }
    }

    /**
     * Batch match multiple jobs to a resume with concurrency limiting
     * @param {string} resumeText - Candidate's resume text
     * @param {Array} jobs - Array of job objects
     * @param {Object} options - Options for batch processing
     * @returns {Promise<Array>} - Array of match results with job references
     */
    async batchMatchJobs(resumeText, jobs, options = {}) {
        const {
            concurrency = 3, // Max concurrent LLM calls
            onProgress = null // Optional progress callback
        } = options;

        // Dynamic import of p-limit
        const pLimit = (await import('p-limit')).default;
        const limit = pLimit(concurrency);

        const startTime = Date.now();
        let completed = 0;

        // Create limited promises for each job
        const matchPromises = jobs.map((job, index) =>
            limit(async () => {
                const matchResult = await this.matchJobToResume(resumeText, job);
                completed++;

                if (onProgress) {
                    onProgress({
                        completed,
                        total: jobs.length,
                        percentage: Math.round((completed / jobs.length) * 100)
                    });
                }

                return {
                    jobId: job._id,
                    job: job,
                    ...matchResult
                };
            })
        );

        // Wait for all matches to complete
        const results = await Promise.all(matchPromises);

        const endTime = Date.now();
        const processingTime = ((endTime - startTime) / 1000).toFixed(1);

        console.log(`✅ Batch matching complete: ${jobs.length} jobs in ${processingTime}s`);

        return results;
    }

    /**
     * Calculate average score from match results
     * @param {Array} matchResults - Array of match results
     * @returns {number} - Average score
     */
    calculateAverageScore(matchResults) {
        if (!matchResults || matchResults.length === 0) return 0;

        const total = matchResults.reduce((sum, result) => sum + result.score, 0);
        return Math.round(total / matchResults.length);
    }
}

// Export singleton instance
module.exports = new MatchingService();
