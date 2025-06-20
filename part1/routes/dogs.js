const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    router.get('/', async (req, res) => {
        try {
            const [rows] = await pool.execute(`
                SELECT
                    d.name AS dog_name,
                    d.size,
                    u.username AS owner_username
                FROM Dogs AS d
                JOIN Users AS u ON d.owner_id = u.user_id;
            `);
            res.json(rows);
        } catch (error) {
            console.error('Error fetching dogs:', error);
            res.status(500).json({ message: 'Internal Server Error', error: error.message });
        }
    });

    return router;
};