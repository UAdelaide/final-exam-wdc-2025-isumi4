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

app.use(express.static(path.join(__dirname, 'public')));

(async () => {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: ''
    });

    await connection.query('CREATE DATABASE IF NOT EXISTS DogWalkService');
    await connection.end();

    const db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'DogWalkService'
    });

    app.locals.db = db;

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

    const dogsRouter = require('./routes/dogs');
    app.use('/api/dogs', dogsRouter);

    const walkRequestsRouter = require('./routes/walkrequests');
    app.use('/api/walkrequests', walkRequestsRouter);

    const walkersRouter = require('./routes/walkers');
    app.use('/api/walkers', walkersRouter);

  } catch (err) {
    console.error('Error setting up database. Is MySQL running?', err);
  }
})();

module.exports = app;