import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTestApp, getRequest } from './helpers/testApp.js';

const JS_CONTENT_TYPE = /(application|text)\/(javascript|x-javascript)/;

test('GET /js/script.js returns 200 with a JS content-type', async () => {
  const app = buildTestApp();
  const res = await getRequest(app, '/js/script.js');

  assert.equal(res.status, 200);
  assert.match(res.headers['content-type'], JS_CONTENT_TYPE);
  // Body should be non-empty so we know the static middleware actually
  // streamed the file.
  assert.ok(res.text.length > 0, 'expected non-empty response body');
});

test('GET /js/utils.js returns 200 with a JS content-type', async () => {
  const app = buildTestApp();
  const res = await getRequest(app, '/js/utils.js');

  assert.equal(res.status, 200);
  assert.match(res.headers['content-type'], JS_CONTENT_TYPE);
  assert.ok(res.text.length > 0, 'expected non-empty response body');
});
