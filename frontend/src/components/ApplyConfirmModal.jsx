import { useState, useEffect } from 'react';
import './ApplyConfirmModal.css';

function ApplyConfirmModal({ job, onClose, onConfirm }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger animation on mount
        setTimeout(() => setIsVisible(true), 10);
    }, []);

    const handleConfirm = (applied) => {
        setIsVisible(false);
        setTimeout(() => {
            onConfirm(applied);
            onClose();
        }, 300);
    };

    if (!job) return null;

    return (
        <div className={`modal-overlay ${isVisible ? 'visible' : ''}`} onClick={onClose}>
            <div
                className={`modal-content ${isVisible ? 'visible' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2>Application Confirmation</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    <p className="modal-question">
                        Did you apply to <strong>{job.title}</strong> at <strong>{job.company}</strong>?
                    </p>
                </div>

                <div className="modal-actions">
                    <button
                        className="btn btn-success"
                        onClick={() => handleConfirm(true)}
                    >
                        ✓ Yes, Applied
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={() => handleConfirm('earlier')}
                    >
                        📅 Applied Earlier
                    </button>
                    <button
                        className="btn btn-neutral"
                        onClick={() => handleConfirm(false)}
                    >
                        ✗ No, Just Browsing
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ApplyConfirmModal;
