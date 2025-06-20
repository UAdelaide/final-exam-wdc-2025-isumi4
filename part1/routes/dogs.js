const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;

    const [rows] = await db.execute(`
      SELECT
        d.dog_id,
        d.name AS dog_name,
        d.size,
        u.username AS owner_username
      FROM Dogs d
      JOIN Users u ON d.owner_id = u.user_id
    `);

    res.json(rows);
  } catch (err) {
    console.error('Error fetching dogs:', err);
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

module.exports = router;