// models/SshCredentials.js

const mongoose = require('mongoose');

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

const SshCredentials = mongoose.model('SshCredentials', sshCredentialsSchema);

module.exports = SshCredentials;
