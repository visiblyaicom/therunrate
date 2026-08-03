/* The Run Rate — site-wide subscribe popup (self-injecting).
   One source of truth; loaded via <script defer src="/subscribe-popup.js"></script> on every page.
   Trigger: 15s or 60% scroll, whichever first. Shown at most once per visitor per 7 days
   (cooldown set on show, so multi-page browsing doesn't re-nag). Fires GA4 popup_shown +
   subscribe_submit(source:popup). Design mirrors the original inline homepage popup exactly. */
(function () {
  var STORAGE_KEY = 'trr_sub_dismissed';
  var DISMISS_DAYS = 7;

  function isDismissed() {
    try {
      var ts = localStorage.getItem(STORAGE_KEY);
      if (!ts) return false;
      return Date.now() - parseInt(ts, 10) < DISMISS_DAYS * 86400000;
    } catch (e) { return false; }
  }
  function setCooldown() {
    try { localStorage.setItem(STORAGE_KEY, Date.now().toString()); } catch (e) {}
  }

  if (isDismissed()) return;

  var CSS = `
.sub-overlay { display:none; position:fixed; inset:0; background:rgba(13,20,33,0.80); backdrop-filter:blur(3px); z-index:9999; align-items:center; justify-content:center; padding:20px; animation:sub-fade-in 0.3s ease; }
.sub-overlay.active { display:flex; }
@keyframes sub-fade-in { from { opacity:0; } to { opacity:1; } }
.sub-popup { background:#1B2235; border:1px solid #2E3D5C; border-radius:4px; padding:48px 44px 40px; max-width:480px; width:100%; position:relative; animation:sub-slide-up 0.35s ease; }
@keyframes sub-slide-up { from { transform:translateY(16px); opacity:0; } to { transform:translateY(0); opacity:1; } }
.sub-close { position:absolute; top:16px; right:18px; background:none; border:none; color:#7A8699; font-size:14px; cursor:pointer; padding:4px 6px; line-height:1; transition:color 0.15s; }
.sub-close:hover { color:#F8F8F4; }
.sub-tag { font-family:'Jost',sans-serif; font-weight:600; font-size:9px; letter-spacing:0.24em; color:#F0E87A; text-transform:uppercase; margin-bottom:16px; }
.sub-heading { font-family:'Cormorant Garamond',serif; font-weight:400; font-style:italic; font-size:28px; line-height:1.2; color:#F8F8F4; margin:0 0 14px; }
.sub-body { font-family:'Jost',sans-serif; font-weight:300; font-size:13px; line-height:1.75; color:#7A8699; margin:0 0 28px; }
.sub-form { display:flex; flex-direction:column; gap:10px; }
.sub-input { background:#0D1421; border:1px solid #2E3D5C; border-radius:2px; color:#F8F8F4; font-family:'Jost',sans-serif; font-weight:300; font-size:13px; padding:12px 14px; outline:none; transition:border-color 0.15s; width:100%; box-sizing:border-box; }
.sub-input::placeholder { color:#7A8699; }
.sub-input:focus { border-color:#F0E87A; }
.sub-btn { background:#F0E87A; color:#0D1421; border:none; border-radius:2px; font-family:'Jost',sans-serif; font-weight:600; font-size:12px; letter-spacing:0.08em; padding:13px 20px; cursor:pointer; transition:opacity 0.15s; text-transform:uppercase; }
.sub-btn:hover { opacity:0.88; }
.sub-fine { font-family:'Jost',sans-serif; font-weight:300; font-size:11px; color:#7A8699; margin:12px 0 0; text-align:center; }
@media (max-width:520px) { .sub-popup { padding:40px 24px 32px; } .sub-heading { font-size:24px; } }
`;

  var HTML =
    '<div id="sub-overlay" class="sub-overlay" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="sub-heading">' +
    '<div class="sub-popup">' +
    '<button class="sub-close" id="sub-close" aria-label="Close">&#10005;</button>' +
    '<div class="sub-tag">FREE WEEKLY NEWSLETTER</div>' +
    '<h2 class="sub-heading" id="sub-heading">The intelligence your competitors aren\'t reading.</h2>' +
    '<p class="sub-body">Studio growth, member acquisition, wearables, AI tools, and brand strategy — applied weekly to the fitness and wellness industry.</p>' +
    '<form class="sub-form" id="sub-form">' +
    '<input type="email" id="sub-email" name="email" placeholder="your@email.com" required autocomplete="email" class="sub-input">' +
    '<button type="submit" class="sub-btn">Subscribe free →</button>' +
    '</form>' +
    '<p class="sub-fine">No spam. Unsubscribe anytime.</p>' +
    '</div></div>';

  var style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  var wrap = document.createElement('div');
  wrap.innerHTML = HTML;
  document.body.appendChild(wrap.firstElementChild);

  var overlay = document.getElementById('sub-overlay');

  function dismiss() {
    setCooldown();
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
  }

  function show() {
    if (isDismissed()) return;
    setCooldown();
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    try { gtag('event', 'popup_shown'); } catch (e) {}
    var em = document.getElementById('sub-email');
    if (em) em.focus();
  }

  var shown = false;
  function triggerOnce() { if (shown) return; shown = true; show(); }

  setTimeout(triggerOnce, 15000);
  window.addEventListener('scroll', function () {
    var denom = document.body.scrollHeight - window.innerHeight;
    if (denom > 0 && window.scrollY / denom >= 0.6) triggerOnce();
  }, { passive: true });

  document.getElementById('sub-close').addEventListener('click', dismiss);
  overlay.addEventListener('click', function (e) { if (e.target === this) dismiss(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') dismiss(); });

  document.getElementById('sub-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var email = document.getElementById('sub-email').value.trim();
    if (!email) return;
    try { gtag('event', 'subscribe_submit', { source: 'popup' }); } catch (e2) {}
    document.querySelector('.sub-form').innerHTML = '<p style="font-family:\'Jost\',sans-serif;font-weight:300;font-size:13px;color:#F0E87A;text-align:center;padding:12px 0;">Opening your subscription options ✓</p>';
    document.querySelector('.sub-fine').style.display = 'none';
    window.location.href = 'https://newsletter.therunrate.co/subscribe?email=' + encodeURIComponent(email) + '&utm_source=site_popup';
    setTimeout(dismiss, 3000);
  });
})();
