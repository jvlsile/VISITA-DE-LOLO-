// TEMPORAL: robot en iPad, con y sin animaciones.
const base = require('./playwright.config.js');
const { devices } = require('@playwright/test');
module.exports = { ...base, retries: 0, timeout: 60000, projects: [
  { name: 'ipad-normal', use: { ...devices['iPad (gen 7) landscape'] } },
  { name: 'ipad-sin-movimiento', use: { ...devices['iPad (gen 7) landscape'], reducedMotion: 'reduce' } }
] };
