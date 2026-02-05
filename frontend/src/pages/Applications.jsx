import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ApplicationCard from '../components/ApplicationCard';
import { applicationsAPI } from '../services/api';
import './Applications.css';

function Applications() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const data = await applicationsAPI.getAll();
            setApplications(data);
        } catch (error) {
            console.error('Error fetching applications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const handleUpdateStatus = async (applicationId, newStatus) => {
        try {
            await applicationsAPI.updateStatus(applicationId, newStatus);
            // Refresh applications list
            fetchApplications();
        } catch (error) {
            console.error('Error updating application status:', error);
        }
    };

    const getStats = () => {
        const total = applications.length;
        const applied = applications.filter(a => a.status === 'applied').length;
        const interview = applications.filter(a => a.status === 'interview').length;
        const offer = applications.filter(a => a.status === 'offer').length;
        const rejected = applications.filter(a => a.status === 'rejected').length;

        return { total, applied, interview, offer, rejected };
    };

    const stats = getStats();

    return (
        <div className="applications-page">
            {/* Header */}
            <header className="app-header">
                <div className="header-content">
                    <button onClick={() => navigate('/')} className="back-button">
                        ← Back to Jobs
                    </button>
                    <div className="header-title">
                        <div className="icon-wrapper">
                            <svg xmlns="http://www.w3.org/2000/svg" className="header-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        </div>
                        <h1>My Applications</h1>
                    </div>
                    <button onClick={handleLogout} className="logout-button">
                        Logout
                    </button>
                </div>
            </header>

            {/* Stats Dashboard */}
            <div className="stats-container">
                <div className="stat-card stat-total">
                    <div className="stat-number">{stats.total}</div>
                    <div className="stat-label">Total Applications</div>
                </div>
                <div className="stat-card stat-applied">
                    <div className="stat-number">{stats.applied}</div>
                    <div className="stat-label">Applied</div>
                </div>
                <div className="stat-card stat-interview">
                    <div className="stat-number">{stats.interview}</div>
                    <div className="stat-label">In Interview</div>
                </div>
                <div className="stat-card stat-offer">
                    <div className="stat-number">{stats.offer}</div>
                    <div className="stat-label">Offers</div>
                </div>
                <div className="stat-card stat-rejected">
                    <div className="stat-number">{stats.rejected}</div>
                    <div className="stat-label">Rejected</div>
                </div>
            </div>

            {/* Applications List */}
            <main className="applications-main">
                {loading ? (
                    <div className="loading-container">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="loading-card"></div>
                        ))}
                    </div>
                ) : applications.length > 0 ? (
                    <div className="applications-grid">
                        {applications.map(app => (
                            <ApplicationCard
                                key={app._id}
                                application={app}
                                onUpdateStatus={handleUpdateStatus}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <h2>No Applications Yet</h2>
                        <p>Start applying to jobs to track your applications here!</p>
                        <button onClick={() => navigate('/')} className="cta-button">
                            Browse Jobs
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}

export default Applications;
