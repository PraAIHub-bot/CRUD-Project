import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

test('connectDB module exports a function', async () => {
    const mod = await import('../db/connectDB.js');
    assert.equal(typeof mod.default, 'function', 'default export should be a function');
});

test('connectDB exits with code 1 when no URI is provided', () => {
    const result = spawnSync(
        process.execPath,
        [
            '--input-type=module',
            '-e',
            "import connectDB from './db/connectDB.js'; await connectDB('');",
        ],
        { cwd: projectRoot, encoding: 'utf8' }
    );
    assert.equal(result.status, 1, 'process should exit with status 1');
    assert.match(result.stderr, /no connection string/i);
});

test('connectDB is idempotent — second call with active connection short-circuits', async () => {
    const mongoose = (await import('mongoose')).default;
    const connectDB = (await import('../db/connectDB.js')).default;

    // Simulate an already-connected state (readyState === 1)
    const originalReadyState = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(mongoose.connection),
        'readyState'
    );
    Object.defineProperty(mongoose.connection, 'readyState', {
        value: 1,
        configurable: true,
    });

    try {
        const result = await connectDB('mongodb://ignored:27017/ignored');
        assert.equal(result, mongoose.connection, 'should return the existing connection without reconnecting');
    } finally {
        if (originalReadyState) {
            Object.defineProperty(mongoose.connection, 'readyState', originalReadyState);
        } else {
            delete mongoose.connection.readyState;
        }
    }
});
