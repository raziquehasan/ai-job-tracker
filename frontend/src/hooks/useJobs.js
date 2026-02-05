import { useState, useEffect, useCallback } from 'react';
import { jobsAPI, matchAPI } from '../services/api';

/**
 * Custom hook for managing jobs fetching and filtering
 * @param {Object} filters - Filter parameters
 * @returns {Object} - { jobs, loading, error, refetch, matchScores, loadingMatches }
 */
export const useJobs = (filters = {}) => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [matchScores, setMatchScores] = useState([]);
    const [loadingMatches, setLoadingMatches] = useState(false);

    // Fetch jobs with current filters
    const fetchJobs = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await jobsAPI.fetchJobs(filters);

            if (response.success) {
                let fetchedJobs = response.data.jobs;

                // Apply client-side match score filter if needed
                if (filters.matchScore && filters.matchScore !== 'all') {
                    fetchedJobs = fetchedJobs.filter(job => {
                        if (!job.score) return false;

                        if (filters.matchScore === 'high') {
                            return job.score > 70;
                        } else if (filters.matchScore === 'medium') {
                            return job.score >= 40 && job.score <= 70;
                        }
                        return true;
                    });
                }

                // Apply work mode filter (hybrid/on-site)
                if (filters.workMode) {
                    if (filters.workMode === 'hybrid') {
                        // Hybrid jobs might have 'hybrid' in description or location
                        fetchedJobs = fetchedJobs.filter(job =>
                            job.description?.toLowerCase().includes('hybrid') ||
                            job.location?.toLowerCase().includes('hybrid')
                        );
                    } else if (filters.workMode === 'on-site') {
                        // On-site jobs are not remote
                        fetchedJobs = fetchedJobs.filter(job => !job.remote);
                    }
                    // 'remote' is handled by backend via remote=true param
                }

                setJobs(fetchedJobs);
            } else {
                setError('Failed to fetch jobs');
            }
        } catch (err) {
            console.error('Error fetching jobs:', err);
            setError(err.message || 'An error occurred while fetching jobs');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    // Fetch match scores
    const fetchMatchScores = useCallback(async () => {
        setLoadingMatches(true);

        try {
            const response = await matchAPI.getScores({ limit: 100 });

            if (response.success) {
                setMatchScores(response.data.scores);
            }
        } catch (err) {
            console.error('Error fetching match scores:', err);
        } finally {
            setLoadingMatches(false);
        }
    }, []);

    // Merge match scores with jobs
    useEffect(() => {
        if (matchScores.length > 0 && jobs.length > 0) {
            const scoresMap = new Map(
                matchScores.map(score => [score.job?._id?.toString(), score])
            );

            const jobsWithScores = jobs.map(job => {
                const matchScore = scoresMap.get(job._id?.toString());

                if (matchScore) {
                    return {
                        ...job,
                        score: matchScore.score,
                        matchedSkills: matchScore.matchedSkills,
                        missingSkills: matchScore.missingSkills,
                        reasoning: matchScore.reasoning,
                    };
                }

                return job;
            });

            setJobs(jobsWithScores);
        }
    }, [matchScores]);

    // Fetch jobs when filters change
    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    // Refetch function for manual refresh
    const refetch = useCallback(() => {
        fetchJobs();
        fetchMatchScores();
    }, [fetchJobs, fetchMatchScores]);

    return {
        jobs,
        loading,
        error,
        refetch,
        matchScores,
        loadingMatches,
        fetchMatchScores,
    };
};

export default useJobs;
