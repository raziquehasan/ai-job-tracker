const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    status: {
        type: String,
        enum: ['applied', 'interview', 'offer', 'rejected'],
        default: 'applied',
        required: true
    },
    appliedAt: {
        type: Date,
        default: Date.now,
        required: true
    },
    timeline: [{
        status: {
            type: String,
            enum: ['applied', 'interview', 'offer', 'rejected'],
            required: true
        },
        date: {
            type: Date,
            default: Date.now,
            required: true
        }
    }]
}, {
    timestamps: true
});

// Create unique compound index on userId + jobId
applicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;
