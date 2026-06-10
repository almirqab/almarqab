// Patch os.hostname before vercel CLI loads
const os = require('os');
const origHostname = os.hostname.bind(os);
os.hostname = () => {
  let h;
  try { h = origHostname(); } catch { return 'localhost'; }
  // Check if hostname contains non-ASCII characters
  if (/[^\x20-\x7E]/.test(h)) return 'localhost';
  return h;
};
// Also handle Node 26+ header validation
const http = require('http');
const origRequest = http.request;
http.request = function patchedRequest(url, options, cb) {
  if (options && options.headers) {
    for (const [key, value] of Object.entries(options.headers)) {
      if (typeof value === 'string' && /[^\x20-\x7E]/.test(value)) {
        options.headers[key] = value.replace(/[^\x20-\x7E]/g, '?');
      }
    }
  }
  return origRequest.call(this, url, options, cb);
};

// Run vercel CLI
require('vercel');
