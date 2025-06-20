const express = require('express');
const router = express.Router();
const db = require('../models/db');

router.get('/my-dogs', async (req, res) => {
    if(!req.session.user || req.session.user.role !== 'owner'){
        return res.status(403).json({error: 'Unauthorized'});
    }
    const ownerId = req.session.user.id;
    try {
        const [dogs] = await db.query(
          'SELECT dog_id, name FROM Dogs WHERE owner_id = ?',
          [ownerId]
        );
        res.json(dogs);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch dogs' });
      }
});

// routes/dogRoutes.js (or wherever your route is)
router.get('/', async (req, res) => {
    try {
      const [dogs] = await db.query('SELECT dog_id, name, size, owner_id FROM Dogs');
      res.json(dogs);
    } catch (error) {
      console.error('SQL Error:', error);
      res.status(500).json({ error: 'Failed to fetch dogs' });
    }
});

module.exports = router;