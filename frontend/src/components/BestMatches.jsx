import { useState, useEffect } from 'react';
import { matchAPI } from '../services/api';
import JobCard from './JobCard';
import './BestMatches.css';

function BestMatches({ onApply }) {
    const [topMatches, setTopMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchBestMatches();
    }, []);

    const fetchBestMatches = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await matchAPI.getScores({ limit: 8, minScore: 40 });

            if (response.success) {
                // Sort by score descending and take top 6-8
                const sorted = response.data.scores
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 8);

                // Transform to job format
                const matches = sorted.map(score => ({
                    ...score.job,
                    score: score.score,
                    matchedSkills: score.matchedSkills,
                    missingSkills: score.missingSkills,
                    reasoning: score.reasoning
                }));

                setTopMatches(matches);
            }
        } catch (err) {
            console.error('Error fetching best matches:', err);
            setError('Failed to load best matches');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="best-matches-section">
                <h2 className="best-matches-title">
                    <span className="title-icon">✨</span>
                    Best Matches For You
                </h2>
                <div className="best-matches-grid">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="match-skeleton"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error || topMatches.length === 0) {
        return null; // Don't show section if no matches
    }

    return (
        <div className="best-matches-section">
            <div className="best-matches-header">
                <div>
                    <h2 className="best-matches-title">
                        <span className="title-icon">✨</span>
                        Best Matches For You
                    </h2>
                    <p className="best-matches-subtitle">
                        Top {topMatches.length} jobs matched to your resume with {topMatches[0]?.score}% - {topMatches[topMatches.length - 1]?.score}% compatibility
                    </p>
                </div>
            </div>

            <div className="best-matches-grid">
                {topMatches.map(job => (
                    <JobCard key={job._id} job={job} onApply={onApply} />
                ))}
            </div>
        </div>
    );
}

export default BestMatches;
