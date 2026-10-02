/* Pure calculation functions (no DOM). */
(function (root) {
  function tenureMonths(assetType, cost, cfg) {
    if (assetType === 'vehicle') {
      return cost > cfg.vehicleThreshold ? cfg.vehicleTenureAbove : cfg.vehicleTenureBelow;
    }
    return cfg.otherAssetsTenure;
  }

  function emi(principal, annualPct, n) {
    var r = annualPct / 1200;
    if (n <= 0) return 0;
    if (r === 0) return principal / n;
    return principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  }

  /* Monthly schedule. Interest accrues during moratorium (serviced, no principal).
     Tenure includes moratorium; EMI is paid over (tenure - moratorium) months. */
  function schedule(loan, annualPct, tenure, moratorium) {
    var rows = [], bal = loan, r = annualPct / 1200;
    var n = tenure - moratorium, e = emi(loan, annualPct, n);
    for (var m = 1; m <= tenure; m++) {
      var interest = bal * r, principal = 0;
      if (m > moratorium) principal = Math.min(bal, e - interest);
      if (m === tenure) principal = bal;
      var open = bal;
      bal = bal - principal;
      rows.push({ month: m, opening: open, interest: interest, principal: principal,
        payment: interest + principal, closing: bal });
    }
    return { rows: rows, emi: e };
  }

  function capitalSubsidy(cost, pct, max) {
    var byPct = cost * pct / 100;
    return { byPct: byPct, max: max, amount: Math.min(byPct, max) };
  }

  /* Interest subvention, grouped per quarter (claim bank -> DIC).
     mode 'percent': ratePct points (capped at loan rate) on outstanding balance.
     mode 'full'   : entire interest applied. Only for `years` years. */
  function subvention(rows, annualPct, sub) {
    var quarters = [], total = 0;
    if (!sub || !sub.years) return { quarters: quarters, total: 0 };
    var limit = sub.years * 12;
    var eff = sub.mode === 'full' ? annualPct : Math.min(sub.ratePct, annualPct);
    for (var i = 0; i < rows.length && i < limit; i += 3) {
      var amt = 0, last = Math.min(i + 3, rows.length, limit);
      for (var j = i; j < last; j++) amt += rows[j].opening * eff / 1200;
      total += amt;
      quarters.push({ quarter: i / 3 + 1, fromMonth: i + 1, toMonth: last, claim: amt });
    }
    return { quarters: quarters, total: total, effectiveRatePct: eff };
  }

  function sum(rows, a, b, k) {
    var s = 0;
    for (var i = a; i < b && i < rows.length; i++) s += rows[i][k];
    return s;
  }

  /* Annual projections and DSCR = (PAT + depreciation + interest) / (interest + principal) */
  function projections(p, rows, tenure) {
    var years = Math.ceil(tenure / 12), out = [], dscrSum = 0;
    var wdv = p.depreciableCost;
    for (var y = 1; y <= years; y++) {
      var revenue = p.revenueYear1 * Math.pow(1 + p.growthPct / 100, y - 1);
      var variable = revenue * p.variableCostPct / 100;
      var fixed = p.fixedCosts * Math.pow(1 + p.fixedEscalationPct / 100, y - 1);
      var dep = wdv * p.depreciationPct / 100;
      wdv -= dep;
      var interest = sum(rows, (y - 1) * 12, y * 12, 'interest');
      var principal = sum(rows, (y - 1) * 12, y * 12, 'principal');
      var ebitda = revenue - variable - fixed;
      var pbt = ebitda - dep - interest;
      var tax = Math.max(0, pbt) * p.taxPct / 100;
      var pat = pbt - tax;
      var service = interest + principal;
      var dscr = service > 0 ? (pat + dep + interest) / service : null;
      if (dscr !== null) dscrSum += dscr;
      out.push({ year: y, revenue: revenue, variable: variable, fixed: fixed, ebitda: ebitda,
        depreciation: dep, interest: interest, pbt: pbt, tax: tax, pat: pat,
        principal: principal, service: service, dscr: dscr });
    }
    var withDebt = out.filter(function (o) { return o.dscr !== null; });
    return { years: out, avgDscr: withDebt.length ? dscrSum / withDebt.length : null,
      minDscr: withDebt.length ? Math.min.apply(null, withDebt.map(function (o) { return o.dscr; })) : null };
  }

  function build(input, cfg, scheme) {
    var cost = input.assets.reduce(function (s, a) { return s + a.cost; }, 0) + (input.workingCapital || 0);
    var loan = Math.max(0, cost * (1 - scheme.promoterMarginPct / 100));
    var hasVehicle = input.assets.some(function (a) { return a.type === 'vehicle'; });
    var vehicleCost = input.assets.filter(function (a) { return a.type === 'vehicle'; })
      .reduce(function (s, a) { return s + a.cost; }, 0);
    var tenure = hasVehicle ? tenureMonths('vehicle', vehicleCost, cfg) : tenureMonths('other', 0, cfg);
    var sch = schedule(loan, input.interestRate, tenure, cfg.moratoriumMonths);
    var sub = capitalSubsidy(cost, scheme.capitalSubsidyPct, scheme.capitalSubsidyMax);
    var iv = subvention(sch.rows, input.interestRate, scheme.subvention);
    var proj = projections(input.financials, sch.rows, tenure);
    return { projectCost: cost, loan: loan, margin: cost - loan, tenure: tenure,
      moratorium: cfg.moratoriumMonths, emi: sch.emi, schedule: sch.rows,
      capitalSubsidy: sub, subvention: iv, projections: proj };
  }

  var api = { tenureMonths: tenureMonths, emi: emi, schedule: schedule,
    capitalSubsidy: capitalSubsidy, subvention: subvention, projections: projections, build: build };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MSMECalc = api;
})(typeof self !== 'undefined' ? self : this);
