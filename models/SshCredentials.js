// models/SshCredentials.js

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const sshCredentialsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    host: {
        type: String,
        required: true
    },
    port: {
        type: Number,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

sshCredentialsSchema.pre('save', async function (next) {
    const sshCredentials = this;

    // Hash the password only if it has been modified or is new
    if (!sshCredentials.isModified('password')) {
        return next();
    }

    try {
        // Generate a salt
        const salt = await bcrypt.genSalt(10);
        // Hash the password with the salt
        const hashedPassword = await bcrypt.hash(sshCredentials.password, salt);
        // Replace the plain password with the hashed one
        sshCredentials.password = hashedPassword;
        next();
    } catch (error) {
        next(error);
    }
});

const SshCredentials = mongoose.model('SshCredentials', sshCredentialsSchema);

module.exports = SshCredentials;
