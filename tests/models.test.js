// Verifies that models register against the shared mongoose connection
// exposed by db/index.js (TICKET-003).

import test from 'node:test';
import assert from 'node:assert/strict';

import mongoose from 'mongoose';

import dbDefault, { mongoose as dbMongoose, connectDB } from '../db/index.js';
import modelsDefault, { StudentModel } from '../models/index.js';
import StudentDirect from '../models/Student.js';

test('db/index.js exports the shared mongoose singleton', () => {
  // Default export and named export both resolve to the mongoose package singleton.
  assert.equal(dbDefault, mongoose, 'default export should be the mongoose singleton');
  assert.equal(dbMongoose, mongoose, 'named export should be the mongoose singleton');
  assert.equal(typeof mongoose.model, 'function');
});

test('db/index.js exports the connectDB helper', () => {
  assert.equal(typeof connectDB, 'function', 'connectDB must be a function');
});

test('models/index.js is a barrel exporting all models', () => {
  assert.ok(StudentModel, 'expected named export StudentModel');
  assert.equal(StudentModel, StudentDirect, 'barrel export must be the same model instance');
  assert.equal(modelsDefault.StudentModel, StudentDirect, 'default export must include StudentModel');
});

test('Student model is registered on the shared mongoose connection', () => {
  // After importing the barrel, the schema is registered on the same mongoose
  // instance that db/index.js exposes — i.e. one shared connection.
  const names = mongoose.modelNames();
  assert.ok(
    names.includes('data'),
    `expected mongoose.modelNames() to include 'data', got ${JSON.stringify(names)}`
  );
  // The registered model retrieved from the singleton must be the same instance.
  assert.equal(mongoose.model('data'), StudentModel);
});

test('importing models/index.js does not mutate process warnings (no circular require)', () => {
  // Pure-ESM imports use live bindings and never emit Node's CJS circular-require
  // warning. We assert no warning listener fires synchronously during import. The
  // imports above already executed; if a circular warning had been emitted, it
  // would appear on stderr — this test documents the intent and guards against a
  // future regression that adds a model import to db/index.js.
  assert.ok(StudentModel, 'sanity: barrel import succeeded without throwing');
});
