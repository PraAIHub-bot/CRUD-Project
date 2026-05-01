import { test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import connectDB from '../db/connectDB.js';

// These tests deliberately stub mongoose.connect so the suite never opens a
// network socket — satisfies the "no external Mongo in CI" acceptance
// criterion (per ticket implementation note: stub mongoose.connect when
// mongodb-memory-server is unavailable).

test('db module exports a callable that wraps a Mongoose instance', () => {
  assert.equal(typeof connectDB, 'function');
  // Mongoose default export is the Mongoose singleton — assert it has the
  // surface our connect logic depends on.
  assert.equal(typeof mongoose.connect, 'function');
  assert.ok(mongoose.connection, 'expected mongoose.connection to be present');
  assert.equal(typeof mongoose.connection.readyState, 'number');
});

test('connectDB invokes mongoose.connect with the URI and student_db option', async (t) => {
  const stub = t.mock.method(mongoose, 'connect', async () => mongoose);

  await connectDB('mongodb://stub-host:27017');

  assert.equal(stub.mock.callCount(), 1);
  const [uri, options] = stub.mock.calls[0].arguments;
  assert.equal(uri, 'mongodb://stub-host:27017');
  assert.deepEqual(options, { dbname: 'student_db' });
});

test('connection.readyState reaches 1 after connectDB resolves (stubbed connect)', async (t) => {
  // Snapshot original readyState getter so we can restore it post-test.
  const originalDescriptor = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(mongoose.connection),
    'readyState',
  );
  t.after(() => {
    if (originalDescriptor) {
      Object.defineProperty(
        Object.getPrototypeOf(mongoose.connection),
        'readyState',
        originalDescriptor,
      );
    }
  });

  // Stub connect so it simulates a successful connection by overriding
  // readyState on the instance to the connected value (1).
  t.mock.method(mongoose, 'connect', async () => {
    Object.defineProperty(mongoose.connection, 'readyState', {
      configurable: true,
      get: () => 1,
    });
    return mongoose;
  });

  await connectDB('mongodb://stub-host:27017');
  assert.equal(mongoose.connection.readyState, 1);
});

test('connectDB swallows connection errors and does not reject', async (t) => {
  // The current implementation logs and returns on failure rather than
  // re-throwing; this test pins that behaviour so a future change is a
  // deliberate decision rather than a silent regression.
  t.mock.method(console, 'log', () => {});
  t.mock.method(mongoose, 'connect', async () => {
    throw new Error('boom');
  });

  await assert.doesNotReject(() => connectDB('mongodb://stub-host:27017'));
});
