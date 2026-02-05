import { useState } from 'react';
import './FiltersPanel.css';

// Common skills for autocomplete
const COMMON_SKILLS = [
    'React', 'JavaScript', 'TypeScript', 'Node.js', 'Python', 'Java',
    'AWS', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL', 'MySQL',
    'Git', 'REST API', 'GraphQL', 'HTML', 'CSS', 'Tailwind',
    'Vue.js', 'Angular', 'Express.js', 'Django', 'Flask', 'Spring Boot',
    'C++', 'C#', '.NET', 'Ruby', 'Go', 'Rust', 'PHP', 'Laravel'
];

function FiltersPanel({ filters, onFiltersChange, isOpen, onToggle }) {
    const [skillInput, setSkillInput] = useState('');
    const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);

    // Filter suggestions based on input
    const filteredSuggestions = COMMON_SKILLS.filter(skill =>
        skill.toLowerCase().includes(skillInput.toLowerCase()) &&
        !filters.skills.includes(skill)
    );

    // Handle skill addition
    const handleAddSkill = (skill) => {
        if (skill && !filters.skills.includes(skill)) {
            onFiltersChange({
                ...filters,
                skills: [...filters.skills, skill]
            });
            setSkillInput('');
            setShowSkillSuggestions(false);
        }
    };

    // Handle skill removal
    const handleRemoveSkill = (skillToRemove) => {
        onFiltersChange({
            ...filters,
            skills: filters.skills.filter(s => s !== skillToRemove)
        });
    };

    // Handle skill input key press
    const handleSkillKeyPress = (e) => {
        if (e.key === 'Enter' && skillInput.trim()) {
            e.preventDefault();
            handleAddSkill(skillInput.trim());
        }
    };

    // Handle clear all filters
    const handleClearAll = () => {
        onFiltersChange({
            title: '',
            skills: [],
            location: '',
            type: '',
            workMode: '',
            postedWithinDays: null,
            matchScore: 'all'
        });
    };

    // Count active filters
    const activeFiltersCount = () => {
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
        <div className={`filters-panel ${isOpen ? 'open' : ''}`}>
            {/* Toggle Button */}
            <button onClick={onToggle} className="filters-toggle">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                </svg>
                Filters
                {activeFiltersCount() > 0 && (
                    <span className="filters-badge">{activeFiltersCount()}</span>
                )}
            </button>

            {/* Panel Content */}
            {isOpen && (
                <div className="filters-content">
                    <div className="filters-header">
                        <h3 className="filters-title">Filter Jobs</h3>
                        {activeFiltersCount() > 0 && (
                            <button onClick={handleClearAll} className="clear-all-btn">
                                Clear All
                            </button>
                        )}
                    </div>

                    <div className="filters-body">
                        {/* Title Search */}
                        <div className="filter-group">
                            <label className="filter-label">Job Title / Role</label>
                            <input
                                type="text"
                                placeholder="e.g. Software Engineer, Product Manager"
                                value={filters.title}
                                onChange={(e) => onFiltersChange({ ...filters, title: e.target.value })}
                                className="filter-input"
                            />
                        </div>

                        {/* Skills Multi-Select */}
                        <div className="filter-group">
                            <label className="filter-label">
                                Skills
                                {filters.skills.length > 0 && (
                                    <span className="skill-count">({filters.skills.length})</span>
                                )}
                            </label>

                            {/* Selected Skills */}
                            {filters.skills.length > 0 && (
                                <div className="skills-selected">
                                    {filters.skills.map(skill => (
                                        <span key={skill} className="skill-tag">
                                            {skill}
                                            <button
                                                onClick={() => handleRemoveSkill(skill)}
                                                className="skill-remove"
                                            >
                                                ✕
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Skill Input */}
                            <div className="skill-input-wrapper">
                                <input
                                    type="text"
                                    placeholder="Add skills (e.g. React, Python)"
                                    value={skillInput}
                                    onChange={(e) => {
                                        setSkillInput(e.target.value);
                                        setShowSkillSuggestions(true);
                                    }}
                                    onKeyPress={handleSkillKeyPress}
                                    onFocus={() => setShowSkillSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowSkillSuggestions(false), 200)}
                                    className="filter-input"
                                />

                                {/* Suggestions Dropdown */}
                                {showSkillSuggestions && filteredSuggestions.length > 0 && (
                                    <div className="skill-suggestions">
                                        {filteredSuggestions.slice(0, 8).map(skill => (
                                            <button
                                                key={skill}
                                                onClick={() => handleAddSkill(skill)}
                                                className="skill-suggestion"
                                            >
                                                {skill}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Location */}
                        <div className="filter-group">
                            <label className="filter-label">Location</label>
                            <input
                                type="text"
                                placeholder="e.g. New York, San Francisco"
                                value={filters.location}
                                onChange={(e) => onFiltersChange({ ...filters, location: e.target.value })}
                                className="filter-input"
                            />
                        </div>

                        {/* Work Mode */}
                        <div className="filter-group">
                            <label className="filter-label">Work Mode</label>
                            <div className="radio-group">
                                {['remote', 'hybrid', 'on-site'].map(mode => (
                                    <label key={mode} className="radio-label">
                                        <input
                                            type="radio"
                                            name="workMode"
                                            value={mode}
                                            checked={filters.workMode === mode}
                                            onChange={(e) => onFiltersChange({ ...filters, workMode: e.target.value })}
                                            className="radio-input"
                                        />
                                        <span className="radio-text">
                                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                        </span>
                                    </label>
                                ))}
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        name="workMode"
                                        value=""
                                        checked={filters.workMode === ''}
                                        onChange={(e) => onFiltersChange({ ...filters, workMode: '' })}
                                        className="radio-input"
                                    />
                                    <span className="radio-text">Any</span>
                                </label>
                            </div>
                        </div>

                        {/* Job Type */}
                        <div className="filter-group">
                            <label className="filter-label">Job Type</label>
                            <select
                                value={filters.type}
                                onChange={(e) => onFiltersChange({ ...filters, type: e.target.value })}
                                className="filter-select"
                            >
                                <option value="">All Types</option>
                                <option value="full-time">Full-time</option>
                                <option value="part-time">Part-time</option>
                                <option value="internship">Internship</option>
                                <option value="contract">Contract</option>
                            </select>
                        </div>

                        {/* Date Posted */}
                        <div className="filter-group">
                            <label className="filter-label">Date Posted</label>
                            <select
                                value={filters.postedWithinDays || ''}
                                onChange={(e) => onFiltersChange({
                                    ...filters,
                                    postedWithinDays: e.target.value ? parseInt(e.target.value) : null
                                })}
                                className="filter-select"
                            >
                                <option value="">Any Time</option>
                                <option value="1">Last 24 hours</option>
                                <option value="7">Last 7 days</option>
                                <option value="30">Last 30 days</option>
                            </select>
                        </div>

                        {/* Match Score */}
                        <div className="filter-group">
                            <label className="filter-label">Match Score</label>
                            <select
                                value={filters.matchScore}
                                onChange={(e) => onFiltersChange({ ...filters, matchScore: e.target.value })}
                                className="filter-select"
                            >
                                <option value="all">All Matches</option>
                                <option value="high">High (&gt;70%)</option>
                                <option value="medium">Medium (40-70%)</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default FiltersPanel;
