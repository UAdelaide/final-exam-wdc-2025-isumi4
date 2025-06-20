const express = require('express');
const router = express.Router();

router.get('/summary', async (req, res) => {
  try {
    const db = req.app.locals.db;

    const [rows] = await db.execute(`
      SELECT
        u.username AS walker_username,
        COUNT(wr.rating_id) AS total_ratings,
        AVG(wr.rating) AS average_rating,
        (
          SELECT COUNT(*)
          FROM WalkRequests wr2
          WHERE wr2.status = 'completed' AND wr2.request_id IN (
            SELECT request_id FROM WalkRatings WHERE walker_id = u.user_id
          )
        ) AS completed_walks
      FROM Users u
      LEFT JOIN WalkRatings wr ON u.user_id = wr.walker_id
      WHERE u.role = 'walker'
      GROUP BY u.user_id
    `);

    res.json(rows);
  } catch (err) {
    console.error('Error in /api/walkers/summary:', err);
    res.status(500).json({ error: 'Failed to fetch walker summary' });
  }
});

module.exports = router;