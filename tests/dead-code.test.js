// Regression tests for TICKET-005: ensure the three dead-code findings
// (views/about.ejs, duplicate db/index.js connect blocks) cannot silently
// reappear in future commits.

import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = process.cwd();

test('views/about.ejs does not exist (was unused dead code)', () => {
  assert.equal(
    existsSync(join(repoRoot, 'views', 'about.ejs')),
    false,
    'views/about.ejs must remain deleted unless wired to a route'
  );
});

test('no source file references the deleted about template', () => {
  const sourceDirs = ['app.js', 'routes', 'controllers', 'models', 'views', 'db', 'public'];
  const offenders = [];

  const walk = (path) => {
    const entries = readdirSync(path, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(path, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (/\.(js|ejs|html|json|css)$/.test(entry.name)) {
        const text = readFileSync(full, 'utf8');
        if (/\babout\.ejs\b|res\.render\(\s*['"`]about['"`]\s*\)/.test(text)) {
          offenders.push(full);
        }
      }
    }
  };

  for (const entry of sourceDirs) {
    const full = join(repoRoot, entry);
    if (!existsSync(full)) continue;
    const stat = readdirSync(repoRoot, { withFileTypes: true })
      .find((d) => d.name === entry);
    if (stat?.isDirectory()) walk(full);
  }

  assert.deepEqual(offenders, [], `dangling references to about template: ${offenders.join(', ')}`);
});

test('db/index.js contains no direct mongoose.connect call (delegated to connectDB.js)', () => {
  const text = readFileSync(join(repoRoot, 'db', 'index.js'), 'utf8');
  // The connect logic must live in db/connectDB.js. db/index.js is a thin
  // barrel — duplicating mongoose.connect here was the original dead-code
  // finding that this ticket cleaned up.
  assert.ok(
    !/mongoose\.connect\s*\(/.test(text),
    'db/index.js must not call mongoose.connect directly — keep that in connectDB.js'
  );
});

test('db/index.js exposes exactly one connect helper', () => {
  const text = readFileSync(join(repoRoot, 'db', 'index.js'), 'utf8');
  // A single named export of connectDB. Multiple connect-helper exports would
  // recreate the duplicate code paths that the analysis flagged.
  const namedConnectExports = text.match(/export\s*{[^}]*\bconnectDB\b/g) ?? [];
  const inlineConnectExports = text.match(/export\s+(const|function|default)\s+connectDB\b/g) ?? [];
  assert.equal(
    namedConnectExports.length + inlineConnectExports.length,
    1,
    'db/index.js must export connectDB exactly once'
  );
});
