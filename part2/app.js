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
      res.redirect('/');
    }
  }
  function ensureWalker(req, res, next){
    if(req.session && req.session.user && req.session.user.role === 'walker'){
      next();
    } else{
      res.redirect('/');
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