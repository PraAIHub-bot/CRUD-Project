import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTestApp, getRequest } from './helpers/testApp.js';

test('GET a view-rendering route returns 200 with text/html', async () => {
  const app = buildTestApp();
  const res = await getRequest(app, '/__smoke/index');

  assert.equal(res.status, 200);
  assert.match(res.headers['content-type'], /text\/html/);
  // Substring proves index.ejs (via the header partial) actually rendered —
  // not just that any HTML came back.
  assert.match(res.text, /CRUD-Operation/);
});

test('an invalid route renders the error.ejs template (404)', async () => {
  const app = buildTestApp();
  const res = await getRequest(app, '/route-that-does-not-exist');

  assert.equal(res.status, 404);
  assert.match(res.headers['content-type'], /text\/html/);
  // Substrings prove error.ejs rendered, confirming the error view is wired.
  assert.match(res.text, /Something went wrong/);
  assert.match(res.text, /404/);
});
