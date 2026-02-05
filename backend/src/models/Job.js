const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    externalId: {
        type: String,
        required: true,
        trim: true
    },
    source: {
        type: String,
        required: true,
        enum: ['adzuna', 'local'],
        default: 'local'
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    company: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['full-time', 'part-time', 'internship', 'contract'],
        default: 'full-time'
    },
    remote: {
        type: Boolean,
        required: true,
        default: false
    },
    applyUrl: {
        type: String,
        required: false,
        trim: true
    },
    postedAt: {
        type: Date,
        required: true,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index for efficient upserts and preventing duplicates
jobSchema.index({ externalId: 1, source: 1 }, { unique: true });

// Index for common queries
jobSchema.index({ title: 'text', description: 'text' });
jobSchema.index({ location: 1 });
jobSchema.index({ type: 1 });
jobSchema.index({ remote: 1 });
jobSchema.index({ postedAt: -1 });

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;
