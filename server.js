const express = require('express');
const path = require('path');
const { Client } = require('ssh2');
const cors = require('cors');
const mongoose = require('mongoose');
const WebSocket = require('ws');
const  SshCredentials = require('./models/SshCredentials');
const authMiddleware = require('./middleware/authMiddleware');
const { decrypt } = require('./utils/encryptionUtil');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const mongodbUrl = process.env.MONGODB_URL;

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static('public')); // Serve static files from the "public" directory
// Serve static files from node_modules
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
// Import routes
const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);

// Global object to store active SSH sessions
const sshSessions = {};

// Connect to MongoDB
mongoose.connect(mongodbUrl, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to MongoDB');
        // Start the server
        const server = app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });

        // WebSocket server for SSH sessions
        const wss = new WebSocket.Server({ server });
        wss.on('connection', (ws) => {
            ws.on('message', (message) => {
                handleWebSocketMessage(ws, message);
            });
            ws.on('close', () => {
                handleWebSocketClose(ws);
            });
        });
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error.message);
    });



// Main Home Page Route
app.get('/', (req, res) => {
    // Logic for handling main page (index.html)
    res.sendFile('index.html', { root: 'public/html' });
});

// Function to handle WebSocket messages
function handleWebSocketMessage(ws, message) {
    try {
        const data = JSON.parse(message);
        const { action, sshSessionId, command } = data;

        if (action === 'exec' && sshSessionId && command) {
            executeSSHCommand(sshSessionId, command)
                .then(output => {
                    ws.send(JSON.stringify({ action: 'output', output }));
                })
                .catch(error => {
                    console.error('Error executing SSH command:', error);
                    ws.send(JSON.stringify({ action: 'error', error: 'Error executing command' }));
                });
        } else {
            ws.send(JSON.stringify({ action: 'error', error: 'Invalid message format' }));
        }
    } catch (error) {
        console.error('Invalid WebSocket message:', error);
        ws.send(JSON.stringify({ action: 'error', error: 'Invalid message format' }));
    }
}

// Function to handle WebSocket connection close
function handleWebSocketClose(ws) {
    console.log('WebSocket connection closed');
}

// Function to execute SSH command
function executeSSHCommand(sshSessionId, command) {
    return new Promise((resolve, reject) => {
        const conn = sshSessions[sshSessionId];
        console.log(conn, "SSH CONNECTIONS");
        if (!conn) {
            reject(new Error('SSH session not found'));
            return;
        }

        conn.exec(command, (err, stream) => {
            if (err) {
                reject(err);
                return;
            }

            let output = '';
            stream.on('close', (code, signal) => {
                resolve(output);
            }).on('data', (data) => {
                output += data.toString();
            }).stderr.on('data', (data) => {
                output += data.toString();
            });
        });
    });
}

function generateSessionId() {
    // Example implementation; customize as needed
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

//ROUTES FOR /Connections Starts here.
app.get('/connections', (req, res) => {
    res.sendFile('connections.html', { root: 'public/html' });
});

// Route for fetching connections data
app.get('/connections/ssh-credentials', authMiddleware, async (req, res) => {
    try {
        const connections = await SshCredentials.find({ user: req.user._id });
        res.status(200).json(connections);
    } catch (error) {
        console.error('Error fetching connections:', error);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

// Route for handling SSH credentials submission
app.post('/connections/ssh-credentials', authMiddleware, async (req, res) => {
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
app.post('/connections/ssh-connect/:id', authMiddleware, async (req, res) => {
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
                            executeSSHCommand(sessionId, data.command)
                                .then(output => {
                                    ws.send(JSON.stringify({ action: 'output', output }));
                                })
                                .catch(error => {
                                    console.error('Error executing SSH command:', error);
                                    ws.send(JSON.stringify({ action: 'error', error: 'Error executing command' }));
                                });
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

module.exports = app;
