// Tiny client-side helpers for talking to the backend API.
// Loaded as an ES module (<script type="module" src="/js/utils.js">)
// so it can also be imported by Node-based tests.

export async function fetchJSON(url, opts = {}) {
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(opts.headers || {}),
  };

  const response = await fetch(url, { ...opts, headers });

  if (!response.ok) {
    let detail = '';
    try { detail = await response.text(); } catch (_) { /* body unreadable */ }
    const err = new Error(
      `fetchJSON ${opts.method || 'GET'} ${url} failed: ${response.status} ${response.statusText}${detail ? ' — ' + detail : ''}`
    );
    err.status = response.status;
    err.body = detail;
    throw err;
  }

  const ctype = response.headers.get('content-type') || '';
  return ctype.includes('application/json') ? response.json() : response.text();
}
