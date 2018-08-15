'use strict';

const express = require('express');
const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config');

const Note = require('../models/note');

const router = express.Router();

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
  const { searchTerm } = req.query;
  let filter = {};

  if (searchTerm) {
    let arr = [];
    arr.push( { title: { $regex: searchTerm, $options: 'i'} } );
    arr.push( { content: { $regex: searchTerm } } );
    filter = { $or: arr};
  } 

  return Note.find( filter ).sort( { updatedAt: 'desc' } )
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    });
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {
  const id = req.params.id;
  return Note.findById(id)
    .then(result => {
      res.json(result);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    });
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {
  const { title, content } = req.body;
  
  return Note.create({title: title, content: content})
    .then( result => {
      res.location('path/to/new/document').status(201).json(result);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: 'Internal server  error' });
    });

});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {

  const id = req.params.id;
  const { title, content } = req.body;
  const toUpdate = { title: title, content: content }
 
  return Note.findByIdAndUpdate(id, { $set : toUpdate},{new: true})
    .then(result => res.status(201).json(result).end())
    .catch(err => res.status(500).json({ message: 'Internal server error' }));
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
  const id = req.params.id;
  return Note.findByIdAndRemove(id)
    .then(() => {
      res.status(204).end();
    })
    .catch(err => res.status(500).json({ message: "Internal server error" }));
});

module.exports = router;