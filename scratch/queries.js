'use strict';

const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config');

const Note = require('../models/note');

mongoose.connect(MONGODB_URI)
  .then(() => {
    const searchTerm = 'England';
    let filter = [];

    if (searchTerm) {
      filter.push( { title: { $regex: searchTerm } } );
      filter.push( { content: { $regex: searchTerm } } );
    }
    return Note.find( { $or: filter } ).sort( { updatedAt: 'desc' } );
  })
  .then(results => {
    console.log(results);
  })
  .then(() => {
    const id = '000000000000000000000004';
    
    return Note.findById( { _id: id } );
  })
  .then(results => {
    console.log(results);
  })    
  .then(() => {
    return Note.create({
      title: 'OO7 James Bond',
      content: 'Government Agent for England'
    });
  })
  .then(results => {
    console.log(201, results);
  })
  .then(() => {
    const id = '000000000000000000000004';
    const toUpdate = { title: 'I AM THE DOG MAN', content: 'HE IS THE DOG MAN' };
   
    return Note.findByIdAndUpdate(id, { $set : toUpdate},{new: true});
  })
  .then(results => {
    console.log(204, results);
  })
  .then(() => {
    const id = '000000000000000000000006';
    return Note.findByIdAndRemove(id);
  })
  .then(() => {
    console.log(204, 'Note Deleted');
  })

  .then(() => {
    return mongoose.disconnect();
  })
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
  });
