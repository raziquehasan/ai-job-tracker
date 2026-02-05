import { useState, useCallback } from 'react';
import { resumeAPI } from '../services/api';
import './ResumeUploadModal.css';

function ResumeUploadModal({ onClose, onUploadSuccess, canClose = true }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [dragActive, setDragActive] = useState(false);

    // Handle drag events
    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    // Handle drop
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        setError(null);

        const droppedFile = e.dataTransfer.files[0];
        validateAndSetFile(droppedFile);
    }, []);

    // Handle file input change
    const handleFileChange = (e) => {
        setError(null);
        const selectedFile = e.target.files[0];
        validateAndSetFile(selectedFile);
    };

    // Validate and set file
    const validateAndSetFile = (selectedFile) => {
        if (!selectedFile) return;

        // Check file type
        const validTypes = ['application/pdf', 'text/plain'];
        if (!validTypes.includes(selectedFile.type)) {
            setError('Only PDF and TXT files are allowed');
            return;
        }

        // Check file size (10MB max)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (selectedFile.size > maxSize) {
            setError('File size must be less than 10MB');
            return;
        }

        setFile(selectedFile);
    };

    // Handle upload
    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const response = await resumeAPI.upload(file);

            if (response.success) {
                // Success! Call the callback
                if (onUploadSuccess) {
                    onUploadSuccess(response.data);
                }
            } else {
                setError(response.message || 'Upload failed');
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.response?.data?.message || 'Failed to upload resume. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    // Handle close
    const handleClose = () => {
        if (!canClose) return; // Prevent closing if forced modal
        if (onClose) onClose();
    };

    return (
        <div
            className="resume-modal-overlay"
            onClick={canClose ? handleClose : undefined}
        >
            <div
                className="resume-modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="resume-modal-header">
                    <div>
                        <h2 className="resume-modal-title">
                            {canClose ? 'Replace Resume' : 'Upload Your Resume'}
                        </h2>
                        <p className="resume-modal-subtitle">
                            {canClose
                                ? 'Upload a new resume to update your job matches'
                                : 'To get started, please upload your resume (PDF or TXT)'
                            }
                        </p>
                    </div>
                    {canClose && (
                        <button onClick={handleClose} className="resume-modal-close">
                            ✕
                        </button>
                    )}
                </div>

                {/* Drag & Drop Area */}
                <div
                    className={`resume-upload-area ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    {!file ? (
                        <>
                            <div className="upload-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>
                            <p className="upload-text-primary">
                                {dragActive ? 'Drop your resume here' : 'Drag & drop your resume here'}
                            </p>
                            <p className="upload-text-secondary">or</p>
                            <label htmlFor="file-input" className="upload-button">
                                Browse Files
                                <input
                                    id="file-input"
                                    type="file"
                                    accept=".pdf,.txt"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>
                            <p className="upload-hint">Supports PDF and TXT files (max 10MB)</p>
                        </>
                    ) : (
                        <div className="file-preview">
                            <div className="file-icon">
                                {file.type === 'application/pdf' ? '📄' : '📝'}
                            </div>
                            <div className="file-info">
                                <p className="file-name">{file.name}</p>
                                <p className="file-size">{(file.size / 1024).toFixed(2)} KB</p>
                            </div>
                            <button
                                onClick={() => setFile(null)}
                                className="file-remove"
                                disabled={uploading}
                            >
                                ✕
                            </button>
                        </div>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="resume-error">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="resume-modal-actions">
                    {canClose && (
                        <button
                            onClick={handleClose}
                            className="btn-cancel"
                            disabled={uploading}
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        onClick={handleUpload}
                        className="btn-upload"
                        disabled={!file || uploading}
                    >
                        {uploading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Uploading...
                            </>
                        ) : (
                            'Upload Resume'
                        )}
                    </button>
                </div>

                {/* Info Box */}
                {!canClose && (
                    <div className="resume-info-box">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <p>Your resume will be analyzed to match you with the best job opportunities</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ResumeUploadModal;
