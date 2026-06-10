const os = require('os')
const original = os.hostname
os.hostname = () => {
  try { const h = original(); if (/[^\x20-\x7E]/.test(h)) return 'localhost'; return h }
  catch { return 'localhost' }
}
