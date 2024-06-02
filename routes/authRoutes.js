const express = require('express');
const router = express.Router();
const { RegisterUser, LoginUser } = require('../controller/authController');

// POST /auth/register - Register a new user
router.post('/register', RegisterUser);

// POST /auth/login - User login
router.post('/login', LoginUser);

module.exports = router;