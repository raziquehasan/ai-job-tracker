const axios = require('axios');

class AdzunaService {
    constructor() {
        this.appId = process.env.ADZUNA_APP_ID;
        this.apiKey = process.env.ADZUNA_API_KEY;
        this.baseUrl = 'https://api.adzuna.com/v1/api/jobs';
        this.country = 'us'; // Default to US, can be made configurable
    }

    /**
     * Fetch jobs from Adzuna API
     * @param {Object} params - Query parameters
     * @param {string} params.what - Job title or keywords
     * @param {string} params.where - Location
     * @param {number} params.results_per_page - Number of results (max 50)
     * @param {number} params.page - Page number
     * @returns {Promise<Array>} - Array of normalized jobs
     */
    async fetchJobs(params = {}) {
        try {
            // Validate credentials
            if (!this.appId || !this.apiKey) {
                throw new Error('Adzuna API credentials not configured. Please set ADZUNA_APP_ID and ADZUNA_API_KEY in .env file.');
            }

            // Build query parameters
            const queryParams = {
                app_id: this.appId,
                app_key: this.apiKey,
                results_per_page: params.results_per_page || 20,
                what: params.what || 'software engineer',
                where: params.where || '',
                page: params.page || 1
            };

            // Make API request
            const url = `${this.baseUrl}/${this.country}/search/${queryParams.page}`;

            const response = await axios.get(url, {
                params: {
                    app_id: queryParams.app_id,
                    app_key: queryParams.app_key,
                    results_per_page: queryParams.results_per_page,
                    what: queryParams.what,
                    where: queryParams.where
                },
                timeout: 10000 // 10 second timeout
            });

            // Check if response has results
            if (!response.data || !response.data.results) {
                throw new Error('Invalid response from Adzuna API');
            }

            // Map and normalize results
            const jobs = response.data.results.map(job => this.normalizeJob(job));

            return jobs;

        } catch (error) {
            // Handle specific error types
            if (error.response) {
                // API responded with error
                const status = error.response.status;
                const message = error.response.data?.message || error.response.statusText;

                if (status === 429) {
                    throw new Error('Adzuna API rate limit exceeded. Please try again later.');
                } else if (status === 401 || status === 403) {
                    throw new Error('Invalid Adzuna API credentials. Please check ADZUNA_APP_ID and ADZUNA_API_KEY.');
                } else if (status >= 500) {
                    throw new Error('Adzuna API server error. Using fallback data.');
                } else {
                    throw new Error(`Adzuna API error (${status}): ${message}`);
                }
            } else if (error.request) {
                // Request made but no response
                throw new Error('No response from Adzuna API. Network error or timeout.');
            } else {
                // Other errors
                throw error;
            }
        }
    }

    /**
     * Normalize Adzuna job data to our schema
     * @param {Object} adzunaJob - Raw job data from Adzuna
     * @returns {Object} - Normalized job object
     */
    normalizeJob(adzunaJob) {
        return {
            externalId: adzunaJob.id || `adzuna-${Date.now()}-${Math.random()}`,
            source: 'adzuna',
            title: adzunaJob.title || 'Untitled Position',
            company: adzunaJob.company?.display_name || 'Unknown Company',
            location: this.normalizeLocation(adzunaJob.location),
            description: adzunaJob.description || 'No description available',
            type: this.normalizeJobType(adzunaJob.contract_type, adzunaJob.title),
            remote: this.isRemote(adzunaJob.location, adzunaJob.title, adzunaJob.description),
            postedAt: adzunaJob.created ? new Date(adzunaJob.created) : new Date()
        };
    }

    /**
     * Normalize location data
     * @param {Object} location - Adzuna location object
     * @returns {string} - Formatted location string
     */
    normalizeLocation(location) {
        if (!location) return 'Remote';

        const parts = [];
        if (location.display_name) return location.display_name;
        if (location.area && location.area[3]) parts.push(location.area[3]); // City
        if (location.area && location.area[1]) parts.push(location.area[1]); // State

        return parts.length > 0 ? parts.join(', ') : 'Remote';
    }

    /**
     * Normalize job type from Adzuna contract_type
     * @param {string} contractType - Adzuna contract type
     * @param {string} title - Job title for additional context
     * @returns {string} - Normalized job type
     */
    normalizeJobType(contractType, title = '') {
        const titleLower = title.toLowerCase();

        // Check title for internship keywords
        if (titleLower.includes('intern') || titleLower.includes('internship')) {
            return 'internship';
        }

        // Map Adzuna contract types
        if (!contractType) return 'full-time';

        const typeLower = contractType.toLowerCase();

        if (typeLower.includes('permanent') || typeLower.includes('full')) {
            return 'full-time';
        } else if (typeLower.includes('part')) {
            return 'part-time';
        } else if (typeLower.includes('contract') || typeLower.includes('temporary')) {
            return 'contract';
        }

        return 'full-time'; // Default
    }

    /**
     * Determine if job is remote based on location and description
     * @param {Object} location - Location object
     * @param {string} title - Job title
     * @param {string} description - Job description
     * @returns {boolean} - True if remote
     */
    isRemote(location, title = '', description = '') {
        const remoteKeywords = ['remote', 'work from home', 'wfh', 'anywhere'];

        // Check location
        if (location && location.display_name) {
            const locationLower = location.display_name.toLowerCase();
            if (remoteKeywords.some(keyword => locationLower.includes(keyword))) {
                return true;
            }
        }

        // Check title
        const titleLower = title.toLowerCase();
        if (remoteKeywords.some(keyword => titleLower.includes(keyword))) {
            return true;
        }

        // Check description (first 500 chars for performance)
        const descLower = description.toLowerCase().substring(0, 500);
        if (remoteKeywords.some(keyword => descLower.includes(keyword))) {
            return true;
        }

        return false;
    }
}

module.exports = new AdzunaService();
