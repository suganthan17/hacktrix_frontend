// src/utils/api.js
export async function safeFetchJson(url, options = {}) {
  const res = await fetch(url, {
    credentials: 'include', // keep cookies if you use sessions; change if not needed
    headers: {
      // allow caller to add/override headers
      'Accept': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const contentType = res.headers.get('content-type') || '';
  const raw = await res.text(); // always read raw response

  console.log('[safeFetchJson] url:', url, 'status:', res.status, 'content-type:', contentType);

  if (!res.ok) {
    console.error('[safeFetchJson] non-2xx response:', res.status, raw.slice(0, 1000));
    // bubble up a helpful error
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    err.raw = raw;
    throw err;
  }

  if (!contentType.includes('application/json')) {
    console.error('[safeFetchJson] expected JSON but got:', contentType, raw.slice(0, 1000));
    const err = new Error('Invalid server response: expected JSON');
    err.status = res.status;
    err.raw = raw;
    throw err;
  }

  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('[safeFetchJson] JSON parse failed. raw:', raw.slice(0, 1000));
    e.raw = raw;
    throw e;
  }
}
