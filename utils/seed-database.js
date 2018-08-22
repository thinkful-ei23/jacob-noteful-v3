'use strict';

const mongoose = require('mongoose');

const { MONGODB_URI } = require('../config');

const Note = require('../models/note');
const Tag = require('../models/tag');
const Folder = require('../models/folder');
const User = require('../models/user');

const seedFolders = require('../db/seed/folders');
const seedNotes = require('../db/seed/notes');
const seedTags = require('../db/seed/tags');
const seedUsers = require('../db/seed/users');

mongoose.connect(MONGODB_URI)
  .then(() => mongoose.connection.db.dropDatabase())
  .then(() => {
    return Promise.all([
      Note.insertMany(seedNotes),
      Folder.insertMany(seedFolders),
      Tag.insertMany(seedTags),
      User.insertMany(seedUsers),
      Folder.createIndexes(),
      Tag.createIndexes(),
      User.createIndexes()
    ]);
  })
  .then((results) => {
    console.log(`Inserted ${results[0].length} Notes`,`Inserted ${results[1].length} Folders`, `Inserted ${results[2].length} Tags`, `Inserted ${results[3].length} Users`);
  })
  .then(() => mongoose.disconnect())
  .catch(err => {
    console.log(err);
  });