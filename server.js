'use strict';

const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');

const { PORT, MONGODB_URI } = require('./config');

const notesRouter = require('./routes/notes');
const foldersRouter = require('./routes/folders');
const tagsRouter = require ('./routes/tags');
const usersRouter = require('./routes/users');
const passport = require('passport');
const localStrategy = require('./passport/local');
const jwtStrategy = require('./passport/jwt');

const authRouter = require('./routes/auth');
// Create an Express application
const app = express();

// Log all requests. Skip logging during
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'common', {
  skip: () => process.env.NODE_ENV === 'test'
}));

// Create a static webserver
app.use(express.static('public'));

// Parse request body
app.use(express.json());

// Utilize the given `stategy`
passport.use(localStrategy);
passport.use(jwtStrategy);

// Protect endpoints using JWT Strategy
const jwtAuth = passport.authenticate('jwt', { session: false, failWithError: true });

// Mount routers
app.use('/api/notes', jwtAuth, notesRouter);
app.use('/api/folders', jwtAuth, foldersRouter);
app.use('/api/tags', jwtAuth, tagsRouter);
app.use('/api', usersRouter);
app.use('/api', authRouter);

// Custom 404 Not Found route handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Custom Error Handler
app.use((err, req, res, next) => {
  if (err.status) {
    const errBody = Object.assign({}, err, { message: err.message });
    res.status(err.status).json(errBody);
  } else {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Connect to DB and Listen for incoming connections

if (process.env.NODE_ENV !== 'test') {

  mongoose.connect(MONGODB_URI)
    .then(instance => {
      const conn = instance.connections[0];
      console.info(`Connected to: mongodb://${conn.host}:${conn.port}/${conn.name}`);
    })
    .catch(err => {
      console.error(`ERROR: ${err.message}`);
      console.error('\n === Did you remember to start `mongod`? === \n');
      console.error(err);
    })
    .then(() => {
      app.listen(PORT, function () {
        console.info(`Server listening on ${this.address().port}`);
      }).on('error', err => {
        console.error(err);
      });
    });
}

module.exports = app; // Export for testing