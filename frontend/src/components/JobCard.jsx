import React from 'react';

const JobCard = ({ job, onApply }) => {
    const handleApply = () => {
        // Check if applyUrl exists
        if (!job.applyUrl) {
            alert('Application link not available for this job');
            console.warn('Missing applyUrl for job:', job);
            return;
        }

        // Save job ID for tracking
        if (onApply) {
            onApply(job);
        }

        // Open external job link
        window.open(job.applyUrl, '_blank', 'noopener,noreferrer');
    };

    // Get badge color based on score
    const getScoreBadgeClass = (score) => {
        if (!score) return 'bg-gray-100 text-gray-600 border-gray-200';
        if (score > 70) return 'bg-green-50 text-green-700 border-green-200';
        if (score >= 40) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
        return 'bg-gray-100 text-gray-600 border-gray-200';
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{job.title}</h3>
                    <p className="text-gray-500 font-medium text-sm flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" clipRule="evenodd" />
                        </svg>
                        {job.company}
                    </p>
                </div>
                {job.score !== undefined && (
                    <div className={`${getScoreBadgeClass(job.score)} px-3 py-1.5 rounded-full text-sm font-black flex items-center gap-1 border`}>
                        {job.score}% Match
                    </div>
                )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-semibold capitalize flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {job.location}
                </span>
                <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-md text-xs font-semibold capitalize">{job.type}</span>
                {job.remote && (
                    <span className="bg-green-50 text-green-600 px-2.5 py-1 rounded-md text-xs font-semibold uppercase">Remote</span>
                )}
            </div>

            <p className="text-gray-600 text-sm line-clamp-2 mb-4 h-10 leading-relaxed">
                {job.description}
            </p>

            {job.matchedSkills && job.matchedSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-4 border-t border-gray-50 mb-4">
                    {job.matchedSkills.slice(0, 3).map((skill, i) => (
                        <span key={i} className="text-[10px] text-indigo-500 font-bold px-2 py-0.5 rounded-full bg-indigo-50">
                            #{skill}
                        </span>
                    ))}
                    {job.matchedSkills.length > 3 && (
                        <span className="text-[10px] text-gray-400 font-bold px-2 py-0.5">
                            +{job.matchedSkills.length - 3} more
                        </span>
                    )}
                </div>
            )}

            <button
                onClick={handleApply}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 px-4 rounded-lg font-bold text-sm hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
                Apply Now →
            </button>
        </div>
    );
};

export default JobCard;
