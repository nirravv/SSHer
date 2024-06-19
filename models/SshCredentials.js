const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryptionUtil');

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

    // Encrypt the password only if it has been modified or is new
    if (!sshCredentials.isModified('password')) {
        return next();
    }

    try {
        // Encrypt the password
        const encryptedPassword = await encrypt(sshCredentials.password);
        // Replace the plain password with the encrypted one
        sshCredentials.password = encryptedPassword;
        next();
    } catch (error) {
        next(error);
    }
});

// Method to decrypt password
sshCredentialsSchema.methods.decryptPassword = async function () {
    try {
        return await decrypt(this.password);
    } catch (error) {
        throw new Error('Failed to decrypt password');
    }
};

const SshCredentials = mongoose.model('SshCredentials', sshCredentialsSchema);

module.exports = SshCredentials;
