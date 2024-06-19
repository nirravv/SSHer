const express = require('express');
const router = express.Router();
const SshCredentials = require('../models/SshCredentials'); // Import your SSH credentials model here
const authMiddleware = require('../middleware/authMiddleware'); // Import your authentication middleware here
const WebSocket = require('ws');
const { Client } = require('ssh2');
const { decrypt } = require('../utils/encryptionUtil');
const { server } = require('../server'); // Adjust the path as needed

// Object to store active SSH sessions
const sshSessions = {};

// Function to generate a unique session ID
function generateSessionId() {
    // Example implementation; customize as needed
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Define routes for handling connections
router.get('/', (req, res) => {
    res.sendFile('connections.html', { root: 'public/html' });
});

// Route for fetching connections data
router.get('/ssh-credentials', authMiddleware, async (req, res) => {
    try {
        const connections = await SshCredentials.find({ user: req.user._id });
        res.status(200).json(connections);
    } catch (error) {
        console.error('Error fetching connections:', error);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

// Route for handling SSH credentials submission
router.post('/ssh-credentials', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { host, port, username, password } = req.body;

        if (!host || !port || !username || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const newSshCredentials = new SshCredentials({ user: userId, host, port, username, password });
        await newSshCredentials.save();

        res.status(200).json({ message: 'SSH credentials saved successfully' });
    } catch (error) {
        console.error('Error saving SSH credentials:', error);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});


// Route for connecting to SSH server
router.post('/ssh-connect/:id', authMiddleware, async (req, res) => {
    const connectionId = req.params.id;
    const token = req.headers.authorization;

    try {
        if (!connectionId) {
            return res.status(400).json({ success: false, message: 'Connection ID is required' });
        }

        const credentials = await SshCredentials.findById(connectionId);
        if (!credentials) {
            return res.status(404).json({ success: false, message: 'Connection not found' });
        }

        const decryptedPassword = await decrypt(credentials.password);
        const conn = new Client();

        // Log connection details
        console.log(`Attempting to connect to SSH server ${credentials.host}:${credentials.port}`);

        conn.on('ready', () => {
            const sessionId = generateSessionId(); // Generate session ID
            sshSessions[sessionId] = conn;
            console.log(`SSH connection established successfully with session ID ${sessionId}`);
            // Send the session ID back to the client
            res.json({ success: true, sshSessionId: sessionId });

            // Establish WebSocket connection with the session ID
            const wss = new WebSocket.Server({ noServer: true }); // Use noServer option
            wss.on('connection', (ws) => {
                console.log(`WebSocket connected for session ID ${sessionId}`);
                // Handle WebSocket messages for this session ID
                ws.on('message', (message) => {
                    console.log(`Received message from WebSocket: ${message}`);
                    // Process incoming messages, e.g., execute SSH commands
                    try {
                        const data = JSON.parse(message);
                        if (data.action === 'exec' && data.sshSessionId === sessionId) {
                            executeSSHCommand(conn, data.command, ws);
                        } else {
                            console.warn(`Invalid message or session ID: ${message}`);
                        }
                    } catch (error) {
                        console.error('Error parsing WebSocket message:', error);
                    }
                });

                ws.on('close', () => {
                    console.log(`WebSocket connection closed for session ID ${sessionId}`);
                    // Clean up resources if needed
                    delete sshSessions[sessionId]; // Remove SSH session from sessions object
                });
            });

            // Attach WebSocket server to the existing HTTP server instance
            wss.handleUpgrade(req, req.socket, Buffer.alloc(0), (ws) => {
                wss.emit('connection', ws, req);
            });
        }).on('error', (err) => {
            console.error('SSH connection error:', err);
            res.status(500).json({ success: false, message: 'Failed to connect' });
        }).connect({
            host: credentials.host,
            port: credentials.port,
            username: credentials.username,
            password: decryptedPassword
        });
    } catch (error) {
        console.error('Error connecting to SSH:', error);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});




module.exports = router;
