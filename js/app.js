(function () {
  var cfg = MSMEConfig.DEFAULTS, SCHEMES = MSMEConfig.SCHEMES;
  var $ = function (id) { return document.getElementById(id); };
  var num = function (id) { return parseFloat($(id).value) || 0; };
  var inr = function (v) { return '₹ ' + Math.round(v).toLocaleString('en-IN'); };
  var esc = function (s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; };

  Object.keys(SCHEMES).forEach(function (k) {
    var o = document.createElement('option'); o.value = k; o.textContent = SCHEMES[k].name; $('scheme').appendChild(o);
  });

  function addAsset(name, type, cost) {
    var tr = document.createElement('tr');
    tr.innerHTML = '<td><input class="an" value="' + esc(name) + '"></td>' +
      '<td><select class="at"><option value="vehicle">Vehicle</option><option value="other">Other asset</option></select></td>' +
      '<td><input class="ac" type="number" min="0" value="' + cost + '"></td>' +
      '<td><button type="button" class="rm">✕</button></td>';
    tr.querySelector('.at').value = type;
    tr.querySelector('.rm').onclick = function () { tr.remove(); };
    $('assets').tBodies[0].appendChild(tr);
  }

  function loadScheme() {
    var s = SCHEMES[$('scheme').value];
    $('rate').value = cfg.interestRate;
    $('margin').value = s.promoterMarginPct;
    $('subPct').value = s.capitalSubsidyPct;
    $('subMax').value = s.capitalSubsidyMax;
    $('ivRate').value = s.subvention.ratePct;
    $('ivYears').value = s.subvention.years;
    $('tnc').innerHTML = '<ol>' + s.termsAndConditions.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ol>';
    $('scheme-summary').textContent = s.fullName;
    $('accept').checked = false;
  }
  $('scheme').onchange = loadScheme;
  $('addAsset').onclick = function () { addAsset('', 'other', 0); };

  function row(cells, cls) {
    return '<tr' + (cls ? ' class="' + cls + '"' : '') + '>' + cells.map(function (c, i) {
      return '<td' + (i ? ' class="n"' : '') + '>' + c + '</td>'; }).join('') + '</tr>';
  }
  function table(head, rows) {
    return '<table><thead><tr>' + head.map(function (h, i) { return '<th' + (i ? ' class="n"' : '') + '>' + h + '</th>'; }).join('') +
      '</tr></thead><tbody>' + rows.join('') + '</tbody></table>';
  }

  $('generate').onclick = function () {
    $('error').textContent = '';
    if (!$('accept').checked) { $('error').textContent = 'Please accept the terms and conditions first.'; return; }
    var assets = [].map.call($('assets').tBodies[0].rows, function (tr) {
      return { name: tr.querySelector('.an').value || 'Asset', type: tr.querySelector('.at').value,
        cost: parseFloat(tr.querySelector('.ac').value) || 0 };
    }).filter(function (a) { return a.cost > 0; });
    if (!assets.length) { $('error').textContent = 'Add at least one asset with a cost.'; return; }

    var base = SCHEMES[$('scheme').value];
    var scheme = Object.assign({}, base, {
      promoterMarginPct: num('margin'), capitalSubsidyPct: num('subPct'), capitalSubsidyMax: num('subMax'),
      subvention: { mode: base.subvention.mode, ratePct: num('ivRate'), years: num('ivYears') } });
    var input = { interestRate: num('rate'), workingCapital: num('wc'), assets: assets,
      financials: { revenueYear1: num('rev'), growthPct: num('growth'), variableCostPct: num('varPct'),
        fixedCosts: num('fixed'), fixedEscalationPct: num('esc'),
        depreciableCost: assets.reduce(function (s, a) { return s + a.cost; }, 0),
        depreciationPct: num('dep'), taxPct: num('tax') } };
    var r = MSMECalc.build(input, cfg, scheme);
    render(r, input, scheme);
  };

  function render(r, input, scheme) {
    var p = r.projections, avg = p.avgDscr, h = '';
    h += '<div class="no-print"><button id="back">← Edit</button> <button id="print" class="primary">Print / Save as PDF</button></div>';
    h += '<div class="cover"><h1>' + esc($('entName').value) + '</h1><h2 style="border:0">Project Report</h2>' +
      '<p>Scheme: <b>' + esc(scheme.name) + '</b></p><p>Promoter: ' + esc($('promoter').value) + '<br>' + esc($('address').value) + '</p></div>';

    h += '<h2>1. Executive Summary</h2><p>Activity: ' + esc($('activity').value) + '</p><div class="kpis">' +
      kpi('Project cost', inr(r.projectCost)) + kpi('Term loan', inr(r.loan)) + kpi('Promoter margin', inr(r.margin)) +
      kpi('Tenure', r.tenure + ' months (incl. ' + r.moratorium + ' moratorium)') +
      kpi('Interest rate', input.interestRate + '% p.a.') + kpi('Monthly EMI', inr(r.emi)) +
      kpi('Capital subsidy', inr(r.capitalSubsidy.amount)) + kpi('Interest subvention (total)', inr(r.subvention.total)) +
      kpi('Average DSCR', avg === null ? 'n/a' : avg.toFixed(2), avg >= 1.5 ? 'good' : 'bad') + '</div>';

    h += '<h2>2. Project Cost &amp; Means of Finance</h2>' + table(['Item', 'Type', 'Amount'],
      input.assets.map(function (a) { return row([esc(a.name), a.type === 'vehicle' ? 'Vehicle' : 'Other', inr(a.cost)]); })
        .concat(input.workingCapital ? [row(['Working capital', '', inr(input.workingCapital)])] : [])
        .concat([row(['Total project cost', '', inr(r.projectCost)], 'total')])) +
      table(['Means of finance', 'Amount', '%'], [
        row(['Promoter margin', inr(r.margin), (100 * r.margin / r.projectCost).toFixed(1) + '%']),
        row(['Bank term loan', inr(r.loan), (100 * r.loan / r.projectCost).toFixed(1) + '%']),
        row(['Total', inr(r.projectCost), '100%'], 'total')]);

    var cs = r.capitalSubsidy;
    h += '<h2>3. Capital Subsidy</h2><p>Subsidy = minimum of (' + scheme.capitalSubsidyPct + '% of project cost, maximum limit).</p>' +
      table(['Basis', 'Amount'], [row(['' + scheme.capitalSubsidyPct + '% of project cost', inr(cs.byPct)]),
        row(['Scheme maximum', inr(cs.max)]), row(['Capital subsidy admissible', inr(cs.amount)], 'total')]);

    var iv = r.subvention;
    h += '<h2>4. Interest Subvention</h2>';
    if (!iv.quarters.length) h += '<p>No interest subvention under this scheme.</p>';
    else h += '<p>Subvention of ' + iv.effectiveRatePct + '% p.a. on outstanding loan for ' + scheme.subvention.years +
      ' years. The bank submits the claim quarterly to the DIC.</p>' +
      table(['Quarter', 'Months', 'Claim to DIC'], iv.quarters.map(function (q) {
        return row([q.quarter, q.fromMonth + '–' + q.toMonth, inr(q.claim)]); })
        .concat([row(['Total', '', inr(iv.total)], 'total')]));

    h += '<h2 class="pb">5. Loan Repayment Schedule (yearly)</h2>' + table(['Year', 'Interest', 'Principal', 'Total payment', 'Closing balance'],
      p.years.map(function (y) {
        var close = r.schedule[Math.min(y.year * 12, r.schedule.length) - 1].closing;
        return row([y.year, inr(y.interest), inr(y.principal), inr(y.service), inr(close)]); }));

    h += '<h2>6. Projected Profitability &amp; DSCR</h2>' + table(['Year', 'Revenue', 'EBITDA', 'Depreciation', 'Interest', 'PAT', 'Debt service', 'DSCR'],
      p.years.map(function (y) {
        return row([y.year, inr(y.revenue), inr(y.ebitda), inr(y.depreciation), inr(y.interest), inr(y.pat), inr(y.service),
          y.dscr === null ? '–' : '<span class="' + (y.dscr >= 1.5 ? 'good' : 'bad') + '">' + y.dscr.toFixed(2) + '</span>']); })) +
      '<p class="note">DSCR = (PAT + Depreciation + Interest) ÷ (Interest + Principal). Banks typically prefer ≥ 1.5. ' +
      'Average: ' + (avg === null ? 'n/a' : avg.toFixed(2)) + '; minimum: ' + (p.minDscr === null ? 'n/a' : p.minDscr.toFixed(2)) + '. ' +
      'Subsidy and subvention are excluded from DSCR (conservative).</p>';

    h += '<h2>7. Assumptions</h2><ul><li>Vehicles above ₹5 lakh: 84 months; up to ₹5 lakh: 60 months; other assets: 60 months. Moratorium ' + r.moratorium + ' months.</li>' +
      '<li>Interest rate ' + input.interestRate + '% p.a. (editable). Tenure includes moratorium.</li>' +
      '<li>Revenue growth ' + num('growth') + '%, variable cost ' + num('varPct') + '% of revenue, tax ' + num('tax') + '%.</li></ul>';

    h += '<h2>8. Terms &amp; Conditions Accepted</h2><ol>' + scheme.termsAndConditions.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ol>';
    h += '<h2>9. Declaration</h2><p>[Declaration placeholder – edit in js/app.js]</p><p><br>Place: ______ &nbsp; Date: ______ &nbsp;&nbsp; Signature of Promoter: ____________</p>';

    $('report').innerHTML = h; $('report').hidden = false; $('form-section').hidden = true;
    $('back').onclick = function () { $('report').hidden = true; $('form-section').hidden = false; };
    $('print').onclick = function () { window.print(); };
  }
  function kpi(l, v, c) { return '<div class="kpi">' + l + '<b class="' + (c || '') + '">' + v + '</b></div>'; }

  addAsset('Vehicle', 'vehicle', 800000);
  addAsset('Equipment', 'other', 200000);
  loadScheme();
})();
