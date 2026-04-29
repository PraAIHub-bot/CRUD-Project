// Tests for public/js/utils.js fetchJSON helper.
// Uses Node's built-in test runner (Node >= 18 has both node:test and global fetch).

import test from 'node:test';
import assert from 'node:assert/strict';

import { fetchJSON } from '../public/js/utils.js';

function mockFetch(impl) {
  const original = globalThis.fetch;
  globalThis.fetch = impl;
  return () => { globalThis.fetch = original; };
}

function jsonResponse(body, { status = 200, statusText = 'OK' } = {}) {
  const text = JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    headers: { get: (h) => (h.toLowerCase() === 'content-type' ? 'application/json; charset=utf-8' : null) },
    json: async () => JSON.parse(text),
    text: async () => text,
  };
}

test('fetchJSON parses JSON success responses', async () => {
  const restore = mockFetch(async (url, opts) => {
    assert.equal(url, '/api/health');
    assert.equal(opts.headers['Content-Type'], 'application/json');
    assert.equal(opts.headers['Accept'], 'application/json');
    return jsonResponse({ ok: true });
  });
  try {
    const data = await fetchJSON('/api/health');
    assert.deepEqual(data, { ok: true });
  } finally {
    restore();
  }
});

test('fetchJSON merges caller headers without dropping JSON defaults', async () => {
  const restore = mockFetch(async (_url, opts) => {
    assert.equal(opts.headers['X-Trace'], 'abc');
    assert.equal(opts.headers['Content-Type'], 'application/json');
    return jsonResponse({});
  });
  try {
    await fetchJSON('/x', { headers: { 'X-Trace': 'abc' } });
  } finally {
    restore();
  }
});

test('fetchJSON throws on non-2xx responses', async () => {
  const restore = mockFetch(async () => jsonResponse({ error: 'boom' }, { status: 500, statusText: 'Server Error' }));
  try {
    await assert.rejects(
      () => fetchJSON('/fail', { method: 'POST' }),
      (err) => {
        assert.equal(err.status, 500);
        assert.match(err.message, /500/);
        assert.match(err.message, /POST/);
        return true;
      }
    );
  } finally {
    restore();
  }
});

test('fetchJSON returns text for non-JSON content types', async () => {
  const restore = mockFetch(async () => ({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: { get: () => 'text/plain' },
    json: async () => { throw new Error('should not be called'); },
    text: async () => 'hello',
  }));
  try {
    const out = await fetchJSON('/plain');
    assert.equal(out, 'hello');
  } finally {
    restore();
  }
});
