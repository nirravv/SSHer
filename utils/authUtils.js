// utils/authUtils.js
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Ensure that environment variables are loaded

const JWT_SECRET = process.env.JWT_SECRET;

// Function to generate a JWT token
const generateToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
};

// Function to verify a JWT token
const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (error) {
        // Handle token verification error
        throw new Error('Invalid token');
    }
};

module.exports = { generateToken, verifyToken };
