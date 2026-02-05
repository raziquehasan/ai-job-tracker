const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        default: 'dummy-password-123' // Dummy for now
    },
    resumeText: {
        type: String,
        default: ''
    },
    resumeUpdatedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);

module.exports = User;
