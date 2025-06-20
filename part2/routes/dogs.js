const express = require('express');
const router = express.Router();
const db = require('../models/db');

router.get('/my-dogs', async (req, res) => {
    if(!req.session.user || req.session.user.role !== 'owner'){
        return res.status(403).json({error: 'Unauthorized'});
    }
    try
})