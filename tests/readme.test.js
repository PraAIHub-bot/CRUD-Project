// Validates README.md satisfies TICKET-011 acceptance criteria:
// required sections, the API endpoints table, and the env-vars table.
// Uses node --test so no extra deps are introduced.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const readmePath = resolve(repoRoot, 'README.md');
const routesPath = resolve(repoRoot, 'routes', 'web.js');

test('README.md exists at the repo root', () => {
  assert.equal(existsSync(readmePath), true, 'README.md must exist');
});

const readme = readFileSync(readmePath, 'utf8');

test('README has Title heading', () => {
  // First non-empty line should be a top-level heading.
  const firstHeading = readme.split('\n').find(l => l.startsWith('# '));
  assert.ok(firstHeading, 'README must start with an H1');
  assert.match(firstHeading, /CRUD-Project|Student/i);
});

test('README contains all required sections', () => {
  const required = [
    'Tech Stack',
    'Getting Started',
    'API Endpoints',
    'Data Models',
    'Environment Variables',
    'Testing',
    'Docker',
  ];
  for (const section of required) {
    const re = new RegExp(`^##\\s+${section}\\b`, 'm');
    assert.match(readme, re, `Missing required section: "${section}"`);
  }
});

test('Getting Started documents npm ci and copying .env.example', () => {
  assert.match(readme, /npm ci\b/, 'Getting Started should reference `npm ci`');
  assert.match(readme, /\.env\.example/, 'Getting Started should mention .env.example');
  assert.match(readme, /cp \.env\.example \.env/, 'Should show cp .env.example .env');
});

test('Getting Started references a start command', () => {
  assert.match(readme, /npm (start|run dev)\b/);
});

test('API Endpoints table lists every wired route from routes/web.js', () => {
  // Routes currently wired in routes/web.js (verified at test-time).
  const routesSrc = readFileSync(routesPath, 'utf8');
  const expected = [
    { method: 'GET', path: '/' },
    { method: 'POST', path: '/' },
    { method: 'GET', path: '/edit/:id' },
    { method: 'POST', path: '/update/:id' },
    { method: 'POST', path: '/delete/:id' },
    { method: 'GET', path: '/api/health' },
  ];

  // Sanity: confirm the source still defines each route. If a route is added
  // or removed from web.js, this test will alert the author to update README.
  for (const { method, path } of expected) {
    const verb = method.toLowerCase();
    const re = new RegExp(`router\\.${verb}\\(\\s*['"\`]${path.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}['"\`]`);
    assert.match(routesSrc, re, `routes/web.js no longer defines ${method} ${path}`);
  }

  // Each route should appear in the README (method + path).
  for (const { method, path } of expected) {
    assert.ok(
      readme.includes(method) && readme.includes(`\`${path}\``),
      `README is missing API entry for ${method} ${path}`,
    );
  }
});

test('Environment Variables section documents the Mongo connection variable', () => {
  // Acceptance criteria: documents MONGODB_URI and any other vars in .env.example.
  // The codebase uses DATABASE_URL — the README must mention at least one of them
  // and explain the connection variable.
  assert.match(readme, /DATABASE_URL|MONGODB_URI/);
  assert.match(readme, /MongoDB connection string/i);
});

test('Environment Variables section documents PORT', () => {
  assert.match(readme, /\bPORT\b/);
});

test('Testing section references npm test', () => {
  assert.match(readme, /npm test\b/);
});

test('Docker section references docker compose up', () => {
  assert.match(readme, /docker compose up\b/);
});

test('Data Models section describes the Student model fields', () => {
  for (const field of ['name', 'age', 'fees']) {
    assert.match(readme, new RegExp(`\\b${field}\\b`), `Models section missing field: ${field}`);
  }
});
