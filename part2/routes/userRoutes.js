const express = require('express');
const router = express.Router();
// Make sure this path to your db connection file is correct.
const db = require('../models/db');

// This route is good for testing, it gets all users.
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT user_id, username, email, role FROM Users');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// This is the main login route, called by the form on the frontend.
router.post('/login', async (req, res) => {
  // Just getting the username from the request body.
  const { username } = req.body;

  try {
    // I'm looking for a user in the database who has this username.
    // The exam says we don't need to check the password, so this is all we need.
    const [rows] = await db.query('SELECT * FROM Users WHERE username = ?', [username]);

    // If the database query returns no rows, it means the username wasn't found.
    if (rows.length === 0) {
      // Sending a 401 'Unauthorized' error back to the frontend.
      return res.status(401).json({ error: 'Invalid username' });
    }

    // If we found a user, their data will be in the first row.
    const user = rows[0];

    // This is the most important part for logging in.
    // I'm saving the user's details into the session object.
    // The server will now remember this user for subsequent requests.
    req.session.user = {
      id: user.user_id,
      username: user.username,
      role: user.role
    };

    // If login is successful, send back a success message and the user's data.
    // The Vue.js frontend will receive this and handle redirecting the user.
    res.json({ message: 'Login successful', user: req.session.user });

  } catch (error) {
    // A simple catch block in case the database connection fails.
    console.error('Login error:', error);
    res.status(500).json({ error: 'An internal error occurred during login.' });
  }
});

// A simple route to handle logging out.
router.get('/logout', (req, res) => {
    // To log a user out, we just destroy their session data on the server.
    req.session.destroy(err => {
        if (err) {
            // If something goes wrong, send an error.
            return res.status(500).json({ error: 'Could not log out, please try again.'});
        }
        // If logout is successful, send a confirmation message.
        // The frontend will use this to redirect to the home/login page.
        res.status(200).json({ message: 'Logout successful' });
    });
});


// This is a helper route. The frontend can call '/api/users/me' to check
// who is currently logged in. It's very useful for the dashboards.
router.get('/me', (req, res) => {
  // If there's no user in the session, it means they are not logged in.
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  // If they are logged in, send back their user info.
  res.json(req.session.user);
});

// I'm adding this new route to get a list of all dogs for the homepage.
// It's a public route, so no session check is needed.
router.get('/dogs', async (req, res) => {
    try {
        // This query joins the Dogs and Users tables to get the dog's name,
        // size, and the owner's username.
        const [dogs] = await db.query(`
            SELECT
                d.name AS dog_name,
                d.size,
                u.username AS owner_username
            FROM Dogs d
            JOIN Users u ON d.owner_id = u.user_id
            ORDER BY d.name ASC
        `);
        // Send the list of dogs back as JSON.
        res.json(dogs);
    } catch (error) {
        // Basic error handling if the query fails.
        console.error('Failed to fetch all dogs:', error);
        res.status(500).json({ error: 'Failed to retrieve dog list.' });
    }
});


module.exports = router;
