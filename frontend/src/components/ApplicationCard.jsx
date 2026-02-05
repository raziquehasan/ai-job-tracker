import './ApplicationCard.css';

function ApplicationCard({ application, onUpdateStatus }) {
    const getStatusColor = (status) => {
        switch (status) {
            case 'applied': return 'blue';
            case 'interview': return 'purple';
            case 'offer': return 'green';
            case 'rejected': return 'red';
            default: return 'gray';
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const statuses = ['applied', 'interview', 'offer', 'rejected'];
    const currentStatusIndex = statuses.indexOf(application.status);

    return (
        <div className="application-card">
            <div className="application-header">
                <div>
                    <h3 className="application-title">{application.jobId?.title || 'Job Title'}</h3>
                    <p className="application-company">{application.jobId?.company || 'Company'}</p>
                </div>
                <span className={`status-badge status-${getStatusColor(application.status)}`}>
                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                </span>
            </div>

            <div className="application-meta">
                <span>📅 Applied: {formatDate(application.appliedAt)}</span>
                {application.jobId?.location && (
                    <span>📍 {application.jobId.location}</span>
                )}
            </div>

            {/* Timeline */}
            <div className="timeline">
                {statuses.slice(0, 3).map((status, index) => {
                    const isActive = index <= currentStatusIndex && application.status !== 'rejected';
                    const isRejected = application.status === 'rejected' && status === 'rejected';
                    const timelineEntry = application.timeline.find(t => t.status === status);

                    return (
                        <div key={status} className="timeline-item">
                            <div className={`timeline-dot ${isActive || isRejected ? 'active' : ''} ${isRejected ? 'rejected' : ''}`}>
                                {isActive || isRejected ? '✓' : ''}
                            </div>
                            <div className="timeline-content">
                                <div className={`timeline-label ${isActive || isRejected ? 'active' : ''}`}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </div>
                                {timelineEntry && (
                                    <div className="timeline-date">{formatDate(timelineEntry.date)}</div>
                                )}
                            </div>
                            {index < 2 && <div className={`timeline-line ${isActive ? 'active' : ''}`}></div>}
                        </div>
                    );
                })}
            </div>

            {/* Rejected status shown separately */}
            {application.status === 'rejected' && (
                <div className="rejected-notice">
                    <span className="rejected-icon">✗</span>
                    <span>Application Rejected</span>
                    <span className="rejected-date">
                        {formatDate(application.timeline.find(t => t.status === 'rejected')?.date)}
                    </span>
                </div>
            )}

            {/* Update Status Buttons */}
            {application.status !== 'offer' && application.status !== 'rejected' && (
                <div className="action-buttons">
                    {application.status === 'applied' && (
                        <button
                            onClick={() => onUpdateStatus(application._id, 'interview')}
                            className="btn-update btn-interview"
                        >
                            Move to Interview
                        </button>
                    )}
                    {application.status === 'interview' && (
                        <button
                            onClick={() => onUpdateStatus(application._id, 'offer')}
                            className="btn-update btn-offer"
                        >
                            Got Offer! 🎉
                        </button>
                    )}
                    <button
                        onClick={() => onUpdateStatus(application._id, 'rejected')}
                        className="btn-update btn-reject"
                    >
                        Mark as Rejected
                    </button>
                </div>
            )}
        </div>
    );
}

export default ApplicationCard;
