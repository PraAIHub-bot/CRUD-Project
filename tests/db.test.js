// Re-imports the canonical db tests under __tests__/ (per ticket spec)
// so `node --test tests/` (the npm test script) discovers and runs them.
import '../__tests__/db.test.js';
