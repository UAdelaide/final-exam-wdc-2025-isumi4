const express = require('express');
const router = express.Router();

router.get('/open', async (req, res) => {
  try {
    const db = req.app.locals.db;

    const [rows] = await db.execute(`
      SELECT
        wr.request_id,
        d.name AS dog_name,
        wr.requested_time,
        wr.duration_minutes,
        wr.location,
        u.username AS owner_username
      FROM WalkRequests wr
      JOIN Dogs d ON wr.dog_id = d.dog_id
      JOIN Users u ON d.owner_id = u.user_id
      WHERE wr.status = 'open'
    `);

    res.json(rows);
  } catch (err) {
    console.error('Error in /api/walkrequests/open:', err);
    res.status(500).json({ error: 'Failed to fetch open walk requests' });
  }
});

module.exports = router;