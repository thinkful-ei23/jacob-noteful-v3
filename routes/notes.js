'use strict';

const express = require('express');
const mongoose = require('mongoose');

const Note = require('../models/note');
const Tag = require('../models/tag');
const Folder = require('../models/folder');
const router = express.Router();

const passport = require('passport');

function validateFolderId(folderId, userId) {
  console.log(typeof(folderId),'HEY LOOK AT ME');
  if (folderId === undefined) {
    return Promise.resolve();
  }
  if (!mongoose.Types.ObjectId.isValid(folderId)) {
    const err = new Error('The `folderId` is not valid');
    err.status = 400;
    return Promise.reject(err);
  }
  return Folder.count({ _id: folderId, userId })
    .then(count => {
      if (count === 0) {
        const err = 400;
        return Promise.reject(err);
      }
    });
}
function validateTagsIds(tagId, userId) {
  if (tagId === undefined || tagId.length === 0) {
    return Promise.resolve();
  }
  if (Array.isArray(tagId) === false) {
    const err = new Error('The tags property must be an array');
    err.status = 400;
    return Promise.reject(err);
  }
  for (let i = 0; i < tagId.length; i++) {
    if (!mongoose.Types.ObjectId.isValid(tagId[i])) {
      const err = new Error( 'The tags array contains an invalid id');
      err.status = 400;
      return Promise.reject(err);
    }
  }
  return Tag.count({ _id: tagId, userId })
    .then(count => {
      if (count === 0) {
        const err = 400;
        return Promise.reject(err);
      }
    });
}

// Protect endpoints using JWT Strategy
router.use('/', passport.authenticate('jwt', { session: false, failWithError: true }));



/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
  const { searchTerm, folderId, tagId, } = req.query;
  let filter = {};
  filter.userId = req.user.id;
  if (searchTerm) {
    filter.title = { $regex: searchTerm, $options: 'i' };

    // Mini-Challenge: Search both `title` and `content`
    const re = new RegExp(searchTerm, 'i');
    filter.$or = [{ 'title': re }, { 'content': re }];
  }
  if (folderId) {
    filter.folderId = folderId;
  }
  if (tagId) {
    filter.tags = tagId;
  }

  Note.find(filter)
    .populate('tags')
    .sort({ updatedAt: 'desc' })
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Note.findOne({_id: id, userId })
    .populate('tags')
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {
  const { title, content, folderId, tags } = req.body;
  const userId = req.user.id;
  /***** Never trust users - validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }
  const newNote = { title, content, userId };
  newNote.tags = tags;
  if (folderId) {
    newNote.folderId = folderId;
  }
  if (tags) {
    newNote.tags = tags;
  }
  
  Promise.all([
    validateFolderId(newNote.folderId, userId),
    validateTagsIds(newNote.tags, userId)
  ])
    .then(() => Note.create(newNote))  
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`)
        .status(201)
        .json(result);
    })
    .catch(err => next(err));
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
  const { id } = req.params;
  const { title, content, folderId, tags } = req.body;
  const userId = req.user.id;
  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }
  const updateNote = { title, content, userId };

  if (folderId)  {
    if (mongoose.Types.ObjectId.isValid(folderId)) {
      return updateNote.folderId = folderId;
    } else {
      const err = new Error('The `id` is not valid');
      err.status = 400;
      return next(err);
    }
  }
  if (tags) {
    for (let i = 0; i < tags.length; i++) {
      if (!mongoose.Types.ObjectId.isValid(tags[i])) {
        const err = new Error('The `id` is not valid');
        err.status = 400;
        return next(err);
      }
    } let tagsArray = [];
    for (let i = 0; i < tags.length; i++) {
      tagsArray.push(tags[i]);
    } updateNote.tags = tagsArray;
  }
  Promise.all([
    validateFolderId(folderId, userId),
    validateTagsIds(tags, userId)
  ])
    .then(() => { 
      Note.findByIdAndUpdate(id, updateNote, { new: true })
        .then(result => {
          if (result) {
            res.json(result);
          } else {
            next();
          }
        });
    })
    .catch(err => {
      next(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }
  Note.find({ _id: id, userId: userId}).remove()
    .then(() => {
      res.status(204).end();
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;