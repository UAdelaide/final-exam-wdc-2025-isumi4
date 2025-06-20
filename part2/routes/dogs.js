const express = require('express');
const router = express.Router();
const db = require('../models/db');

router.get('/my-dogs', async (req, res) => {
    if(!req.session.user || req.session.user.role !== 'owner'){
        return res.status(403).json({error: 'Unauthorized'});
    }
    const ownerId = req.session.user.id;
    try{
        const ownerId = req.session.user.id;
        const [rows] = await db.query('SELECT dog_id, name FROM Dogs WHERE owner_id = ?', [ownerId]);
        res.json(rows);
    } catch(error){
        res.status(500).json({error: 'Failed to fetch dogs'});
    }
});

module.exports = router;