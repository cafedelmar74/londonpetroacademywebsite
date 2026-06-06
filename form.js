/**
 * LPA Standardised Lead Capture Form
 * Renders a consistent enquiry form, POSTs to n8n webhook,
 * fires GA4 events on key actions.
 *
 * Usage: call LPA_Form.render('#form-container', courseMeta)
 */
const LPA_Form = {

  /**
   * Render form into a container element
   * @param {string} selector  - CSS selector of container div
   * @param {object} meta      - Course metadata (auto-populates hidden fields)
   */
  render(selector, meta = {}) {
    const container = document.querySelector(selector);
    if (!container) return;

    container.innerHTML = `
      <form class="lpa-form" id="lpa-enquiry-form" novalidate>
        <div class="lpa-form-header">
          <h3 class="lpa-form-title">Enquire About This Course</h3>
          <p class="lpa-form-sub">One of our advisors will respond within one business day.</p>
        </div>

        <div class="lpa-form-row">
          <div class="lpa-form-group">
            <label for="lpa-name">Full Name <span class="req">*</span></label>
            <input type="text" id="lpa-name" name="name" placeholder="Jane Smith" required autocomplete="name">
          </div>
          <div class="lpa-form-group">
            <label for="lpa-email">Work Email <span class="req">*</span></label>
            <input type="email" id="lpa-email" name="email" placeholder="jane@company.com" required autocomplete="email">
          </div>
        </div>

        <div class="lpa-form-row">
          <div class="lpa-form-group">
            <label for="lpa-company">Company / Organisation <span class="req">*</span></label>
            <input type="text" id="lpa-company" name="company" placeholder="Petrobras" required autocomplete="organization">
          </div>
          <div class="lpa-form-group">
            <label for="lpa-phone">Phone Number</label>
            <input type="tel" id="lpa-phone" name="phone" placeholder="+44 7700 900000" autocomplete="tel">
          </div>
        </div>

        <div class="lpa-form-group">
          <label for="lpa-course">Course of Interest <span class="req">*</span></label>
          <input type="text" id="lpa-course" name="course_interest"
            value="${meta.course_name || ''}"
            placeholder="Course name" required>
        </div>

        <div class="lpa-form-group">
          <label for="lpa-message">Message</label>
          <textarea id="lpa-message" name="message" rows="4"
            placeholder="Tell us about your team size, preferred dates, or any specific requirements…"></textarea>
        </div>

        <!-- Hidden metadata fields — auto-populated, sent to n8n -->
        <input type="hidden" name="source"           value="website">
        <input type="hidden" name="page_url"         value="${window.location.href}">
        <input type="hidden" name="course_category"  value="${meta.category  || ''}">
        <input type="hidden" name="course_duration"  value="${meta.duration  || ''}">
        <input type="hidden" name="course_level"     value="${meta.level     || 'Professional'}">
        <input type="hidden" name="course_location"  value="${meta.location  || ''}">
        <input type="hidden" name="submitted_at"     value="">

        <button type="submit" class="lpa-form-btn" id="lpa-submit-btn">
          <span class="btn-label">Send Enquiry →</span>
          <span class="btn-loading" style="display:none">Sending…</span>
        </button>

        <div class="lpa-form-success" id="lpa-form-success" style="display:none">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
          <div>
            <strong>Enquiry sent successfully.</strong>
            <p>We'll be in touch within one business day.</p>
          </div>
        </div>

        <div class="lpa-form-error" id="lpa-form-error" style="display:none">
          Something went wrong. Please email us directly at
          <a href="mailto:${LPA.email}">${LPA.email}</a>
        </div>

        <p class="lpa-form-privacy">
          By submitting this form you agree to our
          <a href="${LPA.site_url}/privacy-policy/" target="_blank" rel="noopener">Privacy Policy</a>.
          We never share your data with third parties.
        </p>
      </form>
    `;

    this._bind(meta);
  },

  _bind(meta) {
    const form    = document.getElementById('lpa-enquiry-form');
    const btn     = document.getElementById('lpa-submit-btn');
    const success = document.getElementById('lpa-form-success');
    const error   = document.getElementById('lpa-form-error');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!this._validate(form)) return;

      // Timestamp
      form.querySelector('[name="submitted_at"]').value = new Date().toISOString();

      // UI: loading state
      btn.querySelector('.btn-label').style.display   = 'none';
      btn.querySelector('.btn-loading').style.display = 'inline';
      btn.disabled = true;

      // Build payload
      const data = Object.fromEntries(new FormData(form));

      // Fire GA4 event: form_start → form_submit
      this._track('form_submit', {
        course_name:     data.course_interest,
        course_category: data.course_category,
        form_location:   'course_page',
      });

      try {
        const res = await fetch(LPA.webhook, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(data),
        });

        if (res.ok || res.status === 200) {
          form.style.display    = 'none';
          success.style.display = 'flex';
          this._track('lead_generated', {
            course_name:     data.course_interest,
            course_category: data.course_category,
          });
        } else {
          throw new Error(`HTTP ${res.status}`);
        }
      } catch (err) {
        console.error('Form error:', err);
        btn.querySelector('.btn-label').style.display   = 'inline';
        btn.querySelector('.btn-loading').style.display = 'none';
        btn.disabled = false;
        error.style.display = 'block';
        this._track('form_error', { error: err.message });
      }
    });

    // Track CTA clicks (brochure, Calendly etc.)
    document.querySelectorAll('[data-track]').forEach(el => {
      el.addEventListener('click', () => {
        this._track(el.dataset.track, {
          label:       el.dataset.trackLabel || el.textContent.trim(),
          course_name: meta.course_name || '',
        });
      });
    });
  },

  _validate(form) {
    let valid = true;
    form.querySelectorAll('[required]').forEach(field => {
      field.classList.remove('lpa-field-error');
      if (!field.value.trim()) {
        field.classList.add('lpa-field-error');
        valid = false;
      }
    });
    if (!valid) {
      form.querySelector('.lpa-field-error')?.focus();
    }
    return valid;
  },

  _track(event, params = {}) {
    if (typeof gtag === 'function') {
      gtag('event', event, params);
    }
  },
};
