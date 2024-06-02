/* 
TO RUN THIS SCRIPT AND GENERATE A JWT_KEY just run node jwt-key-geenerate.js and press enter 
and it will generate a random JWT string for you.
*/
const crypto = require('crypto');

// Function to generate a random JWT secret key
const generateJWTSecret = () => {
    return crypto.randomBytes(64).toString('hex');
};

// Generate a random JWT secret key
const JWT_SECRET = generateJWTSecret();

console.log('Generated JWT Secret Key:', JWT_SECRET);
