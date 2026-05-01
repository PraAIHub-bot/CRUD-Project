import { test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import StudentModel from '../models/Student.js';

// Pure schema-level tests — no DB connection required. validateSync runs
// the same validators Mongoose runs on save() but synchronously and without
// hitting the network.

test('StudentModel is a Mongoose Model with a modelName', () => {
  assert.equal(typeof StudentModel, 'function');
  assert.equal(StudentModel.modelName, 'data');
  assert.ok(StudentModel.schema instanceof mongoose.Schema);
});

test('schema declares the expected fields with correct types', () => {
  const paths = StudentModel.schema.paths;

  assert.ok(paths.name, 'expected schema path: name');
  assert.equal(paths.name.instance, 'String');
  assert.equal(paths.name.isRequired, true);

  assert.ok(paths.age, 'expected schema path: age');
  assert.equal(paths.age.instance, 'Number');
  assert.equal(paths.age.isRequired, true);

  assert.ok(paths.fees, 'expected schema path: fees');
  assert.equal(paths.fees.instance, 'Decimal128');
  assert.equal(paths.fees.isRequired, true);
});

test('missing required fields produce a ValidationError', () => {
  const doc = new StudentModel({});
  const err = doc.validateSync();

  assert.ok(err, 'expected validateSync to return a ValidationError');
  assert.equal(err.name, 'ValidationError');
  assert.ok(err.errors.name, 'expected required-field error for name');
  assert.ok(err.errors.age, 'expected required-field error for age');
  assert.ok(err.errors.fees, 'expected required-field error for fees');
});

test('age outside the [18, 50] range fails validation', () => {
  const tooYoung = new StudentModel({ name: 'A', age: 10, fees: 100 });
  const youngErr = tooYoung.validateSync();
  assert.ok(youngErr?.errors.age, 'expected age min validator to fire');

  const tooOld = new StudentModel({ name: 'A', age: 99, fees: 100 });
  const oldErr = tooOld.validateSync();
  assert.ok(oldErr?.errors.age, 'expected age max validator to fire');
});

test('happy path: a fully populated document validates with no errors', () => {
  const doc = new StudentModel({
    name: '  Alice  ',
    age: 25,
    fees: '1500.75',
  });

  const err = doc.validateSync();
  assert.equal(err, undefined);

  // The schema declares trim:true on name; verify the validator actually
  // applied trimming so future edits to the schema can't silently drop it.
  assert.equal(doc.name, 'Alice');
  assert.equal(doc.age, 25);
  assert.ok(doc.fees, 'expected fees to be set on the document');
});
