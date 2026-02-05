import axios from 'axios';

const getBaseUrl = () => {
    const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    if (rawUrl.endsWith('/api')) return rawUrl;
    if (rawUrl.endsWith('/api/')) return rawUrl.slice(0, -1);
    const base = rawUrl.replace(/\/$/, '');
    return base.endsWith('/api') ? base : `${base}/api`;
};

const API_BASE_URL = getBaseUrl();

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 60000, // 60 seconds for Render wake-up + AI processing
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
    }
);

// ============================================
// RESUME APIs
// ============================================

export const resumeAPI = {
    /**
     * Check if user has uploaded a resume
     */
    checkStatus: async () => {
        const response = await api.get('/resume/status');
        return response.data;
    },

    /**
     * Upload resume (PDF or TXT)
     * @param {File} file - The resume file
     */
    upload: async (file) => {
        const formData = new FormData();
        formData.append('resume', file);

        const response = await api.post('/resume/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};

// ============================================
// JOBS APIs
// ============================================

export const jobsAPI = {
    /**
     * Fetch jobs with filters
     * @param {Object} filters - Filter parameters
     */
    fetchJobs: async (filters = {}) => {
        const params = {};

        // Map frontend filters to backend query params
        if (filters.title) params.title = filters.title;
        if (filters.skills && filters.skills.length > 0) {
            params.skills = filters.skills.join(',');
        }
        if (filters.location) params.location = filters.location;
        if (filters.type) params.type = filters.type;
        if (filters.workMode === 'remote') params.remote = 'true';
        if (filters.postedWithinDays) params.postedWithinDays = filters.postedWithinDays;
        if (filters.page) params.page = filters.page;
        if (filters.limit) params.limit = filters.limit;

        const response = await api.get('/jobs', { params });
        return response.data;
    },

    /**
     * Get job statistics
     */
    getStats: async () => {
        const response = await api.get('/jobs/stats');
        return response.data;
    },
};

// ============================================
// MATCH APIs
// ============================================

export const matchAPI = {
    /**
     * Recalculate match scores for user
     */
    recalculate: async () => {
        const response = await api.post('/match/recalculate');
        return response.data;
    },

    /**
     * Get match scores with optional filters
     * @param {Object} params - Query parameters
     */
    getScores: async (params = {}) => {
        const response = await api.get('/match/scores', { params });
        return response.data;
    },

    /**
     * Get match statistics
     */
    getStats: async () => {
        const response = await api.get('/match/stats');
        return response.data;
    },
};

// ============================================
// ASSISTANT APIs
// ============================================

export const assistantAPI = {
    /**
     * Send message to AI assistant
     * @param {string} message - User message
     */
    chat: async (message) => {
        const response = await api.post('/assistant/chat', { message });
        return response.data;
    },
};

// ============================================
// APPLICATIONS APIs
// ============================================

export const applicationsAPI = {
    /**
     * Confirm application
     * @param {string} jobId - Job ID
     * @param {boolean|string} applied - true, false, or 'earlier'
     */
    confirm: async (jobId, applied) => {
        const response = await api.post('/applications/confirm', { jobId, applied });
        return response.data;
    },

    /**
     * Update application status
     * @param {string} applicationId - Application ID
     * @param {string} status - New status
     */
    updateStatus: async (applicationId, status) => {
        const response = await api.patch(`/applications/${applicationId}/status`, { status });
        return response.data;
    },

    /**
     * Get all applications
     */
    getAll: async () => {
        const response = await api.get('/applications');
        return response.data;
    },
};

export default api;
