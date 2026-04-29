// Client-side glue: uses fetchJSON to verify backend connectivity.
// Loaded as <script type="module" src="/js/script.js">.

import { fetchJSON } from './utils.js';

async function pingHealth() {
  try {
    const data = await fetchJSON('/api/health');
    const target = document.querySelector('[data-health-status]');
    if (target) {
      target.textContent = data && data.ok ? 'online' : 'unknown';
      target.dataset.healthStatus = data && data.ok ? 'ok' : 'error';
    }
    return data;
  } catch (err) {
    const target = document.querySelector('[data-health-status]');
    if (target) {
      target.textContent = 'offline';
      target.dataset.healthStatus = 'error';
    }
    console.error('Health check failed:', err);
    throw err;
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { pingHealth().catch(() => {}); });
  } else {
    pingHealth().catch(() => {});
  }
}

export { pingHealth };
