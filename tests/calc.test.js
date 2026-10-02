const test = require('node:test');
const assert = require('node:assert');
const C = require('../js/calc');
const { DEFAULTS, SCHEMES } = require('../js/schemes');

test('tenure rules', () => {
  assert.strictEqual(C.tenureMonths('vehicle', 500001, DEFAULTS), 84);
  assert.strictEqual(C.tenureMonths('vehicle', 500000, DEFAULTS), 60);
  assert.strictEqual(C.tenureMonths('vehicle', 300000, DEFAULTS), 60);
  assert.strictEqual(C.tenureMonths('other', 900000, DEFAULTS), 60);
});

test('capital subsidy is min of cap and percentage', () => {
  assert.strictEqual(C.capitalSubsidy(1000000, 25, 100000).amount, 100000);
  assert.strictEqual(C.capitalSubsidy(1000000, 25, 900000).amount, 250000);
});

test('schedule amortises to zero with moratorium', () => {
  const s = C.schedule(1000000, 9.65, 60, 3);
  assert.strictEqual(s.rows.length, 60);
  assert.strictEqual(s.rows[0].principal, 0);
  assert.ok(s.rows[3].principal > 0);
  assert.ok(Math.abs(s.rows[59].closing) < 1e-6);
});

test('subvention quarterly claims', () => {
  const s = C.schedule(1000000, 9.65, 60, 3);
  const iv = C.subvention(s.rows, 9.65, { mode: 'percent', ratePct: 3, years: 5 });
  assert.strictEqual(iv.quarters.length, 20);
  assert.ok(Math.abs(iv.quarters[0].claim - 1000000 * 0.03 / 12 * 3) < 1e-6);
  assert.strictEqual(C.subvention(s.rows, 9.65, { ratePct: 0, years: 0 }).total, 0);
});

test('full build with DSCR', () => {
  const r = C.build({
    interestRate: 9.65, workingCapital: 0,
    assets: [{ type: 'vehicle', cost: 800000 }, { type: 'other', cost: 200000 }],
    financials: { revenueYear1: 1500000, growthPct: 8, variableCostPct: 50, fixedCosts: 150000,
      fixedEscalationPct: 5, depreciableCost: 1000000, depreciationPct: 15, taxPct: 25 }
  }, DEFAULTS, SCHEMES.TWEES);
  assert.strictEqual(r.tenure, 84);
  assert.strictEqual(r.projectCost, 1000000);
  assert.strictEqual(r.projections.years.length, 7);
  assert.ok(r.projections.avgDscr > 0);
});
