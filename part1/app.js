var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql2/promise');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

let db;

(async () => {
  try {
    // Connect to MySQL server (no specific DB yet)
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '' // Update your MySQL password if needed
    });

    // Create database if it doesn't exist
    await connection.query('CREATE DATABASE IF NOT EXISTS dogwalksdb');
    await connection.end();

    // Connect to dogwalksdb
    db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'dogwalksdb'
    });

    // Create necessary tables
    await db.execute(`
      CREATE TABLE IF NOT EXISTS Users (
        user_id INT PRIMARY KEY,
        username VARCHAR(50),
        role VARCHAR(20)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS Dogs (
        dog_id INT PRIMARY KEY,
        name VARCHAR(50),
        size VARCHAR(20),
        owner_id INT,
        FOREIGN KEY (owner_id) REFERENCES Users(user_id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS WalkRequests (
        request_id INT PRIMARY KEY,
        dog_id INT,
        requested_time DATETIME,
        duration_minutes INT,
        location VARCHAR(100),
        status VARCHAR(20),
        FOREIGN KEY (dog_id) REFERENCES Dogs(dog_id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS WalkRatings (
        rating_id INT PRIMARY KEY AUTO_INCREMENT,
        request_id INT,
        walker_id INT,
        owner_id INT,
        rating INT,
        FOREIGN KEY (request_id) REFERENCES WalkRequests(request_id)
      )
    `);

    // Insert sample data only if Users table is empty
    const [userCount] = await db.execute('SELECT COUNT(*) AS count FROM Users');
    if (userCount[0].count === 0) {
      await db.execute(`
        INSERT INTO Users (user_id, username, role) VALUES
        (1, 'alice123', 'owner'),
        (2, 'bobwalker', 'walker'),
        (3, 'carol123', 'owner'),
        (4, 'newwalker', 'walker')
      `);

      await db.execute(`
        INSERT INTO Dogs (dog_id, name, size, owner_id) VALUES
        (1, 'Max', 'medium', 1),
        (2, 'Bella', 'small', 3)
      `);

      await db.execute(`
        INSERT INTO WalkRequests (request_id, dog_id, requested_time, duration_minutes, location, status) VALUES
        (1, 1, '2025-06-10 08:00:00', 30, 'Parklands', 'open'),
        (2, 2, '2025-06-11 10:00:00', 60, 'City Park', 'completed')
      `);

      await db.execute(`
        INSERT INTO WalkRatings (request_id, walker_id, owner_id, rating) VALUES
        (2, 2, 3, 5),
        (2, 2, 3, 4)
      `);
    }
  } catch (err) {
    console.error('Error setting up database. Is MySQL running?', err);
  }
})();

// Route: /api/dogs
app.get('/api/dogs', async (req, res) => {
    try {
      const [rows] = await db.execute(`
        SELECT d.name AS dog_name, d.size, u.username AS owner_username
        FROM Dogs d
        LEFT JOIN Users u ON d.owner_id = u.user_id
      `);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch dogs' });
    }
});

// Route: /api/walkrequests/open
app.get('/api/walkrequests/open', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT wr.request_id, d.name AS dog_name, wr.requested_time, wr.duration_minutes, wr.location, u.username AS owner_username
      FROM WalkRequests wr
      JOIN Dogs d ON wr.dog_id = d.dog_id
      JOIN Users u ON d.owner_id = u.user_id
      WHERE wr.status = 'open'
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch walk requests' });
  }
});

// Route: /api/walkers/summary
app.get('/api/walkers/summary', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        u.username AS walker_username,
        COUNT(r.rating_id) AS total_ratings,
        ROUND(AVG(r.rating), 1) AS average_rating,
        COUNT(DISTINCT wr.request_id) AS completed_walks
      FROM Users u
      LEFT JOIN WalkRequests wr ON wr.status = 'completed'
      LEFT JOIN WalkRatings r ON r.walker_id = u.user_id AND r.request_id = wr.request_id
      WHERE u.role = 'walker'
      GROUP BY u.username
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch walker summary' });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

module.exports = app;