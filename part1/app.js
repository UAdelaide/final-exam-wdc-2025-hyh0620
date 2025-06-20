app.get('/api/walkers/summary', async (req, res) => {
  try {
    const sql = `
      SELECT
        u.username                      AS walker_username,
        COUNT(r.rating_id)              AS total_ratings,
        AVG(r.rating)                   AS average_rating,
        SUM(CASE WHEN wr.status='completed' THEN 1 ELSE 0 END)
                                        AS completed_walks
      FROM Users u
      LEFT JOIN WalkRatings r   ON r.walker_id = u.user_id
      LEFT JOIN WalkApplications wa
             ON wa.walker_id = u.user_id
            AND wa.status = 'accepted'
      LEFT JOIN WalkRequests wr
             ON wr.request_id = wa.request_id
            AND wr.status = 'completed'
      WHERE u.role = 'walker'
      GROUP BY u.user_id, u.username
      ORDER BY u.username;
    `;
    const [rows] = await db.execute(sql);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to retrieve walker summary' });
  }
});
