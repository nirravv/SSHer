const express = require('express');
const router = express.Router();
const SshCredentials = require('../models/SshCredentials'); // Import your SSH credentials model here
const authMiddleware = require('../middleware/authMiddleware'); // Import your authentication middleware here

// Define routes for handling connections
router.get('/',(req, res) => {
    // Logic for handling connections page
    res.sendFile('connections.html', { root: 'public/html' });
});


// Route for fetching connections data
router.get('/ssh-credentials', authMiddleware, async (req, res) => {
    try {
        // Fetch connections data for the logged-in user
        const connections = await SshCredentials.find({ user: req.user._id });
        
        // Check if connections exist
        if (connections.length === 0) {
            return res.status(200).json([]);
        }
        
        // If connections exist, send them in the response
        res.status(200).json(connections);
    } catch (error) {
        console.error('Error fetching connections:', error);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

// Route for handling SSH credentials submission
router.post('/ssh-credentials', authMiddleware, async (req, res) => {
    try {
        // Extract user ID from the authenticated request
        const userId = req.user.id;

        // Extract SSH credentials from the request body
        const { host, port, username, password } = req.body;

        // Validate if any required fields are missing
        if (!host || !port || !username || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Create a new SSH credentials object
        const newSshCredentials = new SshCredentials({ user: userId, host, port, username, password });

        // Save the SSH credentials to the database
        await newSshCredentials.save();

        // Return success response
        res.status(200).json({ message: 'SSH credentials saved successfully' });
    } catch (error) {
        console.error('Error saving SSH credentials:', error);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

// Export the router
module.exports = router;
