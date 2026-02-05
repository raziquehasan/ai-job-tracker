const mongoose = require('mongoose');

const matchScoreSchema = new mongoose.Schema({
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
    score: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    matchedSkills: {
        type: [String],
        default: []
    },
    missingSkills: {
        type: [String],
        default: []
    },
    reasoning: {
        type: String,
        required: true
    },
    resumeHash: {
        type: String,
        required: true,
        index: true
    }
}, {
    timestamps: true
});

// Compound unique index to prevent duplicate scores for same user-job pair
matchScoreSchema.index({ userId: 1, jobId: 1 }, { unique: true });

// Index for efficient top matches query
matchScoreSchema.index({ userId: 1, score: -1 });

const MatchScore = mongoose.model('MatchScore', matchScoreSchema);

module.exports = MatchScore;
