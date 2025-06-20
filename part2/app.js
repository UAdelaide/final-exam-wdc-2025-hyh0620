const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser'); // Added this line
const session = require('express-session');    // Added this line
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser()); // Added this middleware

// Session configuration added here
app.use(session({
    secret: 'a_secret_key_for_the_dog_walking_app', // This is just a random secret string
    resave: false,
    saveUninitialized: true
}));

app.use(express.static(path.join(__dirname, '/public')));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

// Export the app instead of listening here
module.exports = app;