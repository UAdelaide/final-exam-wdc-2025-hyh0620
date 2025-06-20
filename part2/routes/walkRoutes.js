const express = require('express');
const router = express.Router();
// Make sure this path to your db connection file is correct.
const db = require('../models/db');

// This route gets the dogs for the currently logged-in owner.
// It's used to populate the dropdown on the owner dashboard.
router.get('/mydogs', async (req, res) => {
    // First, check if a user is logged in and if they are an owner.
    if (!req.session.user || req.session.user.role !== 'owner') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const ownerId = req.session.user.id;
        const [dogs] = await db.query('SELECT dog_id, name FROM Dogs WHERE owner_id = ?', [ownerId]);
        res.json(dogs);
    } catch (error) {
        console.error('Failed to fetch dogs:', error);
        res.status(500).json({ error: 'Failed to fetch dogs' });
    }
});

// This is the new route for walkers to see all 'open' walk requests.
router.get('/open', async (req, res) => {
    // Only logged-in walkers should be able to see this.
    if (!req.session.user || req.session.user.role !== 'walker') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // I'm joining multiple tables to get all the necessary info
        // for the cards on the walker dashboard.
        const [walks] = await db.query(`
            SELECT
                wr.request_id,
                d.name AS dog_name,
                d.size,
                wr.requested_time,
                wr.duration_minutes,
                wr.location,
                u.username AS owner_username
            FROM WalkRequests wr
            JOIN Dogs d ON wr.dog_id = d.dog_id
            JOIN Users u ON d.owner_id = u.user_id
            WHERE wr.status = 'open'
            ORDER BY wr.requested_time ASC
        `);
        res.json(walks);
    } catch (error) {
        console.error('Failed to fetch open walks:', error);
        res.status(500).json({ error: 'Failed to fetch open walk requests' });
    }
});

// This route gets walk requests specifically for the logged-in owner.
router.get('/', async (req, res) => {
    // This logic is for owners, so I'll check the role.
    if (!req.session.user || req.session.user.role !== 'owner') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const ownerId = req.session.user.id;
        // The SQL query joins the tables to get the dog's name and other details.
        const [walks] = await db.query(`
            SELECT wr.request_id, d.name AS dog_name, d.size, wr.requested_time, wr.duration_minutes, wr.location, wr.status
            FROM WalkRequests wr
            JOIN Dogs d ON wr.dog_id = d.dog_id
            WHERE d.owner_id = ?
            ORDER BY wr.requested_time DESC
        `, [ownerId]);
        res.json(walks);
    } catch (error) {
        console.error('Failed to fetch owner walks:', error);
        res.status(500).json({ error: 'Failed to fetch walk requests' });
    }
});

// This is the route for creating a new walk request.
router.post('/', async (req, res) => {
    // Make sure the user is an owner before allowing them to create a request.
    if (!req.session.user || req.session.user.role !== 'owner') {
        return res.status(401).json({ error: 'You must be logged in as an owner to create a request.' });
    }

    const { dog_id, requested_time, duration_minutes, location } = req.body;
    const ownerId = req.session.user.id;

    try {
        // This is an important security check to make sure
        // the dog being requested for a walk actually belongs to the logged-in owner.
        const [dogCheck] = await db.query('SELECT * FROM Dogs WHERE dog_id = ? AND owner_id = ?', [dog_id, ownerId]);

        if (dogCheck.length === 0) {
            return res.status(403).json({ error: 'You can only create walks for your own dogs.' });
        }

        // If the check passes, insert the new walk request into the database.
        const [result] = await db.query(
            'INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location) VALUES (?, ?, ?, ?)',
            [dog_id, requested_time, duration_minutes, location]
        );

        res.status(201).json({ message: 'Walk request created successfully!', requestId: result.insertId });

    } catch (error) {
        console.error('Error creating walk request:', error);
        res.status(500).json({ error: 'Failed to create walk request.' });
    }
});

// This new route handles a walker's application for a walk.
// The ':requestId' makes the URL dynamic (e.g., /api/walks/15/apply).
router.post('/:requestId/apply', async (req, res) => {
    // Only a logged-in walker can apply for a job.
    if (!req.session.user || req.session.user.role !== 'walker') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const requestId = req.params.requestId;
    const walkerId = req.session.user.id;

    try {
        // To prevent issues, I'll first check if the walk is still 'open'.
        const [walkCheck] = await db.query('SELECT status FROM WalkRequests WHERE request_id = ?', [requestId]);

        if (walkCheck.length === 0 || walkCheck[0].status !== 'open') {
            return res.status(400).json({ error: 'This walk is no longer available.' });
        }

        // If the walk is available, add the application to the WalkApplications table.
        await db.query(
            'INSERT INTO WalkApplications (request_id, walker_id, status) VALUES (?, ?, ?)',
            [requestId, walkerId, 'accepted']
        );

        // Then, update the original walk request's status from 'open' to 'accepted'.
        await db.query(
            "UPDATE WalkRequests SET status = 'accepted' WHERE request_id = ?",
            [requestId]
        );

        res.json({ message: 'Application successful! The walk has been assigned to you.' });
    } catch (error) {
        console.error('Failed to apply for walk:', error);
        res.status(500).json({ error: 'Failed to apply for walk.' });
    }
});


module.exports = router;
