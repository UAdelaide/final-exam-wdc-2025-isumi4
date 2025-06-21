const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();

const session = require('express-session');

app.use(session({
  secret: process.env.SESSION_SECRET || 'bongo',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60
  }
}));

app.get('/api/users/session', (req, res) => {
    if (req.session && req.session.user) {
        res.json({ user: req.session.user });
    } else {
        res.status(401).json({ error: 'Not logged in' });
    }
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');
const dogsRouter = require('./routes/dogs');


app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dogs', require('./routes/dogs'));

function ensureOwner(req, res, next){
    if(req.session && req.session.user && req.session.user.role === 'owner'){
      next();
    } else{
      res.redireect('/');
    }
  }
  function ensureWalker(req, res, next){
    if(req.session && req.session.user && req.session.user.role === 'walker'){
      next();
    } else{
      res.redireect('/');
    }
  }

  app.get('/owner-dashboard.html', ensureOwner, (req, res) => {
    res.sendFile(__dirname + '/public/owner-dashboard.html');
  });
  app.get('/walker-dashboard.html', ensureWalker, (req, res) => {
    res.sendFile(__dirname + '/public/walker-dashboard.html');
  });
// Export the app instead of listening here
module.exports = app;