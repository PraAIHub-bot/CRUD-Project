import { test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import connectDB from '../db/connectDB.js';
import StudentModel from '../models/Student.js';

// QA edge-case coverage authored by the test agent on top of the dev's
// behavioural tests in db.test.js / models.test.js. These pin behaviours
// that are easy to break with a future schema or connection-helper edit
// but are not directly asserted elsewhere.

test('connectDB is async — returns a Promise even without await', (t) => {
  t.mock.method(mongoose, 'connect', async () => mongoose);
  const result = connectDB('mongodb://stub/qa');
  assert.ok(result && typeof result.then === 'function', 'expected a Promise');
  return result;
});

test('connectDB still resolves when the URI argument is undefined', async (t) => {
  // Pins current behaviour: connectDB forwards undefined to mongoose.connect
  // and the catch block swallows whatever error mongoose throws. If a future
  // edit adds eager URI validation, this test should be updated deliberately.
  t.mock.method(console, 'log', () => {});
  const stub = t.mock.method(mongoose, 'connect', async (uri) => {
    if (!uri) throw new Error('uri required');
    return mongoose;
  });
  await assert.doesNotReject(() => connectDB(undefined));
  assert.equal(stub.mock.callCount(), 1);
  assert.equal(stub.mock.calls[0].arguments[0], undefined);
});

test('Student schema rejects non-numeric fees value', () => {
  const doc = new StudentModel({ name: 'A', age: 25, fees: 'not-a-number' });
  const err = doc.validateSync();
  assert.ok(err, 'expected validation error for non-numeric fees');
  assert.ok(err.errors.fees, 'expected fees-specific validation error');
});

test('Student schema reports only the missing field when others are valid', () => {
  // Only `name` is missing — confirm the validation error is scoped to it
  // and does not spuriously flag the supplied valid fields.
  const doc = new StudentModel({ age: 25, fees: '100.00' });
  const err = doc.validateSync();
  assert.ok(err, 'expected ValidationError');
  assert.ok(err.errors.name, 'expected name to be flagged as missing');
  assert.equal(err.errors.age, undefined, 'age was supplied; should not error');
  assert.equal(err.errors.fees, undefined, 'fees was supplied; should not error');
});

test('Student schema does not silently accept unknown fields', () => {
  // Mongoose strips unknown fields by default (strict mode). This test pins
  // that behaviour so a future `strict:false` change becomes a deliberate
  // decision rather than a silent data-leak.
  const doc = new StudentModel({
    name: 'Bob',
    age: 30,
    fees: '200',
    rogueField: 'should-be-stripped',
  });
  assert.equal(doc.rogueField, undefined, 'unknown field must be stripped');
  assert.equal(doc.validateSync(), undefined);
});

test('age boundaries: 18 and 50 inclusive are accepted', () => {
  // Pin the inclusive nature of min/max — flips between < and <= are an easy
  // refactor mistake that this test catches.
  const lower = new StudentModel({ name: 'L', age: 18, fees: '1' });
  assert.equal(lower.validateSync(), undefined);
  const upper = new StudentModel({ name: 'U', age: 50, fees: '1' });
  assert.equal(upper.validateSync(), undefined);
});
