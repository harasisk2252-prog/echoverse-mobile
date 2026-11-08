const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const context = { exports: {}, Date };
vm.runInNewContext(ts.transpileModule(readFileSync('src/date.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, context);
const { isValidDate, localDate } = context.exports;

test('rejects impossible dates that JavaScript otherwise normalizes', () => {
  for (const date of ['2026-02-29', '2026-02-30', '2026-04-31', '2026-13-01', '2026-00-10', '26-01-01', '']) {
    assert.equal(isValidDate(date), false, date);
  }
});
test('accepts valid dates including leap days', () => {
  for (const date of ['2024-02-29', '2000-02-29', '2026-11-08']) assert.equal(isValidDate(date), true);
  assert.equal(isValidDate('1900-02-29'), false);
});
test('defaults to the local calendar day, even before UTC midnight', () => {
  const earlyMorning = new Date(2026, 10, 8, 0, 15);
  assert.equal(localDate(earlyMorning), '2026-11-08');
});
