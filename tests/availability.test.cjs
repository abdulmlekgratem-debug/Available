const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const NativeDate = Date;
const fixed = new NativeDate(2026, 9, 1, 12);
class FixedDate extends NativeDate { constructor(...args) { super(...(args.length ? args : [fixed.getTime()])); } static now() { return fixed.getTime(); } }
function load(file, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  new Function('exports', 'require', 'Date', code)(exports, name => dependencies[name], FixedDate);
  return exports;
}
const dateUtils = load('src/utils/dateUtils.ts');
for (const invalid of ['2026-02-31', '31/04/2026', '2026-13-01', '2026-01-00']) assert.equal(dateUtils.parseExpiryDate(invalid), null, invalid);
assert.equal(dateUtils.parseExpiryDate('2028-02-29').getDate(), 29);
const { availabilityStatus, matchesAvailability } = load('src/utils/availability.ts', { './dateUtils': dateUtils });
function board(days, status = 'محجوز') {
  const date = new NativeDate(2026, 9, 1 + days);
  return { status, expiryDate: date.getFullYear() + '-' + String(date.getMonth()+1).padStart(2,'0') + '-' + String(date.getDate()).padStart(2,'0') };
}
for (const days of [-1, 0, 1, 19, 20, 21, 30]) {
  const b = board(days);
  assert.equal(matchesAvailability(b, 'available'), days <= 20, 'default window at ' + days);
  assert.equal(matchesAvailability(b, 'available', true), days <= 0, 'available now at ' + days);
  assert.equal(matchesAvailability(b, 'available-now'), days <= 0, 'now-only button at ' + days);
  assert.equal(matchesAvailability(b, 'soon'), days > 0 && days <= 20, 'soon at ' + days);
  assert.equal(availabilityStatus(b), days <= 0 ? 'available' : days <= 20 ? 'soon' : 'booked');
}
assert.equal(availabilityStatus({expiryDate: null, status: 'محجوز'}), 'booked');
assert.equal(availabilityStatus({expiryDate: null, status: 'متاح'}), 'available');
assert.equal(availabilityStatus(board(21, 'متاح')), 'booked', 'future contract takes precedence over stale status');
assert.equal(matchesAvailability(board(30), 'month-10-2026'), true);
assert.equal(matchesAvailability(board(20), 'month-10-2026'), false, 'upcoming window is separate from later-month selection');
console.log('Availability boundary checks passed: now, 1–20 days, 21+ days, missing dates and stale status.');
