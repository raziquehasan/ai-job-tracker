import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import JobCard from './components/JobCard';
import ChatAssistant from './components/ChatAssistant';
import ApplyConfirmModal from './components/ApplyConfirmModal';
import ResumeUploadModal from './components/ResumeUploadModal';
import FiltersPanel from './components/FiltersPanel';
import BestMatches from './components/BestMatches';
import { useJobs } from './hooks/useJobs';
import { resumeAPI, applicationsAPI } from './services/api';
import './App.css';

function App() {
  // Expanded filter state to support all assignment requirements
  const [filters, setFilters] = useState({
    title: '',
    skills: [],              // Array of selected skills
    location: '',
    type: '',                // full-time, part-time, internship, contract
    workMode: '',            // remote, hybrid, on-site
    postedWithinDays: null,  // 1, 7, 30, null (any)
    matchScore: 'all'        // 'high' (>70), 'medium' (40-70), 'all'
  });

  const [showModal, setShowModal] = useState(false);
  const [pendingJob, setPendingJob] = useState(null);
  const [hasResume, setHasResume] = useState(null); // null = checking, true/false = result
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [filtersPanelOpen, setFiltersPanelOpen] = useState(false);

  const navigate = useNavigate();
  const { logout } = useAuth();

  // Use custom hook for job fetching
  const { jobs, loading, error, refetch, fetchMatchScores } = useJobs(filters);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Check resume status on mount
  useEffect(() => {
    const checkResumeStatus = async () => {
      try {
        const response = await resumeAPI.checkStatus();
        setHasResume(response.hasResume);

        // Force resume upload modal if no resume
        if (!response.hasResume) {
          setShowResumeModal(true);
        } else {
          // Fetch match scores if resume exists
          fetchMatchScores();
        }
      } catch (error) {
        console.error('Error checking resume status:', error);
        setHasResume(false);
      }
    };

    checkResumeStatus();
  }, [fetchMatchScores]);

  // Handle window focus to show application confirmation modal
  useEffect(() => {
    const handleFocus = () => {
      const lastAppliedJobId = localStorage.getItem('lastAppliedJobId');
      if (lastAppliedJobId) {
        const job = jobs.find(j => j._id === lastAppliedJobId || j.id === lastAppliedJobId);
        if (job) {
          setPendingJob(job);
          setShowModal(true);
          localStorage.removeItem('lastAppliedJobId');
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [jobs]);

  // Handle apply button click
  const handleApply = (job) => {
    localStorage.setItem('lastAppliedJobId', job._id || job.id);
  };

  // Handle application confirmation
  const handleConfirmApplication = async (applied) => {
    if (!pendingJob) return;

    try {
      await applicationsAPI.confirm(pendingJob._id || pendingJob.id, applied);
      console.log('Application confirmed');
    } catch (error) {
      console.error('Error confirming application:', error);
    }
  };

  // Handle AI assistant filter updates
  const handleAIUpdate = (newFilters, intent) => {
    if (intent === 'RESET') {
      setFilters({
        title: '',
        skills: [],
        location: '',
        type: '',
        workMode: '',
        postedWithinDays: null,
        matchScore: 'all'
      });
    } else if (intent === 'FILTER') {
      setFilters(prev => ({
        ...prev,
        ...newFilters,
        // Preserve arrays if not provided
        skills: newFilters.skills || prev.skills
      }));
    }
  };

  // Handle resume upload success
  const handleResumeUploaded = () => {
    setHasResume(true);
    setShowResumeModal(false);
    refetch(); // Refetch jobs
    fetchMatchScores(); // Fetch match scores
  };

  // Count active filters
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.title) count++;
    if (filters.skills.length > 0) count++;
    if (filters.location) count++;
    if (filters.type) count++;
    if (filters.workMode) count++;
    if (filters.postedWithinDays) count++;
    if (filters.matchScore !== 'all') count++;
    return count;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-indigo-200 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">JOBTRACKER.AI</h1>
          </div>

          <div className="flex gap-3">
            {hasResume && (
              <button
                onClick={() => setShowResumeModal(true)}
                className="bg-white text-gray-700 px-4 py-2 rounded-full text-sm font-bold border-2 border-gray-300 hover:bg-gray-50 transition-all active:scale-95"
              >
                Replace Resume
              </button>
            )}
            <button
              onClick={() => navigate('/applications')}
              className="bg-white text-indigo-600 px-4 py-2 rounded-full text-sm font-bold border-2 border-indigo-600 hover:bg-indigo-50 transition-all active:scale-95"
            >
              My Applications
            </button>
            <button
              onClick={() => {
                fetchMatchScores();
                refetch();
              }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md hover:bg-black transition-all active:scale-95"
            >
              Match My Resume
            </button>
            <button
              onClick={handleLogout}
              className="bg-white text-red-600 px-4 py-2 rounded-full text-sm font-bold border-2 border-red-600 hover:bg-red-50 transition-all active:scale-95"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Filters Panel */}
        <FiltersPanel
          filters={filters}
          onFiltersChange={setFilters}
          isOpen={filtersPanelOpen}
          onToggle={() => setFiltersPanelOpen(!filtersPanelOpen)}
        />

        {/* Best Matches Section - Only show if resume exists */}
        {hasResume && <BestMatches onApply={handleApply} />}

        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Discover Your Next Role</h2>
            <p className="text-gray-500 font-medium">
              We've found {jobs.length} jobs tailored to your career profile.
              {getActiveFiltersCount() > 0 && ` (${getActiveFiltersCount()} filters active)`}
            </p>
          </div>

          {/* Active filters display */}
          <div className="flex flex-wrap gap-2">
            {filters.title && (
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-200">
                Title: {filters.title}
              </span>
            )}
            {filters.skills.length > 0 && (
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold border border-purple-200">
                Skills: {filters.skills.slice(0, 2).join(', ')}{filters.skills.length > 2 && ` +${filters.skills.length - 2}`}
              </span>
            )}
            {filters.location && (
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200">
                Location: {filters.location}
              </span>
            )}
            {filters.workMode && (
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">
                {filters.workMode.charAt(0).toUpperCase() + filters.workMode.slice(1)}
              </span>
            )}
            {filters.type && (
              <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200">
                Type: {filters.type}
              </span>
            )}
            {filters.postedWithinDays && (
              <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-xs font-bold border border-pink-200">
                Last {filters.postedWithinDays} days
              </span>
            )}
            {filters.matchScore !== 'all' && (
              <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold border border-orange-200">
                Match: {filters.matchScore}
              </span>
            )}
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 font-medium">Error: {error}</p>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-gray-200 rounded-2xl h-64 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.length > 0 ? (
              jobs.map(job => (
                <JobCard key={job._id || job.id} job={job} onApply={handleApply} />
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">No matches found</h3>
                <p className="text-gray-500">Try adjusting your filters or chatting with our AI to refine your search.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <ChatAssistant onFilterUpdate={handleAIUpdate} />

      {showModal && pendingJob && (
        <ApplyConfirmModal
          job={pendingJob}
          onClose={() => setShowModal(false)}
          onConfirm={handleConfirmApplication}
        />
      )}

      {/* Resume Upload Modal */}
      {showResumeModal && (
        <ResumeUploadModal
          canClose={hasResume === true}
          onClose={() => setShowResumeModal(false)}
          onUploadSuccess={handleResumeUploaded}
        />
      )}
    </div>
  );
}

export default App;
