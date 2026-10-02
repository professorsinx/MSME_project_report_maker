# MSME_project_report_maker
This repository with its GitHub Pages site creates MSME project reports for schemes like TWEES, CM-ARISE, PMEGP, UYEGP, AABCS.

Open `index.html` (or serve via GitHub Pages). Pick a scheme, accept its T&C, enter details, generate, then Print / Save as PDF.

## Rules implemented
- Vehicles > ₹5 lakh: 84 months; ≤ ₹5 lakh: 60 months; other assets: 60 months; 3-month moratorium (see `DEFAULTS` in `js/schemes.js`).
- Interest rate defaults to 9.65% and is editable per report.
- Capital subsidy = min(scheme maximum, % of project cost).
- Interest subvention is computed per quarter on the outstanding loan (claim from bank to DIC).
- Annual projections with DSCR.

## Extending
Scheme values and T&C text are **placeholders** in `js/schemes.js` – edit them or add a scheme there. Calculations live in `js/calc.js` (tested: `node --test tests/calc.test.js`); report layout in `js/app.js`.
