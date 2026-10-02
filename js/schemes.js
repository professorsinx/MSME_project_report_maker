/*
 * Scheme configuration. EDIT HERE to change rules or add a scheme.
 * All numeric values and T&C text are PLACEHOLDERS - verify against the
 * latest official scheme guidelines before use.
 * To add a scheme: add a new key; the UI picks it up automatically.
 */
(function (root) {
  var DEFAULTS = {
    interestRate: 9.65,            // % p.a., user can override
    moratoriumMonths: 3,
    vehicleThreshold: 500000,      // INR
    vehicleTenureAbove: 84,        // months (incl. moratorium)
    vehicleTenureBelow: 60,
    otherAssetsTenure: 60          // other assets treated as the "5 lac" bracket
  };

  var SCHEMES = {
    TWEES: {
      name: 'TWEES',
      fullName: 'Scheme name placeholder (TWEES)',
      capitalSubsidyPct: 25,        // % of project cost  [PLACEHOLDER]
      capitalSubsidyMax: 1000000,   // INR cap            [PLACEHOLDER]
      subvention: { mode: 'percent', ratePct: 3, years: 5 }, // [PLACEHOLDER]
      promoterMarginPct: 10,
      termsAndConditions: [
        'TWEES T&C 1: Eligibility criteria placeholder - edit in js/schemes.js.',
        'TWEES T&C 2: Subsidy is released by the DIC after commencement of production.',
        'TWEES T&C 3: Interest subvention claims are submitted quarterly by the bank to the DIC.',
        'TWEES T&C 4: Assets must not be sold or transferred during the loan tenure.'
      ]
    },
    'CM-ARISE': {
      name: 'CM-ARISE',
      fullName: 'Scheme name placeholder (CM-ARISE)',
      capitalSubsidyPct: 25, capitalSubsidyMax: 2500000,
      subvention: { mode: 'percent', ratePct: 3, years: 5 },
      promoterMarginPct: 10,
      termsAndConditions: [
        'CM-ARISE T&C 1: Eligibility criteria placeholder.',
        'CM-ARISE T&C 2: Subsidy conditions placeholder.',
        'CM-ARISE T&C 3: Interest subvention conditions placeholder.'
      ]
    },
    PMEGP: {
      name: 'PMEGP',
      fullName: 'Scheme name placeholder (PMEGP)',
      capitalSubsidyPct: 25, capitalSubsidyMax: 2500000,
      subvention: { mode: 'percent', ratePct: 0, years: 0 },
      promoterMarginPct: 10,
      termsAndConditions: [
        'PMEGP T&C 1: Eligibility criteria placeholder.',
        'PMEGP T&C 2: Subsidy is back-ended and held as a lock-in deposit placeholder.'
      ]
    },
    UYEGP: {
      name: 'UYEGP',
      fullName: 'Scheme name placeholder (UYEGP)',
      capitalSubsidyPct: 25, capitalSubsidyMax: 375000,
      subvention: { mode: 'percent', ratePct: 0, years: 0 },
      promoterMarginPct: 10,
      termsAndConditions: [
        'UYEGP T&C 1: Eligibility criteria placeholder.',
        'UYEGP T&C 2: Subsidy conditions placeholder.'
      ]
    },
    AABCS: {
      name: 'AABCS',
      fullName: 'Scheme name placeholder (AABCS)',
      capitalSubsidyPct: 25, capitalSubsidyMax: 1500000,
      subvention: { mode: 'percent', ratePct: 5, years: 5 },
      promoterMarginPct: 10,
      termsAndConditions: [
        'AABCS T&C 1: Eligibility criteria placeholder.',
        'AABCS T&C 2: Subsidy conditions placeholder.',
        'AABCS T&C 3: Interest subvention conditions placeholder.'
      ]
    }
  };

  var api = { DEFAULTS: DEFAULTS, SCHEMES: SCHEMES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MSMEConfig = api;
})(typeof self !== 'undefined' ? self : this);
