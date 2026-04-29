// Validates .github/workflows/ci.yml satisfies TICKET-010 acceptance criteria.
// We parse the YAML manually with a tiny shape-check rather than pulling in a
// new dependency, since tests run via `node --test` with no extra installs.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workflowPath = resolve(__dirname, '..', '.github', 'workflows', 'ci.yml');

test('CI workflow file exists at .github/workflows/ci.yml', () => {
  assert.equal(existsSync(workflowPath), true, 'ci.yml must exist');
});

const yaml = readFileSync(workflowPath, 'utf8');

test('CI triggers on push to main', () => {
  assert.match(yaml, /on:[\s\S]*push:[\s\S]*branches:\s*\[\s*main\s*\]/);
});

test('CI triggers on pull_request', () => {
  assert.match(yaml, /pull_request:/);
});

test('CI uses Node.js 20', () => {
  assert.match(yaml, /node-version:\s*['"]?20['"]?/);
});

test('CI runs npm ci', () => {
  assert.match(yaml, /npm ci/);
});

test('CI runs npm test', () => {
  assert.match(yaml, /npm test/);
});

test('CI caches node_modules keyed on package-lock.json', () => {
  assert.match(yaml, /actions\/cache@v4/);
  assert.match(yaml, /hashFiles\(['"]package-lock\.json['"]\)/);
  assert.match(yaml, /path:\s*node_modules/);
});

test('CI uses pinned action versions (checkout@v4, setup-node@v4)', () => {
  assert.match(yaml, /actions\/checkout@v4/);
  assert.match(yaml, /actions\/setup-node@v4/);
});

test('CI does not include deploy steps', () => {
  assert.doesNotMatch(yaml, /\bdeploy\b/i);
  assert.doesNotMatch(yaml, /vercel/i);
  assert.doesNotMatch(yaml, /netlify/i);
});
