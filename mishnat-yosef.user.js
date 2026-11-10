// ==UserScript==
// @name         מוסיף למשנת - סל קניות משפחתי חכם
// @namespace    https://digital.levtov.uk/
// @version      0.4
// @description  סל קניות משפחתי חכם למשנת יוסף - מד תקציב שבועי, תזכורת קבועים שנשכחו, מחשבון חיסכון והשוואת מחירים לרשתות השיווק, סימון מוצרים שהוזמנו בעבר, סימון קבועים, היסטוריית קניות מפורטת, הדפסת רשימת איסוף, והוספה מהירה לסל
// @author       לב טוב דיגיטל (https://digital.levtov.uk/)
// @copyright    2026, Lev Tov Digital (https://digital.levtov.uk/). All Rights Reserved.
// @license      Proprietary - כל הזכויות שמורות ללב טוב דיגיטל. לשימוש אישי בלבד. אין להעתיק או להפיץ מחדש.
// @match        https://mishnatyosef.org/*
// @match        https://*.mishnatyosef.org/*
// @connect      digital.levtov.uk
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-start
// ==/UserScript==

(function() {
'use strict';

(() => {
  if (window.__myfamHooked) return;
  window.__myfamHooked = true;
  const abs = u => { try { return new URL(u, location.href).href; } catch { return String(u); } };
  const want = u => /\/api\//.test(abs(u)) && /mishnatyosef\.org/.test(abs(u));
  const emit = d => {
    try { window.dispatchEvent(new CustomEvent('myfam-api', { detail: JSON.stringify(d) })); } catch (e) {}
  };

  const origFetch = window.fetch;
  const capturedHeaders = {};

  window.fetch = async function (input, init) {
    const res = await origFetch.apply(this, arguments);
    try {
      const url = typeof input === 'string' ? input : (input && input.url) || String(input);
      if (want(url)) {
        const method = (init && init.method) || (input && input.method) || 'GET';
        const body = init && typeof init.body === 'string' ? init.body : null;
        let auth = null;
        try {
          if (init && init.headers) {
            if (init.headers instanceof Headers) {
              init.headers.forEach((v, k) => { capturedHeaders[k.toLowerCase()] = v; });
            } else if (Array.isArray(init.headers)) {
              init.headers.forEach(([k, v]) => { capturedHeaders[k.toLowerCase()] = v; });
            } else if (typeof init.headers === 'object') {
              Object.keys(init.headers).forEach(k => { capturedHeaders[k.toLowerCase()] = init.headers[k]; });
            }
            auth = capturedHeaders['authorization'] || null;
          }
        } catch (e) {}
        res.clone().json()
          .then(json => emit({ url: abs(url), method: method.toUpperCase(), body, auth, headers: { ...capturedHeaders }, status: res.status, json }))
          .catch(() => {});
      }
    } catch (e) {}
    return res;
  };

  const X = XMLHttpRequest.prototype, oOpen = X.open, oSend = X.send, oSetHeader = X.setRequestHeader;
  X.open = function (m, u) { 
    this.__m = m; 
    this.__u = String(u); 
    this.__headers = {};
    return oOpen.apply(this, arguments); 
  };
  X.setRequestHeader = function (header, value) {
    try {
      if (!this.__headers) this.__headers = {};
      this.__headers[header.toLowerCase()] = value;
      capturedHeaders[header.toLowerCase()] = value;
      if (/^authorization$/i.test(header)) this.__auth = value;
    } catch (e) {}
    return oSetHeader.apply(this, arguments);
  };
  X.send = function (b) {
    this.addEventListener('load', function () {
      try {
        if (!want(this.__u)) return;
        let json;
        try { json = this.responseType === 'json' ? this.response : JSON.parse(this.responseText); } catch (e) { return; }
        emit({ 
          url: abs(this.__u), 
          method: String(this.__m).toUpperCase(), 
          body: typeof b === 'string' ? b : null, 
          auth: this.__auth || capturedHeaders['authorization'] || null, 
          headers: { ...capturedHeaders, ...(this.__headers || {}) },
          status: this.status, 
          json 
        });
      } catch (e) {}
    });
    return oSend.apply(this, arguments);
  };

  /* גשר לקריאות ישירות מעולם הדף (עוקף לחלוטין בעיות CORS ובידוד) */
  window.addEventListener('myfam-call-api', async ev => {
    let req;
    try { req = JSON.parse(ev.detail); } catch (e) { return; }
    
    // ניסיון ראשון: fetch מתוך עולם הדף
    try {
      const hdrs = { 'Accept': 'application/json', ...(req.headers || {}) };
      if (req.auth) hdrs['Authorization'] = req.auth;
      const resp = await origFetch(req.url, {
        method: req.method || 'GET',
        headers: hdrs,
        credentials: 'include',
        body: req.body || undefined
      });
      let json = null;
      try { json = await resp.json(); } catch (e) {}
      window.dispatchEvent(new CustomEvent('myfam-call-api-res', {
        detail: JSON.stringify({ id: req.id, status: resp.status, json, ok: resp.ok })
      }));
      return;
    } catch (fetchErr) {
      // אם fetch בדף נכשל, ננסה XHR כגיבוי
    }

    try {
      const xhr = new XMLHttpRequest();
      xhr.open(req.method || 'GET', req.url);
      xhr.withCredentials = true;
      xhr.setRequestHeader('Accept', 'application/json');
      if (req.auth) xhr.setRequestHeader('Authorization', req.auth);
      xhr.onload = function () {
        let json = null;
        try { json = JSON.parse(xhr.responseText); } catch (e) {}
        window.dispatchEvent(new CustomEvent('myfam-call-api-res', {
          detail: JSON.stringify({ id: req.id, status: xhr.status, json, text: xhr.responseText, ok: xhr.status >= 200 && xhr.status < 300 })
        }));
      };
      xhr.onerror = function () {
        window.dispatchEvent(new CustomEvent('myfam-call-api-res', {
          detail: JSON.stringify({ id: req.id, error: 'Network error (xhr)' })
        }));
      };
      xhr.send(req.body || null);
    } catch (err) {
      window.dispatchEvent(new CustomEvent('myfam-call-api-res', {
        detail: JSON.stringify({ id: req.id, error: String(err) })
      }));
    }
  });
})();

if (typeof window.__MY_T === 'undefined') {
  window.__MY_T = {
    request: function(o) {
      return new Promise(function(resolve, reject) {
        if (typeof GM_xmlhttpRequest !== 'undefined') {
          GM_xmlhttpRequest({
            method: o.method || 'GET',
            url: o.url,
            data: o.body,
            headers: Object.assign({ 'Content-Type': 'application/json' }, o.headers || {}),
            onload: function(res) {
              try {
                var d = JSON.parse(res.responseText);
                resolve(d);
              } catch(e) {
                resolve({ data: res.responseText });
              }
            },
            onerror: function(err) { reject(err); }
          });
        } else {
          fetch(o.url, { method: o.method || 'GET', body: o.body, headers: o.headers })
            .then(function(r) { return r.json(); })
            .then(resolve)
            .catch(reject);
        }
      });
    }
  };
}

(function () {
  'use strict';
  const W = window.unsafeWindow || window;
  const T = window.__MY_T;

  const APP_NAME = 'מוסיף למשנת';
  const ICONS = {
    basket: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;display:inline-block"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
    cart: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;display:inline-block"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,
    star: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;display:inline-block"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    starFilled: `<svg viewBox="0 0 24 24" width="16" height="16" fill="#e0a800" stroke="#e0a800" stroke-width="1" style="vertical-align:middle;display:inline-block"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    starBtnEmpty: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;display:inline-block"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    starBtnFilled: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#e0a800" stroke="#e0a800" stroke-width="1" style="vertical-align:middle;display:inline-block"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    cartPlus: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;display:inline-block"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/><line x1="12" y1="9" x2="12" y2="15"/><line x1="9" y1="12" x2="15" y2="12"/></svg>`,
    history: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;display:inline-block"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    download: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;display:inline-block"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    settings: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;display:inline-block"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    bug: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;display:inline-block"><path d="M16 16v1a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-1"/><rect x="8" y="9" width="8" height="8" rx="2"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/><line x1="4" y1="13" x2="8" y2="13"/><line x1="16" y1="13" x2="20" y2="13"/><line x1="5" y1="18" x2="8" y2="16"/><line x1="19" y1="18" x2="16" y2="16"/><line x1="5" y1="8" x2="8" y2="10"/><line x1="19" y1="8" x2="16" y2="10"/></svg>`,
    close: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;display:inline-block"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    checkCircle: `<svg viewBox="0 0 24 24" width="50" height="50" fill="none" stroke="#2e9e5b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block"><circle cx="12" cy="12" r="10"/><polyline points="16 9 11 15 8 12"/></svg>`,
    spinner: `<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#2e9e5b" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="31.4 31.4" style="animation:myfam-spin 1s linear infinite;display:inline-block"><circle cx="12" cy="12" r="10"/></svg>`,
    print: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;display:inline-block"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`,
    bell: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;display:inline-block"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
    search: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;display:inline-block"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    package: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;display:inline-block"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
    trendingUp: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;display:inline-block"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
    trash: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;display:inline-block"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
    chevronDown: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;display:inline-block"><polyline points="6 9 12 15 18 9"/></svg>`,
    lightbulb: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;display:inline-block"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>`,
    check: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;display:inline-block"><polyline points="20 6 9 17 4 12"/></svg>`
  };
  const CONFIG = {
    autoFixedAfter: 3,
    debugKeep: 30,
    debugPaths: /get_items_for_sale|\/orders\/|add_item|update_item|remove_item|get_favourites|open_sales/
  };

  const LS = 'myfam_';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const jget = (k, d) => { try { return JSON.parse(localStorage.getItem(LS + k)) ?? d; } catch { return d; } };
  const jset = (k, v) => localStorage.setItem(LS + k, JSON.stringify(v));

  let state = jget('state', { history: [], fixed: {}, budget: { target: 0, enabled: false, updatedAt: 0 } });
  if (!state.budget) {
    state.budget = { target: 0, enabled: false, updatedAt: 0 };
  }
  let itemPrices = jget('item_prices', {});
  function saveItemPrices() {
    try { jset('item_prices', itemPrices); } catch (e) {}
  }
  // איפוס אוטומטי של סימוני בדיקה ישנים (שחסמו מוצרים כמו בצל ועגבניה שהוזמנו 7 פעמים)
  if (!localStorage.getItem(LS + 'clean_fixed_v3')) {
    localStorage.setItem(LS + 'clean_fixed_v3', 'true');
    state.fixed = {};
    jset('state', state);
  }
  let saleMeta = jget('salemeta', {});          // saleId -> {week, begin}
  let filter = 'all';
  const PREF_DEFAULT = { seenColor: '#2e9e5b', seenFill: false, fixedColor: '#e0a800', fixedFill: true };
  let prefs = { ...PREF_DEFAULT, ...jget('prefs', {}) };
  let sale = { id: null, items: new Map() };    // שם מנורמל -> {pid, name}
  let live = null;                              // ההזמנה הנוכחית: {orderId, saleId, clientId, lines: Map}
  let currentCardMap = new Map();               // כרטיס מוצר פעיל בדף -> {key, leaf}
  const debugBuf = [];

  const norm = s => (s || '').toString().normalize('NFKD').replace(/[\u0591-\u05C7]/g, '')
    .replace(/["'׳״“”]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

  const SECRET = /^(card|tokef|taz|tranzila_token|clientid|phone|email)$/i;
  const redact = o => {
    if (Array.isArray(o)) return o.map(redact);
    if (o && typeof o === 'object') { const r = {}; for (const k in o) r[k] = SECRET.test(k) ? 'X' : redact(o[k]); return r; }
    return o;
  };

  /* ---------- דפים מוחרגים (התוסף לא יפעל בהם) ---------- */
  const EXCLUDED_PATHS = [
    '/login',
    '/register',
    '/auth',
    '/forgot-password',
    '/reset-password',
    '/user/login',
    '/product-scale',
    '/charges',
    '/payment-methods',
    '/profile',
    '/faq',
    '/support',
    '/support/tickets',
    '/return-policy',
    '/policy'
  ];

  function isProductSelectionPage() {
    if (isExcludedPage()) return false;
    const p = (location.pathname || '').toLowerCase();
    if (p.includes('login') || p.includes('auth') || p.includes('register')) return false;
    const isOrderOrCatalog = /^\/(order|orders|sale|catalog|cart)\b/i.test(p);
    const hasCards = (typeof currentCardMap !== 'undefined' && currentCardMap && currentCardMap.size > 0);
    const hasSaleData = (sale && sale.items && sale.items.size > 0) || (live && (live.saleId || (live.lines && live.lines.size > 0)));
    return isOrderOrCatalog || hasCards || hasSaleData;
  }

  function isExcludedPage() {
    const p = (location.pathname || '').toLowerCase();
    return EXCLUDED_PATHS.some(ex => p === ex || p.startsWith(ex + '/') || p.startsWith(ex + '?'));
  }

  function checkExcluded() {
    if (isExcludedPage()) {
      const p = $('#myfam-panel');
      const b = $('#myfam-body');
      if (p) p.style.display = 'none';
      if (b) b.style.display = 'none';
      return true;
    }
    const p = $('#myfam-panel');
    if (p && p.style.display === 'none') p.style.display = '';
    return false;
  }

  /* ---------- חילוץ saleId ו-orderId ישירות מכתובת הדף ---------- */
  function extractOrderIdFromUrl() {
    const m = location.pathname.match(/\/order\/(\d+)/);
    return m ? Number(m[1]) : null;
  }

  function extractSaleIdFromUrl() {
    const m = location.pathname.match(/\/order\/(\d+)\/(\d+)/);
    if (m) {
      const oid = Number(m[1]), sid = Number(m[2]);
      if (sale.id !== sid) {
        sale.id = sid;
      }
      if (!live || live.saleId !== sid) {
        live = { orderId: oid, saleId: sid, clientId: null, lines: new Map() };
      }
      return sid;
    }
    return null;
  }

  /* ---------- נתונים ---------- */
  function counts() {
    const m = {}, seen = new Set();
    const curSaleId = sale.id || extractSaleIdFromUrl();
    for (const o of state.history) {
      if (curSaleId != null && String(o.saleId) === String(curSaleId)) continue;
      for (const it of o.items) {
        const sk = o.saleId + '|' + it.key;
        if (seen.has(sk)) continue; seen.add(sk);
        const c = m[it.key] || (m[it.key] = { name: it.name, count: 0 });
        c.count++;
      }
    }
    return m;
  }

  function isFixed(key, c) {
    const f = state.fixed[key];
    if (f && typeof f.v === 'boolean') {
      return f.v;
    }
    return (c[key]?.count || 0) >= CONFIG.autoFixedAfter;
  }

  function merge(a, b) {
    const m = new Map();
    [...(a.history || []), ...(b.history || [])].forEach(o => {
      const p = m.get(o.id); if (!p || o.date > p.date) m.set(o.id, o);
    });
    const fixed = { ...(a.fixed || {}) };
    for (const [k, v] of Object.entries(b.fixed || {})) {
      if (!fixed[k] || (v && v.t && (!fixed[k].t || v.t > fixed[k].t))) fixed[k] = v;
    }
    return { history: [...m.values()].sort((x, y) => (x.date < y.date ? -1 : 1)), fixed };
  }

  /* ---------- סנכרון נתונים לחשבון גוגל (chrome.storage.sync) ---------- */
  function syncSaveGoogle(itemsToSave) {
    try {
      if (typeof chrome !== 'undefined' && chrome?.storage?.sync) {
        chrome.storage.sync.set(itemsToSave, () => {
          if (chrome.runtime.lastError) {
            console.warn('[myfam sync] Google sync save warning:', chrome.runtime.lastError);
          }
        });
      }
    } catch (e) {}
  }

  function syncLoadGoogle() {
    try {
      if (typeof chrome !== 'undefined' && chrome?.storage?.sync) {
        chrome.storage.sync.get(['myfam_fixed', 'myfam_prefs', 'myfam_auto_import_history', 'myfam_budget'], res => {
          if (chrome.runtime.lastError) return;
          let changed = false;
          if (res.myfam_fixed && typeof res.myfam_fixed === 'object') {
            for (const [k, v] of Object.entries(res.myfam_fixed)) {
              if (!state.fixed[k] || (v && v.t && (!state.fixed[k].t || v.t > state.fixed[k].t))) {
                state.fixed[k] = v;
                changed = true;
              }
            }
          }
          if (res.myfam_prefs && typeof res.myfam_prefs === 'object') {
            prefs = { ...prefs, ...res.myfam_prefs };
            jset('prefs', prefs);
            applyPrefs();
          }
          if (res.myfam_auto_import_history != null) {
            localStorage.setItem(LS + 'auto_import_history', String(res.myfam_auto_import_history));
          }
          if (res.myfam_budget && typeof res.myfam_budget === 'object') {
            if (!state.budget || (res.myfam_budget.updatedAt || 0) > (state.budget.updatedAt || 0)) {
              state.budget = res.myfam_budget;
              changed = true;
            }
          }
          if (changed) {
            jset('state', state);
            render();
            updateBudgetUI();
          }
        });
      }
    } catch (e) {}
  }

  const save = () => {
    jset('state', state);
    syncSaveGoogle({ myfam_fixed: state.fixed, myfam_budget: state.budget });
  };

  /* ---------- יירוט ה-API ---------- */
  let apiHeaders = jget('api_headers', {});
  let apiAuthToken = jget('api_auth', null);
  W.addEventListener('myfam-api', ev => {
    let d; try { d = JSON.parse(ev.detail); } catch { return; }
    if (d.headers && Object.keys(d.headers).length) {
      apiHeaders = { ...apiHeaders, ...d.headers };
      jset('api_headers', apiHeaders);
    }
    if (d.auth && d.auth !== apiAuthToken) {
      apiAuthToken = d.auth;
      jset('api_auth', apiAuthToken);
    }
    try { handleApi(d); } catch (e) { console.warn('[myfam]', e); }
  });

  let productImages = jget('product_images', {});
  // ניקוי זיהומים ישנים של חותמת כשרות אם נשמרו במטמון
  Object.keys(productImages).forEach(k => {
    if (/kashrut|badatz|badge|כשרות|בדץ|עדה/i.test(productImages[k])) {
      delete productImages[k];
    }
  });
  function saveProductImages() {
    try { jset('product_images', productImages); } catch (e) {}
  }

  /* ---------- זיהוי מדויק של תמונת המוצר (סינון כשרות/אייקונים/לבבות) ---------- */
  function findProductImage(cd) {
    if (!cd) return '';
    const imgs = [...cd.querySelectorAll('img')];
    if (!imgs.length) return '';

    const isExcluded = img => {
      const s = ((img.src || '') + ' ' + (img.alt || '') + ' ' + (img.className || '')).toLowerCase();
      return /kashrut|badatz|kosher|hechsher|logo|icon|heart|badge|לב|כשרות|בדץ|עדה|העדה/i.test(s);
    };

    const candidates = imgs.filter(img => {
      if (!img.src || img.src.startsWith('data:') || img.src.includes('enable-')) return false;
      if (isExcluded(img)) return false;
      return true;
    });

    if (!candidates.length) return '';

    // בחירת התמונה עם השטח הגדול ביותר (תמונת המוצר הראשית של הכרטיס)
    let best = candidates[0];
    let maxArea = -1;
    for (const img of candidates) {
      const w = img.naturalWidth || img.width || img.offsetWidth || 0;
      const h = img.naturalHeight || img.height || img.offsetHeight || 0;
      const area = w * h;
      if (area > maxArea) {
        maxArea = area;
        best = img;
      }
    }
    return best ? best.src : (candidates[0].src || '');
  }

  /* ---------- מחוון צף (Toast) על המסך ---------- */
    /* ---------- חלון התראה מותאם ומעוצב של התוסף (Banner/Dialog) ---------- */
  function showAppAlert(msg, title = 'מוסיף למשנת') {
    $('#myfam-app-dialog')?.remove();
    const d = document.createElement('div');
    d.id = 'myfam-app-dialog';
    d.innerHTML = `
      <div class="myfam-app-dialog-overlay">
        <div class="myfam-app-dialog-box">
          <div class="myfam-app-dialog-header">
            <div class="myfam-app-dialog-title">
              <span class="myfam-app-dialog-logo">🛒</span>
              <span>${esc(title)}</span>
            </div>
            <button class="myfam-app-dialog-x" title="סגור">${ICONS.close}</button>
          </div>
          <div class="myfam-app-dialog-body">
            <p>${esc(msg).replace(/\n/g, '<br>')}</p>
          </div>
          <div class="myfam-app-dialog-footer">
            <button class="myfam-app-dialog-btn-primary">אישור</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(d);

    const close = () => d.remove();
    d.querySelector('.myfam-app-dialog-x').onclick = close;
    d.querySelector('.myfam-app-dialog-btn-primary').onclick = close;
    d.querySelector('.myfam-app-dialog-overlay').onclick = e => {
      if (e.target === d.querySelector('.myfam-app-dialog-overlay')) close();
    };
    const escHandler = e => {
      if (e.key === 'Escape') {
        close();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  function showAppConfirm(msg, title = 'מוסיף למשנת') {
    return new Promise(resolve => {
      $('#myfam-app-dialog')?.remove();
      const d = document.createElement('div');
      d.id = 'myfam-app-dialog';
      d.innerHTML = `
        <div class="myfam-app-dialog-overlay">
          <div class="myfam-app-dialog-box">
            <div class="myfam-app-dialog-header">
              <div class="myfam-app-dialog-title">
                <span class="myfam-app-dialog-logo">🛒</span>
                <span>${esc(title)}</span>
              </div>
              <button class="myfam-app-dialog-x" title="ביטול">${ICONS.close}</button>
            </div>
            <div class="myfam-app-dialog-body">
              <p>${esc(msg).replace(/\n/g, '<br>')}</p>
            </div>
            <div class="myfam-app-dialog-footer">
              <button class="myfam-app-dialog-btn-cancel">ביטול</button>
              <button class="myfam-app-dialog-btn-primary">אישור</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(d);

      const finish = val => {
        d.remove();
        document.removeEventListener('keydown', escHandler);
        resolve(val);
      };

      d.querySelector('.myfam-app-dialog-x').onclick = () => finish(false);
      d.querySelector('.myfam-app-dialog-btn-cancel').onclick = () => finish(false);
      d.querySelector('.myfam-app-dialog-btn-primary').onclick = () => finish(true);
      d.querySelector('.myfam-app-dialog-overlay').onclick = e => {
        if (e.target === d.querySelector('.myfam-app-dialog-overlay')) finish(false);
      };
      const escHandler = e => {
        if (e.key === 'Escape') finish(false);
      };
      document.addEventListener('keydown', escHandler);
    });
  }

function showToast(msg, type = 'success') {
    let t = $('#myfam-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'myfam-toast';
      document.body.appendChild(t);
    }
    const isGold = type === 'success' || type === 'gold';
    t.className = isGold ? 'toast-gold' : 'toast-info';
    t.innerHTML = `
      <span class="toast-icon">${isGold ? ICONS.starFilled : ICONS.checkCircle}</span>
      <span class="toast-msg">${esc(msg)}</span>
    `;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => {
      t.classList.remove('show');
    }, 2800);
  }

  // עקביות מלאה: עדיפות לשם המוצר במכירה, ואז לשם המוצר הכללי + משיכת תמונת המוצר ומחיר
  const lineFrom = it => {
    const is = it.item_sale || {};
    const pid = is.itemID || it.productID || it.itemID;
    const name = is.name || (is.product && is.product.name) || it.name;
    if (pid == null || !name) return null;
    const rawImg = is.thumb_featured_image || is.featured_image || is.image || is.picture || is.image_url
      || (is.product && (is.product.thumb_featured_image || is.product.featured_image || is.product.image || is.product.image_url))
      || (it.product && (it.product.thumb_featured_image || it.product.featured_image || it.product.image))
      || it.thumb_featured_image || it.featured_image || it.image;
    let img = '';
    if (rawImg) {
      img = rawImg.startsWith('http') ? rawImg : `https://images.mishnatyosef.org/images/items/${rawImg.replace(/^\/+/, '')}`;
      productImages['p' + pid] = img;
      productImages[norm(name)] = img;
    } else {
      img = productImages['p' + pid] || productImages[norm(name)] || '';
    }

    const rawPrice = it.price ?? is.price ?? it.cost ?? is.cost ?? itemPrices['p' + pid] ?? 0;
    const price = parseFloat(rawPrice) || 0;
    if (price > 0) {
      itemPrices['p' + pid] = price;
    }

    return {
      sid: Number(it.item_salesID ?? is.id),
      pid,
      key: 'p' + pid,
      name,
      qty: parseFloat(it.amount) || 1,
      image: img,
      price
    };
  };

  function handleApi(d) {
    const u = new URL(d.url), path = u.pathname, j = d.json; let m;
    if (CONFIG.debugPaths.test(path)) {
      debugBuf.push({ url: path + u.search, method: d.method, status: d.status,
        body: (d.body || '').slice(0, 300), json: JSON.stringify(redact(j)).slice(0, 2500) });
      if (debugBuf.length > CONFIG.debugKeep) debugBuf.shift();
    }

    if (d.method === 'GET' && /get_items_for_sale\//.test(path)) {
      const rows = Array.isArray(j && j.data) ? j.data : [];
      if (!rows.length) return;
      const page = parseInt(u.searchParams.get('page') || '1', 10);
      const sid = rows[0].saleID;
      if (sale.id !== sid || page <= 1) sale = { id: sid, items: new Map() };
      rows.forEach(r => {
        const n = r.name || (r.product && r.product.name);
        if (n && r.itemID != null) {
          const rawImg = r.image || r.picture || r.image_url || (r.product && (r.product.image || r.product.image_url));
          const img = rawImg ? (rawImg.startsWith('http') ? rawImg : `${API_HOST}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`) : '';
          if (img) {
            productImages['p' + r.itemID] = img;
            productImages[norm(n)] = img;
          }
          const p = parseFloat(r.price ?? (r.item_sale && r.item_sale.price) ?? r.cost ?? 0) || 0;
          if (p > 0) {
            itemPrices['p' + r.itemID] = p;
          }
          sale.items.set(norm(n), { pid: r.itemID, name: n, image: img, price: p, itemSalesId: r.id });
        }
      });
      saveProductImages();
      saveItemPrices();
      scheduleRender();
      updateBudgetUI();
      updateForgottenUI();

    } else if (d.method === 'GET' && path === '/api/profile/open_sales') {
      const sales = Array.isArray(j && j.data) ? j.data : [];
      sales.forEach(s => {
        saleMeta[s.id] = {
          id: s.id,
          week: (s.parent && s.parent.week) || s.name || '',
          begin: s.begin || '',
          end: s.end || s.closing || s.order_closing_time || s.locked_at || ''
        };
      });
      jset('salemeta', saleMeta);
      let changed = false;
      state.history.forEach(o => { const mt = saleMeta[o.saleId]; if (mt && !o.week && mt.week) { o.week = mt.week; o.begin = mt.begin; changed = true; } });
      if (changed) save();

      // שולחים את המכירות הפתוחות לשירות הרקע לעדכון התראות
      try {
        chrome?.runtime?.sendMessage?.({ type: 'updateSalesMeta', sales });
      } catch (e) {}

    } else if (d.method === 'GET' && (m = path.match(/^\/api\/orders\/(\d+)$/))) {
      const o = j && j.order; if (!o) return;
      const ordId = Number(m[1]);
      const curOrdId = extractOrderIdFromUrl();
      if (!curOrdId || ordId === curOrdId) {
        if (o.saleID) sale.id = o.saleID;
        live = { orderId: o.id, saleId: o.saleID, clientId: o.clientID, lines: new Map() };
        let itemSum = 0;
        (o.items || []).forEach(it => {
          if (it.del) return;
          const l = lineFrom(it);
          if (l) {
            live.lines.set(l.sid, l);
            itemSum += (l.qty || 1) * (l.price || itemPrices['p' + l.pid] || 0);
          }
        });
        const serverTotal = parseFloat(o.total_list ?? o.total ?? o.sum ?? o.total_price ?? 0) || null;
        if (serverTotal !== null && serverTotal > 0) {
          live.serverTotal = serverTotal;
          live.offset = serverTotal - itemSum;
          live.currentTotal = serverTotal;
        } else {
          live.currentTotal = itemSum;
        }
        commit();
        updateBudgetUI();
        updateForgottenUI();
        updateSavingsUI();
      } else {
        // זו הזמנת עבר שנטענה (למשל מתוך היסטוריית הזמנות באתר)
        const items = (o.items || [])
          .filter(it => !it.del)
          .map(lineFrom)
          .filter(Boolean)
          .map(l => ({ key: l.key, pid: l.pid, name: l.name, qty: l.qty, image: l.image || '', price: l.price || 0 }))
          .sort((a, b) => a.pid - b.pid);
        if (items.length) {
          const id = `sale-${o.saleID}-${o.clientID || 'me'}`;
          const week = o.week || o.sale?.name || o.sale?.week || saleMeta[o.saleID]?.week || `מכירה ${o.saleID}`;
          const date = o.created_at || o.date || new Date().toISOString();
          state.history = state.history.filter(x => x.id !== id).concat({
            id, saleId: o.saleID, week, begin: o.sale?.begin || '', date, items
          });
          save();
        }
      }

    } else if (d.method === 'POST' && /^\/api\/(add_item|update_item)\//.test(path)) {
      if (!live) return;
      const rows = Array.isArray(j) ? j : (Array.isArray(j?.items) ? j.items : (j?.item ? [j.item] : []));
      rows.forEach(it => { const l = lineFrom(it); if (l) live.lines.set(l.sid, l); });
      const newTotal = parseFloat(j?.total_list ?? j?.total ?? j?.order_total ?? 0) || null;
      if (newTotal !== null && newTotal > 0) {
        live.serverTotal = newTotal;
        live.currentTotal = newTotal;
      } else {
        let itemSum = 0;
        for (const l of live.lines.values()) {
          itemSum += (l.qty || 1) * (l.price || itemPrices['p' + l.pid] || 0);
        }
        live.currentTotal = Math.max(0, itemSum + (live.offset || 0));
      }
      commit();
      updateBudgetUI();
      updateForgottenUI();
      updateSavingsUI();

    } else if (d.method === 'POST' && (m = path.match(/^\/api\/remove_item\/\d+\/(\d+)$/))) {
      if (!live || !(j && j.status === 'success')) return;
      live.lines.delete(Number(m[1]));
      let itemSum = 0;
      for (const l of live.lines.values()) {
        itemSum += (l.qty || 1) * (l.price || itemPrices['p' + l.pid] || 0);
      }
      live.currentTotal = Math.max(0, itemSum + (live.offset || 0));
      commit();
      updateBudgetUI();
      updateForgottenUI();
      updateSavingsUI();
    }
  }

  function commit() {
    if (!live) return;
    const items = [...live.lines.values()]
      .map(l => ({ key: l.key, pid: l.pid, name: l.name, qty: l.qty, image: l.image || '', price: l.price || 0 }))
      .sort((a, b) => a.pid - b.pid);
    const id = `sale-${live.saleId}-${live.clientId}`;
    const prev = state.history.find(o => o.id === id);
    if (prev && JSON.stringify(prev.items) === JSON.stringify(items)) return;
    if (!prev && !items.length) return;
    const mt = saleMeta[live.saleId] || {};
    state.history = state.history.filter(o => o.id !== id).concat({
      id, saleId: live.saleId, week: mt.week || '', begin: mt.begin || '',
      date: new Date().toISOString(), items
    });
    save(); scheduleRender();
  }

  /* ---------- תצוגה ---------- */
  const times = n => n === 1 ? 'פעם אחת' : n === 2 ? 'פעמיים' : `${n} פעמים`;
  let rt; const scheduleRender = () => { clearTimeout(rt); rt = setTimeout(render, 300); };

  function applyPrefs() {
    const s = document.documentElement.style;
    s.setProperty('--myfam-seen', prefs.seenColor);
    s.setProperty('--myfam-seen-bg', prefs.seenColor + '33');
    s.setProperty('--myfam-fixed', prefs.fixedColor);
    s.setProperty('--myfam-fixed-bg', prefs.fixedColor + '40');
  }

  const heartLike = el => {
    let m = false;
    const txt = (el.textContent || '').trim();
    if (!el.children.length && /^favorite(_border)?$/i.test(txt)) m = true;
    else {
      const lab = el.getAttribute('aria-label') || el.getAttribute('title') || '';
      const cl = el.getAttribute('class') || '';
      m = /מועדפ|favou?rite/i.test(lab) || /(^|[\s_-])(heart|favou?rite)/i.test(cl);
      if (!m && el.querySelector && el.querySelector('.material-symbols-rounded, .material-icons, svg')) {
        const sub = (el.querySelector('.material-symbols-rounded, .material-icons')?.textContent || '').trim();
        if (/^favorite(_border)?$/i.test(sub)) m = true;
      }
    }
    return m && !el.closest('#myfam-panel,#myfam-body,#myfam-modal,.myfam-starbtn');
  };

  function positionBody() {
    const p = $('#myfam-panel'), b = $('#myfam-body'), t = $('#myfam-toggle');
    if (!p || !b || !t || b.classList.contains('collapsed')) return;
    const r = t.getBoundingClientRect(), w = 310;
    
    // מנח אופקי בתוך גבולות המסך
    let left = r.left;
    if (left + w > window.innerWidth - 10) {
      left = Math.max(10, window.innerWidth - w - 10);
    }
    if (left < 10) left = 10;
    b.style.left = left + 'px';

    // מנח אנכי: פתיחה מטה או מעלה עם הגבלת גובה מוחלטת שלא תחרוג מתחתית המסך
    const spaceBelow = window.innerHeight - r.bottom - 16;
    const spaceAbove = r.top - 16;

    if (spaceBelow >= 360 || spaceBelow >= spaceAbove) {
      const topPos = Math.max(8, r.bottom + 6);
      b.style.top = topPos + 'px';
      b.style.bottom = '';
      b.style.maxHeight = Math.max(220, window.innerHeight - topPos - 14) + 'px';
    } else {
      const bottomPos = Math.max(8, window.innerHeight - r.top + 6);
      b.style.top = '';
      b.style.bottom = bottomPos + 'px';
      b.style.maxHeight = Math.max(220, r.top - 14) + 'px';
    }
  }

  let panelDragging = false;
  let panelDragMoved = false;

  function initDraggablePanel() {
    const p = $('#myfam-panel');
    const t = $('#myfam-toggle');
    if (!p || !t || p._dragBound) return;
    p._dragBound = true;

    let startX = 0, startY = 0, startLeft = 0, startTop = 0;

    const onPointerDown = e => {
      if (!p.classList.contains('floating')) return;
      if (e.button && e.button !== 0) return;
      panelDragging = true;
      panelDragMoved = false;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      startX = clientX;
      startY = clientY;
      const r = p.getBoundingClientRect();
      startLeft = r.left;
      startTop = r.top;
    };

    const onPointerMove = e => {
      if (!panelDragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const dx = clientX - startX;
      const dy = clientY - startY;
      if (Math.hypot(dx, dy) > 5) {
        panelDragMoved = true;
        p.classList.add('dragging');
      }
      if (!panelDragMoved) return;
      if (e.cancelable && e.touches) e.preventDefault();
      const maxL = Math.max(10, window.innerWidth - 55);
      const maxT = Math.max(10, window.innerHeight - 55);
      const newL = Math.min(Math.max(10, startLeft + dx), maxL);
      const newT = Math.min(Math.max(10, startTop + dy), maxT);
      p.style.left = newL + 'px';
      p.style.top = newT + 'px';
      positionBody();
    };

    const onPointerUp = () => {
      if (!panelDragging) return;
      panelDragging = false;
      p.classList.remove('dragging');
      if (panelDragMoved) {
        const r = p.getBoundingClientRect();
        try {
          localStorage.setItem('myfam_panel_pos', JSON.stringify({ top: Math.round(r.top), left: Math.round(r.left) }));
        } catch (_) {}
      }
    };

    t.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('mouseup', onPointerUp);

    t.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);
  }

  function placePanel(h) {
    if (checkExcluded()) return;
    const p = $('#myfam-panel'); if (!p) return;
    if (h) {
      const pos = innerWidth < 768 ? 'beforebegin' : 'afterend';
      const nb = pos === 'afterend' ? h.nextElementSibling : h.previousElementSibling;
      if (nb !== p) h.insertAdjacentElement(pos, p);
      p.classList.remove('floating'); p.style.left = ''; p.style.top = '';
    } else {
      if (p.parentElement !== document.body) document.body.appendChild(p);
      p.classList.add('floating');

      // שחזור מיקום מותאם אישית שנגרר בעבר
      let customPos = null;
      try {
        const saved = JSON.parse(localStorage.getItem('myfam_panel_pos') || 'null');
        if (saved && typeof saved.top === 'number' && typeof saved.left === 'number') {
          customPos = saved;
        }
      } catch (_) {}

      if (customPos) {
        const maxL = Math.max(10, innerWidth - 60);
        const maxT = Math.max(10, innerHeight - 60);
        p.style.left = Math.min(Math.max(10, customPos.left), maxL) + 'px';
        p.style.top = Math.min(Math.max(10, customPos.top), maxT) + 'px';
      } else {
        let left = null;
        if (innerWidth >= 1024) {
          const hd = [...document.querySelectorAll('h1,h2,h3,h4,div,span,p')]
            .find(e => !e.children.length && e.textContent.trim() === 'סל הקניות המשפחתי');
          for (let x = hd; x && x !== document.body; x = x.parentElement) {
            const r = x.getBoundingClientRect();
            if (r.height >= innerHeight * 0.8 && r.width < innerWidth * 0.6) { if (r.right > 150) left = r.right; break; }
          }
        }
        p.style.left = (left != null ? left + 56 : 16) + 'px';
        p.style.top = left != null ? '76px' : '80px';
      }
    }
    initDraggablePanel();
    positionBody();
  }

  function render() {
    if (!document.body || checkExcluded()) return;
    ensureUI();
    extractSaleIdFromUrl();
    obs.disconnect();

    const c = counts();

    // 1. אלמנטי טקסט ששמם זהה למוצר, ואייקוני לב
    const leaves = [], hearts = [];
    // ניקוי סימוני leaf ישנים (האתר ממחזר אלמנטים בגלילה — טקסט מתחלף אך התכונה נשארת)
    $$('[data-myleaf]').forEach(e => e.removeAttribute('data-myleaf'));
    document.body.querySelectorAll('*').forEach(el => {
      if (heartLike(el)) hearts.push(el);
      if (el.children.length || /^(SCRIPT|STYLE|BUTTON|NOSCRIPT)$/.test(el.tagName)) return;
      const t = el.textContent;
      if (!t || t.length < 2 || t.length > 200) return;
      if (el.closest('#myfam-panel,#myfam-body,#myfam-modal,.myfam-tag')) return;
      const hit = sale.items.get(norm(t));
      if (hit) { el.setAttribute('data-myleaf', 'p' + hit.pid); leaves.push(el); }
    });

    // 2. עולים לכרטיס המוצר המדויק
    const cardMap = new Map();
    leaves.forEach(leaf => {
      const key = leaf.getAttribute('data-myleaf');
      let card = leaf, hops = 0;
      while (card.parentElement && card.parentElement !== document.body && hops < 8) {
        const p = card.parentElement;
        if (p.offsetHeight > 800) break;
        if ([...p.querySelectorAll('[data-myleaf]')].every(x => x.getAttribute('data-myleaf') === key)) {
          card = p;
          hops++;
        } else {
          break;
        }
      }
      cardMap.set(card, { key, leaf });
    });
    currentCardMap = cardMap;
    const cards = [...cardMap.keys()], N = cards.length;

    // 3. אזור רשימת המוצרים
    let region = document.body;
    if (N >= 4) {
      const cnt = new Map(), depth = new Map();
      cards.forEach(cd => {
        const chain = []; for (let x = cd.parentElement; x; x = x.parentElement) chain.push(x);
        chain.forEach((x, i) => { cnt.set(x, (cnt.get(x) || 0) + 1); depth.set(x, chain.length - i); });
      });
      let bd = -1; cnt.forEach((n, x) => { if (n >= N / 2 && depth.get(x) > bd) { bd = depth.get(x); region = x; } });
    }

    // 4. סימון, תגית וכוכב (שימוש חוזר באלמנטים קיימים למניעת ריצוד ואיחור בגלילה)
    $$('.myfam-seen,.myfam-fixed,.myfam-hide,.myfam-fill').forEach(e => {
      if (!cardMap.has(e)) e.classList.remove('myfam-seen', 'myfam-fixed', 'myfam-hide', 'myfam-fill');
    });

    let inList = 0; const stars = [];
    cards.forEach(cd => {
      if (!region.contains(cd)) return;
      inList++;
      const { key, leaf } = cardMap.get(cd);
      const n = c[key]?.count || 0, fx = isFixed(key, c);
      cd.classList.toggle('myfam-fixed', fx);
      cd.classList.toggle('myfam-seen', n > 0 && !fx);
      cd.classList.toggle('myfam-fill', fx ? prefs.fixedFill : (n > 0 && prefs.seenFill));
      const show = filter === 'all' || (filter === 'seen' && n > 0) || (filter === 'fixed' && fx);
      cd.classList.toggle('myfam-hide', !show);
      if (cd === leaf) return;

      cd.classList.add('myfam-card');
      if (getComputedStyle(cd).position === 'static') cd.style.position = 'relative';

      // כפתור כוכב (מופיע רק במעבר עכבר / טאפ, או כשהוא כבר מסומן כקבוע)
      let star = cd.querySelector('.myfam-starbtn');
      if (!star) {
        star = document.createElement('button');
        star.onclick = ev => {
          ev.preventDefault();
          ev.stopPropagation();
          const targetKey = star.dataset.key;
          if (targetKey) {
            const wasFixed = isFixed(targetKey, counts());
            toggleFixed(targetKey);
            const pName = (leaf.textContent || '').trim();
            showToast(
              !wasFixed ? `"${pName}" נוסף לרשימת המוצרים הקבועים שלך ⭐` : `"${pName}" הוסר מרשימת המוצרים הקבועים`,
              !wasFixed ? 'success' : 'info'
            );
          }
        };
        cd.appendChild(star);
      }
      star.dataset.key = key;   // מתעדכן בכל רינדור — כרטיס ממוחזר מקבל את המוצר הנכון
      // הסרת תגיות של מוצר קודם שהיה בכרטיס זה לפני מיחזור
      cd.querySelectorAll('.myfam-tag').forEach(t => { if (t.getAttribute('data-tag-key') !== key) t.remove(); });
      star.className = 'myfam-starbtn' + (fx ? ' on' : '');
      star.innerHTML = fx ? ICONS.starBtnFilled : ICONS.starBtnEmpty;
      star.title = fx ? 'בטל סימון כמוצר קבוע' : 'סמן כמוצר קבוע';
      stars.push({ cd, star });

      // שמירת תמונת המוצר המדויקת (מסנן חותמות כשרות ולוגואים) לטובת הדפסה
      const realImgSrc = findProductImage(cd);
      if (realImgSrc) {
        productImages[key] = realImgSrc;
        const leafText = (leaf.textContent || '').trim();
        if (leafText) productImages[norm(leafText)] = realImgSrc;
      }

      // תגית המוצר: מוצמדת ישירות מעל בלוק המידע של המוצר בתוך הכרטיס (מבנה פלקס טבעי ללא בריחה)
      if (n > 0) {
        let tag = cd.querySelector(`:scope > .myfam-tag[data-tag-key="${key}"]`);
        if (!tag) {
          cd.querySelectorAll('.myfam-tag').forEach(t => t.remove());
          tag = document.createElement('div');
          tag.setAttribute('data-tag-key', key);
          cd.appendChild(tag);   // ילד ישיר של הכרטיס (position:relative) — ממוקם אבסולוטית, לא משפיע על הפריסה
        }
        {
          tag.className = 'myfam-tag' + (fx ? ' fixed' : '');
          tag.innerHTML = fx 
            ? `${ICONS.starFilled} <span>הוזמן ${times(n)}</span>`
            : `<span>הוזמן ${times(n)}</span>`;
        }
      } else {
        cd.querySelector(`.myfam-tag[data-tag-key="${key}"]`)?.remove();
      }

      // תגית השוואת מחיר מול רשתות השיווק - מינימליסטית, אלגנטית ולא מפריעה
      const pName = (leaf.textContent || '').trim();
      const compItem = findMarketComparison(pName, '');
      const myPrice = itemPrices[key] || 0;
      if (compItem && myPrice > 0) {
        const ratio = myPrice / compItem.supermarketPrice;
        if (ratio >= 0.4 && ratio <= 2.2) {
          const diff = compItem.supermarketPrice - myPrice;
          let compTag = cd.querySelector('.myfam-price-comp-tag');
          if (!compTag) {
            compTag = document.createElement('span');
            compTag.className = 'myfam-price-comp-tag';
            // הצמדה ישירה לצד אלמנט המחיר בכרטיס
            const priceEl = [...cd.querySelectorAll('*')].find(el => 
              el.children.length === 0 && el !== leaf && /(?:₪\s*\d|\d+(?:\.\d+)?\s*₪)/.test(el.textContent)
            );
            if (priceEl && priceEl.parentElement && priceEl.parentElement !== cd) {
              priceEl.insertAdjacentElement('afterend', compTag);
            } else {
              cd.appendChild(compTag);
            }
          }
          if (diff >= 0.5) {
            compTag.className = 'myfam-price-comp-tag tag-saving';
            compTag.innerHTML = `⚡ חסכון ₪${diff.toFixed(1)}`;
            compTag.title = `מחיר ברשתות: כ-₪${compItem.supermarketPrice.toFixed(2)} (חיסכון של ₪${diff.toFixed(2)})`;
          } else if (diff <= -0.8) {
            compTag.className = 'myfam-price-comp-tag tag-expensive';
            compTag.innerHTML = `יקר ב-₪${Math.abs(diff).toFixed(1)}`;
            compTag.title = `מחיר ברשתות: כ-₪${compItem.supermarketPrice.toFixed(2)} (יקר ב-₪${Math.abs(diff).toFixed(2)})`;
          } else {
            // הפרש זניח - מסירים כדי לשמור על עיצוב נקי ומינימליסטי
            compTag.remove();
          }
        } else {
          cd.querySelector('.myfam-price-comp-tag')?.remove();
        }
      } else {
        cd.querySelector('.myfam-price-comp-tag')?.remove();
      }
    });

    // ניקוי תגיות וכוכבים שאינם שייכים לכרטיסים פעילים
    $$('.myfam-tag').forEach(t => { if (!region.contains(t) || !t.closest('.myfam-card')) t.remove(); });
    $$('.myfam-starbtn').forEach(s => { if (!region.contains(s) || !s.closest('.myfam-card')) s.remove(); });
    $$('.myfam-price-comp-tag').forEach(t => { if (!region.contains(t) || !t.closest('.myfam-card')) t.remove(); });

    // 5. מדידות ויישור מיקום הכוכב מתחת ללב של הכרטיס
    const sizeOk = r => r.width > 0 && r.width <= 90 && r.height <= 90;
    const cardHeart = new Map(); let toolbarHeart = null;
    hearts.forEach(h => {
      const b = h.closest('button,a,[role="button"]') || h;
      const r = b.getBoundingClientRect(); if (!sizeOk(r)) return;
      const card = b.closest('.myfam-card');
      if (card) { if (!cardHeart.has(card)) cardHeart.set(card, r); }
      else if (!toolbarHeart) toolbarHeart = b;
    });

    const meas = stars.map(s => ({ star: s.star, cr: s.cd.getBoundingClientRect(), hr: cardHeart.get(s.cd) }));
    meas.forEach(({ star, cr, hr }) => {
      if (!hr) return;   // אין לב בכרטיס — נשאר במיקום ברירת המחדל
      star.style.top = Math.round(hr.bottom - cr.top + 4) + 'px';
      star.style.right = Math.max(2, Math.round(cr.right - hr.right + (hr.width - 34) / 2)) + 'px';
    });

    // עדכון כפתורי וסרגל הסינון בתפריט
    const bSeen = $('#myfam-b-seen');
    const bFixed = $('#myfam-b-fixed');
    const filterBar = $('#myfam-active-filter-bar');

    if (bSeen) {
      const isAct = filter === 'seen';
      bSeen.classList.toggle('active-filter', isAct);
      bSeen.classList.toggle('on', isAct);
      bSeen.innerHTML = isAct 
        ? `${ICONS.check} <span>רק מה שהוזמן · פעיל (לחץ לביטול)</span>`
        : `${ICONS.cart} <span>רק מה שהוזמן בעבר</span>`;
    }
    if (bFixed) {
      const isAct = filter === 'fixed';
      bFixed.classList.toggle('active-filter', isAct);
      bFixed.classList.toggle('on', isAct);
      bFixed.innerHTML = isAct 
        ? `${ICONS.check} <span>רק קבועים · פעיל (לחץ לביטול)</span>`
        : `${ICONS.star} <span>רק קבועים</span>`;
    }
    if (filterBar) {
      if (filter === 'seen' || filter === 'fixed') {
        filterBar.style.display = 'flex';
        filterBar.innerHTML = `
          <span>מסנן פעיל: <b>${filter === 'seen' ? 'מוצרים שהוזמנו' : 'מוצרים קבועים'}</b></span>
          <button id="myfam-clear-filter-btn" title="בטל סינון והצג הכל">✕ בטל</button>
        `;
        const clrBtn = $('#myfam-clear-filter-btn', filterBar);
        if (clrBtn) clrBtn.onclick = () => { filter = 'all'; render(); };
      } else {
        filterBar.style.display = 'none';
        filterBar.innerHTML = '';
      }
    }

    const info = $('#myfam-info');
    if (info) {
      info.textContent = (sale.items.size ? `מוצרים בדף: ${inList} · במכירה: ${sale.items.size}` : 'ממתין לנתוני המכירה…')
        ;
    }
    placePanel(toolbarHeart);
    updateBudgetUI();
    updateForgottenUI();
    updateSavingsUI();
    updateSavingsUI();
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  function toggleFixed(key) {
    const c = counts();
    state.fixed[key] = { v: !isFixed(key, c), t: Date.now() };
    save(); render();
  }
  const setStatus = t => { const s = $('#myfam-status'); if (s) s.textContent = t; };

  const API_HOST = 'https://v2.mishnatyosef.org';

  /* קריאה דרך עולם הדף (MAIN world) כגיבוי */
  function pageApiRequest(url, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
      const id = 'req_' + Math.random().toString(36).slice(2);
      let settled = false;

      const onRes = ev => {
        let d;
        try { d = JSON.parse(ev.detail); } catch (e) { return; }
        if (d.id === id) {
          settled = true;
          W.removeEventListener('myfam-call-api-res', onRes);
          if (d.error) return reject(new Error(d.error));
          if (d.status === 401) return reject(new Error('unauthorized'));
          if (d.status >= 400) return reject(new Error('HTTP ' + d.status));
          if (d.json !== null && d.json !== undefined) return resolve(d.json);
          try {
            resolve(JSON.parse(d.text));
          } catch (e) {
            reject(new Error('תשובה לא תקינה מהאתר (לא JSON)'));
          }
        }
      };

      W.addEventListener('myfam-call-api-res', onRes);

      const hdrs = { 'Accept': 'application/json', ...(apiHeaders || {}) };
      if (apiAuthToken) hdrs['Authorization'] = apiAuthToken;

      W.dispatchEvent(new CustomEvent('myfam-call-api', {
        detail: JSON.stringify({ id, url, method, body, auth: apiAuthToken, headers: hdrs })
      }));

      setTimeout(() => {
        if (!settled) {
          W.removeEventListener('myfam-call-api-res', onRes);
          reject(new Error('זמן ההמתנה לתשובת האתר הסתיים (Timeout)'));
        }
      }, 15000);
    });
  }

  /* קריאה חכמה ל-API של משנת יוסף:
     1. עדיפות ראשונה: דרך Background Service Worker (בזכות host_permissions בכרום אין מגבלות CORS או CSP).
     2. עדיפות שנייה (גיבוי): דרך עולם הדף (MAIN world).
  */
  async function siteApiRequest(url, method = 'GET', body = null) {
    const headers = { 'Accept': 'application/json', ...(apiHeaders || {}) };
    if (apiAuthToken) headers['Authorization'] = apiAuthToken;

    // 1. ניסיון ראשי: דרך ה-Background Service Worker
    try {
      if (T && typeof T.request === 'function') {
        const res = await T.request({ url, method, body, headers });
        if (res !== undefined && res !== null) return res;
      }
    } catch (bgErr) {
      if (bgErr && bgErr.message === 'unauthorized') throw bgErr;
      console.warn('[myfam bg request fallback to page]', bgErr);
    }

    // 2. גיבוי: דרך עולם הדף
    return pageApiRequest(url, method, body);
  }

  function showImportProgressModal() {
    $('#myfam-import-modal')?.remove();
    const m = document.createElement('div');
    m.id = 'myfam-import-modal';
    m.innerHTML = `
      <div class="myfam-box myfam-import-box">
        <div style="text-align:center; padding: 6px 0;">
          <div style="margin-bottom:14px;">${ICONS.spinner}</div>
          <h3 style="margin:0 0 8px; font-size:18px; color:#1e293b;">מייבא היסטוריית הזמנות…</h3>
          <p id="myfam-import-status" style="margin:0 0 14px; font-size:14px; color:#64748b;">מתחבר לאתר משנת יוסף…</p>
          <div style="background:#f1f5f9; border-radius:8px; height:8px; overflow:hidden; width:100%; margin-bottom:12px;">
            <div id="myfam-import-bar" style="background:#2e9e5b; height:100%; width:5%; transition:width .25s ease;"></div>
          </div>
          <div id="myfam-import-detail" style="font-size:12px; color:#94a3b8;">הסנכרון מתבצע ישירות מול חשבונך</div>
        </div>
      </div>
    `;
    document.body.appendChild(m);
    return {
      update(percent, statusText, detailText) {
        const bar = $('#myfam-import-bar', m);
        const st = $('#myfam-import-status', m);
        const dt = $('#myfam-import-detail', m);
        if (bar) bar.style.width = Math.max(5, Math.min(100, Math.round(percent))) + '%';
        if (st && statusText) st.textContent = statusText;
        if (dt && detailText) dt.textContent = detailText;
      },
      showSuccess(importedCount, fixedCount, seenCount) {
        // שמירת אישור ייבוא בעוגיות הדפדפן (כדי שאם המשתמש ימחק עוגיות, התוסף יידע שההיסטוריה אופסה)
        setCookieMarker();

        const autoImportPref = localStorage.getItem(LS + 'auto_import_history');
        const showAskAuto = autoImportPref == null; // עדיין לא שאלנו את המשתמש

        m.innerHTML = `
          <div class="myfam-box myfam-import-box" style="text-align:center;">
            <button class="myfam-x" title="סגור">${ICONS.close}</button>
            <div style="margin-bottom:12px;">${ICONS.checkCircle}</div>
            <h3 style="margin:0 0 6px; font-size:20px; color:#1e293b;">ייבוא ההיסטוריה הושלם בהצלחה!</h3>
            <p style="margin:0 0 16px; font-size:14px; color:#64748b;">
              סונכרנו <b>${importedCount}</b> הזמנות קודמות מחשבונך באתר.
            </p>
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:12px 14px; text-align:right; margin-bottom:18px; font-size:13px; line-height:1.7; color:#334155;">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                ${ICONS.starFilled} <span><b>מוצרים קבועים (${fixedCount}):</b> סומנו במסגרת זהב ובתגית "קבוע" (הוזמנו 3 פעמים ומעלה).</span>
              </div>
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                <span style="display:inline-block; width:14px; height:14px; border:2px dashed #ff9800; border-radius:3px; flex-shrink:0;"></span>
                <span><b>הוזמנו בעבר (${seenCount}):</b> סומנו במסגרת כתומה (הוזמנו 1-2 פעמים).</span>
              </div>
              <div style="display:flex; align-items:center; gap:8px; color:#1e6b3e; font-weight:500;">
                ${ICONS.cartPlus} <span><b>טיפ:</b> לחץ על "הוסף את כל הקבועים לסל" כדי להכניס אותם לסל בלחיצה אחת!</span>
              </div>
            </div>

            ${showAskAuto ? `
              <div style="background:#ecfdf5; border:1.5px solid #a7f3d0; border-radius:12px; padding:12px 14px; text-align:right; margin-bottom:16px;">
                <div style="font-size:13.5px; font-weight:700; color:#065f46; margin-bottom:4px;">
                  🔄 האם לסנכרן הזמנות חדשות באופן אוטומטי להבא?
                </div>
                <div style="font-size:12px; color:#047857; line-height:1.4; margin-bottom:10px;">
                  אישור יאפשר לתוסף לעדכן את היסטוריית הקניות שלכם פעם ביום ברקע בלי להטריח אתכם, כך שהמוצרים הקבועים והקניות תמיד יהיו מעודכנים!
                </div>
                <div style="display:flex; gap:8px;">
                  <button id="myfam-btn-auto-yes" style="flex:1; padding:8px 12px; background:#10b981; color:#fff; border:none; border-radius:8px; font-size:12.5px; font-weight:bold; cursor:pointer;">
                    ✓ כן, עדכן אוטומטית תמיד
                  </button>
                  <button id="myfam-btn-auto-no" style="padding:8px 12px; background:#fff; color:#475569; border:1px solid #cbd5e1; border-radius:8px; font-size:12.5px; cursor:pointer;">
                    לא כרגע
                  </button>
                </div>
              </div>
            ` : ''}

            <button id="myfam-import-done-btn" style="width:100%; padding:11px; background:#2e9e5b; color:#fff; border:none; border-radius:8px; font-weight:bold; font-size:14px; cursor:pointer;">
              מעולה, הצג את המוצרים
            </button>
          </div>
        `;
        const close = () => m.remove();
        $('#myfam-import-done-btn', m).onclick = close;
        const xBtn = $('.myfam-x', m);
        if (xBtn) xBtn.onclick = close;
        m.onclick = e => { if (e.target === m || e.target.closest('.myfam-x')) close(); };

        const btnAutoYes = $('#myfam-btn-auto-yes', m);
        if (btnAutoYes) {
          btnAutoYes.onclick = () => {
            localStorage.setItem(LS + 'auto_import_history', 'true');
            syncSaveGoogle({ myfam_auto_import_history: 'true' });
            showToast('הסנכרון האוטומטי הופעל בהצלחה! התוסף יעדכן את היסטוריית הקניות ברקע.', 'success');
            close();
          };
        }
        const btnAutoNo = $('#myfam-btn-auto-no', m);
        if (btnAutoNo) {
          btnAutoNo.onclick = () => {
            localStorage.setItem(LS + 'auto_import_history', 'false');
            syncSaveGoogle({ myfam_auto_import_history: 'false' });
            close();
          };
        }
      },
      showError(msg) {
        m.innerHTML = `
          <div class="myfam-box myfam-import-box" style="text-align:center;">
            <button class="myfam-x" title="סגור">${ICONS.close}</button>
            <div style="margin-bottom:12px; color:#dc2626;">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h3 style="margin:0 0 6px; font-size:18px; color:#1e293b;">שגיאה בייבוא ההיסטוריה</h3>
            <p style="margin:0 0 16px; font-size:13px; color:#64748b;">${esc(msg)}</p>
            <button id="myfam-import-err-btn" style="width:100%; padding:10px; background:#f1f5f9; color:#334155; border:1px solid #cbd5e1; border-radius:8px; font-weight:bold; cursor:pointer;">
              סגור
            </button>
          </div>
        `;
        const close = () => m.remove();
        $('#myfam-import-err-btn', m).onclick = close;
        const xBtn = $('.myfam-x', m);
        if (xBtn) xBtn.onclick = close;
        m.onclick = e => { if (e.target === m || e.target.closest('.myfam-x')) close(); };
      },
      close() { m.remove(); }
    };
  }

  /* ---------- ניהול עוגיית זיהוי סנכרון היסטוריה ---------- */
  const COOKIE_NAME = 'myfam_synced';

  function hasCookieMarker() {
    try {
      return document.cookie.split(';').some(c => c.trim().startsWith(COOKIE_NAME + '='));
    } catch (e) {
      return false;
    }
  }

  function setCookieMarker() {
    try {
      // עוגייה לשנה שלמה באתר mishnatyosef.org
      const oneYear = 365 * 24 * 60 * 60;
      document.cookie = `${COOKIE_NAME}=1; max-age=${oneYear}; path=/; SameSite=Lax`;
    } catch (e) {}
  }

  /* ---------- באנר התראה על חוסר בהיסטוריית הזמנות ---------- */
  function showMissingHistoryBanner() {
    if ($('#myfam-missing-hist-banner')) return;
    const b = document.createElement('div');
    b.id = 'myfam-missing-hist-banner';
    b.innerHTML = `
      <div class="myfam-missing-hist-content">
        <span class="myfam-missing-hist-icon">${ICONS.download}</span>
        <div class="myfam-missing-hist-text">
          <b>עדיין לא סונכרנה היסטוריית הקניות שלך בתוסף</b>
          <span>סנכרן את ההזמנות הקודמות כדי לקבל זיהוי מוצרים קבועים ⭐ והוספה מהירה לסל!</span>
        </div>
        <div class="myfam-missing-hist-btns">
          <button id="myfam-btn-sync-now" class="myfam-btn-primary">ייבא היסטוריה כעת</button>
          <button id="myfam-btn-dismiss-banner" class="myfam-sec-btn">הזכר לי מחר</button>
        </div>
      </div>
    `;
    document.body.appendChild(b);

    const btnSync = $('#myfam-btn-sync-now', b);
    if (btnSync) {
      btnSync.onclick = () => {
        b.remove();
        importHistoryFromSite();
      };
    }
    const btnDismiss = $('#myfam-btn-dismiss-banner', b);
    if (btnDismiss) {
      btnDismiss.onclick = () => {
        b.remove();
        localStorage.setItem(LS + 'hist_reminder_dismissed', Date.now());
      };
    }
  }

  /* בדיקה יומית חכמה האם נדרש סנכרון */
  async function checkDailyHistorySync() {
    const KEY_LAST_CHECK = 'last_hist_check_day';
    const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const lastCheck = localStorage.getItem(LS + KEY_LAST_CHECK);

    // בדיקה פעם ביום בלבד
    if (lastCheck === todayStr) return;
    localStorage.setItem(LS + KEY_LAST_CHECK, todayStr);

    const hasCookie = hasCookieMarker();
    const hasHistoryItems = Array.isArray(state.history) && state.history.some(o => o.items && o.items.length);
    const autoImportPref = localStorage.getItem(LS + 'auto_import_history');

    // מקרה 1: עוגיות הדפדפן נמחקו (או התקנה חדשה) — אין עוגייה ואין היסטוריה
    if (!hasCookie && !hasHistoryItems) {
      // אם המשתמש כבר דחה את הבאנר ב-24 שעות האחרונות
      const dismissed = localStorage.getItem(LS + 'hist_reminder_dismissed');
      if (dismissed && Date.now() - Number(dismissed) < 24 * 60 * 60 * 1000) {
        return;
      }
      if (isProductSelectionPage()) setTimeout(() => { if (isProductSelectionPage()) showMissingHistoryBanner(); }, 2000);
      return;
    }

    // אם יש היסטוריה מקומית אך העוגייה לא קיימת, נשחזר את העוגייה
    if (hasHistoryItems && !hasCookie) {
      setCookieMarker();
    }

    // מקרה 2: המשתמש אישר סנכרון אוטומטי מלא בעבר — נסנכרן שקט ברקע
    if (autoImportPref === 'true') {
      try {
        await importHistorySilent();
      } catch (e) {
        console.warn('[myfam daily auto import]', e);
      }
    }
  }

  /* סנכרון שקט ברקע בלי להטריח את המשתמש */
  async function importHistorySilent() {
    try {
      const data = await siteApiRequest(`${API_HOST}/api/orders?page=1`, 'GET');
      const ordersList = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
      if (!ordersList.length) return;

      let changed = false;
      for (const ord of ordersList.slice(0, 8)) {
        const oid = ord.id;
        if (!oid) continue;
        const oData = await siteApiRequest(`${API_HOST}/api/orders/${oid}`, 'GET');
        const o = oData?.order || ord;
        if (!o) continue;

        const items = (o.items || [])
          .filter(it => !it.del)
          .map(lineFrom)
          .filter(Boolean)
          .map(l => ({ key: l.key, pid: l.pid, name: l.name, qty: l.qty, image: l.image || '', price: l.price || 0 }))
          .sort((a, b) => a.pid - b.pid);

        if (items.length) {
          const id = `sale-${o.saleID}-${o.clientID || 'me'}`;
          const week = o.week || o.sale?.name || o.sale?.week || saleMeta[o.saleID]?.week || `מכירה ${o.saleID}`;
          const date = o.created_at || o.date || new Date().toISOString();
          const existing = state.history.find(x => x.id === id);
          if (!existing || existing.items.length !== items.length) {
            state.history = state.history.filter(x => x.id !== id).concat({
              id, saleId: o.saleID, week, begin: o.sale?.begin || '', date, items
            });
            changed = true;
          }
        }
      }
      if (changed) {
        save();
        render();
        setCookieMarker();
      }
    } catch (e) {}
  }

  async function importHistoryFromSite() {
    setStatus('מייבא היסטוריה…');
    const progress = showImportProgressModal();
    try {
      let importedCount = 0;
      const totalPages = 6;

      for (let page = 1; page <= totalPages; page++) {
        progress.update(
          ((page - 1) / totalPages) * 100,
          `בודק דף הזמנות ${page} מתוך ${totalPages}…`,
          importedCount ? `סונכרנו עד כה ${importedCount} הזמנות` : 'מתחבר למערכת…'
        );

        let data;
        try {
          data = await siteApiRequest(`${API_HOST}/api/orders?page=${page}`, 'GET');
        } catch (e) {
          if (e.message === 'unauthorized') {
            progress.showError('התחברות נדרשת: יש לוודא שאתה מחובר לחשבונך באתר משנת יוסף.');
            setStatus('נדרשת התחברות');
            return;
          }
          throw e;
        }

        const ordersList = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        if (!ordersList.length) break;

        for (let i = 0; i < ordersList.length; i++) {
          const ord = ordersList[i];
          const oid = ord.id;
          if (!oid) continue;

          progress.update(
            (((page - 1) + ((i + 1) / ordersList.length)) / totalPages) * 100,
            `מייבא פרטי הזמנה (${i + 1}/${ordersList.length} בעמוד ${page})…`,
            `סונכרנו ${importedCount} הזמנות`
          );

          try {
            const oData = await siteApiRequest(`${API_HOST}/api/orders/${oid}`, 'GET');
            const o = oData?.order || ord;
            if (!o) continue;

            const items = (o.items || [])
              .filter(it => !it.del)
              .map(lineFrom)
              .filter(Boolean)
              .map(l => ({ key: l.key, pid: l.pid, name: l.name, qty: l.qty, image: l.image || '', price: l.price || 0 }))
              .sort((a, b) => a.pid - b.pid);

            if (items.length) {
              const id = `sale-${o.saleID}-${o.clientID || 'me'}`;
              const week = o.week || o.sale?.name || o.sale?.week || saleMeta[o.saleID]?.week || `מכירה ${o.saleID}`;
              const date = o.created_at || o.date || new Date().toISOString();
              state.history = state.history.filter(x => x.id !== id).concat({
                id, saleId: o.saleID, week, begin: o.sale?.begin || '', date, items
              });
              importedCount++;
            }
          } catch (e) {
            console.warn('[myfam import order]', oid, e);
          }
        }
      }

      save();
      render();

      const c = counts();
      let fixedCount = 0, seenCount = 0;
      Object.keys(c).forEach(k => {
        if (isFixed(k, c)) fixedCount++;
        else if (c[k]?.count > 0) seenCount++;
      });

      progress.update(100, 'הייבוא הושלם!', 'מעדכן את התצוגה…');
      setTimeout(() => {
        progress.showSuccess(importedCount, fixedCount, seenCount);
        setStatus('היסטוריה יובאה ✓');
      }, 400);

    } catch (err) {
      console.error('[myfam import error]', err);
      progress.showError('שגיאה בייבוא ההיסטוריה מהאתר: ' + (err.message || err));
      setStatus('שגיאה בייבוא');
    }
  }

  /* ---------- הוספת כל הקבועים לסל ---------- */
  function findCardAddButton(cd) {
    const buttons = [...cd.querySelectorAll('button, a[role="button"]')].filter(b => 
      !b.classList.contains('myfam-starbtn') && !heartLike(b)
    );
    if (!buttons.length) return null;
    const explicit = buttons.find(b => {
      const txt = (b.textContent || '').trim();
      const aria = b.getAttribute('aria-label') || b.getAttribute('title') || '';
      return /\+|הוסף|add/i.test(txt + aria) || b.querySelector('.material-symbols-rounded, .material-icons')?.textContent.trim() === 'add';
    });
    if (explicit) return explicit;
    return buttons[buttons.length - 1];
  }

  function findCardForKey(key) {
    if (!currentCardMap) return null;
    for (const [card, data] of currentCardMap.entries()) {
      if (data.key === key) return card;
    }
    return null;
  }

  async function addAllFixedToCart() {
    const btnAll = $('#myfam-b-addall');
    const origHtml = btnAll ? btnAll.innerHTML : '';
    const c = counts();
    const cartPids = new Set(live ? [...live.lines.values()].map(l => l.key) : []);
    const candidates = [];

    $$('.myfam-card.myfam-fixed').forEach(cd => {
      const leaf = cd.querySelector('[data-myleaf]');
      if (!leaf) return;
      const key = leaf.getAttribute('data-myleaf');
      if (cartPids.has(key)) return; // כבר קיים בסל

      const btn = findCardAddButton(cd);
      if (btn) {
        candidates.push({ cd, key, btn });
      }
    });

    if (!candidates.length) {
      showToast('כל המוצרים הקבועים במכירה זו כבר נמצאים בסל הקניות שלך!', 'info');
      return;
    }

    if (!await showAppConfirm(`נמצאו ${candidates.length} מוצרים קבועים שעדיין אינם בסל.\nלהוסיף את כולם כעת לסל הקניות?`, 'הוספה מהירה לסל')) {
      return;
    }

    if (btnAll) {
      btnAll.disabled = true;
      btnAll.style.pointerEvents = 'none';
      btnAll.style.opacity = '0.9';
      btnAll.innerHTML = `<span style="display:inline-block;animation:myfam-spin 1s linear infinite;margin-left:6px;">⏳</span> <span>מוסיף 0 מתוך ${candidates.length}...</span>`;
    }

    setStatus(`מוסיף ${candidates.length} פריטים לסל…`);
    let added = 0;
    for (const item of candidates) {
      try {
        item.btn.click();
        added++;
        if (btnAll) {
          btnAll.innerHTML = `<span style="display:inline-block;animation:myfam-spin 1s linear infinite;margin-left:6px;">⏳</span> <span>מוסיף ${added} מתוך ${candidates.length}...</span>`;
        }
        await new Promise(r => setTimeout(r, 220));
      } catch (err) {
        console.warn('[myfam add fixed]', err);
      }
    }
    setStatus(`נוספו ${added} פריטים לסל ✓`);

    if (btnAll) {
      btnAll.style.background = '#059669';
      btnAll.style.color = '#ffffff';
      btnAll.innerHTML = `${ICONS.checkCircle} <span>נוספו ${added} מוצרים לסל! ✓</span>`;
      setTimeout(() => {
        btnAll.disabled = false;
        btnAll.style.pointerEvents = '';
        btnAll.style.opacity = '';
        btnAll.style.background = '';
        btnAll.style.color = '';
        btnAll.innerHTML = origHtml || `${ICONS.cartPlus} <span>הוסף את כל הקבועים לסל</span>`;
      }, 3500);
    }
    showToast(`נוספו ${added} מוצרים קבועים לסל בהצלחה!`, 'success');
  }

  /* ---------- מד תקציב דינמי ומעודד (Budget Tracker) ---------- */
  function getCurrentOrderTotal() {
    if (live && live.currentTotal != null && live.currentTotal > 0) {
      return live.currentTotal;
    }
    let sum = 0;
    if (live && live.lines) {
      for (const l of live.lines.values()) {
        const p = l.price || itemPrices['p' + l.pid] || 0;
        sum += (l.qty || 1) * p;
      }
    }
    if (live && live.offset != null) {
      return Math.max(0, sum + live.offset);
    }
    if (sum > 0) return sum;

    // גיבוי: חילוץ סך ההזמנה מתוך ממשק האתר אם קיים
    try {
      const candidates = [...document.querySelectorAll('header, nav, [class*="cart"], [class*="total"], [id*="total"], [class*="order"]')];
      for (const el of candidates) {
        const txt = (el.textContent || '').trim();
        if (/סה"?כ|לתשלום/i.test(txt) && /₪/.test(txt)) {
          const m = txt.match(/(\d+(?:\.\d{1,2})?)\s*₪|₪\s*(\d+(?:\.\d{1,2})?)/);
          if (m) {
            const val = parseFloat(m[1] || m[2]);
            if (val > 0) return val;
          }
        }
      }
    } catch (e) {}

    return 0;
  }

  function setBudget(target, enabled = true) {
    state.budget = {
      target: Math.max(0, parseFloat(target) || 0),
      enabled: Boolean(enabled && target > 0),
      updatedAt: Date.now()
    };
    save();
    updateBudgetUI();
  }

  function updateBudgetUI() {
    if (checkExcluded()) return;

    const b = state.budget || { target: 0, enabled: false };
    const pill = $('#myfam-budget-pill');
    const gaugeBar = $('#myfam-gauge-bar');
    const gaugeCur = $('#myfam-gauge-cur');
    const gaugeTar = $('#myfam-gauge-tar');
    const editBtn  = $('#myfam-b-edit-budget');

    if (!b.enabled || !b.target || b.target <= 0) {
      if (pill) pill.style.display = 'none';
      if (gaugeBar) {
        gaugeBar.setAttribute('stroke-dashoffset', '176');
        gaugeBar.setAttribute('stroke', '#cbd5e1');
      }
      if (gaugeCur) gaugeCur.textContent = '₪0';
      if (gaugeTar) gaugeTar.textContent = 'הגדר יעד';
      if (editBtn) editBtn.textContent = '+ הגדר';
      return;
    }

    const currentTotal = getCurrentOrderTotal();
    const target = b.target;
    const pct = target > 0 ? (currentTotal / target) * 100 : 0;
    const diff = Math.abs(target - currentTotal);

    let stateClass = 'budget-ok';
    let statusMsg = '';
    let statusIcon = '✓';
    let strokeColor = '#0d9488';

    if (currentTotal > target) {
      stateClass = 'budget-over';
      statusIcon = '💡';
      statusMsg = `חריגה של ₪${Math.round(diff)} מהיעד`;
      strokeColor = '#dc2626';
    } else if (pct >= 80) {
      stateClass = 'budget-warn';
      statusIcon = '⚠️';
      statusMsg = `מתקרב ליעד · נותרו ₪${Math.round(diff)}`;
      strokeColor = '#ea580c';
    } else {
      stateClass = 'budget-ok';
      statusIcon = '✓';
      statusMsg = `בתוך התקציב · נותרו ₪${Math.round(diff)}`;
      strokeColor = '#0d9488';
    }

    // 1. עדכון חוגת התקציב בכרטיס התפריט הראשי
    if (gaugeBar) {
      const offset = Math.max(0, 176 - (176 * Math.min(100, pct) / 100));
      gaugeBar.setAttribute('stroke-dashoffset', String(offset));
      gaugeBar.setAttribute('stroke', strokeColor);
    }
    if (gaugeCur) gaugeCur.textContent = `₪${Math.round(currentTotal)}`;
    if (gaugeTar) gaugeTar.textContent = `מתוך ${Math.round(target)} ₪`;
    if (editBtn) editBtn.textContent = '✏️ עריכה';

    // 2. תגית קומפקטית (Pill) צמודה לכפתור הסל
    if (pill) {
      pill.style.display = 'flex';
      pill.className = `myfam-budget-pill ${stateClass}`;
      pill.title = `${statusMsg} (יעד: ₪${target}) · לחץ לעריכה`;
      pill.innerHTML = `
        <div class="myfam-pill-nums">₪${Math.round(currentTotal)} / ₪${target}</div>
        <div class="myfam-pill-bar">
          <div class="myfam-pill-fill" style="width:${Math.min(100, pct)}%;"></div>
        </div>
      `;
      pill.onclick = e => {
        e.stopPropagation();
        showBudgetModal();
      };
    }
  }

  function showBudgetModal() {
    $('#myfam-budget-modal')?.remove();
    const b = state.budget || { target: 0, enabled: false };

    // חישוב ממוצע הזמנות קודמות כהמלצה חכמה
    let avgAmount = 0;
    try {
      const recentOrders = (state.history || []).slice(-4);
      let totalSum = 0, count = 0;
      recentOrders.forEach(o => {
        let orderSum = 0;
        (o.items || []).forEach(it => {
          const p = it.price || itemPrices[it.key] || 0;
          orderSum += (it.qty || 1) * p;
        });
        if (orderSum > 0) {
          totalSum += orderSum;
          count++;
        }
      });
      if (count > 0) avgAmount = Math.round(totalSum / count);
    } catch (e) {}

    const m = document.createElement('div');
    m.id = 'myfam-budget-modal';
    m.innerHTML = `
      <div class="myfam-budget-modal-box">
        <button class="myfam-x" title="סגור">${ICONS.close}</button>
        
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
          <div style="font-size:24px;">🎯</div>
          <div>
            <h3 style="margin:0;font-size:17px;color:#0f172a;">הגדרת יעד תקציב שבועי</h3>
            <div style="font-size:12px;color:#64748b;">עקוב בקלות אחר סך ההזמנה שלך בזמן אמת</div>
          </div>
        </div>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px;margin-bottom:14px;">
          <label style="display:block;font-size:12.5px;color:#334155;font-weight:600;margin-bottom:8px;">
            סכום התקציב למכירה השבועית:
          </label>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="position:relative;flex:1;">
              <input type="number" id="myfam-input-budget-target" min="0" step="10" placeholder="למשל: 400"
                value="${b.target > 0 ? b.target : ''}"
                style="width:100%;padding:9px 12px 9px 30px;border:1.5px solid #2e9e5b;border-radius:8px;font-size:16px;font-weight:bold;color:#0f172a;box-sizing:border-box;outline:none;">
              <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-weight:bold;color:#64748b;">₪</span>
            </div>
            <button id="myfam-btn-save-budget" class="myfam-btn-primary" style="padding:10px 18px;white-space:nowrap;">
              שמור יעד
            </button>
          </div>

          ${avgAmount > 0 ? `
            <div style="margin-top:10px;font-size:12px;color:#047857;background:#ecfdf5;padding:6px 10px;border-radius:8px;display:flex;align-items:center;justify-content:space-between;">
              <span>💡 ממוצע הקניות האחרונות שלך: <b>₪${avgAmount}</b></span>
              <button id="myfam-btn-use-avg" style="background:#fff;border:1px solid #a7f3d0;color:#065f46;border-radius:6px;padding:2px 8px;font-size:11px;font-weight:bold;cursor:pointer;">
                השתמש בו
              </button>
            </div>
          ` : ''}
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #f1f5f9;padding-top:10px;">
          <button id="myfam-btn-disable-budget" style="background:none;border:none;color:#ef4444;font-size:12px;cursor:pointer;padding:4px;font-weight:500;">
            ללא הגבלת תקציב (הסתר מד)
          </button>
          <button id="myfam-btn-close-budget" class="myfam-sec-btn">
            סגור
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(m);

    const inputTarget = $('#myfam-input-budget-target', m);
    if (inputTarget) inputTarget.focus();

    const saveAndClose = (targetVal, enabled) => {
      setBudget(targetVal, enabled);
      m.remove();
      showToast(enabled ? `יעד התקציב עודכן ל-₪${targetVal} בהצלחה! 🎯` : 'מד התקציב כובה', 'success');
    };

    const btnSave = $('#myfam-btn-save-budget', m);
    if (btnSave) {
      btnSave.onclick = () => {
        const val = parseFloat(inputTarget.value) || 0;
        if (val <= 0) {
          saveAndClose(0, false);
        } else {
          saveAndClose(val, true);
        }
      };
    }

    if (inputTarget) {
      inputTarget.onkeydown = e => {
        if (e.key === 'Enter') {
          btnSave.click();
        } else if (e.key === 'Escape') {
          m.remove();
        }
      };
    }

    const btnUseAvg = $('#myfam-btn-use-avg', m);
    if (btnUseAvg) {
      btnUseAvg.onclick = () => {
        inputTarget.value = avgAmount;
      };
    }

    const btnDisable = $('#myfam-btn-disable-budget', m);
    if (btnDisable) {
      btnDisable.onclick = () => {
        saveAndClose(0, false);
      };
    }

    const btnClose = $('#myfam-btn-close-budget', m);
    if (btnClose) btnClose.onclick = () => m.remove();

    const xBtn = $('.myfam-x', m);
    if (xBtn) xBtn.onclick = () => m.remove();

    m.onclick = e => {
      if (e.target === m || e.target.closest('.myfam-x')) m.remove();
    };
  }

  /* ---------- תזכורת חכמה של "מוצרים קבועים שנשכחו" (Forgotten Fixed Items) ---------- */
  function getForgottenFixedItems() {
    if (!live || !live.lines) return [];
    const c = counts();
    const cartKeys = new Set([...live.lines.values()].map(l => l.key));
    const cartNames = new Set([...live.lines.values()].map(l => norm(l.name)));

    const missing = [];
    for (const [normName, it] of (sale.items || new Map()).entries()) {
      const key = 'p' + it.pid;
      if (isFixed(key, c)) {
        if (!cartKeys.has(key) && !cartNames.has(normName)) {
          let avgQty = 1;
          try {
            let sumQty = 0, ordCount = 0;
            for (const o of state.history) {
              const found = o.items?.find(x => x.key === key || norm(x.name) === normName);
              if (found && found.qty > 0) {
                sumQty += found.qty;
                ordCount++;
              }
            }
            if (ordCount > 0) avgQty = Math.round(sumQty / ordCount) || 1;
          } catch (e) {}

          missing.push({
            key,
            pid: it.pid,
            name: it.name,
            itemSalesId: it.itemSalesId,
            image: it.image || productImages[key] || productImages[normName] || '',
            price: it.price || itemPrices[key] || 0,
            avgQty
          });
        }
      }
    }
    return missing;
  }

  function updateForgottenUI() {
    if (checkExcluded()) return;
    const badge = $('#myfam-forgotten-badge');
    const widget = $('#myfam-forgotten-widget');

    const curSaleId = sale.id || extractSaleIdFromUrl();
    const isDismissed = curSaleId && localStorage.getItem(LS + 'dismiss_forgotten_' + curSaleId) === 'true';

    const onOrderPage = location.pathname.includes('/order/');
    const missing = onOrderPage ? getForgottenFixedItems() : [];

    if (!missing.length || isDismissed) {
      if (badge) badge.style.display = 'none';
      if (widget) {
        widget.style.display = 'none';
        widget.innerHTML = '';
      }
      return;
    }

    // 1. תגית פסיבית ליד כפתור הסל
    if (badge) {
      badge.style.display = 'flex';
      badge.innerHTML = `
        <span class="badge-icon">🔔</span>
        <span class="badge-text">חסרים ${missing.length} קבועים</span>
      `;
      badge.onclick = e => {
        e.stopPropagation();
        showForgottenModal(false);
      };
    }

    // 2. שורת התראה בתפריט הפאנל
    if (widget) {
      widget.style.display = 'block';
      widget.innerHTML = `
        <div class="myfam-forgotten-bar" id="myfam-forgotten-bar-trigger">
          <div class="myfam-forgotten-bar-content">
            <span style="font-size:15px;">🔔</span>
            <span>חסרים <b>${missing.length}</b> מוצרים קבועים בסל</span>
          </div>
          <button class="myfam-forgotten-bar-btn">הצג</button>
        </div>
      `;
      const trig = $('#myfam-forgotten-bar-trigger', widget);
      if (trig) {
        trig.onclick = () => {
          $('#myfam-body')?.classList.add('collapsed');
          showForgottenModal(false);
        };
      }
    }
  }

  function showForgottenModal(isAutoTrigger = false) {
    $('#myfam-forgotten-modal')?.remove();
    const missing = getForgottenFixedItems();
    const curSaleId = sale.id || extractSaleIdFromUrl();

    if (!missing.length) {
      if (!isAutoTrigger) {
        showToast('כל המוצרים הקבועים שלך כבר נמצאים בסל הקניות! 🎉', 'success');
      }
      return;
    }

    const m = document.createElement('div');
    m.id = 'myfam-forgotten-modal';

    const itemsHtml = missing.map(it => `
      <div class="myfam-forgotten-item-row" data-key="${it.key}">
        <div class="myfam-forgotten-item-thumb">
          ${it.image ? `<img src="${esc(it.image)}" alt="${esc(it.name)}">` : `<span class="myfam-no-img">${ICONS.package}</span>`}
        </div>
        <div class="myfam-forgotten-item-details">
          <div class="myfam-forgotten-item-name" title="${esc(it.name)}">${esc(it.name)}</div>
          <div class="myfam-forgotten-item-sub">
            ${it.price > 0 ? `<span class="myfam-price-tag">₪${it.price.toFixed(2)}</span>` : ''}
            <span class="myfam-qty-rec">כמות ממוצעת: <b>${it.avgQty || 1}</b> יח'</span>
          </div>
        </div>
        <div class="myfam-forgotten-item-action">
          <button class="myfam-btn-add-single" data-key="${it.key}" title="הוסף מוצר זה לסל כעת">
            + הוסף לסל
          </button>
        </div>
      </div>
    `).join('');

    m.innerHTML = `
      <div class="myfam-forgotten-box">
        <button class="myfam-x" title="סגור">${ICONS.close}</button>

        <div class="myfam-forgotten-header">
          <div class="myfam-forgotten-icon">🛍️</div>
          <div>
            <h3 class="myfam-forgotten-title">רגע לפני שסוגרים...</h3>
            <div class="myfam-forgotten-subtitle">
              בדקת שלא שכחת מוצרים קבועים? נמצאו <b>${missing.length}</b> מוצרים שטרם הוספת השבוע:
            </div>
          </div>
        </div>

        <div class="myfam-forgotten-list">
          ${itemsHtml}
        </div>

        <div class="myfam-forgotten-footer">
          <button id="myfam-btn-add-all-forgotten" class="myfam-btn-primary" style="flex:1; display:flex; align-items:center; justify-content:center; gap:8px;">
            ${ICONS.cartPlus} <span>הוסף את כולם לסל</span>
          </button>
          <button id="myfam-btn-dismiss-forgotten" class="myfam-sec-btn">
            לא צריך השבוע
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(m);

    // טיפול בהוספת מוצר בודד
    m.querySelectorAll('.myfam-btn-add-single').forEach(btn => {
      btn.onclick = async () => {
        const key = btn.dataset.key;
        const it = missing.find(x => x.key === key);
        if (!it) return;
        const row = btn.closest('.myfam-forgotten-item-row');
        await addSingleForgottenItem(it, row, btn);
      };
    });

    async function addSingleForgottenItem(it, rowEl, btnEl) {
      btnEl.disabled = true;
      btnEl.innerHTML = ICONS.spinner;
      let success = false;

      // 1. חיפוש כרטיס קיים ב-DOM
      const card = findCardForKey(it.key);
      if (card) {
        const b = findCardAddButton(card);
        if (b) {
          b.click();
          success = true;
        }
      }

      // 2. פנייה ישירה ל-API של האתר אם הכרטיס אינו ב-DOM
      if (!success && live?.orderId && it.itemSalesId) {
        try {
          await siteApiRequest(`${API_HOST}/api/add_item/${live.orderId}`, 'POST', JSON.stringify({
            item_salesID: it.itemSalesId,
            amount: it.avgQty || 1
          }));
          success = true;
        } catch (e) {}
      }

      if (success) {
        btnEl.className = 'myfam-btn-added';
        btnEl.innerHTML = '✓ נוסף';
        if (rowEl) rowEl.classList.add('item-added');
        showToast(`"${it.name}" נוסף לסל בהצלחה! 🛒`, 'success');
        updateBudgetUI();
        setTimeout(() => {
          updateForgottenUI();
          if (getForgottenFixedItems().length === 0) {
            setTimeout(() => m.remove(), 700);
          }
        }, 500);
      } else {
        btnEl.disabled = false;
        btnEl.innerHTML = '+ הוסף לסל';
        showToast(`לא הצלחנו להוסיף את "${it.name}" כעת. נסו שוב.`, 'info');
      }
    }

    // הוספת כל המוצרים החסרים
    const btnAddAll = $('#myfam-btn-add-all-forgotten', m);
    if (btnAddAll) {
      btnAddAll.onclick = async () => {
        btnAddAll.disabled = true;
        btnAddAll.innerHTML = `${ICONS.spinner} <span>מוסיף מוצרים לסל…</span>`;

        let addedCount = 0;
        const rows = [...m.querySelectorAll('.myfam-forgotten-item-row')];

        for (let i = 0; i < missing.length; i++) {
          const it = missing[i];
          const rowEl = rows[i];
          const btnEl = rowEl?.querySelector('.myfam-btn-add-single');
          if (btnEl && !btnEl.classList.contains('myfam-btn-added')) {
            btnEl.innerHTML = ICONS.spinner;
            let success = false;

            const card = findCardForKey(it.key);
            if (card) {
              const b = findCardAddButton(card);
              if (b) {
                b.click();
                success = true;
              }
            }

            if (!success && live?.orderId && it.itemSalesId) {
              try {
                await siteApiRequest(`${API_HOST}/api/add_item/${live.orderId}`, 'POST', JSON.stringify({
                  item_salesID: it.itemSalesId,
                  amount: it.avgQty || 1
                }));
                success = true;
              } catch (e) {}
            }

            if (success) {
              addedCount++;
              btnEl.className = 'myfam-btn-added';
              btnEl.innerHTML = '✓ נוסף';
              if (rowEl) rowEl.classList.add('item-added');
            }
            await new Promise(r => setTimeout(r, 220));
          }
        }

        showToast(`נוספו ${addedCount} מוצרים קבועים לסל בהצלחה! 🎉`, 'success');
        if (curSaleId) {
          localStorage.setItem(LS + 'dismiss_forgotten_' + curSaleId, 'true');
        }
        updateBudgetUI();
        updateForgottenUI();
        setTimeout(() => m.remove(), 1000);
      };
    }

    // השתקה למכירה זו
    const btnDismiss = $('#myfam-btn-dismiss-forgotten', m);
    if (btnDismiss) {
      btnDismiss.onclick = () => {
        if (curSaleId) {
          localStorage.setItem(LS + 'dismiss_forgotten_' + curSaleId, 'true');
        }
        m.remove();
        updateForgottenUI();
        showToast('התזכורת הושתקה למכירה זו 👍', 'info');
      };
    }

    const xBtn = $('.myfam-x', m);
    if (xBtn) xBtn.onclick = () => m.remove();

    m.onclick = e => {
      if (e.target === m || e.target.closest('.myfam-x')) m.remove();
    };
  }

  /* ---------- טריגרים אקטיביים מעודנים לתזכורת (Smart Triggers) ---------- */
  let tabBlurTime = 0;
  let autoReminderTriggeredThisSession = false;

  function canTriggerAutoReminder() {
    if (checkExcluded()) return false;
    if (!location.pathname.includes('/order/')) return false;
    if (!live || !live.lines || live.lines.size === 0) return false;
    if (!sale.items || sale.items.size < 5) return false;

    const curSaleId = sale.id || extractSaleIdFromUrl();
    if (!curSaleId) return false;
    if (localStorage.getItem(LS + 'dismiss_forgotten_' + curSaleId) === 'true') return false;
    if (autoReminderTriggeredThisSession) return false;

    // בדיקה שלא פתוח מודאל כלשהו על המסך
    if ($('#myfam-forgotten-modal, #myfam-modal, #myfam-budget-modal, #myfam-import-modal, #myfam-tips-modal')) {
      return false;
    }

    const missing = getForgottenFixedItems();
    if (!missing.length) return false;

    return true;
  }

  function triggerAutoReminder() {
    if (!canTriggerAutoReminder()) return;
    autoReminderTriggeredThisSession = true;
    const curSaleId = sale.id || extractSaleIdFromUrl();
    if (curSaleId) {
      localStorage.setItem(LS + 'dismiss_forgotten_' + curSaleId, 'true');
    }
    showForgottenModal(true);
  }

  // טריגר 1: חזרה לטאב לאחר 60 שניות לפחות
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      tabBlurTime = Date.now();
    } else if (document.visibilityState === 'visible') {
      if (tabBlurTime > 0 && Date.now() - tabBlurTime >= 60000) {
        tabBlurTime = 0;
        setTimeout(triggerAutoReminder, 1200);
      }
    }
  });

  // טריגר 2: Exit Intent (תנועת עכבר מהירה כלפי מעלה מחוץ לחלון)
  let lastClientY = 0;
  document.addEventListener('mousemove', e => {
    lastClientY = e.clientY;
  }, { passive: true });

  document.addEventListener('mouseleave', e => {
    if (e.clientY <= 0 && lastClientY < 60) {
      triggerAutoReminder();
    }
  });


  /* ---------- מחשבון חיסכון והשוואת מחירים מול רשתות השיווק ---------- */
  const MARKET_ANCHOR_ITEMS = [
  {
    "id": "milk_3",
    "name": "חלב תנובה 3% 1 ליטר",
    "aliases": [
      "חלב 3",
      "חלב תנובה 3"
    ],
    "supermarketPrice": 7.11,
    "chains": {
      "osherAd": 6.9,
      "ramiLevy": 7.11,
      "yeshHesed": 7.11
    }
  },
  {
    "id": "milk_1",
    "name": "חלב תנובה 1% 1 ליטר",
    "aliases": [
      "חלב 1",
      "חלב תנובה 1"
    ],
    "supermarketPrice": 6.55,
    "chains": {
      "osherAd": 6.4,
      "ramiLevy": 6.55,
      "yeshHesed": 6.55
    }
  },
  {
    "id": "eggs_l30",
    "name": "ביצים L תבנית 30",
    "aliases": [
      "ביצים l",
      "ביצים גודל l",
      "תבנית 30"
    ],
    "supermarketPrice": 38.0,
    "chains": {
      "osherAd": 36.9,
      "ramiLevy": 37.9,
      "yeshHesed": 38.0
    }
  },
  {
    "id": "eggs_m30",
    "name": "ביצים M תבנית 30",
    "aliases": [
      "ביצים m",
      "ביצים גודל m"
    ],
    "supermarketPrice": 34.5,
    "chains": {
      "osherAd": 33.9,
      "ramiLevy": 34.5,
      "yeshHesed": 34.5
    }
  },
  {
    "id": "eggs_l12",
    "name": "ביצים L מארז 12",
    "aliases": [
      "מארז 12",
      "12 ביצים"
    ],
    "supermarketPrice": 15.2,
    "chains": {
      "osherAd": 14.9,
      "ramiLevy": 15.2,
      "yeshHesed": 15.2
    }
  },
  {
    "id": "cheese_white_5",
    "name": "גבינה לבנה 5% תנובה 250 גרם",
    "aliases": [
      "גבינה לבנה 5",
      "לבנה 5% תנובה"
    ],
    "supermarketPrice": 5.75,
    "chains": {
      "osherAd": 5.5,
      "ramiLevy": 5.75,
      "yeshHesed": 5.75
    }
  },
  {
    "id": "cottage_5",
    "name": "קוטג' תנובה 5% 250 גרם",
    "aliases": [
      "קוטג 5",
      "קוטג' 5"
    ],
    "supermarketPrice": 6.9,
    "chains": {
      "osherAd": 6.8,
      "ramiLevy": 6.9,
      "yeshHesed": 6.9
    }
  },
  {
    "id": "yellow_emek",
    "name": "גבינה צהובה עמק תנובה 400 גרם",
    "aliases": [
      "עמק 28",
      "צהובה עמק",
      "עמק 400"
    ],
    "supermarketPrice": 23.9,
    "chains": {
      "osherAd": 22.9,
      "ramiLevy": 23.9,
      "yeshHesed": 24.5
    }
  },
  {
    "id": "yellow_gilboa",
    "name": "גבינה צהובה גלבוע 200 גרם",
    "aliases": [
      "גלבוע 200",
      "צהובה גלבוע"
    ],
    "supermarketPrice": 13.5,
    "chains": {
      "osherAd": 12.9,
      "ramiLevy": 13.5,
      "yeshHesed": 13.9
    }
  },
  {
    "id": "butter_100",
    "name": "חמאה תנובה 100 גרם",
    "aliases": [
      "חמאה 100",
      "חמאה תנובה"
    ],
    "supermarketPrice": 5.1,
    "chains": {
      "osherAd": 4.9,
      "ramiLevy": 5.1,
      "yeshHesed": 5.1
    }
  },
  {
    "id": "sour_cream",
    "name": "שמנת חמוצה 15% תנובה 200 מ\"ל",
    "aliases": [
      "שמנת חמוצה 15",
      "חמוצה 15"
    ],
    "supermarketPrice": 3.05,
    "chains": {
      "osherAd": 2.9,
      "ramiLevy": 3.05,
      "yeshHesed": 3.05
    }
  },
  {
    "id": "sweet_cream",
    "name": "שמנת מתוקה 38% השף הלבן 250 מ\"ל",
    "aliases": [
      "שמנת מתוקה 38",
      "השף הלבן 38"
    ],
    "supermarketPrice": 8.5,
    "chains": {
      "osherAd": 7.9,
      "ramiLevy": 8.5,
      "yeshHesed": 8.9
    }
  },
  {
    "id": "milky",
    "name": "מילקי שוקולד שטראוס",
    "aliases": [
      "מילקי שוקולד",
      "מילקי"
    ],
    "supermarketPrice": 3.4,
    "chains": {
      "osherAd": 3.2,
      "ramiLevy": 3.4,
      "yeshHesed": 3.5
    }
  },
  {
    "id": "shoko_1l",
    "name": "שוקו תנובה 1 ליטר",
    "aliases": [
      "שוקו 1 ליטר",
      "שוקו תנובה"
    ],
    "supermarketPrice": 11.9,
    "chains": {
      "osherAd": 10.9,
      "ramiLevy": 11.9,
      "yeshHesed": 12.2
    }
  },
  {
    "id": "oil_canola",
    "name": "שמן קנולה מזוכך 1 ליטר",
    "aliases": [
      "שמן קנולה",
      "קנולה 1 ליטר"
    ],
    "supermarketPrice": 9.9,
    "chains": {
      "osherAd": 8.9,
      "ramiLevy": 9.5,
      "yeshHesed": 9.9
    }
  },
  {
    "id": "oil_soy",
    "name": "שמן סויה 1 ליטר",
    "aliases": [
      "שמן סויה",
      "סויה 1 ליטר"
    ],
    "supermarketPrice": 8.9,
    "chains": {
      "osherAd": 7.9,
      "ramiLevy": 8.5,
      "yeshHesed": 8.9
    }
  },
  {
    "id": "oil_olive",
    "name": "שמן זית כתית מעולה 750 מ\"ל",
    "aliases": [
      "שמן זית",
      "כתית מעולה 750"
    ],
    "supermarketPrice": 39.9,
    "chains": {
      "osherAd": 36.9,
      "ramiLevy": 38.9,
      "yeshHesed": 39.9
    }
  },
  {
    "id": "sugar_white",
    "name": "סוכר לבן סוגת 1 ק\"ג",
    "aliases": [
      "סוכר לבן",
      "סוכר 1 קג",
      "סוכר סוגת"
    ],
    "supermarketPrice": 5.2,
    "chains": {
      "osherAd": 4.8,
      "ramiLevy": 4.9,
      "yeshHesed": 5.2
    }
  },
  {
    "id": "flour_white",
    "name": "קמח לבן בהיר 1 ק\"ג",
    "aliases": [
      "קמח לבן",
      "קמח בהיר 1"
    ],
    "supermarketPrice": 4.9,
    "chains": {
      "osherAd": 4.2,
      "ramiLevy": 4.5,
      "yeshHesed": 4.9
    }
  },
  {
    "id": "flour_raising",
    "name": "קמח תופח 1 ק\"ג",
    "aliases": [
      "קמח תופח",
      "תופח 1 קג"
    ],
    "supermarketPrice": 6.9,
    "chains": {
      "osherAd": 5.9,
      "ramiLevy": 6.5,
      "yeshHesed": 6.9
    }
  },
  {
    "id": "salt_fine",
    "name": "מלח שולחן דק 1 ק\"ג",
    "aliases": [
      "מלח שולחן",
      "מלח דק 1"
    ],
    "supermarketPrice": 2.6,
    "chains": {
      "osherAd": 2.3,
      "ramiLevy": 2.5,
      "yeshHesed": 2.6
    }
  },
  {
    "id": "rice_persian",
    "name": "אורז פרסי סוגת 1 ק\"ג",
    "aliases": [
      "אורז פרסי",
      "פרסי סוגת"
    ],
    "supermarketPrice": 10.9,
    "chains": {
      "osherAd": 9.9,
      "ramiLevy": 10.5,
      "yeshHesed": 10.9
    }
  },
  {
    "id": "rice_basmati",
    "name": "אורז בסמטי סוגת 1 ק\"ג",
    "aliases": [
      "אורז בסמטי",
      "בסמטי 1 קג"
    ],
    "supermarketPrice": 14.9,
    "chains": {
      "osherAd": 13.5,
      "ramiLevy": 13.9,
      "yeshHesed": 14.9
    }
  },
  {
    "id": "rice_jasmine",
    "name": "אורז יסמין סוגת 1 ק\"ג",
    "aliases": [
      "אורז יסמין",
      "יסמין 1 קג"
    ],
    "supermarketPrice": 12.9,
    "chains": {
      "osherAd": 11.5,
      "ramiLevy": 12.2,
      "yeshHesed": 12.9
    }
  },
  {
    "id": "pasta_osem_spaghetti",
    "name": "פסטה ספגטי אסם 500 גרם",
    "aliases": [
      "ספגטי אסם",
      "פסטה ספגטי"
    ],
    "supermarketPrice": 6.5,
    "chains": {
      "osherAd": 5.5,
      "ramiLevy": 5.9,
      "yeshHesed": 6.5
    }
  },
  {
    "id": "pasta_osem_penne",
    "name": "פסטה פנה אסם 500 גרם",
    "aliases": [
      "פסטה פנה",
      "פנה אסם",
      "פסטה נוצה"
    ],
    "supermarketPrice": 6.5,
    "chains": {
      "osherAd": 5.5,
      "ramiLevy": 5.9,
      "yeshHesed": 6.5
    }
  },
  {
    "id": "pasta_osem_fusilli",
    "name": "פסטה מסולסלת (בורגי) אסם 500 גרם",
    "aliases": [
      "פסטה בורגי",
      "פסטה מסולסלת",
      "פסטה פוזילי"
    ],
    "supermarketPrice": 6.5,
    "chains": {
      "osherAd": 5.5,
      "ramiLevy": 5.9,
      "yeshHesed": 6.5
    }
  },
  {
    "id": "ptitim_osem",
    "name": "פתיתים אפויים אסם 500 גרם",
    "aliases": [
      "פתיתים אפויים",
      "פתיתים עגולים",
      "פתיתים כוכבים",
      "פתיתים אסם"
    ],
    "supermarketPrice": 6.9,
    "chains": {
      "osherAd": 5.9,
      "ramiLevy": 6.5,
      "yeshHesed": 6.9
    }
  },
  {
    "id": "tuna_fillet_4",
    "name": "טונה בהירה בשמן מארז רביעייה",
    "aliases": [
      "טונה 4",
      "שימורי טונה רביעיה",
      "טונה בשמן רביעיה",
      "מארז טונה"
    ],
    "supermarketPrice": 24.9,
    "chains": {
      "osherAd": 21.9,
      "ramiLevy": 23.9,
      "yeshHesed": 24.9
    }
  },
  {
    "id": "corn_can",
    "name": "גרגרי תירס מתוק שימורים 550 גרם",
    "aliases": [
      "תירס מתוק",
      "שימורי תירס",
      "גרגרי תירס"
    ],
    "supermarketPrice": 6.9,
    "chains": {
      "osherAd": 5.5,
      "ramiLevy": 6.2,
      "yeshHesed": 6.9
    }
  },
  {
    "id": "peas_can",
    "name": "אפונה עדינה שימורים 550 גרם",
    "aliases": [
      "אפונה עדינה",
      "שימורי אפונה"
    ],
    "supermarketPrice": 6.9,
    "chains": {
      "osherAd": 5.5,
      "ramiLevy": 6.2,
      "yeshHesed": 6.9
    }
  },
  {
    "id": "pickles_cucumbers",
    "name": "מלפפונים חמוצים במלח 7-9 שימורים",
    "aliases": [
      "מלפפונים בחומץ",
      "מלפפונים במלח",
      "שימורי מלפפונים",
      "מלפפונים 7-9"
    ],
    "supermarketPrice": 7.5,
    "chains": {
      "osherAd": 6.2,
      "ramiLevy": 6.9,
      "yeshHesed": 7.5
    }
  },
  {
    "id": "olives_green",
    "name": "זיתים ירוקים טבעות שימורים",
    "aliases": [
      "זיתים ירוקים",
      "זיתים טבעות",
      "זיתים מושחלים",
      "זיתים חרוזים"
    ],
    "supermarketPrice": 8.9,
    "chains": {
      "osherAd": 7.5,
      "ramiLevy": 7.9,
      "yeshHesed": 8.9
    }
  },
  {
    "id": "tomato_paste_100",
    "name": "רסק עגבניות 28-30% 100 גרם (שלישייה/יחידה)",
    "aliases": [
      "רסק עגבניות",
      "רסק 100 גרם"
    ],
    "supermarketPrice": 2.2,
    "chains": {
      "osherAd": 1.9,
      "ramiLevy": 2.0,
      "yeshHesed": 2.2
    }
  },
  {
    "id": "ketchup_osem",
    "name": "קטשופ אסם בקבוק לחיץ 750 גרם",
    "aliases": [
      "קטשופ אסם",
      "קטשופ 750"
    ],
    "supermarketPrice": 12.9,
    "chains": {
      "osherAd": 11.5,
      "ramiLevy": 12.2,
      "yeshHesed": 12.9
    }
  },
  {
    "id": "mayo_telma",
    "name": "מיונז אמיתי תלמה 500 גרם",
    "aliases": [
      "מיונז תלמה",
      "מיונז אמיתי"
    ],
    "supermarketPrice": 12.9,
    "chains": {
      "osherAd": 11.2,
      "ramiLevy": 12.0,
      "yeshHesed": 12.9
    }
  },
  {
    "id": "tahini_raw",
    "name": "טחינה גולמית טהורה 1 ק\"ג",
    "aliases": [
      "טחינה גולמית",
      "טחינה 1 קג",
      "טחינה הנסיך",
      "טחינה ירושלים"
    ],
    "supermarketPrice": 23.9,
    "chains": {
      "osherAd": 21.9,
      "ramiLevy": 22.9,
      "yeshHesed": 23.9
    }
  },
  {
    "id": "challah",
    "name": "חלת שבת מהודרת 500 גרם",
    "aliases": [
      "חלת שבת",
      "חלה מהודרת",
      "חלה לשבת"
    ],
    "supermarketPrice": 7.5,
    "chains": {
      "osherAd": 6.9,
      "ramiLevy": 7.2,
      "yeshHesed": 7.5
    }
  },
  {
    "id": "bread_wholewheat",
    "name": "לחם 100% חיטה מלאה פרוס (דגנית עין בר/ברמן/אנגל)",
    "aliases": [
      "חיטה מלאה",
      "דגנית עין בר",
      "לחם מלא",
      "מחיטה מלאה"
    ],
    "supermarketPrice": 12.90,
    "chains": {
      "osherAd": 11.90,
      "ramiLevy": 12.50,
      "yeshHesed": 12.90
    }
  },
  {
    "id": "bread_sliced",
    "name": "לחם אחיד כהה פרוס 750 גרם",
    "aliases": [
      "לחם אחיד",
      "אחיד פרוס",
      "אחיד כהה"
    ],
    "supermarketPrice": 7.91,
    "chains": {
      "osherAd": 7.91,
      "ramiLevy": 7.91,
      "yeshHesed": 7.91
    }
  },
  {
    "id": "cornflakes_telma",
    "name": "קורנפלקס תלמה אלופים 750 גרם",
    "aliases": [
      "קורנפלקס תלמה",
      "קורנפלקס של אלופים"
    ],
    "supermarketPrice": 19.9,
    "chains": {
      "osherAd": 18.5,
      "ramiLevy": 19.5,
      "yeshHesed": 19.9
    }
  },
  {
    "id": "kariot_telma",
    "name": "כריות שוקולד תלמה 750 גרם",
    "aliases": [
      "כריות תלמה",
      "כריות נוגט",
      "כריות שוקולד"
    ],
    "supermarketPrice": 26.9,
    "chains": {
      "osherAd": 24.9,
      "ramiLevy": 25.9,
      "yeshHesed": 26.9
    }
  },
  {
    "id": "petiber_osem",
    "name": "ביסקוויט פטיבר אסם 500 גרם",
    "aliases": [
      "פטי בר",
      "פטיבר אסם"
    ],
    "supermarketPrice": 13.9,
    "chains": {
      "osherAd": 12.5,
      "ramiLevy": 13.2,
      "yeshHesed": 13.9
    }
  },
  {
    "id": "bamba_osem",
    "name": "במבה אסם 80 גרם",
    "aliases": [
      "במבה אסם",
      "במבה 80"
    ],
    "supermarketPrice": 4.9,
    "chains": {
      "osherAd": 4.2,
      "ramiLevy": 4.5,
      "yeshHesed": 4.9
    }
  },
  {
    "id": "bisli_osem",
    "name": "ביסלי אסם 70 גרם (גריל/ברביקיו/בצל)",
    "aliases": [
      "ביסלי גריל",
      "ביסלי ברביקיו",
      "ביסלי בצל",
      "ביסלי אסם"
    ],
    "supermarketPrice": 4.9,
    "chains": {
      "osherAd": 4.2,
      "ramiLevy": 4.5,
      "yeshHesed": 4.9
    }
  },
  {
    "id": "shahar_hashahar",
    "name": "ממרח שוקולד השחר העולה 450 גרם",
    "aliases": [
      "השחר העולה",
      "ממרח השחר"
    ],
    "supermarketPrice": 13.5,
    "chains": {
      "osherAd": 12.5,
      "ramiLevy": 12.9,
      "yeshHesed": 13.5
    }
  },
  {
    "id": "coca_cola_6",
    "name": "קוקה קולה 1.5 ליטר מארז שישייה",
    "aliases": [
      "קוקה קולה שישיה",
      "קולה שישיה",
      "קוקה קולה 1.5"
    ],
    "supermarketPrice": 44.9,
    "chains": {
      "osherAd": 41.9,
      "ramiLevy": 43.9,
      "yeshHesed": 44.9
    }
  },
  {
    "id": "coca_zero_6",
    "name": "קוקה קולה זירו 1.5 ליטר מארז שישייה",
    "aliases": [
      "קולה זירו שישיה",
      "זירו שישיה",
      "קוקה קולה זירו"
    ],
    "supermarketPrice": 44.9,
    "chains": {
      "osherAd": 41.9,
      "ramiLevy": 43.9,
      "yeshHesed": 44.9
    }
  },
  {
    "id": "mineral_water_6",
    "name": "מים מינרליים 1.5 ליטר מארז שישייה",
    "aliases": [
      "מים מינרליים שישיה",
      "שישיית מים",
      "עין גדי שישיה"
    ],
    "supermarketPrice": 14.5,
    "chains": {
      "osherAd": 13.5,
      "ramiLevy": 13.9,
      "yeshHesed": 14.5
    }
  },
  {
    "id": "grape_juice",
    "name": "מיץ ענבים תירוש כרמל 1 ליטר",
    "aliases": [
      "תירוש כרמל",
      "מיץ ענבים תירוש"
    ],
    "supermarketPrice": 18.9,
    "chains": {
      "osherAd": 17.5,
      "ramiLevy": 18.2,
      "yeshHesed": 18.9
    }
  },
  {
    "id": "coffee_elite",
    "name": "קפה נמס עלית פחית 200 גרם",
    "aliases": [
      "קפה נמס עלית",
      "נמס עלית 200"
    ],
    "supermarketPrice": 21.9,
    "chains": {
      "osherAd": 19.9,
      "ramiLevy": 20.9,
      "yeshHesed": 21.9
    }
  },
  {
    "id": "tasters_choice",
    "name": "קפה מגורען טסטרס צ'ויס 200 גרם",
    "aliases": [
      "טסטרס צויס",
      "טסטרס צ'ויס"
    ],
    "supermarketPrice": 34.9,
    "chains": {
      "osherAd": 32.9,
      "ramiLevy": 33.9,
      "yeshHesed": 34.9
    }
  },
  {
    "id": "tea_wissotzky",
    "name": "תה ויסוצקי קלאסי 100 שקיקים",
    "aliases": [
      "ויסוצקי קלאסי",
      "תה ויסוצקי 100"
    ],
    "supermarketPrice": 19.9,
    "chains": {
      "osherAd": 18.5,
      "ramiLevy": 19.2,
      "yeshHesed": 19.9
    }
  },
  {
    "id": "fairy_dish",
    "name": "נוזל כלים פיירי 650 מ\"ל",
    "aliases": [
      "פיירי",
      "נוזל כלים פיירי"
    ],
    "supermarketPrice": 12.9,
    "chains": {
      "osherAd": 11.5,
      "ramiLevy": 12.2,
      "yeshHesed": 12.9
    }
  },
  {
    "id": "persil_gel",
    "name": "ג'ל כביסה פרסיל / אריאל 2.5 ליטר",
    "aliases": [
      "ג'ל כביסה",
      "גל כביסה",
      "פרסיל כביסה",
      "אריאל ג'ל"
    ],
    "supermarketPrice": 36.9,
    "chains": {
      "osherAd": 33.9,
      "ramiLevy": 35.9,
      "yeshHesed": 36.9
    }
  },
  {
    "id": "badin_softener",
    "name": "מרכך כביסה מרוכז בדין 1 ליטר",
    "aliases": [
      "מרכך בדין",
      "בדין מרוכז"
    ],
    "supermarketPrice": 16.9,
    "chains": {
      "osherAd": 14.9,
      "ramiLevy": 15.9,
      "yeshHesed": 16.9
    }
  },
  {
    "id": "sano_bleach",
    "name": "אקונומיקה סנו ג'ל 750 מ\"ל",
    "aliases": [
      "אקונומיקה סנו",
      "סנו ג'ל"
    ],
    "supermarketPrice": 11.5,
    "chains": {
      "osherAd": 10.5,
      "ramiLevy": 10.9,
      "yeshHesed": 11.5
    }
  },
  {
    "id": "toilet_paper_30",
    "name": "נייר טואלט דו-שכבתי 30 גלילים",
    "aliases": [
      "נייר טואלט 30",
      "לילי 30",
      "מולט 30"
    ],
    "supermarketPrice": 34.9,
    "chains": {
      "osherAd": 31.9,
      "ramiLevy": 33.5,
      "yeshHesed": 34.9
    }
  },
  {
    "id": "garbage_bags",
    "name": "שקיות אשפה עם שרוך מארז 50-60 יח'",
    "aliases": [
      "שקיות אשפה שרוך",
      "שקיות לפח"
    ],
    "supermarketPrice": 19.9,
    "chains": {
      "osherAd": 17.9,
      "ramiLevy": 18.9,
      "yeshHesed": 19.9
    }
  },
  {
    "id": "colgate_total",
    "name": "משחת שיניים קולגייט טוטאל 100 מ\"ל",
    "aliases": [
      "קולגייט טוטאל",
      "משחת שיניים קולגייט"
    ],
    "supermarketPrice": 14.9,
    "chains": {
      "osherAd": 12.9,
      "ramiLevy": 13.9,
      "yeshHesed": 14.9
    }
  },
  {
    "id": "hand_soap_1l",
    "name": "אל סבון נוזלי לידיים מילוי 1 ליטר",
    "aliases": [
      "סבון נוזלי 1 ליטר",
      "אל סבון מילוי",
      "סבון ידיים 1"
    ],
    "supermarketPrice": 9.9,
    "chains": {
      "osherAd": 8.5,
      "ramiLevy": 9.2,
      "yeshHesed": 9.9
    }
  },
  {
    "id": "shampoo_havai",
    "name": "שמפו / מרכך פינוק או הוואי 700 מ\"ל",
    "aliases": [
      "שמפו פינוק",
      "שמפו הואי",
      "מרכך פינוק",
      "פינוק 700"
    ],
    "supermarketPrice": 11.9,
    "chains": {
      "osherAd": 10.5,
      "ramiLevy": 11.2,
      "yeshHesed": 11.9
    }
  },
  {
    "id": "peas_frozen_sunfrost",
    "name": "אפונה עדינה סנפרוסט 800 גרם",
    "aliases": [
      "אפונה סנפרוסט",
      "סנפרוסט אפונה"
    ],
    "supermarketPrice": 17.9,
    "chains": {
      "osherAd": 15.9,
      "ramiLevy": 16.9,
      "yeshHesed": 17.9
    }
  },
  {
    "id": "green_beans_sunfrost",
    "name": "שעועית ירוקה עדינה סנפרוסט 800 גרם",
    "aliases": [
      "שעועית ירוקה סנפרוסט",
      "סנפרוסט שעועית"
    ],
    "supermarketPrice": 17.9,
    "chains": {
      "osherAd": 15.9,
      "ramiLevy": 16.9,
      "yeshHesed": 17.9
    }
  },
  {
    "id": "fries_frozen",
    "name": "צ'יפס אמריקאי קפוא 1.5-2 ק\"ג",
    "aliases": [
      "ציפס קפוא",
      "צ'יפס אמריקאי",
      "תפודים ציפס"
    ],
    "supermarketPrice": 21.9,
    "chains": {
      "osherAd": 18.9,
      "ramiLevy": 20.5,
      "yeshHesed": 21.9
    }
  },
  {
    "id": "bourekas_potato",
    "name": "בורקס תפוחי אדמה מעדנות 800 גרם",
    "aliases": [
      "בורקס תפוחי אדמה",
      "בורקס מעדנות"
    ],
    "supermarketPrice": 19.9,
    "chains": {
      "osherAd": 17.9,
      "ramiLevy": 18.9,
      "yeshHesed": 19.9
    }
  },
  {
    "id": "malawach",
    "name": "מלוואח מעדנות 700 גרם",
    "aliases": [
      "מלוואח מעדנות",
      "מלוח מעדנות"
    ],
    "supermarketPrice": 16.9,
    "chains": {
      "osherAd": 14.9,
      "ramiLevy": 15.9,
      "yeshHesed": 16.9
    }
  },
  {
    "id": "schnitzel_corn",
    "name": "שניצל תירס טבעול 750 גרם",
    "aliases": [
      "שניצל תירס",
      "טבעול תירס"
    ],
    "supermarketPrice": 29.9,
    "chains": {
      "osherAd": 26.9,
      "ramiLevy": 28.5,
      "yeshHesed": 29.9
    }
  },
  {
    "id": "chicken_breast_fresh",
    "name": "חזה עוף טרי מוכשר 1 ק\"ג",
    "aliases": [
      "חזה עוף טרי",
      "חזה עוף נקי"
    ],
    "supermarketPrice": 39.9,
    "chains": {
      "osherAd": 36.9,
      "ramiLevy": 37.9,
      "yeshHesed": 39.9
    }
  },
  {
    "id": "ground_beef_frozen",
    "name": "בשר טחון קפוא חלק 500 גרם",
    "aliases": [
      "בשר בקר טחון",
      "בקר טחון קפוא",
      "טחון חלק"
    ],
    "supermarketPrice": 22.9,
    "chains": {
      "osherAd": 19.9,
      "ramiLevy": 21.9,
      "yeshHesed": 22.9
    }
  },
  {
    "id": "salmon_fillet_frozen",
    "name": "פילה סלמון קפוא בוואקום 1 ק\"ג",
    "aliases": [
      "פילה סלמון",
      "סלמון קפוא"
    ],
    "supermarketPrice": 64.9,
    "chains": {
      "osherAd": 59.9,
      "ramiLevy": 62.9,
      "yeshHesed": 64.9
    }
  }
];

  let dynamicMarketItems = MARKET_ANCHOR_ITEMS;

  async function fetchRemoteMarketPrices() {
    try {
      const cached = localStorage.getItem('myfam_market_prices');
      const cachedTime = localStorage.getItem('myfam_market_prices_time');
      const now = Date.now();
      if (cached && cachedTime && (now - Number(cachedTime) < 24 * 3600 * 1000)) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          dynamicMarketItems = parsed;
          return;
        }
      }
      // Fetch fresh comparison prices: Primary from GitHub raw, jsDelivr CDN (friendly with filters/NetFree), fallback to website
      const primaryUrl = 'https://raw.githubusercontent.com/Lev-Good/mishnat-yosef-prices/main/prices.json';
      const cdnUrl = 'https://cdn.jsdelivr.net/gh/Lev-Good/mishnat-yosef-prices@main/prices.json';
      const fallbackUrl = 'https://digital.levtov.uk/mishnat/prices.json';
      
      let data = null;
      for (const url of [primaryUrl, cdnUrl, fallbackUrl]) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);
          const res = await fetch(url, { signal: controller.signal, cache: 'no-cache' }).catch(() => null);
          clearTimeout(timeoutId);
          if (res && res.ok) {
            const j = await res.json().catch(() => null);
            if (Array.isArray(j) && j.length > 0) {
              data = j;
              break;
            }
          }
        } catch (_) {}
      }

      if (data) {
        dynamicMarketItems = data;
        localStorage.setItem('myfam_market_prices', JSON.stringify(data));
        localStorage.setItem('myfam_market_prices_time', String(now));
        updateSavingsUI();
      }
    } catch (_) {
      // Fallback silently to bundled MARKET_ANCHOR_ITEMS
    }
  }

  function findMarketComparison(itemName, barcode = '') {
    if (!itemName) return null;
    const n = norm(itemName);
    for (const item of (dynamicMarketItems || MARKET_ANCHOR_ITEMS)) {
      if (item.aliases.some(alias => n.includes(alias))) {
        return item;
      }
    }
    return null;
  }

  function getCartSavingsStats() {
    if (!live || !live.lines) return null;
    const lines = [...live.lines.values()];
    if (!lines.length) return null;

    let matchedCount = 0;
    let totalMyCost = 0;
    let totalMarketCost = 0;
    let totalSavings = 0;
    const matchedItems = [];

    for (const l of lines) {
      const myUnitPrice = l.price || itemPrices['p' + l.pid] || 0;
      if (myUnitPrice <= 0) continue;

      const match = findMarketComparison(l.name, '');
      if (!match) continue;

      const marketUnitPrice = match.supermarketPrice;
      const ratio = myUnitPrice / marketUnitPrice;
      // מסנן יחס קיצוני למניעת חוסר התאמה בגודל מארז
      if (ratio < 0.4 || ratio > 2.2) continue;

      const qty = l.qty || 1;
      const myItemTotal = myUnitPrice * qty;
      const marketItemTotal = marketUnitPrice * qty;
      const itemSavings = marketItemTotal - myItemTotal;

      matchedCount++;
      totalMyCost += myItemTotal;
      totalMarketCost += marketItemTotal;
      totalSavings += itemSavings;

      matchedItems.push({
        line: l,
        name: l.name,
        image: l.image,
        qty,
        myUnitPrice,
        marketUnitPrice,
        myItemTotal,
        marketItemTotal,
        itemSavings,
        savingsPct: marketItemTotal > 0 ? (itemSavings / marketItemTotal) * 100 : 0,
        chains: match.chains || {}
      });
    }

    const coveragePct = lines.length > 0 ? (matchedCount / lines.length) * 100 : 0;
    const isReliable = matchedCount >= 3;

    return {
      matchedCount,
      totalLines: lines.length,
      coveragePct,
      isReliable,
      totalMyCost,
      totalMarketCost,
      totalSavings,
      savingsPct: totalMarketCost > 0 ? (totalSavings / totalMarketCost) * 100 : 0,
      items: matchedItems.sort((a, b) => b.itemSavings - a.itemSavings)
    };
  }

  function updateSavingsUI() {
    if (checkExcluded()) return;
    const pill = $('#myfam-savings-pill');
    const savVal = $('#myfam-sav-val');
    const savDetail = $('#myfam-sav-detail');

    const stats = getCartSavingsStats();
    if (!stats || !stats.items || !stats.items.length) {
      if (pill) pill.style.display = 'none';
      if (savVal) {
        savVal.textContent = '₪0.0';
        savVal.style.color = '#059669';
      }
      if (savDetail) savDetail.textContent = 'בסל הנוכחי';
      return;
    }

    // עדכון כרטיס החיסכון בתפריט
    if (savVal) {
      savVal.textContent = stats.totalSavings < 0 ? `-₪${Math.abs(stats.totalSavings).toFixed(1)}` : `₪${stats.totalSavings.toFixed(1)}`;
      savVal.style.color = stats.totalSavings < 0 ? '#dc2626' : '#059669';
    }
    if (savDetail) {
      if (stats.totalSavings >= 0) {
        savDetail.textContent = `(${Math.round(stats.savingsPct)}% חיסכון) (${stats.matchedCount} מוצרים)`;
      } else {
        savDetail.textContent = `(יקר יותר מהרשתות) (${stats.matchedCount} מוצרים)`;
      }
    }

    // תגית חיסכון צפה ליד כפתור הסל
    if (stats.isReliable && stats.totalSavings > 0) {
      if (pill) {
        pill.style.display = 'flex';
        pill.innerHTML = `
          <span style="font-size:14px;">💰</span>
          <span>חיסכון: <b>₪${Math.round(stats.totalSavings)}</b></span>
        `;
        pill.title = `חיסכון משוער של ₪${stats.totalSavings.toFixed(2)} (${Math.round(stats.savingsPct)}%) מול רשתות השיווק ב-${stats.matchedCount} מוצרים בסל. לחץ לצפייה בדוח!`;
        pill.onclick = e => {
          e.stopPropagation();
          showSavingsModal();
        };
      }
    } else {
      if (pill) pill.style.display = 'none';
    }
  }

  function showSavingsModal() {
    $('#myfam-savings-modal')?.remove();
    const stats = getCartSavingsStats();

    if (!stats || !stats.items.length) {
      showAppAlert('טרם אותרו מוצרים בסל הנוכחי הניתנים להשוואה מול רשתות השיווק.\n(ההשוואה מתבצעת על מוצרי מזווה, חלב, יסוד, שימורים וניקיון עם מחיר מאומת).', 'השוואת מחירים וחיסכון');
      return;
    }

    const m = document.createElement('div');
    m.id = 'myfam-savings-modal';

    const rowsHtml = stats.items.map(it => {
      const chainsText = Object.entries(it.chains)
        .map(([cName, cPrice]) => {
          const heName = cName === 'osherAd' ? 'אושר עד' : cName === 'ramiLevy' ? 'רמי לוי' : 'יש חסד';
          return `<span class="myfam-chain-pill">${heName}: ₪${Number(cPrice).toFixed(2)}</span>`;
        }).join('');

      return `
        <tr>
          <td style="width:36px; text-align:center;">
            ${it.image ? `<img src="${esc(it.image)}" style="width:32px;height:32px;object-fit:contain;border-radius:6px;border:1px solid #e2e8f0;">` : `<span style="color:#94a3b8;">${ICONS.package}</span>`}
          </td>
          <td>
            <div style="font-weight:700; color:#1e293b;">${esc(it.name)}</div>
            ${chainsText ? `<div class="myfam-chain-pills">${chainsText}</div>` : ''}
          </td>
          <td style="text-align:center; font-weight:700;">${it.qty} יח'</td>
          <td style="text-align:left;">
            <div><b>₪${it.myItemTotal.toFixed(2)}</b></div>
            <div style="font-size:11px; color:#64748b;">(₪${it.myUnitPrice.toFixed(2)} ליח')</div>
          </td>
          <td style="text-align:left;">
            <div><b>₪${it.marketItemTotal.toFixed(2)}</b></div>
            <div style="font-size:11px; color:#64748b;">(₪${it.marketUnitPrice.toFixed(2)} ליח')</div>
          </td>
          <td style="text-align:left;">
            <div class="myfam-td-saving" style="${it.itemSavings < 0 ? 'color:#dc2626;font-weight:bold;' : it.itemSavings > 0 ? 'color:#059669;font-weight:bold;' : 'color:#64748b;font-weight:bold;'}">
              ${it.itemSavings < 0 ? `-₪${Math.abs(it.itemSavings).toFixed(2)}` : it.itemSavings > 0 ? `+₪${it.itemSavings.toFixed(2)}` : `₪0.00`}
            </div>
            <div style="font-size:11px; ${it.itemSavings < 0 ? 'color:#dc2626;' : it.itemSavings > 0 ? 'color:#059669;' : 'color:#64748b;'}">
              ${it.itemSavings < 0 ? `(יקר ב-${Math.round(Math.abs(it.savingsPct))}%)` : it.itemSavings > 0 ? `(${Math.round(it.savingsPct)}% חיסכון)` : `(מחיר זהה)`}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    m.innerHTML = `
      <div class="myfam-savings-box">
        <button class="myfam-x" title="סגור">${ICONS.close}</button>

        <div class="myfam-savings-header">
          <div class="myfam-savings-h-title">
            <div class="myfam-savings-h-icon">💰</div>
            <div class="myfam-savings-h-text">
              <h3>מחשבון חיסכון והשוואת מחירים</h3>
              <div>השוואת סל הקניות הנוכחי מול רשתות השיווק המובילות</div>
            </div>
          </div>
          <button id="myfam-btn-print-savings" class="myfam-sec-btn" style="display:flex;align-items:center;gap:6px;">
            ${ICONS.print} <span>הדפס דוח השוואה</span>
          </button>
        </div>

        <div class="myfam-savings-banner">
          <div class="myfam-savings-card">
            <div class="myfam-savings-card-val c-dark">₪${stats.totalMyCost.toFixed(2)}</div>
            <div class="myfam-savings-card-lbl">סך המוצרים שנבדקו במשנת יוסף</div>
          </div>
          <div class="myfam-savings-card">
            <div class="myfam-savings-card-val c-dark">₪${stats.totalMarketCost.toFixed(2)}</div>
            <div class="myfam-savings-card-lbl">סך אותם מוצרים ברשתות השיווק</div>
          </div>
          <div class="myfam-savings-card card-highlight">
            <div class="myfam-savings-card-val c-green">₪${stats.totalSavings.toFixed(2)}</div>
            <div class="myfam-savings-card-lbl"><b>חיסכון משוער (${Math.round(stats.savingsPct)}%)</b></div>
          </div>
        </div>

        <div class="myfam-savings-disclaimer">
          ℹ️ ההשוואה התאפשרה ב-<b>${stats.matchedCount}</b> מתוך <b>${stats.totalLines}</b> מוצרים בסל, מול חציון רשתות השיווק המובילות (אושר עד, רמי לוי, יש חסד). ירקות, פירות, מוצרים שקילים ומוצרים ייחודיים אינם נכללים בהשוואה.
        </div>

        <div class="myfam-savings-table-wrap">
          <table class="myfam-savings-table">
            <thead>
              <tr>
                <th style="width:36px;"></th>
                <th>שם המוצר ומחירי רשתות</th>
                <th style="width:70px; text-align:center;">כמות</th>
                <th style="width:110px; text-align:left;">משנת יוסף</th>
                <th style="width:110px; text-align:left;">ממוצע ברשתות</th>
                <th style="width:110px; text-align:left;">הפרש חיסכון</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #e2e8f0; padding-top:10px;">
          <div style="font-size:11.5px; color:#64748b;">
            פותח ע"י <b>לב טוב דיגיטל</b> · למידע נוסף: <a href="https://digital.levtov.uk/" target="_blank" style="color:#2e9e5b; text-decoration:none;">digital.levtov.uk</a>
          </div>
          <button id="myfam-btn-close-savings" class="myfam-sec-btn">סגור</button>
        </div>
      </div>
    `;

    document.body.appendChild(m);

    const btnPrint = $('#myfam-btn-print-savings', m);
    if (btnPrint) {
      btnPrint.onclick = () => printSavingsReport(stats);
    }

    const btnClose = $('#myfam-btn-close-savings', m);
    if (btnClose) btnClose.onclick = () => m.remove();

    const xBtn = $('.myfam-x', m);
    if (xBtn) xBtn.onclick = () => m.remove();

    m.onclick = e => {
      if (e.target === m || e.target.closest('.myfam-x')) m.remove();
    };
  }

  function printSavingsReport(stats) {
    if (!stats || !stats.items.length) return;
    const w = window.open('', '_blank');
    if (!w) { showAppAlert('נא לאשר פתיחת חלונות קופצים (Popups) כדי להדפיס את הרשימה.', 'הדפסת רשימה'); return; }

    const nowStr = new Date().toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' });
    const rowsHtml = stats.items.map((it, idx) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td><b>${esc(it.name)}</b></td>
        <td style="text-align:center;">${it.qty}</td>
        <td style="text-align:left;">₪${it.myItemTotal.toFixed(2)} <small>(₪${it.myUnitPrice.toFixed(2)})</small></td>
        <td style="text-align:left;">₪${it.marketItemTotal.toFixed(2)} <small>(₪${it.marketUnitPrice.toFixed(2)})</small></td>
        <td style="text-align:left; ${it.itemSavings < 0 ? 'color:#dc2626;' : it.itemSavings > 0 ? 'color:#065f46;' : 'color:#64748b;'} font-weight:bold;">
          ${it.itemSavings < 0 ? `-₪${Math.abs(it.itemSavings).toFixed(2)} (יקר ב-${Math.round(Math.abs(it.savingsPct))}%)` : it.itemSavings > 0 ? `+₪${it.itemSavings.toFixed(2)} (${Math.round(it.savingsPct)}%)` : '₪0.00'}
        </td>
      </tr>
    `).join('');

    w.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <title>דוח השוואת מחירים וחיסכון - ${APP_NAME}</title>
  <style>
    body{font-family:system-ui,-apple-system,sans-serif;margin:24px;color:#1e293b;direction:rtl}
    h2{margin:0 0 4px;color:#065f46}
    .meta{color:#64748b;font-size:12.5px;margin-bottom:16px}
    .banner{display:flex;gap:14px;margin-bottom:16px}
    .card{background:#f8fafc;border:1px solid #cbd5e1;padding:10px 16px;border-radius:10px;text-align:center}
    .card-high{background:#ecfdf5;border-color:#10b981}
    .val{font-size:20px;font-weight:bold}
    .val.green{color:#059669}
    .lbl{font-size:11.5px;color:#64748b;margin-top:2px}
    table{width:100%;border-collapse:collapse;margin-top:12px;font-size:13px}
    th,td{border:1px solid #cbd5e1;padding:8px 10px}
    th{background:#f1f5f9;font-weight:bold;color:#475569}
    tr:nth-child(even){background:#fafafa}
    .footer{margin-top:20px;padding-top:10px;border-top:1px solid #cbd5e1;font-size:11.5px;color:#94a3b8;display:flex;justify-content:space-between}
    @media print{button{display:none}}
  </style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
    <div>
      <h2>דוח חיסכון והשוואת מחירים מול רשתות השיווק</h2>
      <div class="meta">הופק בתאריך: ${nowStr} | השוואה של ${stats.matchedCount} מוצרים בסל</div>
    </div>
    <button id="printReportBtn" style="padding:8px 16px;background:#2e9e5b;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">🖨️ הדפס דוח</button>
  </div>
  <div class="banner">
    <div class="card">
      <div class="val">₪${stats.totalMyCost.toFixed(2)}</div>
      <div class="lbl">במשנת יוסף</div>
    </div>
    <div class="card">
      <div class="val">₪${stats.totalMarketCost.toFixed(2)}</div>
      <div class="lbl">ברשתות השיווק</div>
    </div>
    <div class="card card-high">
      <div class="val green">₪${stats.totalSavings.toFixed(2)}</div>
      <div class="lbl"><b>חיסכון משוער (${Math.round(stats.savingsPct)}%)</b></div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:36px;">#</th>
        <th>מוצר</th>
        <th style="width:60px;">כמות</th>
        <th style="width:110px;">משנת יוסף</th>
        <th style="width:110px;">ברשתות</th>
        <th style="width:110px;">חיסכון</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <div class="footer">
    <div>הופק באמצעות תוסף "מוסיף למשנת" · פותח ע"י <b>לב טוב דיגיטל</b> (https://digital.levtov.uk/)</div>
    <div>ההשוואה מבוססת על מחירי רשתות מובילות (אושר עד, רמי לוי, יש חסד).</div>
  </div>
</body>
</html>`);
    w.document.close();
    try {
      const pBtn = w.document.getElementById('printReportBtn');
      if (pBtn) pBtn.onclick = () => w.print();
    } catch (_) {}
  }


  /* ---------- הדפסת עגלת קניות או הזמנה ספציפית מההיסטוריה ---------- */
    function harvestPageImages() {
    try {
      const allImgs = document.querySelectorAll('img');
      allImgs.forEach(img => {
        const src = img.currentSrc || img.src || img.getAttribute('src');
        if (!src || src.startsWith('data:') || src.includes('.svg')) return;
        if (/kashrut|badatz|kosher|hechsher|logo|icon|heart|badge|כשרות|בדץ/i.test(src + ' ' + (img.alt || '') + ' ' + (img.className || ''))) return;

        const row = img.closest('tr, .v-data-table__tr, [class*="order"], [class*="product"], [class*="item"], [class*="card"]');
        if (row) {
          const texts = [...row.querySelectorAll('td, span, div, h2, h3, h4, p, b, strong, a')]
            .map(el => (el.textContent || '').trim())
            .filter(t => t.length >= 3 && !/^\d+$/.test(t) && !/^[₪\d\s\.,]+$/.test(t));
          texts.forEach(t => {
            const clean = norm(t.replace(/₪\s*[\d\.]+/g, '').replace(/[\d\.]+\s*₪/g, '').trim());
            if (clean.length >= 3 && !productImages[clean]) {
              productImages[clean] = src;
            }
          });
        }
      });
      saveProductImages();
    } catch (_) {}
  }

  function findImageForProduct(item) {
    if (!item) return '';
    const normN = norm(item.name || '');

    // 1. ישיר מהאובייקט
    if (item.image && !/kashrut|badatz|kosher|hechsher|logo|badge|כשרות|בדץ/i.test(item.image)) {
      return item.image;
    }

    // 2. ממפת התמונות השמורה
    if (item.key && productImages[item.key]) return productImages[item.key];
    if (normN && productImages[normN]) return productImages[normN];

    // 3. מפריטי המכירה הנוכחית
    if (normN && sale && sale.items && sale.items.get(normN)?.image) {
      return sale.items.get(normN).image;
    }

    // 4. התאמה מטושטשת (fuzzy)
    if (normN.length >= 4) {
      for (const [k, v] of Object.entries(productImages)) {
        if (!v || /kashrut|badatz|kosher|hechsher|logo|badge|כשרות|בדץ/i.test(v)) continue;
        if (k.length >= 4 && (normN.includes(k) || k.includes(normN))) {
          return v;
        }
      }
    }

    // 5. מכרטיסי הדף
    if (typeof currentCardMap !== 'undefined' && currentCardMap) {
      for (const [cd, data] of currentCardMap.entries()) {
        if (data && (data.key === item.key || norm(data.key) === normN || (data.leaf && norm(data.leaf.textContent || '') === normN))) {
          const realSrc = findProductImage(cd);
          if (realSrc) return realSrc;
        }
      }
    }

    return '';
  }

  function printOrderList(itemsToPrint, weekTitle = 'רשימת קניות לאיסוף') {
    harvestPageImages();
    let lines = [...(itemsToPrint || [])];
    if (!lines.length) {
      showAppAlert('אין מוצרים להדפסה.', 'הדפסת רשימה');
      return;
    }

    lines.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'));

    const nowStr = new Date().toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' });
    const totalQty = lines.reduce((sum, l) => sum + (parseFloat(l.qty) || 1), 0);

    const rowsHtml = lines.map((l, i) => {
      const qtyNum = parseFloat(l.qty) || 1;
      const isMulti = qtyNum > 1;
      const normN = norm(l.name);
      let imgUrl = findImageForProduct(l);

      return `
        <tr>
          <!-- ריבוע סימון פיזי לתחנת החלוקה -->
          <td class="col-chk">
            <div class="chk-box"></div>
          </td>

          <!-- תמונת המוצר (ניתנת להסתרה/הצגה) -->
          <td class="col-img">
            ${imgUrl ? `<img src="${esc(imgUrl)}" class="prod-thumb" alt="${esc(l.name)}" >` : `<div class="no-img-box">📦</div>`}
          </td>

          <!-- שם המוצר והכמות (הכמות צמודה מימין לשם המוצר, מודגשת כשיותר מ-1) -->
          <td class="col-main">
            <div class="item-wrap">
              <span class="qty-badge ${isMulti ? 'qty-multi' : 'qty-single'}">
                ${qtyNum} יח'
              </span>
              <span class="prod-name ${isMulti ? 'prod-name-multi' : ''}">${esc(l.name)}</span>
            </div>
          </td>

          <!-- מספר סידורי - קטן ממש ובצד -->
          <td class="col-num">${i + 1}</td>
        </tr>
      `;
    }).join('');

    const printHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="utf-8">
        <base href="${location.origin}/">
        <meta name="referrer" content="no-referrer">
        <title>רשימת קניות לאיסוף - ${esc(weekTitle)}</title>
        <style>
          @page { size: A4; margin: 10mm 12mm; }
          * { box-sizing: border-box; }
          body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans Hebrew', Arial, sans-serif; margin: 0; direction: rtl; color: #0f172a; background: #fff; }
          
          /* סרגל עליון להגדרות הדפסה (אינו מודפס) */
          .toolbar { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px 16px; margin: 12px auto 16px; max-width: 900px; gap: 12px; flex-wrap: wrap; }
          .toolbar-options { display: flex; align-items: center; gap: 16px; font-size: 13px; color: #334155; }
          .toolbar-label { display: flex; align-items: center; gap: 6px; cursor: pointer; user-select: none; font-weight: 500; }
          .toolbar-label input { cursor: pointer; width: 16px; height: 16px; accent-color: #2e9e5b; }
          .print-now-btn { display: inline-flex; align-items: center; gap: 6px; background: #2e9e5b; color: #fff; border: none; border-radius: 8px; padding: 8px 18px; font-size: 14px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 6px rgba(46,158,91,0.25); }
          .print-now-btn:hover { background: #237b46; }

          .page-wrap { max-width: 900px; margin: 0 auto; padding: 8px; }
          .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2.5px solid #2e9e5b; padding-bottom: 10px; margin-bottom: 12px; }
          .title-area h1 { font-size: 22px; font-weight: 800; color: #1e6b3e; margin: 0 0 4px; }
          .title-area .meta { font-size: 13px; color: #64748b; }
          .stats-badge { background: #eef7f1; border: 1px solid #a7f3d0; border-radius: 8px; padding: 6px 14px; text-align: left; }
          .stats-badge .main-num { font-size: 16px; font-weight: 800; color: #065f46; }
          .stats-badge .sub-num { font-size: 12px; color: #047857; }

          table { width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 14px; }
          th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 12px; color: #475569; font-weight: 700; }
          td { border: 1px solid #e2e8f0; padding: 7px 10px; vertical-align: middle; }
          tr:nth-child(even) td { background: #fafafa; }

          /* עמודת תיבת סימון */
          .col-chk { width: 40px; text-align: center; }
          .chk-box { width: 19px; height: 19px; border: 2px solid #334155; border-radius: 4px; margin: auto; background: #fff; }

          /* עמודת תמונה */
          .col-img { width: 48px; text-align: center; padding: 4px; }
          .prod-thumb { width: 38px; height: 38px; object-fit: contain; border-radius: 4px; border: 1px solid #e2e8f0; background: #fff; display: block; margin: auto; }
          .no-img-box { width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; font-size: 16px; color: #94a3b8; background: #f1f5f9; border-radius: 4px; margin: auto; }
          body.no-images .col-img, body.no-images th.col-img-th { display: none !important; }

          /* עמודת תוכן ראשית */
          .col-main { text-align: right; }
          .item-wrap { display: flex; align-items: center; gap: 8px; }

          /* תגית כמות פריטים - צמודה מימין לשם המוצר */
          .qty-badge { display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; white-space: nowrap; font-variant-numeric: tabular-nums; }
          .qty-multi { background: #fef3c7; color: #78350f; border: 1.5px solid #d97706; font-size: 15px; font-weight: 800; padding: 2px 8px; min-width: 44px; }
          .qty-single { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; font-size: 12px; font-weight: 600; padding: 2px 6px; min-width: 38px; }
          
          .prod-name { font-size: 15px; font-weight: 600; color: #0f172a; }
          .prod-name-multi { color: #000; font-weight: 700; }

          /* מספר סידורי - קטן ממש ובצד */
          .col-num { width: 28px; text-align: center; font-size: 10px; color: #94a3b8; font-weight: normal; }

          /* מצב צפוף (חיסכון בדפים) */
          body.dense td { padding: 2px 6px !important; font-size: 12.5px !important; }
          body.dense th { padding: 4px 6px !important; font-size: 11px !important; }
          body.dense .prod-thumb { width: 24px !important; height: 24px !important; }
          body.dense .no-img-box { width: 24px !important; height: 24px !important; font-size: 12px !important; }
          body.dense .chk-box { width: 14px !important; height: 14px !important; }
          body.dense .prod-name { font-size: 12.5px !important; }
          body.dense .qty-badge { font-size: 12px !important; padding: 1px 5px !important; min-width: 32px !important; }
          body.dense .header { margin-bottom: 6px !important; padding-bottom: 6px !important; }
          body.dense .toolbar { margin-bottom: 8px !important; padding: 6px 12px !important; }

          /* מצב רשימה צרה וארוכה (פורמט פתק איסוף / סרט קופה) */
          body.narrow-slip .page-wrap { max-width: 360px !important; margin: 0 auto !important; border: 1.5px dashed #94a3b8; padding: 12px 14px !important; border-radius: 6px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
          body.narrow-slip .header { flex-direction: column; align-items: flex-start; gap: 6px; padding-bottom: 8px; margin-bottom: 8px; border-bottom-width: 2px; }
          body.narrow-slip .title-area h1 { font-size: 16px !important; }
          body.narrow-slip .title-area .meta { font-size: 11px !important; }
          body.narrow-slip .stats-badge { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 4px 8px !important; box-sizing: border-box; }
          body.narrow-slip .stats-badge .main-num { font-size: 13px !important; }
          body.narrow-slip .stats-badge .sub-num { font-size: 11px !important; }
          body.narrow-slip table { font-size: 12.5px !important; }
          body.narrow-slip th { padding: 4px 6px !important; font-size: 11px !important; }
          body.narrow-slip td { padding: 4px 6px !important; }
          body.narrow-slip .col-chk { width: 30px !important; }
          body.narrow-slip .chk-box { width: 15px !important; height: 15px !important; }
          body.narrow-slip .col-img { width: 34px !important; padding: 2px !important; }
          body.narrow-slip .prod-thumb, body.narrow-slip .no-img-box { width: 28px !important; height: 28px !important; }
          body.narrow-slip .qty-badge { font-size: 12.5px !important; padding: 1px 5px !important; min-width: 34px !important; }
          body.narrow-slip .prod-name { font-size: 12.5px !important; }
          body.narrow-slip .footer { flex-direction: column; gap: 4px; font-size: 10px !important; text-align: center; }

          .footer { margin-top: 16px; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }

          @media print {
            .toolbar { display: none !important; }
            .page-wrap { max-width: 100% !important; padding: 0 !important; }
            body { background: #fff !important; }
            tr { page-break-inside: avoid; }
            body.narrow-slip .page-wrap { max-width: 360px !important; width: 360px !important; border: 1.5px dashed #94a3b8 !important; padding: 10px !important; margin: 0 auto !important; }
          }
        </style>
      </head>
      <body>
        <div class="page-wrap">
          <!-- סרגל כפתורים עליון (אינו מודפס) -->
          <div class="toolbar no-print">
            <div class="toolbar-options">
              <label class="toolbar-label">
                <input type="checkbox" id="chk-images" checked>
                <span>הצג תמונות מוצרים</span>
              </label>
              <label class="toolbar-label">
                <input type="checkbox" id="chk-dense">
                <span>מצב שורות צפוף</span>
              </label>
              <label class="toolbar-label">
                <input type="checkbox" id="chk-narrow">
                <span>רשימת קניות צרה וארוכה (פתק איסוף)</span>
              </label>
            </div>
            <button class="print-now-btn">
              🖨️ הדפס רשימה
            </button>
          </div>

          <!-- כותרת ראשית -->
          <div class="header">
            <div class="title-area">
              <h1>משנת יוסף · רשימת הזמנה לאיסוף</h1>
              <div class="meta"><b>${esc(weekTitle)}</b> | הודפס: ${nowStr}</div>
            </div>
            <div class="stats-badge">
              <div class="main-num">סה"כ ${lines.length} מוצרים</div>
              <div class="sub-num">${totalQty} יחידות</div>
            </div>
          </div>

          <!-- טבלת המוצרים לאיסוף -->
          <table>
            <thead>
              <tr>
                <th style="width:40px; text-align:center;">נאסף</th>
                <th class="col-img col-img-th" style="width:48px; text-align:center;">תמונה</th>
                <th style="text-align:right;">כמות ושם המוצר</th>
                <th style="width:28px; text-align:center;">#</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer">
            <div>הופק באמצעות תוסף "מוסיף למשנת" · פותח ע"י <b>לב טוב דיגיטל</b> (https://digital.levtov.uk/)</div>
            <div>רשימת סימון ומעקב לתחנת החלוקה</div>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWin = window.open('', '_blank', 'width=850,height=920');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(printHtml);
      printWin.document.close();

      // חיבור האזנה ישירה לאירועים מחוץ ל-HTML למניעת חסימת CSP של הדפדפן
      try {
        const doc = printWin.document;
        const btnPrint = doc.querySelector('.print-now-btn');
        if (btnPrint) btnPrint.onclick = () => printWin.print();

        doc.querySelectorAll('img.prod-thumb').forEach(img => {
          img.onerror = () => {
            img.outerHTML = '<div class="no-img-box">📦</div>';
          };
        });

        const chkImg = doc.getElementById('chk-images');
        if (chkImg) {
          try {
            if (localStorage.getItem('myfam_print_images') === '0') {
              chkImg.checked = false;
              doc.body.classList.add('no-images');
            }
          } catch (e) {}
          chkImg.onchange = () => {
            doc.body.classList.toggle('no-images', !chkImg.checked);
            try { localStorage.setItem('myfam_print_images', chkImg.checked ? '1' : '0'); } catch (e) {}
          };
        }

        const chkDense = doc.getElementById('chk-dense');
        if (chkDense) {
          try {
            if (localStorage.getItem('myfam_print_dense') === '1') {
              chkDense.checked = true;
              doc.body.classList.add('dense');
            }
          } catch (e) {}
          chkDense.onchange = () => {
            doc.body.classList.toggle('dense', chkDense.checked);
            try { localStorage.setItem('myfam_print_dense', chkDense.checked ? '1' : '0'); } catch (e) {}
          };
        }

        const chkNarrow = doc.getElementById('chk-narrow');
        if (chkNarrow) {
          try {
            if (localStorage.getItem('myfam_print_narrow') === '1') {
              chkNarrow.checked = true;
              doc.body.classList.add('narrow-slip');
            }
          } catch (e) {}
          chkNarrow.onchange = () => {
            doc.body.classList.toggle('narrow-slip', chkNarrow.checked);
            try { localStorage.setItem('myfam_print_narrow', chkNarrow.checked ? '1' : '0'); } catch (e) {}
          };
        }
      } catch (e) {}
    } else {
      showAppAlert('חלון ההדפסה נחסם על ידי הדפדפן. יש לאשר פתיחת חלונות קופצים (Popups) עבור אתר משנת יוסף.', 'הדפסת רשימה');
    }
  }

  /* ---------- הדפסת עגלת הקניות הנוכחית ---------- */
  async function printCurrentCart() {
    let lines = live && live.lines ? [...live.lines.values()] : [];

    // אם עדיין אין שורות ב-live, ננסה לבדוק לפי מזהה ההזמנה
    if (!lines.length) {
      const curOrdId = extractOrderIdFromUrl() || (live && live.orderId);
      if (curOrdId) {
        try {
          const oData = await siteApiRequest(`${API_HOST}/api/orders/${curOrdId}`, 'GET');
          const o = oData?.order;
          if (o && Array.isArray(o.items)) {
            lines = o.items.filter(it => !it.del).map(lineFrom).filter(Boolean);
          }
        } catch (e) {}
      }
    }

    if (!lines.length) {
      showAppAlert('עגלת הקניות שלך במכירה זו ריקה כרגע.\nיש להוסיף מוצרים לסל לפני ההדפסה,\nאו לחלופין לפתוח את "היסטוריית קניות" ולהדפיס משם את ההזמנה שננעלה.', 'הדפסת רשימת איסוף');
      return;
    }

    const sid = (live && live.saleId) || extractSaleIdFromUrl();
    const weekName = (sid && saleMeta[sid]?.week) || 'המכירה השבועית';
    printOrderList(lines, weekName);
  }

  /* ---------- היסטוריית קניות וסיכום מוצרים מפורט ---------- */
  function showHistory() {
    $('#myfam-modal')?.remove();

    // חישוב נתוני סיכום מכל ההזמנות
    const validOrders = [...state.history].filter(o => o.items && o.items.length);
    const c = counts();

    // אגרגציית כל המוצרים
    const prodMap = new Map();
    let totalItemsPurchased = 0;

    validOrders.forEach(o => {
      const orderDate = o.date ? new Date(o.date) : null;
      const dateStr = orderDate && !isNaN(orderDate.getTime()) ? orderDate.toLocaleDateString('he-IL') : '';
      const weekName = o.week || `מכירה ${o.saleId || ''}`;

      o.items.forEach(it => {
        if (!it.name) return;
        const key = it.key || norm(it.name);
        const qty = Number(it.qty) || 1;
        totalItemsPurchased += qty;

        let p = prodMap.get(key);
        if (!p) {
          p = {
            key,
            name: it.name,
            pid: it.pid,
            orderCount: 0,
            totalQty: 0,
            sales: [],
            isFixed: isFixed(key, c)
          };
          prodMap.set(key, p);
        }
        p.orderCount++;
        p.totalQty += qty;
        p.sales.push({ week: weekName, date: dateStr, qty });
      });
    });

    const allProducts = [...prodMap.values()];
    const fixedProductsCount = allProducts.filter(p => p.isFixed).length;
    const topProduct = [...allProducts].sort((a, b) => b.orderCount - a.orderCount)[0] || null;

    let currentTab = 'products'; // 'products' | 'orders'
    let searchQuery = '';
    let filterFixedOnly = false;
    let sortBy = 'orders'; // 'orders' | 'qty' | 'name'

    const m = document.createElement('div');
    m.id = 'myfam-modal';

    function renderModalContent() {
      // סינון מוצרים
      const query = norm(searchQuery);
      let filteredProducts = allProducts.filter(p => {
        if (filterFixedOnly && !p.isFixed) return false;
        if (query && !norm(p.name).includes(query)) return false;
        return true;
      });

      if (sortBy === 'orders') {
        filteredProducts.sort((a, b) => b.orderCount - a.orderCount || b.totalQty - a.totalQty);
      } else if (sortBy === 'qty') {
        filteredProducts.sort((a, b) => b.totalQty - a.totalQty || b.orderCount - a.orderCount);
      } else if (sortBy === 'name') {
        filteredProducts.sort((a, b) => a.name.localeCompare(b.name, 'he'));
      }

      // סינון הזמנות
      let filteredOrders = [...validOrders].reverse().filter(o => {
        if (!query) return true;
        const matchWeek = norm(o.week || '').includes(query);
        const matchItem = o.items.some(i => norm(i.name).includes(query));
        return matchWeek || matchItem;
      });

      // תוכן לשונית מוצרים
      let productsHtml = '';
      if (!filteredProducts.length) {
        productsHtml = `<div class="myfam-hist-empty">לא נמצאו מוצרים התואמים לחיפוש/סינון.</div>`;
      } else {
        productsHtml = `
          <div class="myfam-hist-table-wrap">
            <table class="myfam-hist-table">
              <thead>
                <tr>
                  <th style="width:36px;text-align:center;">קבוע</th>
                  <th>שם המוצר</th>
                  <th style="text-align:center;width:95px;">מספר הזמנות</th>
                  <th style="text-align:center;width:90px;">סה"כ כמות</th>
                  <th>מכירה אחרונה</th>
                </tr>
              </thead>
              <tbody>
                ${filteredProducts.map(p => {
                  const lastSale = p.sales[p.sales.length - 1];
                  const lastInfo = lastSale ? `${esc(lastSale.week)}${lastSale.date ? ` (${lastSale.date})` : ''}` : '—';
                  return `
                    <tr class="${p.isFixed ? 'myfam-row-fixed' : ''}">
                      <td style="text-align:center;">
                        <button class="myfam-hist-starbtn ${p.isFixed ? 'on' : ''}" data-key="${esc(p.key)}" title="${p.isFixed ? 'בטל מוצר קבוע' : 'סמן כמוצר קבוע'}">
                          ${p.isFixed ? ICONS.starBtnFilled : ICONS.starBtnEmpty}
                        </button>
                      </td>
                      <td>
                        <div class="myfam-hist-pname">
                          <b>${esc(p.name)}</b>
                          ${p.isFixed ? '<span class="myfam-hist-badge-fixed">קבוע</span>' : ''}
                        </div>
                      </td>
                      <td style="text-align:center;">
                        <span class="myfam-hist-pill ${p.orderCount >= 3 ? 'pill-gold' : 'pill-green'}">${p.orderCount} הזמנות</span>
                      </td>
                      <td style="text-align:center;">
                        <span class="myfam-hist-qty">${p.totalQty} יח'</span>
                      </td>
                      <td style="color:#64748b;font-size:12px;">${lastInfo}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;
      }

      // תוכן לשונית הזמנות
      let ordersHtml = '';
      if (!filteredOrders.length) {
        ordersHtml = `<div class="myfam-hist-empty">לא נמצאו הזמנות התואמות לחיפוש.</div>`;
      } else {
        ordersHtml = filteredOrders.map(o => {
          const dt = o.date ? new Date(o.date) : null;
          const dtFmt = dt && !isNaN(dt.getTime()) ? dt.toLocaleDateString('he-IL', { year:'numeric', month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' }) : '';
          const totalOrderQty = o.items.reduce((s, it) => s + (Number(it.qty) || 1), 0);
          return `
            <div class="myfam-hist-order-card" data-order-id="${esc(o.id)}">
              <div class="myfam-hist-order-head">
                <div class="myfam-hist-order-title">
                  <span class="myfam-hist-order-toggle">${ICONS.chevronDown}</span>
                  <b>${esc(o.week || 'מכירה')}</b>
                  ${dtFmt ? `<span class="myfam-hist-order-date">${dtFmt}</span>` : ''}
                  <span class="myfam-hist-pill pill-gray">${o.items.length} מוצרים · ${totalOrderQty} יח'</span>
                </div>
                <div class="myfam-hist-order-actions">
                  <button class="myfam-hist-print-order-btn" data-print-ord="${esc(o.id)}" title="הדפס רשימת איסוף להזמנה זו">
                    ${ICONS.print} <span>הדפס רשימת איסוף</span>
                  </button>
                  <button class="myfam-hist-del-btn" data-del="${esc(o.id)}" title="מחק הזמנה זו מההיסטוריה">
                    ${ICONS.trash} <span>מחק</span>
                  </button>
                </div>
              </div>
              <div class="myfam-hist-order-body">
                <div class="myfam-hist-order-grid">
                  ${o.items.map(it => `
                    <div class="myfam-hist-order-item">
                      <span class="myfam-hist-item-name">${esc(it.name)}</span>
                      <span class="myfam-hist-item-qty">× ${it.qty}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          `;
        }).join('');
      }

      m.innerHTML = `
        <div class="myfam-box myfam-hist-box">
          <button class="myfam-x" title="סגור">${ICONS.close}</button>

          <!-- כותרת ראשית -->
          <div class="myfam-hist-header">
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="background:#eef7f1;color:#2e9e5b;padding:8px;border-radius:10px;display:flex;">${ICONS.history}</div>
              <div>
                <h3 style="margin:0;font-size:18px;color:#1e293b;">היסטוריית קניות וסיכום מוצרים</h3>
                <div style="font-size:12px;color:#64748b;">${APP_NAME} · נתונים מסונכרנים מחשבונך</div>
              </div>
            </div>
            <div style="display:flex;gap:8px;">
              <button id="myfam-hist-import" class="myfam-hist-sync-btn" title="סנכרן הזמנות מהאתר">
                ${ICONS.download} <span>סנכרן מהאתר</span>
              </button>
              <button id="myfam-hist-print" class="myfam-hist-print-btn" title="הדפס דוח סיכום">
                ${ICONS.print} <span>הדפס דוח</span>
              </button>
            </div>
          </div>

          <!-- כרטיסי סטטיסטיקה מהירים -->
          <div class="myfam-hist-stats">
            <div class="myfam-hist-stat-card">
              <span class="myfam-hist-stat-num" style="color:#2563eb;">${validOrders.length}</span>
              <span class="myfam-hist-stat-lbl">הזמנות בהיסטוריה</span>
            </div>
            <div class="myfam-hist-stat-card">
              <span class="myfam-hist-stat-num" style="color:#2e9e5b;">${allProducts.length}</span>
              <span class="myfam-hist-stat-lbl">מוצרים שונים שנקנו</span>
            </div>
            <div class="myfam-hist-stat-card">
              <span class="myfam-hist-stat-num" style="color:#d97706;">${fixedProductsCount}</span>
              <span class="myfam-hist-stat-lbl">מוצרים קבועים ⭐</span>
            </div>
            <div class="myfam-hist-stat-card">
              <span class="myfam-hist-stat-num" style="color:#7c3aed;">${totalItemsPurchased}</span>
              <span class="myfam-hist-stat-lbl">סה"כ יחידות מוצרים</span>
            </div>
            ${topProduct ? `
              <div class="myfam-hist-stat-card myfam-hist-stat-top">
                <span class="myfam-hist-stat-num" style="font-size:15px;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${esc(topProduct.name)}">${esc(topProduct.name)}</span>
                <span class="myfam-hist-stat-lbl">המוצר הנרכש ביותר (${topProduct.orderCount} הזמנות)</span>
              </div>
            ` : ''}
          </div>

          <!-- סרגל לשוניות וסינונים -->
          <div class="myfam-hist-controls">
            <!-- לשוניות -->
            <div class="myfam-hist-tabs">
              <button id="myfam-tab-products" class="myfam-hist-tab ${currentTab === 'products' ? 'active' : ''}">
                ${ICONS.package} <span>סיכום לפי מוצרים (${allProducts.length})</span>
              </button>
              <button id="myfam-tab-orders" class="myfam-hist-tab ${currentTab === 'orders' ? 'active' : ''}">
                ${ICONS.cart} <span>לפי הזמנות ומכירות (${validOrders.length})</span>
              </button>
            </div>

            <!-- שורת חיפוש ופילטרים -->
            <div class="myfam-hist-filter-row">
              <div class="myfam-hist-search">
                ${ICONS.search}
                <input type="text" id="myfam-hist-search-input" placeholder="${currentTab === 'products' ? 'חפש מוצר…' : 'חפש מוצר או שם מכירה…'}" value="${esc(searchQuery)}">
                ${searchQuery ? `<button id="myfam-hist-search-clear">✕</button>` : ''}
              </div>

              <div class="myfam-hist-filters">
                <button id="myfam-hist-filter-fixed" class="myfam-hist-pill-btn ${filterFixedOnly ? 'active' : ''}">
                  ${ICONS.starFilled} <span>רק קבועים</span>
                </button>

                ${currentTab === 'products' ? `
                  <div class="myfam-hist-sort-wrap">
                    <span style="font-size:12px;color:#64748b;">מיון:</span>
                    <select id="myfam-hist-sort">
                      <option value="orders" ${sortBy === 'orders' ? 'selected' : ''}>הכי הרבה הזמנות</option>
                      <option value="qty" ${sortBy === 'qty' ? 'selected' : ''}>כמות יחידות מצטברת</option>
                      <option value="name" ${sortBy === 'name' ? 'selected' : ''}>לפי שם (א-ב)</option>
                    </select>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>

          <!-- אזור התוכן הגליל -->
          <div class="myfam-hist-body">
            ${currentTab === 'products' ? productsHtml : ordersHtml}
          </div>

          <!-- קרדיטים תחתונים -->
          <div class="myfam-footer-credits" style="margin-top:10px;padding-top:8px;">
            פותח ע"י <b><a href="https://digital.levtov.uk/" target="_blank" rel="noopener">לב טוב דיגיטל</a></b> | כל הזכויות שמורות.<br>
            תוסף אישי ופרטי שאינו קשור כלל למערכת משנת יוסף.
          </div>
        </div>
      `;

      attachModalEvents();
    }

    function attachModalEvents() {
      // סגירה בלחיצה על X או על הרקע
      const xBtn = $('.myfam-x', m);
      if (xBtn) xBtn.onclick = () => m.remove();
      m.onclick = e => {
        if (e.target === m || e.target.closest('.myfam-x')) m.remove();
      };

      // לשוניות
      const tabProd = $('#myfam-tab-products', m);
      const tabOrd = $('#myfam-tab-orders', m);
      if (tabProd) tabProd.onclick = () => { currentTab = 'products'; renderModalContent(); };
      if (tabOrd) tabOrd.onclick = () => { currentTab = 'orders'; renderModalContent(); };

      // חיפוש
      const searchInput = $('#myfam-hist-search-input', m);
      if (searchInput) {
        searchInput.oninput = () => {
          searchQuery = searchInput.value;
          renderModalContent();
          const inp = $('#myfam-hist-search-input', m);
          if (inp) { inp.focus(); inp.selectionStart = inp.selectionEnd = inp.value.length; }
        };
      }
      const searchClear = $('#myfam-hist-search-clear', m);
      if (searchClear) searchClear.onclick = () => { searchQuery = ''; renderModalContent(); };

      // פילטר קבועים
      const btnFixed = $('#myfam-hist-filter-fixed', m);
      if (btnFixed) btnFixed.onclick = () => { filterFixedOnly = !filterFixedOnly; renderModalContent(); };

      // מיון
      const sortSelect = $('#myfam-hist-sort', m);
      if (sortSelect) sortSelect.onchange = () => { sortBy = sortSelect.value; renderModalContent(); };

      // כפתור סנכרון
      const btnImport = $('#myfam-hist-import', m);
      if (btnImport) btnImport.onclick = () => { m.remove(); importHistoryFromSite(); };

      // כפתור הדפסה
      const btnPrint = $('#myfam-hist-print', m);
      if (btnPrint) btnPrint.onclick = () => printHistoryReport(allProducts, validOrders);

      // כוכב לשינוי מוצר קבוע ישירות מהרשימה
      m.querySelectorAll('.myfam-hist-starbtn').forEach(btn => {
        btn.onclick = async ev => {
          ev.stopPropagation();
          const key = btn.dataset.key;
          if (key) {
            const histBody = $('.myfam-hist-body', m);
            const savedScroll = histBody ? histBody.scrollTop : 0;
            const wasFixed = isFixed(key, counts());
            toggleFixed(key);
            // רענון מיידי של הנתונים במודאל
            const updatedCounts = counts();
            const p = prodMap.get(key);
            const nowFixed = isFixed(key, updatedCounts);
            if (p) p.isFixed = nowFixed;
            renderModalContent();
            const newBody = $('.myfam-hist-body', m);
            if (newBody) newBody.scrollTop = savedScroll;
            showToast(
              nowFixed ? `המוצר נוסף לרשימת המוצרים הקבועים שלך ⭐` : `המוצר הוסר מרשימת הקבועים`,
              nowFixed ? 'success' : 'info'
            );
          }
        };
      });

      // כפתורי הדפסת הזמנה ספציפית לאיסוף
      m.querySelectorAll('.myfam-hist-print-order-btn').forEach(btn => {
        btn.onclick = async ev => {
          ev.stopPropagation();
          const ordId = btn.dataset.printOrd;
          const targetOrd = validOrders.find(o => o.id === ordId);
          if (!targetOrd || !targetOrd.items || !targetOrd.items.length) {
            showAppAlert('לא נמצאו פריטים בהזמנה זו להדפסה.', 'הדפסת רשימה');
            return;
          }

          // בדיקה האם לחלק מהפריטים בהזמנה זו עדיין אין תמונה
          const missingImgs = targetOrd.items.filter(it => !it.image && !productImages[it.key] && !productImages[norm(it.name)]);
          if (missingImgs.length) {
            // ניסיון משיכה ישיר של פרטי ההזמנה המלאים מהשרת לצורך קבלת תמונות עדכניות
            try {
              const numericId = (targetOrd.id || '').replace(/^sale-\d+-/, '') || extractOrderIdFromUrl();
              const realId = targetOrd.orderId || (numericId && !isNaN(numericId) ? numericId : null);
              if (realId) {
                const oData = await siteApiRequest(`${API_HOST}/api/orders/${realId}`, 'GET');
                const o = oData?.order;
                if (o && Array.isArray(o.items)) {
                  o.items.forEach(it => {
                    if (it.del) return;
                    const l = lineFrom(it);
                    if (l && l.image) {
                      productImages[l.key] = l.image;
                      productImages[norm(l.name)] = l.image;
                      const match = targetOrd.items.find(x => x.key === l.key || norm(x.name) === norm(l.name));
                      if (match) match.image = l.image;
                    }
                  });
                  saveProductImages();
                  save();
                }
              }
            } catch (e) {
              console.warn('[myfam printOrder fetch image]', e);
            }
          }

          printOrderList(targetOrd.items, targetOrd.week || 'הזמנה שבועית');
        };
      });

      // כפתורי מחיקת הזמנה
      m.querySelectorAll('.myfam-hist-del-btn').forEach(btn => {
        btn.onclick = async ev => {
          ev.stopPropagation();
          const del = btn.dataset.del;
          if (del && await showAppConfirm('למחוק הזמנה זו מההיסטוריה השמורה בתוסף?', 'מחיקת הזמנה מההיסטוריה')) {
            state.history = state.history.map(o => o.id === del ? { ...o, items: [], date: new Date().toISOString() } : o);
            save();
            render();
            showHistory();
          }
        };
      });

      // כיווץ/הרחבה של כרטיסיות הזמנה
      m.querySelectorAll('.myfam-hist-order-head').forEach(head => {
        head.onclick = () => {
          const card = head.closest('.myfam-hist-order-card');
          if (card) card.classList.toggle('collapsed');
        };
      });
    }

    renderModalContent();
    document.body.appendChild(m);
  }

  /* ---------- הדפסת דוח סיכום היסטוריה ---------- */
  function printHistoryReport(products, orders) {
    const sorted = [...products].sort((a, b) => b.orderCount - a.orderCount);
    const totalQty = sorted.reduce((s, p) => s + p.totalQty, 0);

    const rows = sorted.map((p, idx) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td><b>${esc(p.name)}</b>${p.isFixed ? ' <span style="color:#d97706;">⭐ (קבוע)</span>' : ''}</td>
        <td style="text-align:center;">${p.orderCount}</td>
        <td style="text-align:center;">${p.totalQty}</td>
      </tr>
    `).join('');

    const w = window.open('', '_blank');
    if (!w) { showAppAlert('נא לאשר פתיחת חלונות קופצים (Popups) כדי להדפיס את הרשימה.', 'הדפסת רשימה'); return; }

    w.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <title>דוח סיכום קניות מצטבר - ${APP_NAME}</title>
  <style>
    body{font-family:system-ui,-apple-system,sans-serif;margin:24px;color:#1e293b;direction:rtl}
    h2{margin:0 0 4px}
    .meta{color:#64748b;font-size:13px;margin-bottom:18px}
    table{width:100%;border-collapse:collapse;margin-top:10px}
    th,td{border:1px solid #cbd5e1;padding:8px 10px;font-size:13px}
    th{background:#f1f5f9;font-weight:bold}
    tr:nth-child(even){background:#f8fafc}
    .summary-box{display:flex;gap:16px;margin-bottom:16px;font-size:14px}
    .summary-box div{background:#eef7f1;padding:8px 14px;border-radius:8px;border:1px solid #2e9e5b;color:#1e6b3e;font-weight:bold}
    @media print{button{display:none}}
  </style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:center;">
    <div>
      <h2>דוח סיכום קניות מצטבר - ${APP_NAME}</h2>
      <div class="meta">הופק בתאריך: ${new Date().toLocaleDateString('he-IL')} | מתוך ${orders.length} הזמנות</div>
    </div>
    <button class="print-report-btn" style="padding:8px 16px;background:#2e9e5b;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">🖨️ הדפס דוח</button>
  </div>
  <div class="summary-box">
    <div>סה"כ הזמנות: ${orders.length}</div>
    <div>סה"כ מוצרים שונים: ${products.length}</div>
    <div>סה"כ פריטים שנקנו: ${totalQty} יח'</div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:40px;">#</th>
        <th>שם המוצר</th>
        <th style="width:110px;">פעמים שהוזמן</th>
        <th style="width:110px;">כמות יחידות כוללת</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div style="margin-top:24px;font-size:12px;color:#94a3b8;text-align:center;">פותח ע"י לב טוב דיגיטל - digital.levtov.uk</div>
</body>
</html>`);
    w.document.close();
    try {
      const pBtn = w.document.querySelector('.print-report-btn');
      if (pBtn) pBtn.onclick = () => w.print();
    } catch (e) {}
  }

  function openFeedbackPage() {
    if (chrome?.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: 'openFeedback' });
    } else {
      window.open(chrome?.runtime?.getURL ? chrome.runtime.getURL('feedback.html') : 'feedback.html', '_blank');
    }
  }

  function showSettings() {
    $('#myfam-modal')?.remove();
    const m = document.createElement('div'); m.id = 'myfam-modal';
    m.innerHTML = `<div class="myfam-box myfam-set">
      <button class="myfam-x" title="סגור">${ICONS.close}</button>
      
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #e2e8f0;">
        <div style="background:#eef7f1;color:#2e9e5b;padding:8px;border-radius:10px;display:flex;">${ICONS.settings}</div>
        <div>
          <h3 style="margin:0;font-size:18px;color:#1e293b;">הגדרות - ${APP_NAME}</h3>
          <div style="font-size:12px;color:#64748b;">התאמה אישית של תצוגה, התראות וסנכרון</div>
        </div>
      </div>

      <!-- חלק 1: מראה והדגשות -->
      <div class="myfam-set-section">
        <h4 class="myfam-set-sec-title">🎨 מראה והדגשות צבעים</h4>
        <div class="myfam-row">
          <span>הוזמן בעבר:</span>
          <input type="color" id="mf-seenColor" class="myfam-color-pick">
          <select id="mf-seenFill" class="myfam-select-box"><option value="0">מסגרת בלבד</option><option value="1">צביעת כל הכרטיס</option></select>
        </div>
        <div class="myfam-row">
          <span>מוצר קבוע:</span>
          <input type="color" id="mf-fixedColor" class="myfam-color-pick">
          <select id="mf-fixedFill" class="myfam-select-box"><option value="0">מסגרת בלבד</option><option value="1">צביעת כל הכרטיס</option></select>
        </div>
        <div style="display:flex;gap:8px;margin-top:10px;">
          <button id="mf-reset" class="myfam-sec-btn">שחזר צבעי ברירת מחדל</button>
          <button id="mf-reset-fixed" class="myfam-sec-btn" style="flex:1;">איפוס שינויים ידניים בכוכב</button>
        </div>
      </div>
      
      <!-- חלק 2: התראות דפדפן -->
      <div class="myfam-set-section">
        <h4 class="myfam-set-sec-title">🔔 התראות דפדפן על מכירות</h4>
        <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:600; font-size:13px; color:#1e293b;">
          <input type="checkbox" id="mf-notify-enabled" style="accent-color:#2e9e5b;width:16px;height:16px;">
          <span>הפעל התראות דפדפן על מועדי המכירות</span>
        </label>
        <div id="mf-notify-sub" style="margin-right:24px; margin-top:10px; font-size:13px; color:#475569;">
          <label style="display:flex; align-items:center; gap:8px; margin:6px 0; cursor:pointer;">
            <input type="checkbox" id="mf-notify-start" style="accent-color:#2e9e5b;">
            <span>התראה בעת פתיחת המכירה להזמנות</span>
          </label>
          <label style="display:flex; align-items:center; gap:8px; margin:6px 0; cursor:pointer;">
            <input type="checkbox" id="mf-notify-lastday" style="accent-color:#2e9e5b;">
            <span>התראה ביום האחרון להזמנה</span>
          </label>
          <label style="display:flex; align-items:center; gap:8px; margin:6px 0; cursor:pointer;">
            <input type="checkbox" id="mf-notify-closing" style="accent-color:#2e9e5b;">
            <span>התראה דחופה לפני סגירת ההזמנות</span>
          </label>
          <div style="display:flex; align-items:center; gap:8px; margin-top:8px;">
            <span style="font-size:12px;">שלח התראה דחופה:</span>
            <select id="mf-notify-hours" style="padding:4px 8px; border-radius:6px; border:1px solid #cbd5e1; font-size:12px;">
              <option value="1">שעה אחת לפני הסגירה</option>
              <option value="2">שעתיים לפני הסגירה</option>
              <option value="3">3 שעות לפני הסגירה</option>
              <option value="4">4 שעות לפני הסגירה</option>
              <option value="5">5 שעות לפני הסגירה</option>
            </select>
          </div>
          <div style="margin-top:10px;">
            <button id="mf-test-notify" style="padding:6px 14px; background:#eef7f1; border:1px solid #2e9e5b; color:#166534; border-radius:6px; font-size:12px; cursor:pointer; font-weight:bold;">
              בדוק התראה עכשיו 🔔
            </button>
          </div>
        </div>
      </div>

      <!-- חלק 3: מד תקציב ויזואלי -->
      <div class="myfam-set-section">
        <h4 class="myfam-set-sec-title">🎯 מד תקציב שבועי</h4>
        <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:600; font-size:13px; color:#1e293b;">
          <input type="checkbox" id="mf-budget-enabled" style="accent-color:#2e9e5b;width:16px;height:16px;">
          <span>הפעל מד תקציב ויזואלי למכירה השבועית</span>
        </label>
        <div id="mf-budget-sub" style="margin-right:24px; margin-top:10px; font-size:13px; color:#475569;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:12.5px;">סכום יעד בש"ח:</span>
            <input type="number" id="mf-budget-target" min="0" step="10" placeholder="400" style="width:100px; padding:5px 8px; border-radius:6px; border:1px solid #cbd5e1; font-weight:bold; outline:none;">
            <span style="font-weight:bold; color:#334155;">₪</span>
          </div>
          <div style="margin-top:6px; font-size:11.5px; color:#64748b;">
            המערכת תציג תגית חכמה ליד כפתור הסל ותעדכן אותך בזמן אמת על מצב התקציב.
          </div>
        </div>
      </div>

      <!-- חלק 4: סנכרון מאובטח -->
      <div class="myfam-set-section" style="background:#f0fdf4; border-color:#bbf7d0;">
        <h4 class="myfam-set-sec-title" style="color:#166534; display:flex; align-items:center; gap:6px;">
          <span>☁️ סנכרון מאובטח בחשבון Google</span>
        </h4>
        <div style="font-size:12.5px; color:#1e293b; line-height:1.6;">
          כל המוצרים הקבועים שלכם (⭐) והעדפות התצוגה נשמרים ומסונכרנים אוטומטית בין המחשבים שלכם דרך חשבון ה-Google המחובר לדפדפן (<code>chrome.storage.sync</code>).
        </div>
        <div style="margin-top:6px; font-size:11.5px; color:#047857; font-weight:500;">
          ✓ הנתונים אינם נשלחים לשום שרת חיצוני ונשמרים אך ורק בחשבונכם הפרטי.
        </div>
      </div>

      <!-- דירוג ומשוב -->
      <div style="margin-top:14px; text-align:center;">
        <button id="mf-open-feedback" style="background:#fffbeb; border:1px solid #fde68a; width:100%; padding:9px; border-radius:8px; font-weight:bold; color:#92400e; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;">
          ${ICONS.starFilled} <span>נהנים מהתוסף? דרגו אותנו ושלחו משוב</span>
        </button>
      </div>

      <div class="myfam-footer-credits">
        פותח ע"י <b><a href="https://digital.levtov.uk/" target="_blank">לב טוב דיגיטל</a></b> | לפניות: <a href="mailto:mytovmail@gmail.com">mytovmail@gmail.com</a><br>
        <small>תוסף פרטי ועצמאי. אינו קשור כלל למערכת "משנת יוסף". כל הזכויות שמורות.</small>
      </div>
    </div>`;
    document.body.appendChild(m);

    const g = id => $('#' + id, m);
    const fill = () => {
      g('mf-seenColor').value = prefs.seenColor; g('mf-fixedColor').value = prefs.fixedColor;
      g('mf-seenFill').value = prefs.seenFill ? '1' : '0'; g('mf-fixedFill').value = prefs.fixedFill ? '1' : '0';
    };
    fill();

    const notifySettings = jget('notify_settings', {
      enabled: true,
      onStart: true,
      onLastDay: true,
      onClosing: true,
      hoursBefore: 3
    });

    g('mf-notify-enabled').checked = !!notifySettings.enabled;
    g('mf-notify-start').checked = !!notifySettings.onStart;
    g('mf-notify-lastday').checked = !!notifySettings.onLastDay;
    g('mf-notify-closing').checked = !!notifySettings.onClosing;
    g('mf-notify-hours').value = String(notifySettings.hoursBefore || 3);

    const saveNotify = () => {
      const ns = {
        enabled: g('mf-notify-enabled').checked,
        onStart: g('mf-notify-start').checked,
        onLastDay: g('mf-notify-lastday').checked,
        onClosing: g('mf-notify-closing').checked,
        hoursBefore: parseInt(g('mf-notify-hours').value, 10) || 3
      };
      jset('notify_settings', ns);
      try { chrome?.storage?.local?.set?.({ notify_settings: ns }); } catch (e) {}
    };

    g('mf-notify-enabled').onchange = () => {
      if (g('mf-notify-enabled').checked && typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
      saveNotify();
    };
    g('mf-notify-start').onchange = saveNotify;
    g('mf-notify-lastday').onchange = saveNotify;
    g('mf-notify-closing').onchange = saveNotify;
    g('mf-notify-hours').onchange = saveNotify;
    g('mf-test-notify').onclick = () => {
      chrome?.runtime?.sendMessage?.({ type: 'testNotification' });
    };

    const bgt = state.budget || { target: 0, enabled: false };
    g('mf-budget-enabled').checked = !!bgt.enabled;
    g('mf-budget-target').value = bgt.target > 0 ? String(bgt.target) : '';

    const saveBudgetSettings = () => {
      const en = g('mf-budget-enabled').checked;
      const tgt = parseFloat(g('mf-budget-target').value) || 0;
      setBudget(tgt, en && tgt > 0);
    };

    g('mf-budget-enabled').onchange = saveBudgetSettings;
    g('mf-budget-target').onchange = saveBudgetSettings;
    g('mf-budget-target').oninput = saveBudgetSettings;

    const upd = rerender => {
      prefs = { seenColor: g('mf-seenColor').value, fixedColor: g('mf-fixedColor').value,
                seenFill: g('mf-seenFill').value === '1', fixedFill: g('mf-fixedFill').value === '1' };
      jset('prefs', prefs);
      syncSaveGoogle({ myfam_prefs: prefs });
      applyPrefs();
      if (rerender) render();
    };
    g('mf-seenColor').oninput = () => upd(false);
    g('mf-fixedColor').oninput = () => upd(false);
    g('mf-seenFill').onchange = () => upd(true);
    g('mf-fixedFill').onchange = () => upd(true);
    g('mf-reset').onclick = () => { prefs = { ...PREF_DEFAULT }; jset('prefs', prefs); applyPrefs(); fill(); render(); };
    g('mf-reset-fixed').onclick = async () => {
      if (await showAppConfirm('לאפס את כל הסימונים הידניים של מוצרים קבועים?\nכל המוצרים שהוזמנו 3 פעמים ומעלה יחזרו להיות קבועים אוטומטית.', 'איפוס סימונים ידניים')) {
        state.fixed = {};
        save();
        render();
        showToast('הסימונים הידניים אופסו בהצלחה!', 'success');
      }
    };
    g('mf-open-feedback').onclick = () => { m.remove(); openFeedbackPage(); };

    // סגירה ודאית באמצעות X או לחיצה על הרקע
    const closeBtn = $('.myfam-x', m);
    if (closeBtn) closeBtn.onclick = () => m.remove();
    m.onclick = e => { if (e.target === m || e.target.closest('.myfam-x')) m.remove(); };
  }

  /* ---------- מדריך וטיפים לשימוש (סיור מודרך) ---------- */
  const TIPS_DATA = [
    {
      title: 'ברוכים הבאים לתוסף "מוסיף למשנת"!',
      badge: 'היכרות קצרה',
      icon: ICONS.basket,
      text: `התוסף הופך את הקניות השבועיות במשנת יוסף למהירות, פשוטות ומסודרות הרבה יותר.<br><br>
        הוא מזהה אוטומטית מוצרים שהזמנתם בעבר, שומר היסטוריה מלאה, ומאפשר לכם למלא את הסל של כל הקבועים בקליק אחד.`
    },
    {
      title: 'סנכרון היסטוריית הקניות שלכם',
      badge: 'צעד ראשון וחשוב',
      icon: ICONS.download,
      text: `כדי שהתוסף יכיר את כל המוצרים שהזמנתם בעבר, לחצו בתפריט התוסף על <b>"ייבא היסטוריה מהאתר"</b>.<br><br>
        התוסף ימשוך בצורה בטוחה וישירה את ההזמנות הקודמות שלכם, יסמן את כל מה שהזמנתם בעבר, ויגדיר מוצרים קבועים אוטומטית.`
    },
    {
      title: 'מוצרים קבועים והוספה מהירה לסל',
      badge: 'חיסכון עצום בזמן',
      icon: ICONS.starFilled,
      text: `כל מוצר שהוזמן 3 פעמים ומעלה מסומן אוטומטית כ<b>מוצר קבוע ⭐</b>.<br><br>
        רוצים לקבוע מוצר בעצמכם? פשוט לחצו על כוכב הסימון שמופיע על כל כרטיס מוצר.<br>
        בכל שבוע, לחצו על <b>"הוסף את כל הקבועים לסל"</b> וכל המוצרים הקבועים שלכם שבמכירה יתווספו לסל ברגע!`
    },
    {
      title: 'סינון תצוגה והיסטוריה מפורטת',
      badge: 'סדר ונוחות מקסימלית',
      icon: ICONS.history,
      text: `מתלבטים מה חסר לכם? בתפריט התוסף תוכלו לסנן ולראות <b>"רק מה שהוזמן בעבר"</b> או <b>"רק קבועים"</b> בלחיצה אחת.<br><br>
        בלחיצה על <b>"היסטוריית קניות"</b> תוכלו לראות פירוט מדויק של כל המוצרים, כמויות מצטברות, תאריכי הזמנות ודוחות מלאים.`
    },
    {
      title: 'רשימת הדפסה לאיסוף והתראות מכירה',
      badge: 'יום החלוקה והתראות',
      icon: ICONS.print,
      text: `בלחיצה על <b>"הדפס רשימת קניות לאיסוף"</b> תקבלו דף מסודר ומעוצב עם כמויות מודגשות, תמונות המוצרים ותיבות סימון לבדיקה בתחנת החלוקה.<br><br>
        בנוסף, בהגדרות התוסף תוכלו להפעיל <b>התראות דפדפן</b> שיזכירו לכם מתי המכירה נפתחת ולפני שהיא ננעלת!`
    }
  ];

  function showTipsTour(stepIndex = 0) {
    $('#myfam-tips-modal')?.remove();
    const cur = TIPS_DATA[stepIndex];
    if (!cur) return;

    const m = document.createElement('div');
    m.id = 'myfam-tips-modal';
    m.innerHTML = `
      <div class="myfam-tips-box">
        <button class="myfam-x" title="סגור">${ICONS.close}</button>

        <div class="myfam-tips-badge">${esc(cur.badge)}</div>
        <div class="myfam-tips-header">
          <span class="myfam-tips-icon">${cur.icon}</span>
          <h2 class="myfam-tips-title">${esc(cur.title)}</h2>
        </div>

        <div class="myfam-tips-content">
          ${cur.text}
        </div>

        <div class="myfam-tips-dots">
          ${TIPS_DATA.map((_, i) => `<span class="myfam-tips-dot ${i === stepIndex ? 'active' : ''}" data-step="${i}"></span>`).join('')}
        </div>

        <div class="myfam-tips-actions">
          <button class="myfam-tips-btn-dismiss" id="myfam-tips-dontshow">אל תציג טיפים אלו שוב</button>
          <div style="display:flex;gap:8px;">
            ${stepIndex > 0 ? `<button class="myfam-tips-btn-prev" id="myfam-tips-prev">❮ הקודם</button>` : ''}
            <button class="myfam-tips-btn-next" id="myfam-tips-next">
              ${stepIndex < TIPS_DATA.length - 1 ? 'הבא ❯' : 'סיום והבנתי ✓'}
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(m);

    // עדכון תאריך הצגה אחרון
    localStorage.setItem(LS + 'tips_last_shown', Date.now());

    // סגירה
    const close = () => m.remove();
    const xBtn = $('.myfam-x', m);
    if (xBtn) xBtn.onclick = close;
    m.onclick = e => { if (e.target === m || e.target.closest('.myfam-x')) close(); };

    // כפתור אל תציג שוב
    const btnDismiss = $('#myfam-tips-dontshow', m);
    if (btnDismiss) {
      btnDismiss.onclick = () => {
        localStorage.setItem(LS + 'tips_dismissed', 'true');
        m.remove();
        showToast('הטיפים בוטלו ולא יוצגו שוב באופן אוטומטי', 'info');
      };
    }

    // ניווט
    const btnNext = $('#myfam-tips-next', m);
    if (btnNext) {
      btnNext.onclick = () => {
        if (stepIndex < TIPS_DATA.length - 1) {
          m.remove();
          showTipsTour(stepIndex + 1);
        } else {
          m.remove();
          showToast('קנייה מהנה ומוצלחת במשנת יוסף! 🎉', 'success');
        }
      };
    }
    const btnPrev = $('#myfam-tips-prev', m);
    if (btnPrev) {
      btnPrev.onclick = () => {
        m.remove();
        showTipsTour(stepIndex - 1);
      };
    }

    // לחיצה על נקודות
    m.querySelectorAll('.myfam-tips-dot').forEach(d => {
      d.onclick = () => {
        const s = parseInt(d.dataset.step, 10);
        m.remove();
        showTipsTour(s);
      };
    });
  }

  function checkTipsReminder() {
    if (!isProductSelectionPage()) return;
    if (localStorage.getItem(LS + 'tips_dismissed') === 'true') return;
    const last = localStorage.getItem(LS + 'tips_last_shown');
    const ninetyDays = 90 * 24 * 60 * 60 * 1000;
    if (!last || (Date.now() - Number(last) >= ninetyDays)) {
      setTimeout(() => {
        if (isProductSelectionPage()) showTipsTour(0);
      }, 1200);
    }
  }

  function checkFeedbackReminder() {
    const KEY_INSTALL = 'installed_at';
    const KEY_PROMPTED = 'feedback_prompted';
    let installed = localStorage.getItem(LS + KEY_INSTALL);
    if (!installed) {
      localStorage.setItem(LS + KEY_INSTALL, Date.now());
      return;
    }
    const twoWeeks = 14 * 24 * 60 * 60 * 1000;
    if (Date.now() - Number(installed) >= twoWeeks && !localStorage.getItem(LS + KEY_PROMPTED)) {
      localStorage.setItem(LS + KEY_PROMPTED, 'true');
      openFeedbackPage();
    }
  }

  function buildUI() {
    if (document.getElementById('myfam-style')) return;

    const css = document.createElement('style');
    css.id = 'myfam-style';
    css.textContent = `
      .myfam-seen{outline:3px solid var(--myfam-seen,#2e9e5b)!important;outline-offset:-3px}
      .myfam-fixed{outline:3px solid var(--myfam-fixed,#e0a800)!important;outline-offset:-3px}
      .myfam-seen.myfam-fill{background-color:var(--myfam-seen-bg,#2e9e5b33)!important}
      .myfam-fixed.myfam-fill{background-color:var(--myfam-fixed-bg,#e0a80040)!important}
      .myfam-hide{display:none!important}
      .myfam-tag{position:absolute;top:8px;left:50%;transform:translateX(-50%);z-index:4;pointer-events:none;display:inline-flex;align-items:center;gap:4px;width:fit-content;max-width:calc(100% - 130px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:0;padding:2px 8px;background:#fff7ed;color:#c2410c;border:1px solid #ffedd5;border-radius:10px;font:bold 12px sans-serif;direction:rtl;box-sizing:border-box;box-shadow:0 1px 3px rgba(0,0,0,.12)}
      .myfam-tag.fixed{background:#fef3c7;color:#92400e;border:1px solid #fde68a}
      .myfam-tag svg{flex-shrink:0}

      #myfam-import-modal{position:fixed;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(2px);z-index:100002;display:flex;align-items:center;justify-content:center;direction:rtl;font-family:sans-serif}
      .myfam-import-box{width:min(440px,94vw);background:#fff;border-radius:16px;padding:24px 26px;position:relative;box-shadow:0 12px 30px rgba(0,0,0,0.22)}
      @keyframes myfam-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

      .myfam-starbtn{position:absolute;top:50px;right:14px;z-index:5;width:34px;height:34px;border:2px solid transparent;border-radius:50%;background:transparent;color:#888;font-size:20px;line-height:1;padding:0;cursor:pointer;opacity:0;transition:opacity .15s,background .15s,border-color .15s}
      .myfam-card:hover .myfam-starbtn, .myfam-starbtn.on{opacity:1}
      .myfam-starbtn:hover{background:#ffe08a;border-color:#e0a800;color:#8a6500;opacity:1}
      .myfam-starbtn.on{color:#e0a800;opacity:1}

      /* כפתור פאנל ראשי */
      #myfam-panel{position:relative;display:inline-flex;align-items:center;flex:0 0 auto;margin:0 8px;direction:rtl;font:14px system-ui,-apple-system,sans-serif}
      #myfam-panel.floating{position:fixed;z-index:99999;margin:0}
      #myfam-toggle{width:42px;height:42px;border:1.5px solid #10b981;border-radius:12px;background:#ffffff;color:#059669;font-size:20px;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(16,185,129,0.22);transition:all .2s ease}
      #myfam-toggle:hover{background:#ecfdf5;transform:translateY(-2px);box-shadow:0 6px 18px rgba(16,185,129,0.32)}

      /* תפריט נפתח ראשי - עיצוב חדש, גלילה פנימית קבועה ומניעת חריגה */
      #myfam-body{position:fixed;z-index:100000;width:310px;max-height:calc(100vh - 40px);overflow-y:auto !important;overflow-x:hidden;display:flex;flex-direction:column;gap:12px;background:#ffffff;border:1px solid #cbd5e1;border-radius:18px;padding:14px;box-shadow:0 20px 45px -10px rgba(15,23,42,0.25), 0 0 0 1px rgba(15,23,42,0.08);direction:rtl;font-family:system-ui,-apple-system,sans-serif;box-sizing:border-box;scrollbar-width:thin;scrollbar-color:#94a3b8 #f1f5f9}
      #myfam-body.collapsed{display:none}
      #myfam-body::-webkit-scrollbar{width:7px;display:block}
      #myfam-body::-webkit-scrollbar-track{background:#f8fafc;border-radius:4px}
      #myfam-body::-webkit-scrollbar-thumb{background:#94a3b8;border-radius:4px}
      #myfam-body::-webkit-scrollbar-thumb:hover{background:#64748b}

      /* כותרת עליונה של התפריט */
      .myfam-menu-header{display:flex;align-items:center;justify-content:space-between;padding-bottom:10px;border-bottom:1px solid #f1f5f9}
      .myfam-menu-title{font-size:16px;font-weight:800;color:#0f172a;display:flex;align-items:center;gap:6px}
      .myfam-menu-btn-icon{border:none;background:#f1f5f9;color:#64748b;width:28px;height:28px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;transition:all .15s}
      .myfam-menu-btn-icon:hover{background:#e2e8f0;color:#0f172a}

      /* שורת שני כרטיסים צמודים (תקציב + חיסכון) */
      .myfam-two-cards-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      .myfam-side-card{border:1px solid #cbd5e1;border-radius:14px;padding:10px 8px;background:#ffffff;display:flex;flex-direction:column;align-items:center;justify-content:space-between;text-align:center;box-sizing:border-box;min-height:148px}
      .myfam-side-card.savings-green{background:#ecfdf5;border-color:#a7f3d0}
      .myfam-card-title{font-size:13.5px;font-weight:800;color:#1e293b;margin-bottom:2px}
      .myfam-side-card.savings-green .myfam-card-title{color:#065f46}

      /* חוגת מד תקציב */
      .myfam-gauge-wrap{position:relative;width:76px;height:76px;margin:2px 0;display:flex;align-items:center;justify-content:center}
      .myfam-gauge-svg{transform:rotate(-90deg);width:76px;height:76px}
      .myfam-gauge-text{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;text-align:center}
      .myfam-gauge-val{font-size:15px;font-weight:800;color:#0f172a;line-height:1.1}
      .myfam-gauge-sub{font-size:10px;color:#64748b;margin-top:2px}

      /* תוכן כרטיס חיסכון */
      .myfam-sav-sub{font-size:11px;color:#047857}
      .myfam-sav-val{font-size:22px;font-weight:800;color:#059669;line-height:1.1;margin:4px 0 2px}
      .myfam-sav-detail{font-size:10px;color:#047857;line-height:1.2}

      .myfam-card-btn{width:100%;border-radius:8px;padding:4px 6px;font-size:11.5px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px;transition:all .15s}
      .myfam-btn-edit-budget{background:transparent;border:none;color:#64748b}
      .myfam-btn-edit-budget:hover{color:#0f172a;background:#f1f5f9}
      .myfam-btn-savings-modal{background:#ffffff;border:1px solid #6ee7b7;color:#065f46}
      .myfam-btn-savings-modal:hover{background:#d1fae5}

      /* כותרות סקשן */
      .myfam-sec-heading{font-size:13px;font-weight:800;color:#1e293b;margin:0 0 6px;text-align:right}

      /* סרגל סינון מהיר מחולק (Segmented Bar) */
      .myfam-filter-bar{display:flex;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:10px;padding:2px;gap:2px}
      .myfam-filter-tab{flex:1;border:none;background:transparent;padding:6px 2px;font-size:12px;font-weight:600;color:#64748b;border-radius:8px;cursor:pointer;text-align:center;transition:all .15s}
      .myfam-filter-tab:hover{color:#0f172a}
      .myfam-filter-tab.active{background:#ffffff;color:#0f172a;font-weight:800;box-shadow:0 1px 3px rgba(0,0,0,0.1)}

      /* כפתור הוספת כל הקבועים לסל */
      .myfam-btn-add-fixed-all{width:100%;background:#065f46;color:#ffffff;border:none;border-radius:12px;padding:11px 14px;font-size:13.5px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 12px rgba(6,95,70,0.28);transition:all .15s;margin-top:6px}
      .myfam-btn-add-fixed-all:hover{background:#047857;transform:translateY(-1px);box-shadow:0 6px 16px rgba(6,95,70,0.36)}

      /* רשת כפתורי כלים 2x2 */
      .myfam-tools-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      .myfam-tool-btn{border-radius:11px;padding:12px 6px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;font-size:12px;font-weight:700;cursor:pointer;transition:all .15s;border:1px solid transparent}
      .myfam-tool-btn:hover{transform:translateY(-1px)}
      .myfam-tool-btn svg{width:18px;height:18px}
      .tool-comp{background:#ecfdf5;border-color:#a7f3d0;color:#065f46}
      .tool-comp:hover{background:#d1fae5}
      .tool-print{background:#f0f9ff;border-color:#bae6fd;color:#0369a1}
      .tool-print:hover{background:#e0f2fe}
      .tool-tips{background:#fffbeb;border-color:#fde68a;color:#b45309}
      .tool-tips:hover{background:#fef3c7}
      .tool-import{background:#f5f3ff;border-color:#ddd6fe;color:#6d28d9}
      .tool-import:hover{background:#ede9fe}

      /* תחתית הגדרות וסטטוס */
      .myfam-bottom-panel{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:9px 12px;display:flex;flex-direction:column;gap:6px;font-size:11px;color:#64748b}
      .myfam-bottom-header{display:flex;align-items:center;justify-content:space-between;cursor:pointer;font-weight:700;color:#334155}
      .myfam-bottom-header:hover{color:#0f172a}
      .myfam-bottom-links{display:flex;flex-direction:column;gap:5px;padding-top:6px;border-top:1px solid #e2e8f0}
      .myfam-bottom-links button{background:#fff;border:1px solid #cbd5e1;border-radius:6px;padding:5px 8px;font-size:11.5px;color:#334155;cursor:pointer;text-align:right;font-weight:600}
      .myfam-bottom-links button:hover{background:#f1f5f9}
      .myfam-status-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#22c55e;margin-left:4px}
      .myfam-author-link{color:#0284c7;text-decoration:none;font-weight:600}
      .myfam-author-link:hover{text-decoration:underline}

      /* חלונות מודאל */
      #myfam-modal{position:fixed;inset:0;background:rgba(15,23,42,0.6);backdrop-filter:blur(3px);z-index:100001;display:flex;align-items:center;justify-content:center;direction:rtl;font-family:system-ui,-apple-system,sans-serif}
      .myfam-box{background:#fff;max-height:88vh;overflow:auto;padding:24px;border-radius:18px;min-width:320px;position:relative;box-shadow:0 24px 50px -12px rgba(15,23,42,0.28);box-sizing:border-box}
      .myfam-set{width:min(470px,94vw)}
      
      /* כפתור סגירה X - אמין וחסין ללחיצות על svg */
      .myfam-x{position:absolute;top:14px;left:14px;border:none;background:#f1f5f9;color:#64748b;width:32px;height:32px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;transition:all .15s}
      .myfam-x:hover{background:#e2e8f0;color:#0f172a;transform:scale(1.05)}
      .myfam-x svg,.myfam-x line,.myfam-x path{pointer-events:none}

      /* רכיבי הגדרות מעוצבים */
      .myfam-set-section{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;margin-bottom:12px}
      .myfam-set-sec-title{margin:0 0 10px;font-size:13px;font-weight:700;color:#1e293b}
      .myfam-row{display:flex;gap:10px;align-items:center;margin:8px 0}
      .myfam-row span{min-width:85px;font-size:13px;color:#334155;font-weight:500}
      .myfam-color-pick{width:34px;height:34px;border:1px solid #cbd5e1;border-radius:8px;cursor:pointer;padding:2px;background:#fff}
      .myfam-select-box{padding:6px 10px;border:1px solid #cbd5e1;border-radius:8px;font-size:12px;background:#fff;color:#334155;outline:none}
      .myfam-input-text{width:100%;padding:7px 10px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px;box-sizing:border-box;margin-top:4px;outline:none}
      .myfam-input-text:focus{border-color:#2e9e5b}
      .myfam-sec-btn{padding:7px 12px;background:#fff;border:1px solid #cbd5e1;border-radius:8px;font-size:12px;color:#475569;cursor:pointer;font-weight:600;transition:all .15s}
      .myfam-sec-btn:hover{background:#f1f5f9;border-color:#94a3b8}
      .myfam-btn-primary{padding:9px 16px;background:#2e9e5b;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:bold;cursor:pointer;box-shadow:0 2px 8px rgba(46,158,91,0.25);transition:background .15s}
      .myfam-btn-primary:hover{background:#237b46}

      .myfam-order{border-bottom:1px solid #f1f5f9;padding:8px 0}
      .myfam-footer-credits{margin-top:16px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;text-align:center;line-height:1.6}
      .myfam-footer-credits a{color:#2e9e5b;text-decoration:none;font-weight:600}

      /* עיצוב חלונית היסטוריית קניות מורחבת */
      .myfam-hist-box{width:min(780px,95vw);max-height:90vh;display:flex;flex-direction:column;padding:22px 24px}
      .myfam-hist-header{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid #e2e8f0;flex-wrap:wrap}
      .myfam-hist-sync-btn,.myfam-hist-print-btn{display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:8px;font-size:12px;font-weight:bold;cursor:pointer}
      .myfam-hist-sync-btn{background:#eef7f1;border:1px solid #2e9e5b;color:#1e6b3e}
      .myfam-hist-sync-btn:hover{background:#dcf2e3}
      .myfam-hist-print-btn{background:#f8fafc;border:1px solid #cbd5e1;color:#334155}
      .myfam-hist-print-btn:hover{background:#f1f5f9}

      .myfam-hist-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:14px}
      .myfam-hist-stat-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 12px;display:flex;flex-direction:column;align-items:center;text-align:center}
      .myfam-hist-stat-num{font-size:18px;font-weight:bold;line-height:1.2}
      .myfam-hist-stat-lbl{font-size:11px;color:#64748b;margin-top:2px}
      .myfam-hist-stat-top{grid-column:span 2}

      .myfam-hist-controls{display:flex;flex-direction:column;gap:10px;margin-bottom:12px;background:#f8fafc;padding:10px 12px;border-radius:10px;border:1px solid #e2e8f0}
      .myfam-hist-tabs{display:flex;gap:6px}
      .myfam-hist-tab{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:8px 12px;background:#fff;border:1px solid #cbd5e1;border-radius:8px;font-size:13px;font-weight:600;color:#475569;cursor:pointer;transition:all .15s}
      .myfam-hist-tab.active{background:#2e9e5b;color:#fff;border-color:#2e9e5b}
      .myfam-hist-filter-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
      .myfam-hist-search{position:relative;flex:1;min-width:180px;display:flex;align-items:center}
      .myfam-hist-search svg{position:absolute;right:10px;color:#94a3b8;pointer-events:none}
      .myfam-hist-search input{width:100%;padding:7px 32px 7px 24px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px;box-sizing:border-box}
      .myfam-hist-search input:focus{border-color:#2e9e5b;outline:none}
      #myfam-hist-search-clear{position:absolute;left:6px;background:none;border:none;color:#94a3b8;cursor:pointer;font-size:12px;padding:2px}
      .myfam-hist-filters{display:flex;align-items:center;gap:8px}
      .myfam-hist-pill-btn{display:inline-flex;align-items:center;gap:4px;padding:6px 10px;border-radius:20px;border:1px solid #cbd5e1;background:#fff;font-size:12px;cursor:pointer;color:#334155}
      .myfam-hist-pill-btn.active{background:#fef3c7;border-color:#f59e0b;color:#92400e;font-weight:bold}
      .myfam-hist-sort-wrap{display:flex;align-items:center;gap:4px}
      .myfam-hist-sort-wrap select{padding:5px 8px;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;background:#fff;color:#334155}

      .myfam-hist-body{flex:1;overflow-y:auto;padding-right:2px;max-height:44vh}
      .myfam-hist-empty{text-align:center;padding:30px 10px;color:#94a3b8;font-size:14px}

      .myfam-hist-table-wrap{overflow-x:auto}
      .myfam-hist-table{width:100%;border-collapse:collapse;font-size:13px;text-align:right}
      .myfam-hist-table th{background:#f1f5f9;color:#475569;font-weight:600;padding:8px 10px;border-bottom:2px solid #e2e8f0;position:sticky;top:0;z-index:2}
      .myfam-hist-table td{padding:8px 10px;border-bottom:1px solid #f1f5f9}
      .myfam-hist-table tr:hover td{background:#f8fafc}
      .myfam-row-fixed td{background:#fffbeb}
      .myfam-row-fixed:hover td{background:#fef3c7}

      .myfam-hist-starbtn{background:none;border:none;cursor:pointer;padding:4px;display:flex;align-items:center;justify-content:center;color:#94a3b8}
      .myfam-hist-starbtn.on{color:#e0a800}
      .myfam-hist-pname{display:flex;align-items:center;gap:6px}
      .myfam-hist-badge-fixed{background:#fef3c7;color:#92400e;border:1px solid #fde68a;font-size:10px;font-weight:bold;padding:1px 6px;border-radius:8px}

      .myfam-hist-pill{display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:bold}
      .pill-gold{background:#fef3c7;color:#92400e;border:1px solid #fde68a}
      .pill-green{background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0}
      .pill-gray{background:#f1f5f9;color:#475569;border:1px solid #e2e8f0}
      .myfam-hist-qty{font-weight:bold;color:#0f172a}

      .myfam-hist-order-card{background:#fff;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:8px;overflow:hidden;transition:box-shadow .15s}
      .myfam-hist-order-card:hover{box-shadow:0 2px 8px rgba(0,0,0,0.06)}
      .myfam-hist-order-head{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#f8fafc;cursor:pointer;user-select:none}
      .myfam-hist-order-title{display:flex;align-items:center;gap:8px;font-size:13px;flex-wrap:wrap}
      .myfam-hist-order-toggle{display:inline-flex;transition:transform .2s;color:#64748b}
      .myfam-hist-order-card.collapsed .myfam-hist-order-toggle{transform:rotate(90deg)}
      .myfam-hist-order-card.collapsed .myfam-hist-order-body{display:none}
      .myfam-hist-order-date{font-size:12px;color:#64748b}
      .myfam-hist-order-actions{display:flex;align-items:center;gap:6px}
      .myfam-hist-print-order-btn{display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border:1px solid #10b981;background:#f0fdf4;color:#065f46;border-radius:6px;font-size:11.5px;font-weight:bold;cursor:pointer;transition:all .15s}
      .myfam-hist-print-order-btn:hover{background:#dcfce7;border-color:#059669}
      .myfam-hist-del-btn{display:inline-flex;align-items:center;gap:4px;padding:4px 8px;border:1px solid #fca5a5;background:#fff5f5;color:#b91c1c;border-radius:6px;font-size:11px;font-weight:bold;cursor:pointer}
      .myfam-hist-del-btn:hover{background:#fee2e2}
      .myfam-hist-order-body{padding:10px 14px}
      .myfam-hist-order-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:6px;font-size:12px}
      .myfam-hist-order-item{display:flex;justify-content:space-between;background:#f8fafc;padding:5px 8px;border-radius:6px;border:1px solid #f1f5f9}
      .myfam-hist-item-name{color:#1e293b;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .myfam-hist-item-qty{font-weight:bold;color:#2e9e5b;margin-right:6px}

      /* מחוון צף Toast */
      #myfam-toast{position:fixed;bottom:26px;left:50%;transform:translateX(-50%) translateY(30px);z-index:100003;background:#1e293b;color:#fff;padding:10px 18px;border-radius:12px;font:13.5px/1.4 system-ui,-apple-system,sans-serif;direction:rtl;display:flex;align-items:center;gap:10px;box-shadow:0 12px 28px rgba(15,23,42,0.28);opacity:0;pointer-events:none;transition:transform .25s cubic-bezier(0.16,1,0.3,1),opacity .25s ease}
      #myfam-toast.show{transform:translateX(-50%) translateY(0);opacity:1;pointer-events:auto}
      #myfam-toast.toast-gold{background:#78350f;color:#fff;border:1.5px solid #f59e0b;box-shadow:0 12px 28px rgba(180,83,9,0.35)}
      #myfam-toast.toast-info{background:#064e3b;color:#fff;border:1.5px solid #10b981;box-shadow:0 12px 28px rgba(6,95,70,0.35)}
      #myfam-toast .toast-icon{display:flex;align-items:center;justify-content:center;flex-shrink:0}

      /* סימון פילטר פעיל בתפריט */
      #myfam-body button.active-filter{background:#2e9e5b !important;color:#fff !important;border-color:#2e9e5b !important;box-shadow:0 2px 8px rgba(46,158,91,0.35) !important}
      #myfam-active-filter-bar{display:none;align-items:center;justify-content:space-between;background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:6px 10px;font-size:11.5px;color:#92400e;margin-top:-2px}
      #myfam-clear-filter-btn{background:#fff;border:1px solid #d97706;color:#b45309;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:bold;cursor:pointer}
      #myfam-clear-filter-btn:hover{background:#fde68a}

      /* מודאל מדריך וטיפים */
      #myfam-tips-modal{position:fixed;inset:0;background:rgba(15,23,42,0.6);backdrop-filter:blur(3px);z-index:100004;display:flex;align-items:center;justify-content:center;direction:rtl;font-family:system-ui,-apple-system,sans-serif}
      .myfam-tips-box{width:min(480px,94vw);background:#fff;border-radius:20px;padding:26px 28px;position:relative;box-shadow:0 24px 50px -12px rgba(15,23,42,0.3)}
      .myfam-tips-badge{display:inline-block;padding:3px 10px;border-radius:12px;background:#ecfdf5;color:#065f46;font-size:11px;font-weight:bold;margin-bottom:8px}
      .myfam-tips-header{display:flex;align-items:center;gap:12px;margin-bottom:14px}
      .myfam-tips-icon{width:40px;height:40px;border-radius:10px;background:#f0fdf4;border:1px solid #a7f3d0;color:#059669;display:flex;align-items:center;justify-content:center;flex-shrink:0}
      .myfam-tips-title{margin:0;font-size:17px;font-weight:800;color:#0f172a}
      .myfam-tips-content{font-size:13.5px;line-height:1.6;color:#334155;min-height:95px;margin-bottom:18px}
      .myfam-tips-dots{display:flex;justify-content:center;gap:6px;margin-bottom:18px}
      .myfam-tips-dot{width:8px;height:8px;border-radius:50%;background:#cbd5e1;cursor:pointer;transition:all .2s}
      .myfam-tips-dot.active{background:#2e9e5b;width:22px;border-radius:4px}
      .myfam-tips-actions{display:flex;justify-content:space-between;align-items:center;gap:10px;border-top:1px solid #f1f5f9;padding-top:14px}
      .myfam-tips-btn-dismiss{background:none;border:none;color:#94a3b8;font-size:11.5px;cursor:pointer;padding:4px}
      .myfam-tips-btn-dismiss:hover{color:#ef4444;text-decoration:underline}
      .myfam-tips-btn-prev{padding:7px 14px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;font-size:12.5px;font-weight:600;color:#475569;cursor:pointer}
      .myfam-tips-btn-prev:hover{background:#f1f5f9}
      .myfam-tips-btn-next{padding:7px 18px;background:#2e9e5b;border:none;border-radius:8px;font-size:12.5px;font-weight:bold;color:#fff;cursor:pointer;box-shadow:0 2px 6px rgba(46,158,91,0.25)}
      .myfam-tips-btn-next:hover{background:#237b46}

      /* באנר תזכורת חכמה לייבוא היסטוריה */
      #myfam-missing-hist-banner{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:99998;width:min(600px,94vw);background:#ffffff;border:1.5px solid #10b981;border-radius:14px;box-shadow:0 12px 30px rgba(16,185,129,0.25);direction:rtl;font-family:system-ui,-apple-system,sans-serif;animation:myfam-slide-down .3s ease}
      @keyframes myfam-slide-down{from{transform:translateX(-50%) translateY(-20px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}
      .myfam-missing-hist-content{display:flex;align-items:center;gap:12px;padding:12px 16px;flex-wrap:wrap}
      .myfam-missing-hist-icon{width:36px;height:36px;border-radius:10px;background:#ecfdf5;color:#059669;display:flex;align-items:center;justify-content:center;flex-shrink:0}
      .myfam-missing-hist-text{flex:1;min-width:200px;display:flex;flex-direction:column;gap:2px}
      .myfam-missing-hist-text b{font-size:13.5px;color:#065f46}
      .myfam-missing-hist-text span{font-size:12px;color:#475569}
      .myfam-missing-hist-btns{display:flex;align-items:center;gap:8px}

      /* תגית תקציב צפה (Pill) ליד כפתור הסל */
      .myfam-budget-pill{cursor:pointer;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:3px 8px;border-radius:10px;background:#ffffff;box-shadow:0 3px 10px rgba(0,0,0,0.08);border:1.5px solid #e2e8f0;font-family:system-ui,-apple-system,sans-serif;user-select:none;transition:all .18s;min-width:88px;height:42px;box-sizing:border-box}
      .myfam-budget-pill:hover{transform:translateY(-2px);box-shadow:0 5px 14px rgba(0,0,0,0.12)}
      .myfam-pill-nums{font-size:11.5px;font-weight:700;line-height:1.2;font-variant-numeric:tabular-nums}
      .myfam-pill-bar{width:100%;height:3.5px;background:#e2e8f0;border-radius:2px;overflow:hidden;margin-top:3px}
      .myfam-pill-fill{height:100%;border-radius:2px;transition:width .3s ease}

      /* צבעי סטטוס תגית תקציב */
      .myfam-budget-pill.budget-ok{border-color:#a7f3d0;color:#065f46;background:#f0fdf4}
      .myfam-budget-pill.budget-ok .myfam-pill-fill{background:linear-gradient(90deg,#10b981,#059669)}
      .myfam-budget-pill.budget-warn{border-color:#fde68a;color:#92400e;background:#fffbeb}
      .myfam-budget-pill.budget-warn .myfam-pill-fill{background:linear-gradient(90deg,#f59e0b,#d97706)}
      .myfam-budget-pill.budget-over{border-color:#fbcfe8;color:#831843;background:#fdf2f8}
      .myfam-budget-pill.budget-over .myfam-pill-fill{background:linear-gradient(90deg,#db2777,#9d174d)}

      /* וידג'ט תקציב בתוך הפאנל הראשי */
      .myfam-budget-widget{margin-bottom:6px}
      .myfam-budget-empty{display:flex;align-items:center;gap:8px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:10px;padding:7px 9px;cursor:pointer;transition:all .15s}
      .myfam-budget-empty:hover{background:#f1f5f9;border-color:#94a3b8}
      .myfam-budget-empty-icon{font-size:16px;flex-shrink:0}
      .myfam-budget-empty-info{flex:1;display:flex;flex-direction:column;font-size:11px}
      .myfam-budget-empty-info b{color:#1e293b;font-size:11.5px}
      .myfam-budget-empty-info span{color:#64748b;font-size:10px}
      .myfam-budget-empty-btn{background:#2e9e5b;color:#fff;border:none;border-radius:6px;padding:3px 7px;font-size:10.5px;font-weight:bold;cursor:pointer}

      .myfam-budget-card{border-radius:12px;padding:9px 11px;display:flex;flex-direction:column;gap:5px;border:1px solid #e2e8f0}
      .myfam-budget-card.budget-ok{background:#f0fdf4;border-color:#bbf7d0}
      .myfam-budget-card.budget-warn{background:#fffbeb;border-color:#fde68a}
      .myfam-budget-card.budget-over{background:#fdf2f8;border-color:#fbcfe8}

      .myfam-budget-top{display:flex;justify-content:space-between;align-items:center}
      .myfam-budget-title{display:flex;align-items:center;gap:5px;font-size:11.5px;color:#334155}
      .myfam-budget-edit-btn{background:none;border:none;color:#64748b;font-size:10.5px;cursor:pointer;padding:1px 4px;border-radius:4px}
      .myfam-budget-edit-btn:hover{background:rgba(0,0,0,0.06);color:#0f172a}

      .myfam-budget-nums-row{display:flex;justify-content:space-between;align-items:center;font-size:11.5px}
      .myfam-budget-nums-row b{font-size:13px}
      .myfam-budget-pct-badge{font-size:10.5px;font-weight:bold;padding:1px 5px;border-radius:6px;background:rgba(255,255,255,0.85)}

      .myfam-budget-prog-track{width:100%;height:5.5px;background:rgba(0,0,0,0.08);border-radius:3px;overflow:hidden}
      .myfam-budget-prog-fill{height:100%;border-radius:3px;transition:width .3s ease}
      .budget-ok .myfam-budget-prog-fill{background:linear-gradient(90deg,#10b981,#059669)}
      .budget-warn .myfam-budget-prog-fill{background:linear-gradient(90deg,#f59e0b,#d97706)}
      .budget-over .myfam-budget-prog-fill{background:linear-gradient(90deg,#db2777,#9d174d)}

      .myfam-budget-status-row{font-size:10.5px;font-weight:600;display:flex;align-items:center;gap:4px}
      .budget-ok .myfam-budget-status-row{color:#065f46}
      .budget-warn .myfam-budget-status-row{color:#92400e}
      .budget-over .myfam-budget-status-row{color:#831843}

      /* מודאל תקציב */
      #myfam-budget-modal{position:fixed;inset:0;background:rgba(15,23,42,0.6);backdrop-filter:blur(3px);z-index:100005;display:flex;align-items:center;justify-content:center;direction:rtl;font-family:system-ui,-apple-system,sans-serif}
      .myfam-budget-modal-box{width:min(420px,92vw);background:#fff;border-radius:18px;padding:22px;position:relative;box-shadow:0 24px 50px -12px rgba(15,23,42,0.3);box-sizing:border-box}

      /* תגית מוצרים קבועים שנשכחו ליד כפתור הסל */
      .myfam-forgotten-badge{cursor:pointer;display:flex;align-items:center;gap:6px;padding:0 10px;border-radius:10px;background:#fff7ed;border:1.5px solid #fdba74;color:#c2410c;font-size:11.5px;font-weight:700;height:42px;box-sizing:border-box;box-shadow:0 3px 10px rgba(194,65,12,0.12);user-select:none;transition:all .18s;animation:myfam-pulse 3s infinite}
      .myfam-forgotten-badge:hover{background:#ffedd5;border-color:#ea580c;transform:translateY(-2px);box-shadow:0 5px 14px rgba(194,65,12,0.2)}
      @keyframes myfam-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}

      /* שורת התראה בתפריט הפאנל */
      .myfam-forgotten-bar{background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:7px 10px;display:flex;align-items:center;justify-content:space-between;font-size:11.5px;color:#9a3412;cursor:pointer;transition:all .15s;margin-bottom:6px}
      .myfam-forgotten-bar:hover{background:#ffedd5;border-color:#fb923c}
      .myfam-forgotten-bar-content{display:flex;align-items:center;gap:6px}
      .myfam-forgotten-bar-btn{background:#ea580c;color:#fff;border:none;border-radius:6px;padding:3px 8px;font-size:11px;font-weight:bold;cursor:pointer}
      .myfam-forgotten-bar-btn:hover{background:#c2410c}

      /* מודאל מוצרים שנשכחו */
      #myfam-forgotten-modal{position:fixed;inset:0;background:rgba(15,23,42,0.6);backdrop-filter:blur(3px);z-index:100006;display:flex;align-items:center;justify-content:center;direction:rtl;font-family:system-ui,-apple-system,sans-serif}
      .myfam-forgotten-box{width:min(480px,94vw);max-height:86vh;background:#fff;border-radius:18px;padding:22px 24px;position:relative;box-shadow:0 24px 50px -12px rgba(15,23,42,0.32);display:flex;flex-direction:column;box-sizing:border-box}
      .myfam-forgotten-header{display:flex;align-items:center;gap:12px;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid #e2e8f0}
      .myfam-forgotten-icon{width:42px;height:42px;border-radius:10px;background:#fff7ed;border:1px solid #ffedd5;color:#ea580c;font-size:22px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
      .myfam-forgotten-title{margin:0 0 3px;font-size:17px;font-weight:800;color:#0f172a}
      .myfam-forgotten-subtitle{font-size:12.5px;color:#64748b;line-height:1.4}
      .myfam-forgotten-list{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding:2px 4px 6px 0;max-height:48vh}
      
      .myfam-forgotten-item-row{display:flex;align-items:center;gap:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 10px;transition:all .2s}
      .myfam-forgotten-item-row.item-added{background:#f0fdf4;border-color:#bbf7d0}
      .myfam-forgotten-item-thumb{width:38px;height:38px;border-radius:8px;background:#fff;border:1px solid #e2e8f0;overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0}
      .myfam-forgotten-item-thumb img{width:100%;height:100%;object-fit:contain}
      .myfam-forgotten-item-thumb .myfam-no-img{color:#94a3b8}
      .myfam-forgotten-item-details{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
      .myfam-forgotten-item-name{font-size:13px;font-weight:700;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .myfam-forgotten-item-sub{display:flex;align-items:center;gap:8px;font-size:11.5px;color:#64748b}
      .myfam-price-tag{font-weight:700;color:#0f172a}
      .myfam-qty-rec{background:#f1f5f9;padding:1px 6px;border-radius:6px;font-size:11px}
      
      .myfam-btn-add-single{background:#fff;border:1.5px solid #2e9e5b;color:#1e6b3e;border-radius:8px;padding:5px 12px;font-size:12px;font-weight:bold;cursor:pointer;transition:all .15s;white-space:nowrap}
      .myfam-btn-add-single:hover{background:#2e9e5b;color:#fff}
      .myfam-btn-added{background:#ecfdf5;border:1.5px solid #10b981;color:#065f46;border-radius:8px;padding:5px 12px;font-size:12px;font-weight:bold;pointer-events:none}
      
      .myfam-forgotten-footer{display:flex;gap:10px;margin-top:14px;padding-top:12px;border-top:1px solid #e2e8f0}

      /* תגית חיסכון צפה ליד כפתור הסל */
      .myfam-savings-pill{cursor:pointer;display:flex;align-items:center;gap:6px;padding:0 10px;border-radius:10px;background:#ecfdf5;border:1.5px solid #a7f3d0;color:#065f46;font-size:11.5px;font-weight:700;height:42px;box-sizing:border-box;box-shadow:0 3px 10px rgba(16,185,129,0.12);user-select:none;transition:all .18s}
      .myfam-savings-pill:hover{background:#dcfce7;border-color:#10b981;transform:translateY(-2px);box-shadow:0 5px 14px rgba(16,185,129,0.2)}

      /* וידג'ט חיסכון בתוך הפאנל הראשי */
      .myfam-savings-widget{background:linear-gradient(135deg,#f0fdf4 0%,#ecfdf5 100%);border:1.5px solid #a7f3d0;border-radius:12px;padding:9px 11px;display:flex;flex-direction:column;gap:5px;margin-bottom:6px;cursor:pointer;transition:all .15s}
      .myfam-savings-widget:hover{background:#dcfce7;border-color:#34d399;transform:translateY(-1px)}
      .myfam-savings-top{display:flex;align-items:center;gap:7px}
      .myfam-savings-badge-icon{font-size:18px;flex-shrink:0}
      .myfam-savings-main{flex:1;min-width:0}
      .myfam-savings-title{font-size:12px;color:#065f46}
      .myfam-savings-title b{font-size:13.5px;color:#047857}
      .myfam-savings-sub{font-size:10px;color:#059669;margin-top:1px}
      .myfam-savings-btn{background:#10b981;color:#fff;border:none;border-radius:6px;padding:4px 8px;font-size:11px;font-weight:bold;cursor:pointer;width:100%;text-align:center;margin-top:2px}
      .myfam-savings-btn:hover{background:#059669}

      /* תגית השוואת מחיר על כרטיס המוצר - מינימליסטית ועדינה */
      .myfam-price-comp-tag{display:inline-flex;align-items:center;gap:2px;background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;border-radius:4px;padding:0 5px;font-size:10px;font-weight:700;line-height:16px;white-space:nowrap;vertical-align:middle;margin:0 4px;cursor:help;user-select:none;pointer-events:auto;box-shadow:0 1px 2px rgba(0,0,0,0.03)}
      .myfam-price-comp-tag.tag-saving{background:#ecfdf5;color:#047857;border-color:#a7f3d0}
      .myfam-price-comp-tag.tag-expensive{background:#fef2f2;color:#b91c1c;border-color:#fecaca}
      #myfam-panel.floating #myfam-toggle{cursor:grab}
      #myfam-panel.floating.dragging #myfam-toggle{cursor:grabbing}

      /* מודאל השוואת מחירים וחיסכון */
      #myfam-savings-modal{position:fixed;inset:0;background:rgba(15,23,42,0.6);backdrop-filter:blur(3px);z-index:100007;display:flex;align-items:center;justify-content:center;direction:rtl;font-family:system-ui,-apple-system,sans-serif}
      .myfam-savings-box{width:min(720px,95vw);max-height:88vh;background:#fff;border-radius:20px;padding:24px 26px;position:relative;box-shadow:0 24px 50px -12px rgba(15,23,42,0.32);display:flex;flex-direction:column;box-sizing:border-box}
      .myfam-savings-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid #e2e8f0;flex-wrap:wrap;gap:10px}
      .myfam-savings-h-title{display:flex;align-items:center;gap:10px}
      .myfam-savings-h-icon{width:42px;height:42px;border-radius:12px;background:#ecfdf5;border:1px solid #a7f3d0;color:#059669;font-size:22px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
      .myfam-savings-h-text h3{margin:0 0 2px;font-size:18px;font-weight:800;color:#0f172a}
      .myfam-savings-h-text div{font-size:12px;color:#64748b}

      .myfam-savings-banner{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:12px 14px;margin-bottom:14px}
      .myfam-savings-card{display:flex;flex-direction:column;align-items:center;text-align:center;padding:6px;border-radius:10px}
      .myfam-savings-card.card-highlight{background:#ecfdf5;border:1.5px solid #a7f3d0}
      .myfam-savings-card-val{font-size:19px;font-weight:800;line-height:1.2}
      .myfam-savings-card-val.c-green{color:#059669}
      .myfam-savings-card-val.c-dark{color:#0f172a}
      .myfam-savings-card-lbl{font-size:11px;color:#64748b;margin-top:2px}

      .myfam-savings-disclaimer{background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:8px 12px;font-size:11.5px;color:#92400e;line-height:1.4;margin-bottom:12px}
      
      .myfam-savings-table-wrap{flex:1;overflow-y:auto;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:14px;max-height:44vh}
      .myfam-savings-table{width:100%;border-collapse:collapse;font-size:12.5px;text-align:right}
      .myfam-savings-table th{background:#f1f5f9;color:#475569;font-weight:700;padding:8px 10px;border-bottom:1.5px solid #cbd5e1;position:sticky;top:0;z-index:2}
      .myfam-savings-table td{padding:8px 10px;border-bottom:1px solid #f1f5f9;vertical-align:middle}
      .myfam-savings-table tr:hover td{background:#f8fafc}
      .myfam-td-saving{font-weight:800;color:#059669}
      .myfam-chain-pills{display:flex;gap:4px;flex-wrap:wrap;font-size:10.5px;color:#64748b;margin-top:2px}
      .myfam-chain-pill{background:#f1f5f9;padding:1px 5px;border-radius:4px}
      /* חלון התראה מותאם של התוסף */
      #myfam-app-dialog{position:fixed;inset:0;z-index:100010;direction:rtl;font-family:system-ui,-apple-system,sans-serif}
      .myfam-app-dialog-overlay{position:absolute;inset:0;background:rgba(15,23,42,0.55);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:16px}
      .myfam-app-dialog-box{width:min(440px,94vw);background:#ffffff;border-radius:18px;box-shadow:0 24px 50px -12px rgba(15,23,42,0.35);overflow:hidden;border:1px solid #e2e8f0;display:flex;flex-direction:column;animation:myfam-pop .2s ease-out}
      @keyframes myfam-pop{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
      .myfam-app-dialog-header{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #f1f5f9;background:#f8fafc}
      .myfam-app-dialog-title{display:flex;align-items:center;gap:8px;font-size:16px;font-weight:800;color:#0f172a}
      .myfam-app-dialog-logo{font-size:18px}
      .myfam-app-dialog-x{border:none;background:transparent;color:#64748b;width:28px;height:28px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;transition:all .15s}
      .myfam-app-dialog-x:hover{background:#e2e8f0;color:#0f172a}
      .myfam-app-dialog-body{padding:18px 20px;font-size:14px;line-height:1.65;color:#334155}
      .myfam-app-dialog-body p{margin:0}
      .myfam-app-dialog-footer{display:flex;justify-content:flex-end;gap:10px;padding:12px 18px;border-top:1px solid #f1f5f9;background:#f8fafc}
      .myfam-app-dialog-btn-primary{padding:9px 20px;background:#059669;color:#ffffff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(5,150,105,0.25);transition:all .15s}
      .myfam-app-dialog-btn-primary:hover{background:#047857}
      .myfam-app-dialog-btn-cancel{padding:9px 18px;background:#ffffff;color:#475569;border:1px solid #cbd5e1;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;transition:all .15s}
      .myfam-app-dialog-btn-cancel:hover{background:#f1f5f9;color:#1e293b}

    `;
    document.head.appendChild(css);

    // פאנל כפתור התוסף
    const p = document.createElement('div');
    p.id = 'myfam-panel';
    p.innerHTML = `
      <button id="myfam-toggle" title="${APP_NAME}">${ICONS.basket}</button>
      <div id="myfam-budget-pill" class="myfam-budget-pill" style="display:none;"></div>
      <div id="myfam-forgotten-badge" class="myfam-forgotten-badge" style="display:none;" title="מוצרים קבועים שנשכחו - לחץ להצגה והוספה מהירה"></div>
      <div id="myfam-savings-pill" class="myfam-savings-pill" style="display:none;" title="חיסכון משוער בסל - לחץ לדוח השוואה"></div>
    `;
    document.body.appendChild(p);

    // תפריט הפאנל - מוצמד ישירות ל-body כדי לעקוף בעיות transform/overflow של שורת הכלים
    const b = document.createElement('div');
    b.id = 'myfam-body';
    b.className = 'collapsed';
    b.innerHTML = `
      <!-- כותרת עליונה -->
      <div class="myfam-menu-header">
        <button id="myfam-btn-header-tips" class="myfam-menu-btn-icon" title="מדריך וטיפים">${ICONS.lightbulb}</button>
        <div class="myfam-menu-title">✨ ${APP_NAME} 🛒</div>
        <button id="myfam-btn-close-menu" class="myfam-menu-btn-icon" title="סגור">${ICONS.close}</button>
      </div>

      <!-- שורת שני כרטיסים צמודים: תקציב שבועי + החיסכון שלך -->
      <div class="myfam-two-cards-row">
        <!-- כרטיס תקציב שבועי -->
        <div id="myfam-budget-card" class="myfam-side-card">
          <div class="myfam-card-title">תקציב שבועי</div>
          <div class="myfam-gauge-wrap">
            <svg class="myfam-gauge-svg" viewBox="0 0 76 76">
              <circle cx="38" cy="38" r="28" fill="none" stroke="#e2e8f0" stroke-width="8"/>
              <circle id="myfam-gauge-bar" cx="38" cy="38" r="28" fill="none" stroke="#0d9488" stroke-width="8" stroke-dasharray="176" stroke-dashoffset="176" stroke-linecap="round"/>
            </svg>
            <div class="myfam-gauge-text">
              <span id="myfam-gauge-cur" class="myfam-gauge-val">₪0</span>
              <span id="myfam-gauge-tar" class="myfam-gauge-sub">הגדר</span>
            </div>
          </div>
          <button id="myfam-b-edit-budget" class="myfam-card-btn myfam-btn-edit-budget">✏️ עריכה</button>
        </div>

        <!-- כרטיס החיסכון שלך -->
        <div id="myfam-savings-card" class="myfam-side-card savings-green">
          <div class="myfam-card-title">החיסכון שלך</div>
          <div>
            <div class="myfam-sav-sub">חיסכון משוער:</div>
            <div id="myfam-sav-val" class="myfam-sav-val">₪0.0</div>
            <div id="myfam-sav-detail" class="myfam-sav-detail">בסל הנוכחי</div>
          </div>
          <button id="myfam-b-savings-detail" class="myfam-card-btn myfam-btn-savings-modal">⟨ דו"ח השוואה</button>
        </div>
      </div>

      <!-- ווידג'ט תזכורת קבועים אם חסר משהו -->
      <div id="myfam-forgotten-widget" class="myfam-forgotten-widget" style="display:none;"></div>

      <!-- סינון מוצרים מהיר -->
      <div>
        <div class="myfam-sec-heading">סינון מוצרים מהיר</div>
        <div class="myfam-filter-bar">
          <button class="myfam-filter-tab active" data-tab="all">[ הכל ]</button>
          <button class="myfam-filter-tab" data-tab="seen">🕒 הוזמן בעבר</button>
          <button class="myfam-filter-tab" data-tab="fixed">⭐ קבועים</button>
        </div>
        <button id="myfam-b-addall" class="myfam-btn-add-fixed-all">
          ${ICONS.cartPlus} <span>הוסף את כל הקבועים לסל</span>
        </button>
      </div>

      <!-- אזור כלים ושימוש (2x2) -->
      <div>
        <div class="myfam-sec-heading">אזור כלים ושימוש</div>
        <div class="myfam-tools-grid">
          <button id="myfam-b-savings" class="myfam-tool-btn tool-comp">
            ${ICONS.trendingUp}
            <span>השוואת רשימה</span>
          </button>
          <button id="myfam-b-print" class="myfam-tool-btn tool-print">
            ${ICONS.print}
            <span>הדפסת רשימה</span>
          </button>
          <button id="myfam-b-tips" class="myfam-tool-btn tool-tips">
            ${ICONS.lightbulb}
            <span>מדריך וטיפים</span>
          </button>
          <button id="myfam-b-import" class="myfam-tool-btn tool-import">
            ${ICONS.download}
            <span>ייבוא היסטוריה</span>
          </button>
        </div>
      </div>

      <!-- הגדרות, סטטוס וקרדיטים -->
      <div class="myfam-bottom-panel">
        <div id="myfam-bottom-toggle" class="myfam-bottom-header">
          <span>⚙️ הגדרות והתראות</span>
          <span id="myfam-bottom-arrow">▼</span>
        </div>
        <div id="myfam-bottom-links" class="myfam-bottom-links" style="display:none;">
          <button id="myfam-b-hist">${ICONS.history} <span>היסטוריית קניות מפורטת</span></button>
          <button id="myfam-b-set">${ICONS.settings} <span>הגדרות התוסף והתראות</span></button>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:2px;">
          <div><span class="myfam-status-dot"></span><span id="myfam-info">ממתין לנתוני המכירה...</span></div>
          <a href="https://digital.levtov.uk/" target="_blank" rel="noopener" class="myfam-author-link">לב טוב דיגיטל</a>
        </div>
      </div>
    `;
    document.body.appendChild(b);

    $('#myfam-toggle').onclick = e => {
      if (panelDragMoved) {
        panelDragMoved = false;
        e.stopPropagation();
        return;
      }
      e.stopPropagation();
      b.classList.toggle('collapsed');
      positionBody();
    };

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !b.classList.contains('collapsed')) {
        b.classList.add('collapsed');
      }
    });

    document.addEventListener('click', e => {
      if (!b.classList.contains('collapsed') && !e.target.closest('#myfam-panel,#myfam-body,#myfam-modal')) {
        b.classList.add('collapsed');
      }
    });

    addEventListener('scroll', positionBody, { passive: true, capture: true });

    // כפתורי כותרת עליונה
    $('#myfam-btn-header-tips').onclick = () => { b.classList.add('collapsed'); showTipsTour(0); };
    $('#myfam-btn-close-menu').onclick  = () => { b.classList.add('collapsed'); };

    // כפתור עריכת תקציב בכרטיס
    $('#myfam-b-edit-budget').onclick = () => { b.classList.add('collapsed'); showBudgetModal(); };

    // כפתור דוח השוואה בכרטיס החיסכון
    $('#myfam-b-savings-detail').onclick = () => { b.classList.add('collapsed'); showSavingsModal(); };

    // לשוניות סינון מהיר (Segmented bar)
    b.querySelectorAll('.myfam-filter-tab').forEach(tab => {
      tab.onclick = () => {
        b.querySelectorAll('.myfam-filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        filter = tab.dataset.tab;
        render();
      };
    });

    // כפתורי פעולות וכלים
    $('#myfam-b-addall').onclick = () => { addAllFixedToCart(); };
    $('#myfam-b-print').onclick  = () => { b.classList.add('collapsed'); printCurrentCart(); };
    $('#myfam-b-savings').onclick = () => { b.classList.add('collapsed'); showSavingsModal(); };
    $('#myfam-b-import').onclick = () => { b.classList.add('collapsed'); importHistoryFromSite(); };
    $('#myfam-b-tips').onclick   = () => { b.classList.add('collapsed'); showTipsTour(0); };

    // תחתית הגדרות נפתחת
    const bottomToggle = $('#myfam-bottom-toggle');
    const bottomLinks  = $('#myfam-bottom-links');
    const bottomArrow  = $('#myfam-bottom-arrow');
    if (bottomToggle && bottomLinks) {
      bottomToggle.onclick = () => {
        const isHidden = bottomLinks.style.display === 'none';
        bottomLinks.style.display = isHidden ? 'flex' : 'none';
        if (bottomArrow) bottomArrow.textContent = isHidden ? '▲' : '▼';
        positionBody();
        if (isHidden) {
          setTimeout(() => {
            b.scrollTo({ top: b.scrollHeight, behavior: 'smooth' });
          }, 60);
        }
      };
    }

    $('#myfam-b-hist').onclick = () => { b.classList.add('collapsed'); showHistory(); };
    $('#myfam-b-set').onclick  = () => { b.classList.add('collapsed'); showSettings(); };
  }

  function ensureUI() {
    if (checkExcluded()) return;
    if (!document.getElementById('myfam-panel') || !document.body.contains(document.getElementById('myfam-panel'))) {
      const oldB = document.getElementById('myfam-body');
      if (oldB) oldB.remove();
      const oldP = document.getElementById('myfam-panel');
      if (oldP) oldP.remove();
      const oldS = document.getElementById('myfam-style');
      if (oldS) oldS.remove();
      buildUI();
    }
  }

  /* ---------- האזנה לניווט SPA (Vue Router) ---------- */
  function onRouteChanged() {
    if (checkExcluded()) return;
    ensureUI();
    extractSaleIdFromUrl();
    scheduleRender();
  }

  window.addEventListener('popstate', onRouteChanged);
  const origPushState = history.pushState;
  history.pushState = function () {
    const res = origPushState.apply(this, arguments);
    onRouteChanged();
    return res;
  };
  const origReplaceState = history.replaceState;
  history.replaceState = function () {
    const res = origReplaceState.apply(this, arguments);
    onRouteChanged();
    return res;
  };

  /* ---------- הפעלה ---------- */
  let timer;
  const obs = new MutationObserver(mutations => {
    if (checkExcluded()) return;
    const onlyMyfam = mutations.every(m => {
      const t = m.target;
      return t && (t.closest?.('#myfam-panel, #myfam-body, #myfam-modal, #myfam-budget-modal, #myfam-forgotten-modal, #myfam-savings-modal, #myfam-toast, .myfam-tag, .myfam-starbtn'));
    });
    if (onlyMyfam) return;

    clearTimeout(timer);
    timer = setTimeout(render, 400);
  });

  function init() {
    if (checkExcluded()) {
      window.addEventListener('popstate', onRouteChanged);
      return;
    }
    extractSaleIdFromUrl();
    applyPrefs();
    buildUI();
    render();
    updateBudgetUI();
    updateForgottenUI();
    syncLoadGoogle();
    checkFeedbackReminder();
    checkTipsReminder();
    checkDailyHistorySync();
    window.addEventListener('resize', scheduleRender);
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();

})();
