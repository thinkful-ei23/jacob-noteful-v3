'use strict';

const mongoose = require('mongoose');

const { MONGODB_URI } = require('../config');

const Folder = require('../models/folder');
const Note = require('../models/note');
const Tag = require('../models/tag');

const seedFolders = require('../db/seed/folders');
const seedNotes = require('../db/seed/notes');
const seedTags = require('../db/seed/tags');

mongoose.connect(MONGODB_URI)
  .then(() => mongoose.connection.db.dropDatabase())
  .then(() => {
    return Promise.all([
      Note.insertMany(seedNotes),
      Folder.insertMany(seedFolders),
      Tag.insertMany(seedTags),
      Folder.createIndexes(),
      Tag.createIndexes()
    ]);
  })
  .then((results) => {
    console.log(`Inserted ${results[0].length} Notes`,`Inserted ${results[1].length} Folders`, `Inserted ${results[2].length} Tags`);
  })
  .then(() => mongoose.disconnect())
  .catch(err => {
    console.log(err);
  });