// Validates Dockerfile, docker-compose.yml, and .dockerignore satisfy
// TICKET-009 acceptance criteria. Uses shape-checks against the file
// contents so the suite stays compatible with `node --test` and does
// not require Docker itself to be installed in CI.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const dockerfilePath = resolve(repoRoot, 'Dockerfile');
const composePath = resolve(repoRoot, 'docker-compose.yml');
const dockerignorePath = resolve(repoRoot, '.dockerignore');

test('Dockerfile exists at repo root', () => {
  assert.equal(existsSync(dockerfilePath), true, 'Dockerfile must exist');
});

test('docker-compose.yml exists at repo root', () => {
  assert.equal(existsSync(composePath), true, 'docker-compose.yml must exist');
});

test('.dockerignore exists at repo root', () => {
  assert.equal(existsSync(dockerignorePath), true, '.dockerignore must exist');
});

const dockerfile = readFileSync(dockerfilePath, 'utf8');
const compose = readFileSync(composePath, 'utf8');
const dockerignore = readFileSync(dockerignorePath, 'utf8');

test('Dockerfile pins node:20-alpine (no :latest)', () => {
  assert.match(dockerfile, /FROM\s+node:20-alpine/);
  assert.doesNotMatch(dockerfile, /node:latest/);
});

test('Dockerfile is multi-stage (declares more than one FROM)', () => {
  const fromCount = (dockerfile.match(/^FROM\s+/gm) || []).length;
  assert.ok(fromCount >= 2, `expected >= 2 FROM stages, got ${fromCount}`);
});

test('Dockerfile uses npm ci (not npm install) for reproducibility', () => {
  assert.match(dockerfile, /npm ci/);
  assert.doesNotMatch(dockerfile, /npm install\b/);
});

test('Dockerfile installs production-only deps (omits dev dependencies)', () => {
  assert.match(dockerfile, /npm ci[^\n]*--omit=dev/);
});

test('Dockerfile EXPOSEs port 3000', () => {
  assert.match(dockerfile, /EXPOSE\s+3000/);
});

test('Dockerfile CMD launches node app.js (matches package.json main)', () => {
  assert.match(dockerfile, /CMD\s+\[\s*"node"\s*,\s*"app\.js"\s*\]/);
});

test('Dockerfile does not COPY .env into the image', () => {
  assert.doesNotMatch(dockerfile, /COPY[^\n]*\.env\b/);
});

test('docker-compose defines an app service that builds from .', () => {
  assert.match(compose, /^\s*app:/m);
  assert.match(compose, /build:\s*\./);
});

test('docker-compose maps host:container port 3000:3000', () => {
  assert.match(compose, /["']?3000:3000["']?/);
});

test('docker-compose app depends_on mongo', () => {
  assert.match(compose, /depends_on:[\s\S]*?-\s*mongo/);
});

test('docker-compose sets MONGODB_URI to mongodb://mongo:27017/crudapp', () => {
  assert.match(compose, /MONGODB_URI[:\s=]+mongodb:\/\/mongo:27017\/crudapp/);
});

test('docker-compose defines a mongo service pinned to mongo:7', () => {
  assert.match(compose, /^\s*mongo:/m);
  assert.match(compose, /image:\s*mongo:7\b/);
  assert.doesNotMatch(compose, /image:\s*mongo:latest/);
});

test('docker-compose persists mongo data via the mongo-data volume', () => {
  assert.match(compose, /mongo-data:\s*\/data\/db/);
  assert.match(compose, /^\s*volumes:[\s\S]*mongo-data:/m);
});

test('.dockerignore excludes node_modules, .git, .env, and __tests__', () => {
  const lines = dockerignore.split(/\r?\n/).map((l) => l.trim());
  for (const required of ['node_modules', '.git', '.env', '__tests__']) {
    assert.ok(
      lines.includes(required),
      `.dockerignore must list "${required}"`
    );
  }
});

test('.dockerignore excludes coverage and log files', () => {
  const lines = dockerignore.split(/\r?\n/).map((l) => l.trim());
  assert.ok(lines.includes('coverage'), '.dockerignore must list coverage');
  assert.ok(lines.includes('*.log'), '.dockerignore must list *.log');
});
