const express = require('express');
const helmet = require('helmet');
const bcrypt = require('bcrypt');
const session = require('express-session');
const knexSessionStore = require('connect-session-knex')(session);

const db = require('./data/db-config.js');

const server = express();

server.use(helmet());
server.use(express.json());
server.use(session({
  name: 'userServer',
  secret: 'Once upon a time',
  cookie: {
    maxAge: 1000 * 60 * 60,
    secure: false,
    httpOnly: true
  },
  resave: false,
  saveUninitialized: false,

  store: new knexSessionStore({
    knex: require('./data/db-config.js'), // ref knex instance
    tablename: "sessions", // db table name
    sidfieldname: "sid", // col name in table for session id
    createTable: true, // create if table not found
    clearInterval: 1000 * 60 * 60 // clear expired sessions, in ms
  })
}))

// ROUTES
server.get('/api/users', restricted, async (req, res) => {
  try {
    // Get all users
    const users = await db('users');

    if (users) {
      res.status(200).json(users);
    }
  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
})

server.post('/api/register', async (req, res) => {
  const user = req.body;

  try {
    if (user.username && user.password) {
      // Hash password
      const hash = bcrypt.hashSync(user.password, 5);
      user.password = hash;

      // Insert User into db
      const userReg = await db('users').insert(user);

      if (userReg) {
        res.status(201).json({userReg});
      } else {
        res.status(404).json({
          message: 'User registeration is not valid'
        })
      }
    } else {
      res.status(400).json({
        message: "All required fields not found."
      })
    }
  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
})

server.post('/api/login', async (req, res) => {
  const userTry = req.body;

  try {
    // Get user hashed password
    const user = await db('users').where('username', userTry.username).first();

    // Hash password check
    const attempt = bcrypt.compareSync(userTry.password, user.password);

    if (attempt) {
      req.session.user = user;
      res.send('<h1>Logged In</h1>');
    } else {
      res.status(404).json({
        message: 'You shall not pass!'
      })
    }
  } catch (err) {
    res.status(500).json({
       error: err.message
    })
  }
})

server.delete('/api/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        res.status(400).json({
          error: err.message
        })
      } else {
        res.status(200).json({
          message: "You are now logged out. Please come again!"
        })
      }
    })
  } else {
    res.end();
  }
})

// FALLBACK
server.use('/', (req, res) => {
  res.send('<p>User Auth Server</p>');
})

// MIDDLEWARE
/*
async function validate(req, res, next) {
  const userTry = req.headers;

  try {
    if (userTry.username && userTry.password) {
      // Get user hashed password
      const user = await db('users').where('username', userTry.username).first();

      // Hash password check
      const attempt = bcrypt.compareSync(userTry.password, user.password);

      if (attempt) {
        next();
      } else {
        res.status(404).json({
          message: 'You shall not pass!'
        })
      }
    } else {
      res.status(400).json({
        message: "All required fields not found."
      })
    }
  } catch (err) {
    res.status(500).json({
      message: err.message
    })
  }
}
*/

async function restricted(req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(404).json({
      message: 'You shall not pass!'
    })
  }
}

module.exports = server;