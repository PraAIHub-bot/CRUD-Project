// Re-imports the canonical smoke tests under __tests__/ (per ticket spec)
// so `node --test tests/` (the npm test script) discovers and runs them.
import '../__tests__/public.test.js';
