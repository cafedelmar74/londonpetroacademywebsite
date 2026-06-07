/**
 * LPA Global Configuration
 * Update values here once — they apply across the entire site.
 * Do not hardcode phone, email, or webhook anywhere else.
 */
const LPA = {

  // ── Contact ──────────────────────────────────────────────
  phone:       '+44 (0) 1582 516247',
  phone_href:  'tel:+441582516247',
  email:       'info@londonpetroacademy.co.uk',
  email_ih:    'j.rogus@londonpetroacademy.co.uk',  // in-house enquiries
  address:     '207 Regent Street, London, W1B 3HH',
  calendly:    'https://calendly.com/london_petro_academy/ms-teams-session-with-london-petro-academy',

  // ── Analytics ────────────────────────────────────────────
  ga4_id:      'G-88QEV1PLG4',

  // ── n8n Lead Capture Webhook ─────────────────────────────
  // Switch between test and production URLs here only
  webhook_test: 'https://n8n.srv765009.hstgr.cloud/webhook-test/lpa-leads',
  webhook_prod: 'https://n8n.srv765009.hstgr.cloud/webhook/lpa-leads',
  get webhook() { return this.webhook_prod; }, // now live on production

  // ── Social ────────────────────────────────────────────────
  linkedin:    'https://www.linkedin.com/company/london-petro-academy-limited/',
  twitter:     'https://twitter.com/London_Petro_Ac',

  // ── Site ──────────────────────────────────────────────────
  site_url:    'https://www.londonpetroacademy.co.uk',
  github_url:  'https://cafedelmar74.github.io',

};

// Freeze so nothing overwrites it accidentally
Object.freeze(LPA);
