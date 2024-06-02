const express = require('express');
const { Client } = require('ssh2');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const mongodbUrl = process.env.MONGODB_URL;

// Connect to MongoDB
mongoose.connect(mongodbUrl, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to MongoDB');
        // Start the server
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error.message);
    });

app.use(express.json());
app.use(cors());
app.use(express.static('public')); // Serve static files from the "public" directory

const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);

let sshConnection = null;

app.post('/ssh/connect', (req, res) => {
    const { host, port, username, password } = req.body;

    if (sshConnection) {
        res.json({ message: 'SSH connection already established' });
    } else {
        establishSSHConnection(host, port, username, password)
            .then(connection => {
                sshConnection = connection;
                res.json({ message: 'SSH connection established' });
            })
            .catch(error => {
                res.status(500).json({ error: 'SSH connection failed', details: error.message });
            });
    }
});

app.post('/ssh/execute', (req, res) => {
    const { command } = req.body;

    if (!sshConnection) {
        return res.status(500).json({ error: 'SSH connection not established' });
    }

    executeSSHCommand(sshConnection, command)
        .then(output => {
            res.json({ output });
        })
        .catch(error => {
            res.status(500).json({ error: 'Error executing command', details: error.message });
        });
});

function establishSSHConnection(host, port, username, password) {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => {
            resolve(conn);
        }).on('error', (err) => {
            reject(err);
        }).connect({ host, port, username, password });
    });
}

function executeSSHCommand(connection, command) {
    return new Promise((resolve, reject) => {
        connection.exec(command, (err, stream) => {
            if (err) {
                reject(err);
            }
            let data = '';
            stream.on('close', (code, signal) => {
                resolve(data);
            }).on('data', (chunk) => {
                data += chunk;
            }).stderr.on('data', (chunk) => {
                data += chunk;
            });
        });
    });
}
