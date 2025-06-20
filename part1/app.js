const express = require('express');
const db = require('./db');
const app = express();
const PORT = 8080;

app.use(express.json());

app.get('/api/dogs', async (req, res) => {
    try {
        const sql = `
            SELECT
                d.name      AS dog_name,
                d.size,
                u.username  AS owner_username
            FROM
                Dogs d
            JOIN
                Users u ON d.owner_id = u.user_id
            ORDER BY
                u.username, d.name;
        `;
        const [rows] = await db.execute(sql);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'failed to retrieve dog data' });
    }
});

app.get('/api/walkrequests/open', async (req, res) => {
    try {
        const sql = `
            SELECT
                wr.request_id,
                d.name AS dog_name,
                wr.requested_time,
                wr.duration_minutes,
                wr.location,
                u.username AS owner_username
            FROM
                WalkRequests wr
            JOIN
                Dogs d ON wr.dog_id = d.dog_id
            JOIN
                Users u ON d.owner_id = u.user_id
            WHERE
                wr.status = 'open'
            ORDER BY
                wr.requested_time ASC;
        `;
        const [rows] = await db.execute(sql);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'failed to retrieve open walk requests' });
    }
});

app.get('/api/walkers/summary', async (req, res) => {
    try {
        const sql = `
            SELECT
                u.username AS walker_username,
                COUNT(DISTINCT r.rating_id) AS total_ratings,
                AVG(r.rating) AS average_rating,
                COUNT(DISTINCT CASE WHEN wr.status = 'completed' THEN wr.request_id END) AS completed_walks
            FROM
                Users u
            LEFT JOIN
                WalkRatings r ON u.user_id = r.walker_id
            LEFT JOIN
                WalkRequests wr ON u.user_id = wr.accepted_walker_id
            WHERE
                u.role = 'walker'
            GROUP BY
                u.user_id, u.username
            ORDER BY
                u.username;
        `;
        const [rows] = await db.execute(sql);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'failed to retrieve walker summary' });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
