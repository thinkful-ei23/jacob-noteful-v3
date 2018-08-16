'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');

const Note = require('../models/note');

const seedNotes = require('../db/seed/notes');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Noteful API Testing',() => {

  before(() => {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(() => {
    return Note.insertMany(seedNotes);
  });

  afterEach(() => {
    return mongoose.connection.db.dropDatabase();
  });

  after(() => {
    return mongoose.disconnect();
  });

  describe('/GET /api/notes', () => {
    it ('Should return all existing notes in database', () => {
      let res;
      return chai.request(app)
        .get('/api/notes')
        .then(_res => {
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.lengthOf.at.least(1);
          return Note.find().count();
        })
        .then(notes => {
          expect(res.body.length).to.be.equal(notes);
        });
    });
    it ('Should not return when wrong path ', () => {
      return chai.request(app)
        .get('/api/notess')
        .then(res => {
          expect(res).to.have.status(404);
          expect(res).to.be.json;
        });
    });
  });

  describe('/GET /api/notes/:id', () => {
    it ('Should return note matching id', () => {
      let data;
      return Note.findOne()
        .then(_data => {
          data = _data;
      
          return chai.request(app)
            .get(`/api/notes/${data.id}`);
        })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'title', 'content', 'folderId', 'createdAt', 'updatedAt' );

          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });
    it ('should not return a note if wrong id path', () => {
      let id = 123456789;
      return chai.request(app)
        .get(`/api/notes/${id}`)
        .then(res => {
          expect(res).to.have.status(400);
        });
    });
  });

  describe('/POST api/notes', () => {
    it ('Should create a new note', () => {
      const newItem = {
        title: 'THIS IS A TEST',
        content: 'THIS IS ONLY A TEST'
      };
      return chai.request(app)
        .post('/api/notes')
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys('id', 'title', 'content', 'createdAt', 'updatedAt' );
          return Note.findById(res.body.id)
            .then(dbItem => {
              expect(res.body.id).to.equal(dbItem.id);
              expect(res.body.title).to.equal(dbItem.title);
              expect(res.body.content).to.equal(dbItem.content);
              expect(new Date(res.body.createdAt)).to.eql(dbItem.createdAt);
              expect(new Date(res.body.updatedAt)).to.eql(dbItem.updatedAt);
            });
        });
    });
    it ('should return error when sending no title in post', () => {
      let badItem = {
        content: 'No Title'
      };
      return chai.request(app)
        .post('/api/notes')
        .send(badItem)
        .then(res => {
          expect(res).to.have.status(400);
        }); 
    });
  });
  describe('UPDATE /api/notes/:id', () => {
    it ('should update note', () => {
      const updateNote = {
        title: 'I HAVE CHANGED',
        content: 'SHUT UP'
      };
      let data;
      return Note.findOne()
        .then(_data => {
          data = _data;
          
          return chai.request(app)
            .put(`/api/notes/${data.id}`)
            .send(updateNote);
        })
        .then(res => {
          expect(res).to.have.status(200);
          return Note.findById(data.id);
        })
        .then(res => {
          expect(res.title).to.be.equal(updateNote.title);
          expect(res.content).to.be.equal(updateNote.content);
        });
    });

    it ('it should return an error', () => {
      const badNote = {
        title: null,
        content: 'NEVER GONNA WORK'
      };
      let data;
      return Note.findOne()
        .then(_data => {
          data = _data;

          return chai.request(app)
            .put(`/api/notes/${data.id}`)
            .send(badNote);
        })
        .then(res => {
          expect(res).to.have.status(400);
        });
    });
  });

  describe('DELETE /api/notes/:id', () => {
    it ('should delete note by id', () => {
      let data;
      return Note.findOne()
        .then(_data => {
          data = _data;
          
          return chai.request(app)
            .delete(`/api/notes/${data.id}`);
        })
        .then(res => {
          expect(res).to.have.status(204);
          return Note.findById(data.id);
        })
        .then(res => {
          expect(res).to.be.null;
        });
    });
    it ('should not return error', () => {
      let badId =12345;
      return chai.request(app)
        .delete(`/api/notes/${badId}`)
        .then(res => {
          expect(res).to.have.status(400);
        });
    });
  });
});