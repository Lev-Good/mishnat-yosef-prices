// מוסיף למשנת - סל קניות משפחתי חכם
// Copyright (c) 2026 Lev Tov Digital (https://digital.levtov.uk/). All Rights Reserved.
// Proprietary software - Unauthorized copying, modification or redistribution is strictly prohibited.
(function () {
  'use strict';
  const W = window.unsafeWindow || window;
  const T = window.__MY_T;

  const APP_NAME = 'מוסיף למשנת';
  const APP_VERSION = '0.6.9';
  const ICONS = {
    info: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;display:inline-block"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
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
    check: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;display:inline-block"><polyline points="20 6 9 17 4 12"/></svg>`,
    expand: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;display:inline-block"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
    shrink: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;display:inline-block"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`
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

  let itemUnitTexts = jget('unit_texts', {});
  function saveItemUnitTexts() {
    try { jset('unit_texts', itemUnitTexts); } catch (e) {}
  }

  const UNIT_HINT_RE = /(\d+(?:\.\d+)?)\s*(?:ק["״׳']?ג|קילו(?:גרם)?|גרם|גר['"״׳]?|מ["״׳']?ל|ליטר|ל['"״׳]?)(?:[^\u0590-\u05fea-z0-9]|$)/i;
  function extractCardUnitText(cd, leaf) {
    if (!cd) return '';
    try {
      const els = cd.querySelectorAll('span, div, p, small, b, strong, td');
      for (let i = 0; i < els.length; i++) {
        const el = els[i];
        if (el === leaf || el.childElementCount > 0) continue;
        const txt = (el.textContent || '').trim();
        if (!txt || txt.length > 50 || /₪|ש["״׳']?ח/.test(txt)) continue;
        if (UNIT_HINT_RE.test(txt)) {
          if (!el.closest('.myfam-tag, .myfam-starbtn, .myfam-price-comp-tag, button')) return txt;
        }
      }
    } catch (_) {}
    return '';
  }
  // איפוס אוטומטי של סימוני בדיקה ישנים (שחסמו מוצרים כמו בצל ועגבניה שהוזמנו 7 פעמים)
  if (!localStorage.getItem(LS + 'clean_fixed_v3')) {
    localStorage.setItem(LS + 'clean_fixed_v3', 'true');
    state.fixed = {};
    jset('state', state);
  }
  let saleMeta = jget('salemeta', {});          // saleId -> {week, begin}
  let filter = 'all';
  const PREF_DEFAULT = { 
    seenColor: '#2e9e5b', 
    seenFill: false, 
    fixedColor: '#e0a800', 
    fixedFill: true,
    selectedChains: ['yeshHesed', 'netoChisachon', 'osherAd', 'ramiLevy', 'shaareiRevaha'],
    compareInHistory: true,
    historyWindow: 6
  };
  let prefs = { ...PREF_DEFAULT, ...jget('prefs', {}) };
  if (prefs.compareInHistory === undefined) prefs.compareInHistory = true;
  if (typeof prefs.historyWindow !== 'number' || !Number.isFinite(prefs.historyWindow) || prefs.historyWindow < 0) {
    prefs.historyWindow = PREF_DEFAULT.historyWindow;
  }
  if (!Array.isArray(prefs.selectedChains) || !prefs.selectedChains.length) {
    prefs.selectedChains = [...PREF_DEFAULT.selectedChains];
  }
  let sale = { id: null, items: new Map(), loadedAll: false };    // שם מנורמל / pid / itemSalesId -> מוצר במכירה
  let live = null;                              // ההזמנה הנוכחית: {orderId, saleId, clientId, lines: Map}
  let viewedOrder = null;                       // הזמנת עבר שנצפתה באתר: {orderId, saleId, week, date, lines: Map}
  let historyRenderItems = new Map();           // מפת מוצרים מהזמנות עבר לצביעה/השוואה בדפי היסטוריה
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

  function isHistoryPage() {
    const p = (location.pathname || '').toLowerCase();
    return /^\/(orders|history|order-history|previous-orders)\b/i.test(p);
  }

  function isProductSelectionPage() {
    if (isExcludedPage()) return false;
    const p = (location.pathname || '').toLowerCase();
    if (p.includes('login') || p.includes('auth') || p.includes('register')) return false;
    const isOrderOrCatalog = /^\/(order|orders|sale|catalog|cart|history|order-history|previous-orders)\b/i.test(p);
    const hasCards = (typeof currentCardMap !== 'undefined' && currentCardMap && currentCardMap.size > 0);
    const hasSaleData = (sale && sale.items && sale.items.size > 0)
      || (live && (live.saleId || (live.lines && live.lines.size > 0)))
      || (viewedOrder && viewedOrder.lines && viewedOrder.lines.size > 0);
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
    const m = location.pathname.match(/\/orders?\/(\d+)/);
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
  let cachedCounts = null;
  let cachedCountsSaleId = null;
  function invalidateCountsCache() {
    cachedCounts = null;
    cachedCountsSaleId = null;
  }

  /* מעקב אחר קטלוגי מכירות שהוצעו בפועל (כדי להבחין בין דילוג מכוון למוצר שלא הוצע במכירה, כגון מוצרי חגים) */
  let saleCatalogs = jget('sale_catalogs', {});
  let saleCatalogSaveTimer = null;
  function recordSaleCatalogKeys(saleId, keys) {
    if (saleId == null || !Array.isArray(keys) || !keys.length) return;
    const sid = String(saleId);
    const existing = saleCatalogs[sid];
    const set = new Set(existing?.keys || []);
    let changed = !existing;
    for (const k of keys) {
      if (k && !set.has(k)) {
        set.add(k);
        changed = true;
      }
    }
    if (!changed) return;
    saleCatalogs[sid] = {
      d: existing?.d || new Date().toISOString().slice(0, 10),
      t: Date.now(),
      keys: [...set]
    };
    const sids = Object.keys(saleCatalogs);
    if (sids.length > 20) {
      sids.sort((a, b) => (saleCatalogs[b]?.t || 0) - (saleCatalogs[a]?.t || 0));
      for (const oldSid of sids.slice(20)) {
        delete saleCatalogs[oldSid];
      }
    }
    clearTimeout(saleCatalogSaveTimer);
    saleCatalogSaveTimer = setTimeout(() => {
      try { jset('sale_catalogs', saleCatalogs); } catch (_) {}
      invalidateCountsCache();
    }, 600);
  }

  function counts() {
    const curSaleId = sale.id || extractSaleIdFromUrl();
    const winSize = typeof prefs.historyWindow === 'number' ? prefs.historyWindow : 6;
    const cacheKey = `${curSaleId}|w=${winSize}`;
    if (cachedCounts && cachedCountsSaleId === cacheKey) {
      return cachedCounts;
    }

    // איחוד הזמנות עבר לפי saleId (מהחדש לישן) ללא המכירה הפעילה הנוכחית
    const sortedAsc = [...state.history].sort((a, b) => ((a.date || '') < (b.date || '') ? -1 : 1));
    const salesById = new Map();
    for (const o of sortedAsc) {
      if (!o || !Array.isArray(o.items) || !o.items.length) continue;
      if (curSaleId != null && String(o.saleId) === String(curSaleId)) continue;
      const sid = String(o.saleId);
      let rec = salesById.get(sid);
      if (!rec) {
        rec = { saleId: sid, date: o.date || '', items: new Map() };
        salesById.set(sid, rec);
      } else if ((o.date || '') > rec.date) {
        rec.date = o.date || '';
      }
      for (const it of o.items) {
        if (!it || !it.key) continue;
        const qty = Math.max(1, Number(it.qty) || 1);
        rec.items.set(it.key, { name: it.name, qty });
      }
    }

    // מהמכירה האחרונה אחורה בזמן
    const pastSalesDesc = [...salesById.values()].reverse();
    const m = {};

    if (winSize <= 0) {
      // כל ההיסטוריה ללא הגבלת חלון
      for (const s of [...pastSalesDesc].reverse()) {
        for (const [key, info] of s.items.entries()) {
          const c = m[key] || (m[key] = { name: info.name, count: 0, totalQty: 0, lastQty: 0 });
          c.count++;
          c.totalQty += info.qty;
          c.lastQty = info.qty;
        }
      }
      cachedCounts = m;
      cachedCountsSaleId = cacheKey;
      return m;
    }

    // בניית סטים של קטלוגים שמורים לבדיקה מהירה האם מוצר הוצע במכירה נתונה
    const catalogSets = new Map();
    for (const [sid, cat] of Object.entries(saleCatalogs || {})) {
      if (cat && Array.isArray(cat.keys) && cat.keys.length) {
        catalogSets.set(sid, new Set(cat.keys));
      }
    }

    // איסוף כלל המוצרים שאי פעם הוזמנו
    const allKeys = new Map();
    for (const s of pastSalesDesc) {
      for (const [key, info] of s.items.entries()) {
        if (!allKeys.has(key)) allKeys.set(key, info.name);
      }
    }

    // לכל מוצר: בודקים את winSize ההזדמנויות האחרונות שבהן המוצר הוצע למכירה
    for (const [key, fallbackName] of allKeys.entries()) {
      let opportunities = 0;
      let count = 0;
      let totalQty = 0;
      let lastQty = 0;
      let latestName = fallbackName;

      for (const s of pastSalesDesc) {
        const hit = s.items.get(key);
        if (hit) {
          opportunities++;
          count++;
          totalQty += hit.qty;
          if (lastQty === 0) {
            lastQty = hit.qty;
            latestName = hit.name || latestName;
          }
        } else {
          const catSet = catalogSets.get(s.saleId);
          // אם ידוע לנו קטלוג המכירה והמוצר כלל לא הוצע בה (למשל מוצר חג/עונתי) — לא נספר כדילוג!
          if (catSet && !catSet.has(key)) {
            continue;
          }
          opportunities++;
        }
        if (opportunities >= winSize) break;
      }

      if (count > 0) {
        m[key] = { name: latestName, count, totalQty, lastQty, opportunities };
      }
    }

    cachedCounts = m;
    cachedCountsSaleId = cacheKey;
    return m;
  }

  function formatOrderBadge(n, info) {
    const lastQty = info?.lastQty || 0;
    const totalQty = info?.totalQty || 0;
    if (n === 1) {
      return lastQty > 0 ? `הוזמן פעם אחת (${lastQty} יח')` : `הוזמן ${times(n)}`;
    }
    if (totalQty > 0) {
      return `הוזמן ${times(n)} · ${lastQty} יח' (סה"כ ${totalQty})`;
    }
    return `הוזמן ${times(n)}`;
  }

  function attachModalFullscreenBtn(boxEl, fsState) {
    if (!boxEl) return;
    boxEl.querySelector('.myfam-fs-btn')?.remove();
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'myfam-fs-btn';
    const syncUi = () => {
      const isFs = !!fsState.value;
      boxEl.classList.toggle('myfam-modal-fs', isFs);
      btn.innerHTML = isFs ? ICONS.shrink : ICONS.expand;
      btn.title = isFs ? 'יציאה ממסך מלא' : 'הגדל למסך מלא';
    };
    syncUi();
    btn.onclick = ev => {
      ev.stopPropagation();
      fsState.value = !fsState.value;
      syncUi();
    };
    boxEl.appendChild(btn);
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
            if (!Array.isArray(prefs.selectedChains) || !prefs.selectedChains.length) {
              prefs.selectedChains = [...PREF_DEFAULT.selectedChains];
            }
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
  let dynamicApiHost = jget('api_host', null);

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
    if (d.url) {
      try {
        const parsed = new URL(d.url, location.href);
        if (parsed.hostname.includes('mishnatyosef.org')) {
          const detected = parsed.origin;
          if (detected && detected !== dynamicApiHost) {
            dynamicApiHost = detected;
            jset('api_host', dynamicApiHost);
          }
        }
      } catch (_) {}
    }
    try { handleApi(d); } catch (e) { console.warn('[myfam]', e); }
  });

  function formatMishnatImageUrl(raw) {
    if (!raw || typeof raw !== 'string') return '';
    raw = raw.trim();
    if (!raw) return '';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    if (raw.startsWith('//')) return 'https:' + raw;
    const clean = raw.replace(/^\/+/, '');
    if (clean.startsWith('images/')) return `https://images.mishnatyosef.org/${clean}`;
    return `https://images.mishnatyosef.org/images/items/${clean}`;
  }

  let productImages = jget('product_images', {});
  // ניקוי זיהומים ישנים של חותמת כשרות או כתובות שגויות עם API_HOST
  Object.keys(productImages).forEach(k => {
    const val = productImages[k];
    if (/kashrut|badatz|badge|כשרות|בדץ|עדה/i.test(val)) {
      delete productImages[k];
    } else if (val && val.includes('v2.mishnatyosef.org')) {
      productImages[k] = formatMishnatImageUrl(val.replace(/^https?:\/\/v2\.mishnatyosef\.org\/?/, ''));
    }
  });
  function saveProductImages() {
    try { jset('product_images', productImages); } catch (e) {}
  }

  /* ---------- זיהוי מדויק של תמונת המוצר (סינון כשרות/אייקונים/לבבות) ---------- */
  function findProductImage(cd) {
    if (!cd) return '';
    const imgs = [...cd.getElementsByTagName('img')];
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

    // בחירת התמונה עם השטח הגדול ביותר (תמונת המוצר הראשית של הכרטיס) ללא layout thrashing
    let best = candidates[0];
    let maxArea = -1;
    for (const img of candidates) {
      const w = img.naturalWidth || img.width || 0;
      const h = img.naturalHeight || img.height || 0;
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

    const close = () => {
      d.remove();
      document.removeEventListener('keydown', escHandler);
    };
    d.querySelector('.myfam-app-dialog-x').onclick = close;
    d.querySelector('.myfam-app-dialog-btn-primary').onclick = close;
    d.querySelector('.myfam-app-dialog-overlay').onclick = e => {
      if (e.target === d.querySelector('.myfam-app-dialog-overlay')) close();
    };
    const escHandler = e => {
      if (e.key === 'Escape') close();
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
    let img = formatMishnatImageUrl(rawImg);
    if (img) {
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

  // אכלוס מוצרי המכירה מכל הקטגוריות למפה מרכזית מהירה ועמידה
  function populateSaleItems(rows) {
    if (!Array.isArray(rows) || !rows.length) return;
    const offeredKeys = [];
    let rowSaleId = sale.id;
    rows.forEach(r => {
      const n = r.name || (r.product && r.product.name);
      const pid = r.itemID != null ? r.itemID : (r.product && r.product.id);
      const salesId = r.id != null ? r.id : r.item_salesID;
      if (n && pid != null) {
        offeredKeys.push('p' + pid);
        if (rowSaleId == null && r.saleID != null) rowSaleId = r.saleID;
        const rawImg = r.thumb_featured_image || r.featured_image || r.image || r.picture || r.image_url
          || (r.product && (r.product.thumb_featured_image || r.product.featured_image || r.product.image || r.product.image_url));
        const img = formatMishnatImageUrl(rawImg);
        if (img) {
          productImages['p' + pid] = img;
          productImages[norm(n)] = img;
        }
        const p = parseFloat(r.price ?? (r.item_sale && r.item_sale.price) ?? r.cost ?? 0) || 0;
        if (p > 0) {
          itemPrices['p' + pid] = p;
        }
        const rawUnit = [
          r.unit, r.unit_name, r.weight, r.package_weight, r.sub_title, r.subtitle, r.description,
          r.product?.unit, r.product?.unit_name, r.product?.weight, r.product?.description
        ].filter(v => typeof v === 'string' && v.trim()).join(' ');
        const unitMatch = rawUnit.match(UNIT_HINT_RE);
        const unitText = unitMatch ? unitMatch[0].trim() : '';
        if (unitText) {
          itemUnitTexts['p' + pid] = unitText;
          itemUnitTexts[norm(n)] = unitText;
        }
        const itemObj = {
          pid: Number(pid),
          name: n,
          image: img,
          price: p,
          unitText,
          itemSalesId: salesId != null ? Number(salesId) : null,
          raw: r
        };
        sale.items.set(norm(n), itemObj);
        sale.items.set('p' + pid, itemObj);
        if (salesId != null) sale.items.set('s' + salesId, itemObj);
        if (r.product && r.product.name) sale.items.set(norm(r.product.name), itemObj);
      }
    });
    if (rowSaleId != null && offeredKeys.length) {
      recordSaleCatalogKeys(rowSaleId, offeredKeys);
    }
    saveProductImages();
    saveItemPrices();
    saveItemUnitTexts();
  }

  function populateHistoryRenderFromOrder(o) {
    if (!o || !Array.isArray(o.items)) return;
    const linesMap = new Map();
    o.items.filter(it => !it.del).forEach(it => {
      const l = lineFrom(it);
      if (!l) return;
      linesMap.set(l.sid || l.key, l);
      const itemObj = {
        pid: Number(l.pid),
        name: l.name,
        image: l.image || '',
        price: l.price || 0,
        itemSalesId: l.sid || null
      };
      historyRenderItems.set(norm(l.name), itemObj);
      historyRenderItems.set('p' + l.pid, itemObj);
      if (l.sid) historyRenderItems.set('s' + l.sid, itemObj);
    });
    saveProductImages();
    saveItemPrices();
    if (linesMap.size > 0) {
      viewedOrder = {
        orderId: o.id,
        saleId: o.saleID,
        week: o.week || o.sale?.name || o.sale?.week || saleMeta[o.saleID]?.week || `מכירה ${o.saleID || ''}`.trim(),
        date: o.created_at || o.date || '',
        lines: linesMap
      };
    }
  }

  let cachedHistFallbackLen = -1;
  let histFallbackMap = new Map();
  function getHistoryLookupItem(normName) {
    const direct = historyRenderItems.get(normName);
    if (direct) return direct;
    if (!isHistoryPage()) return null;
    if (cachedHistFallbackLen !== state.history.length) {
      histFallbackMap = new Map();
      for (const ord of state.history) {
        if (!Array.isArray(ord.items)) continue;
        for (const it of ord.items) {
          if (!it || !it.name) continue;
          const itemObj = {
            pid: Number(it.pid || 0),
            name: it.name,
            image: it.image || '',
            price: it.price || itemPrices[it.key] || 0
          };
          histFallbackMap.set(norm(it.name), itemObj);
        }
      }
      cachedHistFallbackLen = state.history.length;
    }
    return histFallbackMap.get(normName) || null;
  }

  function handleApi(d) {
    const u = new URL(d.url), path = u.pathname, j = d.json; let m;
    const isDebug = !!localStorage.getItem(LS + 'debug_enabled');
    if (isDebug && CONFIG.debugPaths.test(path)) {
      debugBuf.push({ url: path + u.search, method: d.method, status: d.status,
        body: (d.body || '').slice(0, 300), json: JSON.stringify(redact(j)).slice(0, 2500) });
      if (debugBuf.length > CONFIG.debugKeep) debugBuf.shift();
    }

    if (d.method === 'GET' && /get_items_for_sale\//.test(path)) {
      const rows = Array.isArray(j && j.data) ? j.data : [];
      if (!rows.length) return;
      const sid = rows[0].saleID;
      if (sale.id !== sid) sale = { id: sid, items: new Map(), loadedAll: false };
      populateSaleItems(rows);
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

    } else if (d.method === 'GET' && path === '/api/orders') {
      const list = Array.isArray(j?.data) ? j.data : (Array.isArray(j) ? j : []);
      list.forEach(o => { if (o && Array.isArray(o.items) && o.items.length) populateHistoryRenderFromOrder(o); });
      scheduleRender();
      updateSavingsUI();

    } else if (d.method === 'GET' && (m = path.match(/^\/api\/orders\/(\d+)$/))) {
      const o = j && j.order; if (!o) return;
      const ordId = Number(m[1]);
      const curOrdId = extractOrderIdFromUrl();
      if ((!curOrdId || ordId === curOrdId) && !isHistoryPage()) {
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
        populateHistoryRenderFromOrder(o);
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
        if (sale.items.size === 0) scheduleRender();
      } else {
        // זו הזמנת עבר שנטענה (למשל מתוך היסטוריית הזמנות באתר)
        populateHistoryRenderFromOrder(o);
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
        updateSavingsUI();
        scheduleRender();
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

  let saveDebounceTimer = null;
  function scheduleSave(delay = 1200) {
    if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(save, delay);
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
    scheduleSave();
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
    return m && !el.closest('#myfam-panel,#myfam-body,#myfam-modal,#myfam-whatsnew-modal,.myfam-starbtn');
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
  let lastDragEndTime = 0;

  function initDraggablePanel() {
    const p = $('#myfam-panel');
    const t = $('#myfam-toggle');
    if (!p || !t || p._dragBound) return;
    p._dragBound = true;

    // מניעת גרירת HTML5 מובנית של הדפדפן (ghost drag) שחוסמת mousemove
    t.ondragstart = e => { e.preventDefault(); return false; };

    let startX = 0, startY = 0, startLeft = 0, startTop = 0, currentPointerId = null;

    const onPointerDown = e => {
      if (e.button && e.button !== 0) return;
      panelDragging = true;
      panelDragMoved = false;
      const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
      const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;
      startX = clientX;
      startY = clientY;
      const r = p.getBoundingClientRect();
      startLeft = r.left;
      startTop = r.top;

      if (e.pointerId != null && typeof t.setPointerCapture === 'function') {
        try {
          t.setPointerCapture(e.pointerId);
          currentPointerId = e.pointerId;
        } catch (_) {}
      }

      window.addEventListener('pointermove', onPointerMove, { passive: false });
      window.addEventListener('pointerup', onPointerUp, { passive: false });
      window.addEventListener('pointercancel', onPointerUp, { passive: false });
      window.addEventListener('mousemove', onPointerMove, { passive: false });
      window.addEventListener('mouseup', onPointerUp, { passive: false });
      window.addEventListener('touchmove', onPointerMove, { passive: false });
      window.addEventListener('touchend', onPointerUp, { passive: false });
    };

    const onPointerMove = e => {
      if (!panelDragging) return;
      const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
      const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;
      const dx = clientX - startX;
      const dy = clientY - startY;

      if (!panelDragMoved && Math.hypot(dx, dy) >= 4) {
        panelDragMoved = true;
        if (p.parentElement !== document.body) {
          document.body.appendChild(p);
        }
        p.classList.add('floating');
        p.classList.add('dragging');
      }

      if (!panelDragMoved) return;
      if (e.cancelable) e.preventDefault();

      const maxL = Math.max(10, window.innerWidth - 55);
      const maxT = Math.max(10, window.innerHeight - 55);
      const newL = Math.min(Math.max(10, startLeft + dx), maxL);
      const newT = Math.min(Math.max(10, startTop + dy), maxT);
      p.style.left = newL + 'px';
      p.style.top = newT + 'px';
      positionBody();
    };

    const onPointerUp = e => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);

      if (currentPointerId != null && typeof t.releasePointerCapture === 'function') {
        try { t.releasePointerCapture(currentPointerId); } catch (_) {}
        currentPointerId = null;
      }

      if (!panelDragging) return;
      panelDragging = false;
      p.classList.remove('dragging');

      if (panelDragMoved) {
        lastDragEndTime = Date.now();
        const r = p.getBoundingClientRect();
        try {
          localStorage.setItem('myfam_panel_pos', JSON.stringify({ top: Math.round(r.top), left: Math.round(r.left) }));
        } catch (_) {}
      }
    };

    if (window.PointerEvent) {
      t.addEventListener('pointerdown', onPointerDown);
    } else {
      t.addEventListener('mousedown', onPointerDown);
      t.addEventListener('touchstart', onPointerDown, { passive: true });
    }
  }

  function placePanel(h) {
    if (checkExcluded()) return;
    const p = $('#myfam-panel'); if (!p) return;

    // שחזור מיקום מותאם אישית שנגרר בעבר - קודם לכל הצמדה אוטומטית!
    let customPos = null;
    try {
      const saved = JSON.parse(localStorage.getItem('myfam_panel_pos') || 'null');
      if (saved && typeof saved.top === 'number' && typeof saved.left === 'number') {
        customPos = saved;
      }
    } catch (_) {}

    if (customPos) {
      if (p.parentElement !== document.body) document.body.appendChild(p);
      p.classList.add('floating');
      const maxL = Math.max(10, innerWidth - 60);
      const maxT = Math.max(10, innerHeight - 60);
      p.style.left = Math.min(Math.max(10, customPos.left), maxL) + 'px';
      p.style.top = Math.min(Math.max(10, customPos.top), maxT) + 'px';
    } else if (h) {
      const pos = innerWidth < 768 ? 'beforebegin' : 'afterend';
      const nb = pos === 'afterend' ? h.nextElementSibling : h.previousElementSibling;
      if (nb !== p) h.insertAdjacentElement(pos, p);
      p.classList.remove('floating'); p.style.left = ''; p.style.top = '';
    } else {
      if (p.parentElement !== document.body) document.body.appendChild(p);
      p.classList.add('floating');
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
    initDraggablePanel();
    positionBody();
  }

  function render() {
    if (!document.body || checkExcluded()) return;
    ensureUI();
    extractSaleIdFromUrl();
    obs.disconnect();

    const c = counts();

    // 1. אלמנטי טקסט ששמם זהה למוצר, ואייקוני לב (החרגה מלאה של סל הקניות ומודאלים)
    const onHistoryPage = isHistoryPage();
    const allowHistoryCompare = prefs.compareInHistory !== false;
    const leaves = [];

    // איתור ממוקד ומהיר של אייקוני וכפתורי לב ללא סריקה מיותרת של כל ה-DOM
    const hearts = [...document.body.querySelectorAll('button, a, [role="button"], .material-symbols-rounded, .material-icons, svg, [class*="heart" i], [class*="fav" i], [aria-label*="מועדפ" i]')].filter(heartLike);

    // איתור ממוקד של אלמנטי מלל בלבד (ללא ילדים)
    const candidateTextEls = document.body.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,div,b,strong,td,a');
    for (let i = 0; i < candidateTextEls.length; i++) {
      const el = candidateTextEls[i];
      if (el.childElementCount > 0) continue;
      const t = el.textContent;
      if (!t || t.length < 2 || t.length > 100) continue;
      const nt = norm(t);
      const hitSale = sale.items.get(nt);
      const hitHist = (!hitSale && allowHistoryCompare && (onHistoryPage || sale.items.size === 0 || (viewedOrder && viewedOrder.lines && viewedOrder.lines.size > 0)))
        ? getHistoryLookupItem(nt)
        : null;
      const hit = hitSale || hitHist;
      if (!hit) continue;

      // בדיקת החרגה מתבצעת אך ורק עבור אלמנטים שהם אכן מוצר (חוסך עשרות אלפי בדיקות closest)
      if (el.closest('#myfam-panel, #myfam-body, #myfam-modal, #myfam-whatsnew-modal, #myfam-budget-modal, #myfam-forgotten-modal, #myfam-savings-modal, .myfam-tag, #cart, [id*="cart" i], [class*="cart-product" i], [class*="cart-products" i], header, nav, dialog')) continue;

      const leafKey = hit.pid ? ('p' + hit.pid) : nt;
      if (el.getAttribute('data-myleaf') !== leafKey) el.setAttribute('data-myleaf', leafKey);
      if (hit.price > 0 && el.getAttribute('data-myprice') !== String(hit.price)) el.setAttribute('data-myprice', String(hit.price));
      if (!hitSale && !el.hasAttribute('data-myhist')) el.setAttribute('data-myhist', '1');
      leaves.push(el);
    }

    // ניקוי סימוני leaf ישנים אך ורק עבור אלמנטים שכבר אינם עלי מוצר פעילים
    const currentLeafSet = new Set(leaves);
    $$('[data-myleaf]').forEach(e => {
      if (!currentLeafSet.has(e)) {
        e.removeAttribute('data-myleaf');
        e.removeAttribute('data-myprice');
        e.removeAttribute('data-myhist');
      }
    });

    // 2. עולים לכרטיס המוצר המדויק ללא Layout Thrashing (ללא p.offsetHeight וללא סריקות יקרות)
    const cardMap = new Map();
    const escapedKeys = new Map();
    leaves.forEach(leaf => {
      const key = leaf.getAttribute('data-myleaf');
      let card = leaf, hops = 0;
      let escKey = escapedKeys.get(key);
      if (!escKey) {
        escKey = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(key) : key.replace(/["\\]/g, '\\$&');
        escapedKeys.set(key, escKey);
      }
      while (card.parentElement && card.parentElement !== document.body && hops < 8) {
        const p = card.parentElement;
        if (p.tagName === 'TR') { card = p; break; }
        if (/^(BODY|HTML|MAIN|SECTION|NAV|HEADER|FOOTER|FORM)$/i.test(p.tagName)) break;
        if (p.closest('#cart, [id*="cart" i], [class*="cart-product" i], [class*="cart-products" i]')) break;
        // עצירה מיידית אם להורה יש מוצר נוסף אחר
        if (p.querySelector(`[data-myleaf]:not([data-myleaf="${escKey}"])`)) break;
        card = p;
        hops++;
      }
      if (!card.closest('#cart, [id*="cart" i], [class*="cart-product" i], [class*="cart-products" i]')) {
        cardMap.set(card, { key, leaf });
      }
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
      if (!cardMap.has(e) || e.closest('#cart, [id*="cart" i], [class*="cart-product" i], [class*="cart-products" i]')) {
        e.classList.remove('myfam-seen', 'myfam-fixed', 'myfam-hide', 'myfam-fill');
      }
    });
    // ניקוי מוחלט של אלמנטי תוסף מתוך סל הקניות
    $$('#cart .myfam-tag, #cart .myfam-starbtn, #cart .myfam-price-comp-tag, [id*="cart" i] .myfam-tag, [id*="cart" i] .myfam-starbtn, [id*="cart" i] .myfam-price-comp-tag').forEach(el => el.remove());

    let inList = 0; const stars = [];
    let unitTextsChanged = false;
    let productImagesChanged = false;

    cards.forEach(cd => {
      if (!region.contains(cd)) return;
      inList++;
      const { key, leaf } = cardMap.get(cd);
      const isHistItem = leaf.getAttribute('data-myhist') === '1';
      const suppressHistDecorations = onHistoryPage || isHistItem;
      const n = c[key]?.count || 0, fx = isFixed(key, c);
      cd.classList.toggle('myfam-fixed', !suppressHistDecorations && fx);
      cd.classList.toggle('myfam-seen', !suppressHistDecorations && n > 0 && !fx);
      cd.classList.toggle('myfam-fill', !suppressHistDecorations && (fx ? prefs.fixedFill : (n > 0 && prefs.seenFill)));
      const show = filter === 'all' || (filter === 'seen' && n > 0) || (filter === 'fixed' && fx);
      cd.classList.toggle('myfam-hide', !show);
      if (cd === leaf) return;

      const isTableRow = cd.tagName === 'TR';
      const leafPrice = parseFloat(leaf.getAttribute('data-myprice') || '0') || 0;
      const cardHost = isTableRow ? (leaf.closest('td,th') || leaf.parentElement || cd) : cd;

      if (!cd.classList.contains('myfam-card')) cd.classList.add('myfam-card');
      if (!isTableRow && !cd.style.position) cd.style.position = 'relative';

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
        cardHost.appendChild(star);
      }
      if (star.dataset.key !== key) star.dataset.key = key;
      cd.querySelectorAll('.myfam-tag').forEach(t => { if (t.getAttribute('data-tag-key') !== key) t.remove(); });
      const targetStarCls = 'myfam-starbtn' + (fx ? ' on' : '');
      if (star.className !== targetStarCls) star.className = targetStarCls;
      const targetStarHtml = fx ? ICONS.starBtnFilled : ICONS.starBtnEmpty;
      if (star.innerHTML !== targetStarHtml) star.innerHTML = targetStarHtml;
      const targetStarTitle = fx ? 'בטל סימון כמוצר קבוע' : 'סמן כמוצר קבוע';
      if (star.title !== targetStarTitle) star.title = targetStarTitle;
      if (!isTableRow) stars.push({ cd, star });

      // שמירת תמונת המוצר רק אם אינה שמורה כבר (חוסך סריקות מיותרות)
      const leafText = (leaf.textContent || '').trim();
      const normLeaf = norm(leafText);
      if (!productImages[key] && !productImages[normLeaf]) {
        const realImgSrc = findProductImage(cd);
        if (realImgSrc) {
          productImages[key] = realImgSrc;
          if (normLeaf) productImages[normLeaf] = realImgSrc;
          productImagesChanged = true;
        }
      }

      // תגית המוצר: מוצמדת ישירות מעל בלוק המידע של המוצר בתוך הכרטיס
      if (n > 0 && !isTableRow && !suppressHistDecorations) {
        let tag = cd.querySelector(`:scope > .myfam-tag[data-tag-key="${key}"]`);
        if (!tag) {
          cd.querySelectorAll('.myfam-tag').forEach(t => t.remove());
          tag = document.createElement('div');
          tag.setAttribute('data-tag-key', key);
          cardHost.appendChild(tag);
        }
        const badgeInfo = c[key];
        const badgeText = formatOrderBadge(n, badgeInfo);
        const targetTagCls = 'myfam-tag' + (fx ? ' fixed' : '');
        if (tag.className !== targetTagCls) tag.className = targetTagCls;
        const targetTagHtml = fx
          ? `${ICONS.starFilled} <span>${badgeText}</span>`
          : `<span>${badgeText}</span>`;
        if (tag.innerHTML !== targetTagHtml) tag.innerHTML = targetTagHtml;
        if (badgeInfo && badgeInfo.totalQty > 0) {
          const targetTagTitle = `הוזמן ${times(n)} | בהזמנה האחרונה: ${badgeInfo.lastQty} יח' | סה"כ בכל ההזמנות: ${badgeInfo.totalQty} יח'`;
          if (tag.title !== targetTagTitle) tag.title = targetTagTitle;
        }
      } else {
        cd.querySelector(`.myfam-tag[data-tag-key="${key}"]`)?.remove();
      }

      // תגית השוואת מחיר מול רשתות השיווק - מינימליסטית, אלגנטית ולא מפריעה
      const pName = leafText;
      let unitHint = itemUnitTexts[key] || itemUnitTexts[norm(pName)] || '';
      if (!unitHint && !UNIT_HINT_RE.test(pName)) {
        const domUnit = extractCardUnitText(cd, leaf);
        if (domUnit) {
          unitHint = domUnit;
          itemUnitTexts[key] = domUnit;
          itemUnitTexts[norm(pName)] = domUnit;
          unitTextsChanged = true;
        }
      }
      const showCompareHere = !isHistItem || allowHistoryCompare;
      const rawComp = showCompareHere ? findMarketComparison(pName, unitHint) : null;
      const compItem = rawComp ? getEffectiveMarketComparison(rawComp) : null;

      // מציאת מחיר המוצר: רק כאשר יש פריט להשוואה
      let myPrice = itemPrices[key] || leafPrice || 0;
      let priceEl = null;
      if (compItem) {
        priceEl = cd.querySelector('[class*="price" i], [id*="price" i], .amount, .cost');
        if (priceEl && !myPrice) {
          const numMatch = (priceEl.textContent || '').match(/(\d+(?:\.\d{1,2})?)/);
          if (numMatch) myPrice = parseFloat(numMatch[1]) || 0;
        }
        if (!myPrice || !priceEl) {
          const priceCandidates = cd.querySelectorAll('span, div, p, b, strong');
          for (let pi = 0; pi < priceCandidates.length; pi++) {
            const el = priceCandidates[pi];
            if (el === leaf || el.childElementCount > 0) continue;
            const txt = (el.textContent || '').trim();
            const m = txt.match(/(\d+(?:\.\d+)?)\s*(?:₪|ש["״׳]?ח|שח)|(?:₪|ש["״׳]?ח|שח)\s*(\d+(?:\.\d+)?)/i);
            if (m) {
              if (!myPrice) myPrice = parseFloat(m[1] || m[2]) || 0;
              if (!priceEl) priceEl = el;
              break;
            }
          }
        }
      }

      if (compItem && myPrice > 0 && compItem.effectivePrice > 0) {
        const ratio = myPrice / compItem.effectivePrice;
        if (ratio >= 0.4 && ratio <= 2.2) {
          const diff = compItem.effectivePrice - myPrice;
          let compTag = cd.querySelector('.myfam-price-comp-tag');
          if (!compTag) {
            compTag = document.createElement('span');
            compTag.className = 'myfam-price-comp-tag';
            // הצמדה ישירה לצד אלמנט המחיר בכרטיס, או מתחת לשם המוצר
            if (priceEl && priceEl.parentElement && priceEl.parentElement !== cd) {
              priceEl.insertAdjacentElement('afterend', compTag);
            } else if (leaf && leaf.parentElement) {
              leaf.insertAdjacentElement('afterend', compTag);
            } else {
              cardHost.appendChild(compTag);
            }
          }
          const selChainNames = (compItem.activeChainEntries && compItem.activeChainEntries.length)
            ? compItem.activeChainEntries.map(([c]) => ALL_CHAINS[c]?.name || c).join(', ')
            : (compItem.sourceLabel || 'רשתות שיווק');
          const scaleSuffix = compItem._scaleLabel ? ` (${compItem._scaleLabel})` : '';
          const eqSuffix = (compItem.isEquivalentBrand ? ' (מקביל)' : '') + scaleSuffix;
          const eqNote = (compItem.isEquivalentBrand
            ? `\n* הערה: השוואה למותג מקביל שאינו זהה (${compItem.matchedName || 'מוצר מקביל דומה'}).`
            : '')
            + (compItem._scaleNote ? `\n* הערה: ${compItem._scaleNote}.` : '');

          let targetCompCls, targetCompHtml, targetCompTitle;
          if (diff >= 0.3) {
            targetCompCls = 'myfam-price-comp-tag tag-saving';
            targetCompHtml = `⚡ חסכון ₪${diff.toFixed(1)}${eqSuffix}`;
            targetCompTitle = `מחיר במשנת יוסף: ₪${myPrice.toFixed(2)} | ממוצע ברשתות שנבחרו (${selChainNames}): כ-₪${compItem.effectivePrice.toFixed(2)} (חיסכון של ₪${diff.toFixed(2)})${eqNote}\n* הנתונים להערכה והמלצה בלבד וללא אחריות (ט.ל.ח).`;
          } else if (diff <= -0.3) {
            targetCompCls = 'myfam-price-comp-tag tag-expensive';
            targetCompHtml = `⚠️ יקר ב-₪${Math.abs(diff).toFixed(1)}${eqSuffix}`;
            targetCompTitle = `מחיר במשנת יוסף: ₪${myPrice.toFixed(2)} | ממוצע ברשתות שנבחרו (${selChainNames}): כ-₪${compItem.effectivePrice.toFixed(2)} (יקר ב-₪${Math.abs(diff).toFixed(2)})${eqNote}\n* הנתונים להערכה והמלצה בלבד וללא אחריות (ט.ל.ח).`;
          } else {
            targetCompCls = 'myfam-price-comp-tag tag-equal';
            targetCompHtml = `= ברשתות ₪${compItem.effectivePrice.toFixed(1)}${eqSuffix}`;
            targetCompTitle = `מחיר במשנת יוסף: ₪${myPrice.toFixed(2)} | ממוצע ברשתות שנבחרו (${selChainNames}): כ-₪${compItem.effectivePrice.toFixed(2)} (מחיר זהה)${eqNote}\n* הנתונים להערכה והמלצה בלבד וללא אחריות (ט.ל.ח).`;
          }
          if (compTag.className !== targetCompCls) compTag.className = targetCompCls;
          if (compTag.innerHTML !== targetCompHtml) compTag.innerHTML = targetCompHtml;
          if (compTag.title !== targetCompTitle) compTag.title = targetCompTitle;
        } else {
          cd.querySelector('.myfam-price-comp-tag')?.remove();
        }
      } else {
        cd.querySelector('.myfam-price-comp-tag')?.remove();
      }
    });

    if (unitTextsChanged) saveItemUnitTexts();
    if (productImagesChanged) saveProductImages();

    // ניקוי תגיות וכוכבים שאינם שייכים לכרטיסים פעילים
    $$('.myfam-tag').forEach(t => { if (!region.contains(t) || !t.closest('.myfam-card')) t.remove(); });
    $$('.myfam-starbtn').forEach(s => { if (!region.contains(s) || !s.closest('.myfam-card')) s.remove(); });
    $$('.myfam-price-comp-tag').forEach(t => { if (!region.contains(t) || !t.closest('.myfam-card')) t.remove(); });

    // 5. מדידות ויישור מיקום הכוכב מתחת ללב של הכרטיס (קריאות מרוכזות ולאחר מכן כתיבות מרוכזות)
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
      if (!hr) return;
      const topVal = Math.round(hr.bottom - cr.top + 4) + 'px';
      const rightVal = Math.max(2, Math.round(cr.right - hr.right + (hr.width - 34) / 2)) + 'px';
      if (star.style.top !== topVal) star.style.top = topVal;
      if (star.style.right !== rightVal) star.style.right = rightVal;
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
      if (sale.items.size) {
        info.textContent = `מוצרים בדף: ${inList} · במכירה: ${sale.items.size}`;
      } else if (onHistoryPage || (viewedOrder && viewedOrder.lines && viewedOrder.lines.size)) {
        info.textContent = inList ? `היסטוריית הזמנות · זוהו ${inList} מוצרים בדף` : 'דף היסטוריית הזמנות';
      } else {
        info.textContent = 'ממתין לנתוני המכירה…';
      }
    }
    placePanel(toolbarHeart);
    updateBudgetUI();
    updateForgottenUI();
    updateSavingsUI();
    obs.observe(document.body, { childList: true, subtree: true });
  }

  function toggleFixed(key) {
    const c = counts();
    state.fixed[key] = { v: !isFixed(key, c), t: Date.now() };
    invalidateCountsCache();
    save(); render();
  }
  const setStatus = t => { const s = $('#myfam-status'); if (s) s.textContent = t; };

  /* פונקציות חכמות לחילוץ טוקן, כותרות וכתובת השרת */
  function extractSiteToken() {
    const directKeys = [
      'token', 'access_token', 'accessToken', 'auth_token', 'authToken',
      'jwt', 'mishnat_token', 'bearer_token', 'user_token'
    ];
    for (const st of [localStorage, sessionStorage]) {
      if (!st) continue;
      for (const k of directKeys) {
        try {
          const val = st.getItem(k);
          if (val && typeof val === 'string' && val.length > 8 && val !== 'null' && val !== 'undefined') {
            return val.replace(/^Bearer\s+/i, '').trim();
          }
        } catch (_) {}
      }
      try {
        for (let i = 0; i < st.length; i++) {
          const k = st.key(i);
          if (!k) continue;
          const raw = st.getItem(k);
          if (!raw || typeof raw !== 'string') continue;
          if (raw.charCodeAt(0) === 123 && (raw.includes('token') || raw.includes('Token') || raw.includes('jwt'))) {
            try {
              const obj = JSON.parse(raw);
              const cand = obj.token || obj.accessToken || obj.access_token || obj.authToken || obj.auth_token || obj.jwt || obj?.user?.token || obj?.auth?.token || obj?.data?.token;
              if (cand && typeof cand === 'string' && cand.length > 8) {
                return cand.replace(/^Bearer\s+/i, '').trim();
              }
            } catch (_) {}
          }
        }
      } catch (_) {}
    }
    try {
      const m = document.cookie.match(/(?:^|;\s*)(?:token|access_token|jwt|auth)=([^;]+)/i);
      if (m && m[1]) {
        return decodeURIComponent(m[1]).replace(/^Bearer\s+/i, '').trim();
      }
    } catch (_) {}
    return '';
  }

  function getXsrfToken() {
    try {
      const m = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/i);
      if (m && m[1]) return decodeURIComponent(m[1]);
    } catch (_) {}
    return '';
  }

  function getBestAuthToken() {
    if (apiAuthToken && typeof apiAuthToken === 'string' && apiAuthToken.length > 8) {
      return apiAuthToken;
    }
    const found = extractSiteToken();
    if (found) {
      apiAuthToken = found.startsWith('Bearer ') ? found : 'Bearer ' + found;
      jset('api_auth', apiAuthToken);
      return apiAuthToken;
    }
    return null;
  }

  const getApiHost = () => dynamicApiHost || ((typeof location !== 'undefined' && location.origin && /mishnatyosef\.org/i.test(location.origin)) ? location.origin : 'https://mishnatyosef.org');
  const API_HOST = (typeof location !== 'undefined' && location.origin && /mishnatyosef\.org/i.test(location.origin))
    ? location.origin
    : 'https://mishnatyosef.org';

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

      W.dispatchEvent(new CustomEvent('myfam-call-api', {
        detail: JSON.stringify({ id, url, method, body, auth: getBestAuthToken(), headers: apiHeaders })
      }));

      setTimeout(() => {
        if (!settled) {
          W.removeEventListener('myfam-call-api-res', onRes);
          reject(new Error('זמן ההמתנה לתשובת האתר הסתיים (Timeout)'));
        }
      }, 15000);
    });
  }

  /* קריאה ישירה באותו Origin (Content Script Direct Fetch עם Credentials) */
  async function directContentFetch(url, method = 'GET', body = null) {
    try {
      const token = getBestAuthToken();
      const xsrf = getXsrfToken();
      const headers = {
        'Accept': 'application/json, text/plain, */*',
        'X-Requested-With': 'XMLHttpRequest'
      };
      if (body) headers['Content-Type'] = 'application/json';
      if (token) headers['Authorization'] = token.startsWith('Bearer ') ? token : 'Bearer ' + token;
      if (xsrf) headers['X-XSRF-TOKEN'] = xsrf;
      if (apiHeaders && typeof apiHeaders === 'object') {
        if (apiHeaders['x-xsrf-token'] && !headers['X-XSRF-TOKEN']) headers['X-XSRF-TOKEN'] = apiHeaders['x-xsrf-token'];
      }

      const resp = await fetch(url, {
        method,
        headers,
        credentials: 'include',
        body: body || undefined
      });

      if (resp.status === 401) {
        const err = new Error('unauthorized');
        err.status = 401;
        throw err;
      }
      if (!resp.ok) {
        const err = new Error(`HTTP ${resp.status}`);
        err.status = resp.status;
        throw err;
      }

      const ct = resp.headers.get('content-type') || '';
      if (ct.includes('json')) {
        return await resp.json();
      }
      const txt = await resp.text();
      try {
        return JSON.parse(txt);
      } catch (_) {
        throw new Error('תשובה לא תקינה מהאתר (לא JSON)');
      }
    } catch (e) {
      throw e;
    }
  }

  /* קריאה חכמה ורב-שכבתית ל-API של משנת יוסף:
     1. עולם הדף (MAIN world) עם הסשן המקומי והטוקן ב-localStorage
     2. פנייה ישירה מתוך הסקריפט (Content Script Same-Origin Fetch עם credentials מלאים)
     3. שירות הרקע של התוסף (Background Service Worker דרך T.request)
     4. גיבוי דומיין חלופי (mishnatyosef.org <-> v2.mishnatyosef.org)
  */
  async function siteApiRequest(url, method = 'GET', body = null) {
    let lastError = null;

    // שכבה 1: עולם הדף (MAIN world)
    try {
      const res = await pageApiRequest(url, method, body);
      if (res !== undefined && res !== null) return res;
    } catch (pageErr) {
      lastError = pageErr;
      if (pageErr.message === 'unauthorized' || pageErr.status === 401) {
        throw pageErr;
      }
      if (localStorage.getItem(LS + 'debug_enabled')) {
        console.log('[myfam pageApiRequest fallback]', pageErr);
      }
    }

    // שכבה 2: Same-Origin Fetch ישיר מתוך הסקריפט
    try {
      const res = await directContentFetch(url, method, body);
      if (res !== undefined && res !== null) return res;
    } catch (directErr) {
      lastError = directErr;
      if (directErr.message === 'unauthorized' || directErr.status === 401) {
        throw directErr;
      }
      if (localStorage.getItem(LS + 'debug_enabled')) {
        console.log('[myfam directContentFetch fallback]', directErr);
      }
    }

    // שכבה 3: שירות הרקע של התוסף (T.request)
    if (T && typeof T.request === 'function') {
      try {
        const bgHeaders = {
          'Accept': 'application/json, text/plain, */*',
          'X-Requested-With': 'XMLHttpRequest'
        };
        if (body) bgHeaders['Content-Type'] = 'application/json';
        const token = getBestAuthToken();
        if (token) bgHeaders['Authorization'] = token;
        const xsrf = getXsrfToken();
        if (xsrf) bgHeaders['X-XSRF-TOKEN'] = xsrf;

        const res = await T.request({ url, method, body, headers: bgHeaders });
        if (res !== undefined && res !== null) return res;
      } catch (bgErr) {
        if (localStorage.getItem(LS + 'debug_enabled')) {
          console.log('[myfam bg request fallback failed]', bgErr);
        }
        if (bgErr.message === 'unauthorized' || bgErr.status === 401) {
          throw bgErr;
        }
        if (lastError && lastError.message && !lastError.message.includes('Receiving end')) {
          throw lastError;
        }
        throw bgErr;
      }
    }

    // שכבה 4: אם נכשל ויש דומיין חלופי (mishnatyosef.org <-> v2.mishnatyosef.org), ננסה אותו
    let altUrl = null;
    if (typeof url === 'string') {
      if (url.includes('https://mishnatyosef.org/api/')) {
        altUrl = url.replace('https://mishnatyosef.org/api/', 'https://v2.mishnatyosef.org/api/');
      } else if (url.includes('https://v2.mishnatyosef.org/api/')) {
        altUrl = url.replace('https://v2.mishnatyosef.org/api/', 'https://mishnatyosef.org/api/');
      }
    }
    if (altUrl && !url.__retriedAlt) {
      try {
        const altReqUrl = new String(altUrl);
        altReqUrl.__retriedAlt = true;
        const res = await directContentFetch(altReqUrl, method, body);
        if (res !== undefined && res !== null) return res;
      } catch (_) {}
    }

    if (lastError) throw lastError;
    return null;
  }

  // טעינה חכמה ומקיפה של כלל מוצרי המכירה מכל הקטגוריות
  let saleCatalogPromise = null;
  async function ensureSaleItemsLoaded(oid) {
    // מזהה ההזמנה (orderId) הוא הפרמטר הראשון ב-API של get_items_for_sale, בעוד saleId הוא מזהה המכירה
    const realOrderId = (live && live.orderId) || extractOrderIdFromUrl();
    const targetOrderId = realOrderId || oid;
    if (!targetOrderId) return;
    if (sale.loadedAll && sale.items && sale.items.size > 0) return;
    if (saleCatalogPromise) return saleCatalogPromise;

    saleCatalogPromise = (async () => {
      try {
        const res = await siteApiRequest(`${API_HOST}/api/get_items_for_sale/${targetOrderId}/null?page=1&limit=500`);
        const rows = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        if (rows.length) {
          const sid = rows[0].saleID || extractSaleIdFromUrl() || targetOrderId;
          if (sale.id !== sid) {
            sale = { id: sid, items: new Map(), loadedAll: false };
          }
          populateSaleItems(rows);
          const totalPages = parseInt(res?.pagination?.total_pages || '1', 10);
          if (totalPages > 1) {
            for (let p = 2; p <= Math.min(totalPages, 10); p++) {
              try {
                const nextRes = await siteApiRequest(`${API_HOST}/api/get_items_for_sale/${targetOrderId}/null?page=${p}&limit=500`);
                const nextRows = Array.isArray(nextRes?.data) ? nextRes.data : [];
                if (nextRows.length) populateSaleItems(nextRows);
              } catch (_) {}
            }
          }
          sale.loadedAll = true;
          updateForgottenUI();
        }
      } catch (err) {
        const msg = String(err?.message || err);
        if (!msg.includes('הזמנה לא קיימת') && !msg.includes('404')) {
          console.debug('[myfam ensureSaleItemsLoaded]', msg);
        }
      } finally {
        saleCatalogPromise = null;
      }
    })();
    return saleCatalogPromise;
  }

  function showImportProgressModal() {
    $('#myfam-import-modal')?.remove();
    const m = document.createElement('div');
    m.id = 'myfam-import-modal';
    let hiddenByUser = false;
    m.innerHTML = `
      <div class="myfam-box myfam-import-box">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:8px;">
          <div style="display:flex; align-items:center; gap:8px; min-width:0;">
            <span style="display:inline-flex; width:18px; height:18px; border:2.5px solid #e2e8f0; border-top-color:#2e9e5b; border-radius:50%; animation:myfam-spin .8s linear infinite; flex-shrink:0;"></span>
            <h3 style="margin:0; font-size:14px; font-weight:700; color:#1e293b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">מייבא היסטוריה ברקע…</h3>
          </div>
          <button id="myfam-import-hide-btn" title="הסתר (הייבוא ימשיך ברקע)" style="background:transparent; border:none; color:#94a3b8; cursor:pointer; padding:2px 4px; font-size:16px; line-height:1;">✕</button>
        </div>
        <p id="myfam-import-status" style="margin:0 0 8px; font-size:12.5px; color:#475569;">מתחבר לאתר משנת יוסף…</p>
        <div style="background:#f1f5f9; border-radius:8px; height:6px; overflow:hidden; width:100%; margin-bottom:7px;">
          <div id="myfam-import-bar" style="background:#2e9e5b; height:100%; width:5%; transition:width .25s ease;"></div>
        </div>
        <div id="myfam-import-detail" style="font-size:11.5px; color:#64748b;">ניתן להמשיך להשתמש באתר כרגיל</div>
      </div>
    `;
    document.body.appendChild(m);
    const hideBtn = $('#myfam-import-hide-btn', m);
    if (hideBtn) {
      hideBtn.onclick = () => {
        hiddenByUser = true;
        m.remove();
        showToast('הייבוא ממשיך ברקע — נעדכן בסיום ✓', 'info');
      };
    }
    return {
      update(percent, statusText, detailText) {
        if (hiddenByUser) return;
        const bar = $('#myfam-import-bar', m);
        const st = $('#myfam-import-status', m);
        const dt = $('#myfam-import-detail', m);
        if (bar) bar.style.width = Math.max(5, Math.min(100, Math.round(percent))) + '%';
        if (st && statusText) st.textContent = statusText;
        if (dt && detailText) dt.textContent = `${detailText} • ניתן להמשיך לגלוש`;
      },
      showSuccess(importedCount, fixedCount, seenCount) {
        // שמירת אישור ייבוא בעוגיות הדפדפן (כדי שאם המשתמש ימחק עוגיות, התוסף יידע שההיסטוריה אופסה)
        setCookieMarker();

        const autoImportPref = localStorage.getItem(LS + 'auto_import_history');
        const showAskAuto = autoImportPref == null; // עדיין לא שאלנו את המשתמש

        if (hiddenByUser && !showAskAuto) {
          showToast(`ייבוא ההיסטוריה הושלם ✓ סונכרנו ${importedCount} הזמנות (${fixedCount} קבועים)`, 'success');
          return;
        }
        if (!document.body.contains(m)) {
          document.body.appendChild(m);
        }

        m.innerHTML = `
          <div class="myfam-box myfam-import-box">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:8px;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:50%; background:#dcfce7; color:#15803d; font-weight:700; font-size:13px; flex-shrink:0;">✓</span>
                <h3 style="margin:0; font-size:14.5px; font-weight:700; color:#1e293b;">ייבוא ההיסטוריה הושלם!</h3>
              </div>
              <button class="myfam-x" title="סגור" style="position:static; background:transparent; border:none; color:#94a3b8; cursor:pointer; padding:2px 4px;">${ICONS.close}</button>
            </div>
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:8px 10px; margin-bottom:10px; font-size:12px; line-height:1.6; color:#334155;">
              <div>סונכרנו <b>${importedCount}</b> הזמנות • <b>${fixedCount}</b> קבועים ⭐ • <b>${seenCount}</b> הוזמנו בעבר</div>
            </div>

            ${showAskAuto ? `
              <div style="background:#ecfdf5; border:1px solid #a7f3d0; border-radius:10px; padding:9px 10px; margin-bottom:10px;">
                <div style="font-size:12px; font-weight:700; color:#065f46; margin-bottom:6px;">
                  🔄 לסנכרן הזמנות חדשות אוטומטית ברקע להבא?
                </div>
                <div style="display:flex; gap:6px;">
                  <button id="myfam-btn-auto-yes" style="flex:1; padding:6px 8px; background:#10b981; color:#fff; border:none; border-radius:7px; font-size:12px; font-weight:700; cursor:pointer;">
                    ✓ כן, תמיד
                  </button>
                  <button id="myfam-btn-auto-no" style="padding:6px 10px; background:#fff; color:#475569; border:1px solid #cbd5e1; border-radius:7px; font-size:12px; cursor:pointer;">
                    לא כרגע
                  </button>
                </div>
              </div>
            ` : ''}

            <button id="myfam-import-done-btn" style="width:100%; padding:8px; background:#2e9e5b; color:#fff; border:none; border-radius:8px; font-weight:700; font-size:12.5px; cursor:pointer;">
              מעולה, סגור
            </button>
          </div>
        `;
        const close = () => m.remove();
        $('#myfam-import-done-btn', m).onclick = close;
        const xBtn = $('.myfam-x', m);
        if (xBtn) xBtn.onclick = close;

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
        if (!document.body.contains(m)) {
          document.body.appendChild(m);
        }
        m.innerHTML = `
          <div class="myfam-box myfam-import-box">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px;">
              <div style="display:flex; align-items:center; gap:7px; color:#dc2626;">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <h3 style="margin:0; font-size:14px; font-weight:700; color:#1e293b;">שגיאה בייבוא ההיסטוריה</h3>
              </div>
              <button class="myfam-x" title="סגור" style="position:static; background:transparent; border:none; color:#94a3b8; cursor:pointer; padding:2px 4px;">${ICONS.close}</button>
            </div>
            <p style="margin:0 0 10px; font-size:12px; color:#64748b; line-height:1.5;">${esc(msg)}</p>
            <button id="myfam-import-err-btn" style="width:100%; padding:7px; background:#f1f5f9; color:#334155; border:1px solid #cbd5e1; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer;">
              סגור
            </button>
          </div>
        `;
        const close = () => m.remove();
        $('#myfam-import-err-btn', m).onclick = close;
        const xBtn = $('.myfam-x', m);
        if (xBtn) xBtn.onclick = close;
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
    if (isExcludedPage() || location.pathname.includes('/login') || location.pathname.includes('/register')) return;
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
      const data = await siteApiRequest(`${getApiHost()}/api/orders?page=1`, 'GET');
      const ordersList = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
      if (!ordersList.length) return;

      let changed = false;
      for (const ord of ordersList.slice(0, 8)) {
        const oid = ord.id;
        if (!oid) continue;
        const oData = await siteApiRequest(`${getApiHost()}/api/orders/${oid}`, 'GET');
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

  let isImportingHistory = false;
  async function importHistoryFromSite() {
    if (isImportingHistory) {
      showToast('ייבוא ההיסטוריה כבר רץ ברקע…', 'info');
      return;
    }
    isImportingHistory = true;
    setStatus('מייבא היסטוריה ברקע…');
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
          data = await siteApiRequest(`${getApiHost()}/api/orders?page=${page}`, 'GET');
        } catch (e) {
          if (e.message === 'unauthorized' || e.status === 401) {
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
            const oData = await siteApiRequest(`${getApiHost()}/api/orders/${oid}`, 'GET');
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
      const errMsg = String(err?.message || err);
      if (errMsg.includes('Receiving end does not exist') || errMsg.includes('Extension context invalidated') || errMsg.includes('אינו זמין כעת')) {
        progress.showError('התוסף עודכן או אותחל. יש לרענן את דף האתר (F5) כדי לחדש את החיבור ולסנכרן.');
        setStatus('נדרש רענון דף');
      } else if (errMsg === 'unauthorized' || err?.status === 401) {
        progress.showError('התחברות נדרשת: יש לוודא שאתה מחובר לחשבונך באתר משנת יוסף.');
        setStatus('נדרשת התחברות');
      } else {
        progress.showError('שגיאה בייבוא ההיסטוריה מהאתר: ' + errMsg);
        setStatus('שגיאה בייבוא');
      }
    } finally {
      isImportingHistory = false;
    }
  }

  /* ---------- הוספת כל הקבועים לסל ---------- */
  function triggerSimulatedClick(el) {
    if (!el) return;
    const target = el.querySelector('.material-symbols-rounded, .material-icons, svg') || el;
    const opts = { bubbles: true, cancelable: true, view: window };
    target.dispatchEvent(new PointerEvent('pointerdown', opts));
    target.dispatchEvent(new MouseEvent('mousedown', opts));
    target.dispatchEvent(new PointerEvent('pointerup', opts));
    target.dispatchEvent(new MouseEvent('mouseup', opts));
    target.click();
    if (target !== el) {
      el.dispatchEvent(new PointerEvent('pointerdown', opts));
      el.dispatchEvent(new MouseEvent('mousedown', opts));
      el.dispatchEvent(new PointerEvent('pointerup', opts));
      el.dispatchEvent(new MouseEvent('mouseup', opts));
      el.click();
    }
  }

  function findCardAddButton(cd) {
    if (!cd) return null;
    const elements = [...cd.querySelectorAll('button, a[role="button"], div[role="button"], [class*="add"], [class*="plus"], [class*="btn"]')].filter(b => 
      !b.classList.contains('myfam-starbtn') && !heartLike(b)
    );
    if (!elements.length) return null;
    const explicit = elements.find(b => {
      const txt = (b.textContent || '').trim();
      const aria = b.getAttribute('aria-label') || b.getAttribute('title') || '';
      return /\+|הוסף|להוסיף|הוספה|add/i.test(txt + aria) || b.querySelector('.material-symbols-rounded, .material-icons')?.textContent.trim() === 'add';
    });
    if (explicit) return explicit;
    return elements[elements.length - 1];
  }

  function findCardForKey(key) {
    if (!currentCardMap) return null;
    for (const [card, data] of currentCardMap.entries()) {
      if (data.key === key) return card;
    }
    return null;
  }

  /* פונקציה מרכזית ואמינה להוספת פריט לסל */
  async function addItemToCart(it, amount = 1) {
    const oid = extractOrderIdFromUrl() || (location.pathname.includes('/order/') && live && live.orderId);
    if (!oid) return false;

    // אם המכירה טרם נטענה במלואה, נוודא טעינה
    if (!sale || !sale.items || !sale.items.size || (!sale.items.get('p' + it.pid) && !sale.items.get(norm(it.name || '')))) {
      await ensureSaleItemsLoaded(oid);
    }

    const match = (sale && sale.items) ? (
      sale.items.get('p' + it.pid) ||
      (it.key && sale.items.get(it.key)) ||
      sale.items.get(norm(it.name || '')) ||
      (it.itemSalesId && sale.items.get('s' + it.itemSalesId))
    ) : null;

    const itemID = Number(match?.pid || it.pid || (it.key ? it.key.replace(/^p/, '') : 0));
    const salesId = Number(match?.itemSalesId || it.itemSalesId || match?.id || 0);
    const name = match?.name || it.name || '';
    const price = Number(match?.price || it.price || 0);
    const qty = Number(amount || it.avgQty || 1);

    if (!itemID && !salesId) {
      if (localStorage.getItem(LS + 'debug_enabled')) console.log('[myfam] לא נמצא מזהה מוצר עבור', it);
      return false;
    }

    let success = false;

    // 1. קריאה ישירה ואמינה ל-API של משנת יוסף עם כל המזהים הנדרשים
    try {
      const payload = {
        ...(match?.raw || {}),
        itemID: itemID,
        item_salesID: salesId || itemID,
        id: salesId || itemID,
        name: name,
        amount: qty,
        price: price,
        price1: price
      };

      const res = await siteApiRequest(`${API_HOST}/api/add_item/${oid}`, 'POST', JSON.stringify(payload));
      if (res) {
        success = true;
        const rows = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : (Array.isArray(res?.items) ? res.items : (res?.item ? [res.item] : [])));
        rows.forEach(r => {
          const l = lineFrom(r);
          if (l && live && live.lines) live.lines.set(l.sid, l);
        });

        // עדכון מיידי בסל המקומי של התוסף
        if (live && live.lines) {
          const sid = salesId || itemID;
          live.lines.set(sid, {
            sid: sid,
            pid: itemID,
            key: 'p' + itemID,
            name: name,
            qty: qty,
            price: price,
            image: it.image || match?.image || ''
          });
        }

        const newTotal = parseFloat(res?.total_list ?? res?.total ?? res?.order_total ?? res?.data?.total_list ?? 0) || null;
        if (newTotal !== null && newTotal > 0 && live) {
          live.serverTotal = newTotal;
          live.currentTotal = newTotal;
        }

        // רענון סל מלא מהאתר ברקע
        try {
          siteApiRequest(`${API_HOST}/api/orders/${oid}`).then(oRes => {
            if (oRes && oRes.order) {
              const o = oRes.order;
              const curOrdId = extractOrderIdFromUrl();
              if (curOrdId === oid && live) {
                live.serverTotal = parseFloat(o.total_list ?? o.total ?? 0) || live.serverTotal;
                live.currentTotal = live.serverTotal;
                if (Array.isArray(o.items)) {
                  live.lines = new Map();
                  o.items.forEach(lineIt => {
                    const l = lineFrom(lineIt);
                    if (l) live.lines.set(l.sid, l);
                  });
                }
                updateBudgetUI();
                updateForgottenUI();
                updateSavingsUI();
              }
            }
          }).catch(() => {});
        } catch (e) {}
      }
    } catch (e) {
      if (localStorage.getItem(LS + 'debug_enabled')) {
        console.log('[myfam add item API error]', e);
      }
    }

    // 2. גיבוי: לחיצה ויזואלית על כרטיס המוצר בדף רק אם קריאת ה-API נכשלה (לפי הכמות המבוקשת)
    if (!success) {
      const card = findCardForKey(it.key || ('p' + itemID));
      if (card) {
        const btn = findCardAddButton(card);
        if (btn) {
          for (let q = 0; q < qty; q++) {
            try {
              triggerSimulatedClick(btn);
              success = true;
              if (q + 1 < qty) await new Promise(r => setTimeout(r, 120));
            } catch (e) { break; }
          }
        }
      }
    }

    if (success) {
      commit();
      updateBudgetUI();
      updateForgottenUI();
      updateSavingsUI();
      return true;
    }
    return false;
  }

  function getRecommendedQtyForProduct(key, normName) {
    try {
      const fixedEntry = state.fixed?.[key];
      if (fixedEntry && typeof fixedEntry === 'object' && fixedEntry.qty > 0) {
        return Math.max(1, Math.round(Number(fixedEntry.qty)));
      }
      const curSaleId = (typeof sale !== 'undefined' && sale?.id) || extractSaleIdFromUrl();
      const sorted = [...(state.history || [])].sort((a, b) => ((a.date || '') < (b.date || '') ? -1 : 1));
      const recentQtys = [];
      for (const o of sorted) {
        if (curSaleId != null && String(o.saleId) === String(curSaleId)) continue;
        const found = o.items?.find(x => x.key === key || (normName && norm(x.name) === normName));
        if (found && found.qty > 0) {
          recentQtys.push(Number(found.qty));
        }
      }
      if (recentQtys.length > 0) {
        const lastSlice = recentQtys.slice(-5);
        const avg = lastSlice.reduce((a, b) => a + b, 0) / lastSlice.length;
        return Math.max(1, Math.round(avg));
      }
    } catch (_) {}
    return 1;
  }

  async function addAllFixedToCart() {
    const btnAll = $('#myfam-b-addall');
    const origHtml = btnAll ? btnAll.innerHTML : '';
    
    // וידוא טעינת כלל מוצרי המכירה מכל הקטגוריות
    const oid = (live && live.orderId) || extractOrderIdFromUrl();
    if (oid && (!sale.loadedAll || !sale.items || sale.items.size < 5)) {
      if (btnAll) {
        btnAll.disabled = true;
        btnAll.innerHTML = `<span style="display:inline-block;animation:myfam-spin 1s linear infinite;margin-left:6px;">⏳</span> <span>טוען מוצרים מהמכירה...</span>`;
      }
      await ensureSaleItemsLoaded(oid);
    }

    // שליפת כל המוצרים הקבועים שעדיין חסרים בסל הנוכחי
    let candidates = getForgottenFixedItems();

    // גיבוי: אם getForgottenFixedItems ריק, נבדוק כרטיסים גלויים ב-DOM
    if (!candidates.length) {
      const cartPids = new Set(live ? [...live.lines.values()].map(l => l.key) : []);
      $$('.myfam-card.myfam-fixed').forEach(cd => {
        const leaf = cd.querySelector('[data-myleaf]');
        if (!leaf) return;
        const key = leaf.getAttribute('data-myleaf');
        if (cartPids.has(key)) return;
        const t = (leaf.textContent || '').trim();
        const hit = sale && sale.items && sale.items.get(norm(t));
        candidates.push({
          key,
          pid: hit ? hit.pid : Number(key.replace(/^p/, '')),
          name: t,
          itemSalesId: hit ? hit.itemSalesId : null,
          avgQty: getRecommendedQtyForProduct(key, norm(t))
        });
      });
    }

    if (!candidates.length) {
      showToast('כל המוצרים הקבועים במכירה זו כבר נמצאים בסל הקניות שלך! 🎉', 'info');
      return;
    }

    const totalUnits = candidates.reduce((sum, cItem) => sum + (Number(cItem.avgQty) || 1), 0);
    const multiCount = candidates.filter(cItem => (Number(cItem.avgQty) || 1) > 1).length;
    const confirmMsg = multiCount > 0
      ? `נמצאו ${candidates.length} מוצרים קבועים שחסרים בסל (סה"כ ${totalUnits} יחידות, לפי הכמות הרגילה שלך).\nלהוסיף את כולם כעת לסל הקניות?`
      : `נמצאו ${candidates.length} מוצרים קבועים שעדיין אינם בסל.\nלהוסיף את כולם כעת לסל הקניות?`;

    if (!await showAppConfirm(confirmMsg, 'הוספה מהירה לסל')) {
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
        const ok = await addItemToCart(item, item.avgQty || 1);
        if (ok) added++;
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
    showToast(`נוספו ${added} מוצרים קבועים לסל בהצלחה! 🛒`, 'success');
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

    const candidateKeys = new Set();
    for (const [k, f] of Object.entries(state.fixed || {})) {
      if (f && f.v) candidateKeys.add(k);
    }
    for (const [k, v] of Object.entries(c)) {
      if ((v?.count || 0) >= CONFIG.autoFixedAfter) {
        if (state.fixed?.[k]?.v !== false) candidateKeys.add(k);
      }
    }

    const missing = [];
    const seenPids = new Set();
    const saleMap = sale.items || new Map();

    for (const candKey of candidateKeys) {
      if (cartKeys.has(candKey)) continue;
      const it = saleMap.get(candKey);
      if (!it || !it.pid || seenPids.has(it.pid)) continue;
      seenPids.add(it.pid);

      const key = 'p' + it.pid;
      const normName = norm(it.name || '');
      if (cartKeys.has(key) || cartNames.has(normName)) continue;

      const avgQty = getRecommendedQtyForProduct(key, normName);

      let img = it.image || productImages[key] || productImages[normName] || '';
      if (!img) {
        img = getProductImage({ key, name: it.name, image: it.image });
      }
      img = formatMishnatImageUrl(img);
      if (img) {
        productImages[key] = img;
        if (normName) productImages[normName] = img;
      }

      missing.push({
        key,
        pid: it.pid,
        name: it.name,
        itemSalesId: it.itemSalesId,
        image: img,
        price: it.price || itemPrices[key] || 0,
        avgQty,
        raw: it.raw
      });
    }
    return missing;
  }

  function updateForgottenUI() {
    if (checkExcluded()) return;
    const badge = $('#myfam-forgotten-badge');
    const widget = $('#myfam-forgotten-widget');

    const curSaleId = sale.id || extractSaleIdFromUrl();
    const curOrderId = (live && live.orderId) || extractOrderIdFromUrl();
    const isDismissed = curSaleId && localStorage.getItem(LS + 'dismiss_forgotten_' + curSaleId) === 'true';

    const onOrderPage = location.pathname.includes('/order/');
    if (onOrderPage && curOrderId && !sale.loadedAll && !saleCatalogPromise) {
      ensureSaleItemsLoaded(curOrderId);
    }

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

  async function showForgottenModal(isAutoTrigger = false) {
    $('#myfam-forgotten-modal')?.remove();
    const oid = (live && live.orderId) || extractOrderIdFromUrl();
    if (oid && (!sale.loadedAll || !sale.items || sale.items.size < 5)) {
      await ensureSaleItemsLoaded(oid);
    }
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
          ${it.image ? `<img src="${esc(it.image)}" alt="${esc(it.name)}" onerror="this.onerror=null;this.style.display='none';this.parentElement.innerHTML='<span class=\\'myfam-no-img\\'>${ICONS.package}</span>';">` : `<span class="myfam-no-img">${ICONS.package}</span>`}
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
    attachModalFullscreenBtn($('.myfam-forgotten-box', m), { value: false });

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
      const success = await addItemToCart(it, it.avgQty || 1);

      if (success) {
        btnEl.className = 'myfam-btn-added';
        btnEl.innerHTML = '✓ נוסף';
        if (rowEl) rowEl.classList.add('item-added');
        showToast(`"${it.name}" נוסף לסל בהצלחה! 🛒`, 'success');
        setTimeout(() => {
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
            const success = await addItemToCart(it, it.avgQty || 1);

            if (success) {
              addedCount++;
              btnEl.className = 'myfam-btn-added';
              btnEl.innerHTML = '✓ נוסף';
              if (rowEl) rowEl.classList.add('item-added');
            } else {
              btnEl.disabled = false;
              btnEl.innerHTML = '+ הוסף לסל';
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
    if ($('#myfam-forgotten-modal, #myfam-modal, #myfam-whatsnew-modal, #myfam-budget-modal, #myfam-import-modal, #myfam-tips-modal')) {
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
  const ALL_CHAINS = {
    yeshHesed: { id: 'yeshHesed', name: 'יש חסד' },
    netoChisachon: { id: 'netoChisachon', name: 'נטו חיסכון' },
    osherAd: { id: 'osherAd', name: 'אושר עד' },
    ramiLevy: { id: 'ramiLevy', name: 'רמי לוי' },
    shaareiRevaha: { id: 'shaareiRevaha', name: 'שערי רווחה' },
    mechiraLaKehila: { id: 'mechiraLaKehila', name: 'המכירה לקהילה' }
  };
  const DEFAULT_SELECTED_CHAINS = ['yeshHesed', 'netoChisachon', 'osherAd', 'ramiLevy', 'shaareiRevaha', 'mechiraLaKehila'];

  const MARKET_ANCHOR_ITEMS = [
  {
    "id": "milk_3",
    "name": "חלב תנובה 3% 1 ליטר",
    "aliases": [
      "חלב 3%",
      "חלב תנובה 3%",
      "חלב טרי 3%"
    ],
    "supermarketPrice": 7.28,
    "chains": {
      "osherAd": null,
      "ramiLevy": 7.2,
      "yeshHesed": 7.35,
      "netoChisachon": null
    },
    "lastVerified": "2026-11-15"
  },
  {
    "id": "milk_1",
    "name": "חלב תנובה 1% 1 ליטר",
    "aliases": [
      "חלב 1%",
      "חלב תנובה 1%",
      "חלב טרי 1%"
    ],
    "supermarketPrice": 6.55,
    "chains": {
      "osherAd": 6.55,
      "ramiLevy": 6.55,
      "yeshHesed": 6.55,
      "netoChisachon": 6.55
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "eggs_l30",
    "name": "ביצים L תבנית 30",
    "aliases": [
      "ביצים l 30",
      "ביצים גודל l 30",
      "תבנית 30 ביצים l",
      "תבנית 30 ביצים",
      "תבנית ביצים l 30",
      "תבנית ביצים 30",
      "ביצים 30"
    ],
    "supermarketPrice": 38,
    "chains": {
      "osherAd": 37.24,
      "ramiLevy": 38,
      "yeshHesed": 38,
      "netoChisachon": 37.62
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "eggs_m30",
    "name": "ביצים M תבנית 30",
    "aliases": [
      "ביצים m 30",
      "ביצים גודל m 30",
      "תבנית 30 ביצים m"
    ],
    "supermarketPrice": 34.5,
    "chains": {
      "osherAd": 33.81,
      "ramiLevy": 34.5,
      "yeshHesed": 34.5,
      "netoChisachon": 34.16
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "eggs_l12",
    "name": "ביצים L מארז 12",
    "aliases": [
      "ביצים l 12",
      "מארז 12 ביצים",
      "12 ביצים l",
      "12 ביצים"
    ],
    "supermarketPrice": 14.54,
    "chains": {
      "osherAd": null,
      "ramiLevy": null,
      "yeshHesed": 14.54,
      "netoChisachon": null
    },
    "lastVerified": "2026-11-15"
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
      "osherAd": 5.75,
      "ramiLevy": 5.75,
      "yeshHesed": 5.75,
      "netoChisachon": 5.75
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "cottage_5",
    "name": "קוטג' תנובה 5% 250 גרם",
    "aliases": [
      "קוטג 5%",
      "קוטג תנובה 5%",
      "קוטג 250"
    ],
    "supermarketPrice": 6.87,
    "chains": {
      "osherAd": 6.8,
      "ramiLevy": 6.9,
      "yeshHesed": 6.9,
      "netoChisachon": 6.85
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "yellow_emek",
    "name": "גבינה צהובה עמק תנובה 400 גרם",
    "aliases": [
      "עמק 28",
      "צהובה עמק",
      "עמק 400"
    ],
    "supermarketPrice": 23.77,
    "chains": {
      "osherAd": 22.9,
      "ramiLevy": 23.9,
      "yeshHesed": 24.5,
      "netoChisachon": 23.7
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "yellow_gilboa",
    "name": "גבינה צהובה גלבוע 200 גרם",
    "aliases": [
      "גלבוע 200",
      "צהובה גלבוע"
    ],
    "supermarketPrice": 15.5,
    "chains": {
      "osherAd": null,
      "ramiLevy": 15.5,
      "yeshHesed": null,
      "netoChisachon": null
    },
    "lastVerified": "2026-11-15"
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
      "osherAd": 5.1,
      "ramiLevy": 5.1,
      "yeshHesed": 5.1,
      "netoChisachon": 5.1
    },
    "lastVerified": "2026-11-09"
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
      "osherAd": 3.05,
      "ramiLevy": 3.05,
      "yeshHesed": 3.05,
      "netoChisachon": 3.05
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "sweet_cream",
    "name": "שמנת מתוקה 38% השף הלבן 250 מ\"ל",
    "aliases": [
      "שמנת מתוקה 38",
      "השף הלבן 38"
    ],
    "supermarketPrice": 8.43,
    "chains": {
      "osherAd": 7.9,
      "ramiLevy": 8.5,
      "yeshHesed": 8.9,
      "netoChisachon": 8.4
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "milky",
    "name": "מילקי שוקולד שטראוס",
    "aliases": [
      "מילקי שוקולד",
      "מילקי"
    ],
    "supermarketPrice": 3.37,
    "chains": {
      "osherAd": 3.2,
      "ramiLevy": 3.4,
      "yeshHesed": 3.5,
      "netoChisachon": 3.35
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "shoko_1l",
    "name": "שוקו תנובה 1 ליטר",
    "aliases": [
      "שוקו 1 ליטר",
      "שוקו תנובה"
    ],
    "supermarketPrice": 11.67,
    "chains": {
      "osherAd": 10.9,
      "ramiLevy": 11.9,
      "yeshHesed": 12.2,
      "netoChisachon": 11.55
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "oil_canola",
    "name": "שמן קנולה מזוכך 1 ליטר",
    "aliases": [
      "שמן קנולה",
      "קנולה 1 ליטר"
    ],
    "supermarketPrice": 9.43,
    "chains": {
      "osherAd": 8.9,
      "ramiLevy": 9.5,
      "yeshHesed": 9.9,
      "netoChisachon": 9.4
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "oil_soy",
    "name": "שמן סויה 1 ליטר",
    "aliases": [
      "שמן סויה",
      "שמן סויה 1 ליטר"
    ],
    "supermarketPrice": 8.43,
    "chains": {
      "osherAd": 7.9,
      "ramiLevy": 8.5,
      "yeshHesed": 8.9,
      "netoChisachon": 8.4
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "oil_olive",
    "name": "שמן זית כתית מעולה 750 מ\"ל",
    "aliases": [
      "שמן זית",
      "כתית מעולה 750"
    ],
    "supermarketPrice": 29.85,
    "chains": {
      "osherAd": 29.9,
      "ramiLevy": 29.8,
      "yeshHesed": null,
      "netoChisachon": null
    },
    "lastVerified": "2026-11-15"
  },
  {
    "id": "sugar_white",
    "name": "סוכר לבן סוגת 1 ק\"ג",
    "aliases": [
      "סוכר לבן",
      "סוכר 1 קג",
      "סוכר סוגת"
    ],
    "supermarketPrice": 4.97,
    "chains": {
      "osherAd": 4.8,
      "ramiLevy": 4.9,
      "yeshHesed": 5.2,
      "netoChisachon": 5
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "flour_white",
    "name": "קמח לבן בהיר 1 ק\"ג",
    "aliases": [
      "קמח לבן",
      "קמח בהיר 1"
    ],
    "supermarketPrice": 4.53,
    "chains": {
      "osherAd": 4.2,
      "ramiLevy": 4.5,
      "yeshHesed": 4.9,
      "netoChisachon": 4.55
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "flour_raising",
    "name": "קמח תופח 1 ק\"ג",
    "aliases": [
      "קמח תופח",
      "תופח 1 קג"
    ],
    "supermarketPrice": 6.43,
    "chains": {
      "osherAd": 5.9,
      "ramiLevy": 6.5,
      "yeshHesed": 6.9,
      "netoChisachon": 6.4
    },
    "lastVerified": "2026-11-09"
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
      "osherAd": 2.6,
      "ramiLevy": 2.6,
      "yeshHesed": 2.6,
      "netoChisachon": 2.6
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "rice_persian",
    "name": "אורז פרסי סוגת 1 ק\"ג",
    "aliases": [
      "אורז פרסי",
      "פרסי סוגת"
    ],
    "supermarketPrice": 10.43,
    "chains": {
      "osherAd": 9.9,
      "ramiLevy": 10.5,
      "yeshHesed": 10.9,
      "netoChisachon": 10.4
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "rice_basmati",
    "name": "אורז בסמטי סוגת 1 ק\"ג",
    "aliases": [
      "אורז בסמטי",
      "בסמטי 1 קג"
    ],
    "supermarketPrice": 14.1,
    "chains": {
      "osherAd": 13.5,
      "ramiLevy": 13.9,
      "yeshHesed": 14.9,
      "netoChisachon": 14.2
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "rice_jasmine",
    "name": "אורז יסמין סוגת 1 ק\"ג",
    "aliases": [
      "אורז יסמין",
      "יסמין 1 קג"
    ],
    "supermarketPrice": 12.2,
    "chains": {
      "osherAd": 11.5,
      "ramiLevy": 12.2,
      "yeshHesed": 12.9,
      "netoChisachon": 12.2
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "pasta_osem_spaghetti",
    "name": "פסטה ספגטי אסם 500 גרם",
    "aliases": [
      "ספגטי אסם",
      "פסטה ספגטי"
    ],
    "supermarketPrice": 4.5,
    "chains": {
      "osherAd": 4.5,
      "ramiLevy": 4.5,
      "yeshHesed": 4.5,
      "netoChisachon": null
    },
    "lastVerified": "2026-11-15"
  },
  {
    "id": "pasta_osem_penne",
    "name": "פסטה פנה אסם 500 גרם",
    "aliases": [
      "פסטה פנה",
      "פנה אסם",
      "פסטה נוצה"
    ],
    "supermarketPrice": 5.97,
    "chains": {
      "osherAd": 5.5,
      "ramiLevy": 5.9,
      "yeshHesed": 6.5,
      "netoChisachon": 6
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "pasta_osem_fusilli",
    "name": "פסטה מסולסלת (בורגי) אסם 500 גרם",
    "aliases": [
      "פסטה בורגי",
      "פסטה מסולסלת",
      "פסטה פוזילי"
    ],
    "supermarketPrice": 5.97,
    "chains": {
      "osherAd": 5.5,
      "ramiLevy": 5.9,
      "yeshHesed": 6.5,
      "netoChisachon": 6
    },
    "lastVerified": "2026-11-09"
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
    "supermarketPrice": 6.43,
    "chains": {
      "osherAd": 5.9,
      "ramiLevy": 6.5,
      "yeshHesed": 6.9,
      "netoChisachon": 6.4
    },
    "lastVerified": "2026-11-09"
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
    "supermarketPrice": 29.9,
    "chains": {
      "osherAd": null,
      "ramiLevy": 29.9,
      "yeshHesed": null,
      "netoChisachon": null
    },
    "lastVerified": "2026-11-15"
  },
  {
    "id": "corn_can",
    "name": "גרגרי תירס מתוק שימורים 550 גרם",
    "aliases": [
      "תירס מתוק",
      "שימורי תירס",
      "גרגרי תירס"
    ],
    "supermarketPrice": 6.2,
    "chains": {
      "osherAd": 5.5,
      "ramiLevy": 6.2,
      "yeshHesed": 6.9,
      "netoChisachon": 6.2
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "peas_can",
    "name": "אפונה עדינה שימורים 550 גרם",
    "aliases": [
      "אפונה עדינה",
      "שימורי אפונה"
    ],
    "supermarketPrice": 6.2,
    "chains": {
      "osherAd": 5.5,
      "ramiLevy": 6.2,
      "yeshHesed": 6.9,
      "netoChisachon": 6.2
    },
    "lastVerified": "2026-11-09"
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
    "supermarketPrice": 6.87,
    "chains": {
      "osherAd": 6.2,
      "ramiLevy": 6.9,
      "yeshHesed": 7.5,
      "netoChisachon": 6.85
    },
    "lastVerified": "2026-11-09"
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
    "supermarketPrice": 8.1,
    "chains": {
      "osherAd": 7.5,
      "ramiLevy": 7.9,
      "yeshHesed": 8.9,
      "netoChisachon": 8.2
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "tomato_paste_100",
    "name": "רסק עגבניות 28-30% 100 גרם",
    "aliases": [
      "רסק עגבניות 100",
      "רסק 100 גרם"
    ],
    "supermarketPrice": 2.03,
    "chains": {
      "osherAd": 1.9,
      "ramiLevy": 2,
      "yeshHesed": 2.2,
      "netoChisachon": 2.05
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "ketchup_osem",
    "name": "קטשופ אסם בקבוק לחיץ 750 גרם",
    "aliases": [
      "קטשופ אסם",
      "קטשופ 750"
    ],
    "supermarketPrice": 12.2,
    "chains": {
      "osherAd": 11.5,
      "ramiLevy": 12.2,
      "yeshHesed": 12.9,
      "netoChisachon": 12.2
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "mayo_telma",
    "name": "מיונז אמיתי תלמה 500 גרם",
    "aliases": [
      "מיונז תלמה",
      "מיונז אמיתי"
    ],
    "supermarketPrice": 12.03,
    "chains": {
      "osherAd": 11.2,
      "ramiLevy": 12,
      "yeshHesed": 12.9,
      "netoChisachon": 12.05
    },
    "lastVerified": "2026-11-09"
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
    "supermarketPrice": 22.9,
    "chains": {
      "osherAd": 21.9,
      "ramiLevy": 22.9,
      "yeshHesed": 23.9,
      "netoChisachon": 22.9
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "challah",
    "name": "חלת שבת מהודרת 500 גרם",
    "aliases": [
      "חלת שבת",
      "חלה מהודרת",
      "חלה לשבת"
    ],
    "supermarketPrice": 7.2,
    "chains": {
      "osherAd": 6.9,
      "ramiLevy": 7.2,
      "yeshHesed": 7.5,
      "netoChisachon": 7.2
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "bread_wholewheat",
    "name": "לחם 100% חיטה מלאה פרוס (דגנית עין בר/ברמן/אנגל)",
    "aliases": [
      "לחם חיטה מלאה",
      "לחם דגנית עין בר",
      "לחם מלא פרוס",
      "לחם מחיטה מלאה"
    ],
    "supermarketPrice": 12.43,
    "chains": {
      "osherAd": 11.9,
      "ramiLevy": 12.5,
      "yeshHesed": 12.9,
      "netoChisachon": 12.4
    },
    "lastVerified": "2026-11-09"
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
      "yeshHesed": 7.91,
      "netoChisachon": 7.91
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "cornflakes_telma",
    "name": "קורנפלקס תלמה אלופים 750 גרם",
    "aliases": [
      "קורנפלקס תלמה",
      "קורנפלקס של אלופים"
    ],
    "supermarketPrice": 19.3,
    "chains": {
      "osherAd": 18.5,
      "ramiLevy": 19.5,
      "yeshHesed": 19.9,
      "netoChisachon": 19.2
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "kariot_telma",
    "name": "כריות שוקולד תלמה 750 גרם",
    "aliases": [
      "כריות תלמה",
      "כריות נוגט",
      "כריות שוקולד"
    ],
    "supermarketPrice": 25.9,
    "chains": {
      "osherAd": 24.9,
      "ramiLevy": 25.9,
      "yeshHesed": 26.9,
      "netoChisachon": 25.9
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "petiber_osem",
    "name": "ביסקוויט פטיבר אסם 500 גרם",
    "aliases": [
      "פטי בר",
      "פטיבר אסם"
    ],
    "supermarketPrice": 13.2,
    "chains": {
      "osherAd": 12.5,
      "ramiLevy": 13.2,
      "yeshHesed": 13.9,
      "netoChisachon": 13.2
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "bamba_osem",
    "name": "במבה אסם 80 גרם",
    "aliases": [
      "במבה אסם",
      "במבה 80",
      "במבה 80 גרם",
      "במבה אסם 80",
      "שקית במבה 80"
    ],
    "supermarketPrice": 4.53,
    "chains": {
      "osherAd": 4.2,
      "ramiLevy": 4.5,
      "yeshHesed": 4.9,
      "netoChisachon": 4.55
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "bisli_osem",
    "name": "ביסלי אסם 70 גרם (גריל/ברביקיו)",
    "aliases": [
      "ביסלי גריל 70",
      "ביסלי ברביקיו 70",
      "ביסלי בצל 70",
      "ביסלי 70 גרם",
      "חטיף ביסלי גריל 70",
      "ביסלי גריל אסם"
    ],
    "supermarketPrice": 4.53,
    "chains": {
      "osherAd": 4.2,
      "ramiLevy": 4.5,
      "yeshHesed": 4.9,
      "netoChisachon": 4.55
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "bisli_party_mix",
    "name": "ביסלי פארטי מיקס אריזה גדולה אסם (150-200 גרם)",
    "aliases": [
      "פארטי מיקס",
      "ביסלי פארטי",
      "ביסלי אריזה גדולה",
      "פארטי מיקס אסם",
      "ביסלי מיקס"
    ],
    "supermarketPrice": 7.9,
    "chains": {
      "osherAd": 6.9,
      "ramiLevy": 7.5,
      "yeshHesed": 8.5,
      "netoChisachon": 7.7
    },
    "lastVerified": "2026-11-15"
  },
  {
    "id": "shahar_hashahar",
    "name": "ממרח שוקולד השחר העולה 450-500 גרם",
    "aliases": [
      "השחר העולה",
      "ממרח השחר",
      "שוקולד השחר",
      "שוקולד השחר 450",
      "שוקולד השחר 500"
    ],
    "supermarketPrice": 12.97,
    "chains": {
      "osherAd": 12.5,
      "ramiLevy": 12.9,
      "yeshHesed": 13.5,
      "netoChisachon": 13
    },
    "lastVerified": "2026-11-15"
  },
  {
    "id": "badin_softener_2l",
    "name": "מרכך כביסה בדין 2 ליטר",
    "aliases": [
      "מרכך בדין",
      "מרכך כביסה בדין",
      "בדין 2 ליטר",
      "בדין 2 ל"
    ],
    "supermarketPrice": 17.9,
    "chains": {
      "osherAd": 16.9,
      "ramiLevy": 17.9,
      "yeshHesed": 18.9,
      "netoChisachon": 17.9
    },
    "lastVerified": "2026-11-15"
  },
  {
    "id": "coca_cola_6",
    "name": "קוקה קולה 1.5 ליטר מארז שישייה",
    "aliases": [
      "קוקה קולה שישיה",
      "קולה שישיה",
      "שישיית קוקה קולה"
    ],
    "supermarketPrice": 43.57,
    "chains": {
      "osherAd": 41.9,
      "ramiLevy": 43.9,
      "yeshHesed": 44.9,
      "netoChisachon": 43.4
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "coca_zero_6",
    "name": "קוקה קולה זירו 1.5 ליטר מארז שישייה",
    "aliases": [
      "קולה זירו שישיה",
      "זירו שישיה",
      "שישיית קוקה קולה זירו"
    ],
    "supermarketPrice": 43.57,
    "chains": {
      "osherAd": 41.9,
      "ramiLevy": 43.9,
      "yeshHesed": 44.9,
      "netoChisachon": 43.4
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "mineral_water_6",
    "name": "מים מינרליים 1.5 ליטר מארז שישייה",
    "aliases": [
      "מים מינרליים שישיה",
      "שישיית מים",
      "עין גדי שישיה"
    ],
    "supermarketPrice": 13.97,
    "chains": {
      "osherAd": 13.5,
      "ramiLevy": 13.9,
      "yeshHesed": 14.5,
      "netoChisachon": 14
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "grape_juice",
    "name": "מיץ ענבים תירוש כרמל 1 ליטר",
    "aliases": [
      "תירוש כרמל",
      "מיץ ענבים תירוש"
    ],
    "supermarketPrice": 18.2,
    "chains": {
      "osherAd": 17.5,
      "ramiLevy": 18.2,
      "yeshHesed": 18.9,
      "netoChisachon": 18.2
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "coffee_elite",
    "name": "קפה נמס עלית פחית 200 גרם",
    "aliases": [
      "קפה נמס עלית",
      "נמס עלית 200"
    ],
    "supermarketPrice": 20.9,
    "chains": {
      "osherAd": 19.9,
      "ramiLevy": 20.9,
      "yeshHesed": 21.9,
      "netoChisachon": 20.9
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "tasters_choice",
    "name": "קפה מגורען טסטרס צ'ויס 200 גרם",
    "aliases": [
      "טסטרס צויס",
      "טסטרס צ'ויס"
    ],
    "supermarketPrice": 33.9,
    "chains": {
      "osherAd": 32.9,
      "ramiLevy": 33.9,
      "yeshHesed": 34.9,
      "netoChisachon": 33.9
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "tea_wissotzky",
    "name": "תה ויסוצקי קלאסי 100 שקיקים",
    "aliases": [
      "ויסוצקי קלאסי",
      "תה ויסוצקי 100"
    ],
    "supermarketPrice": 19.2,
    "chains": {
      "osherAd": 18.5,
      "ramiLevy": 19.2,
      "yeshHesed": 19.9,
      "netoChisachon": 19.2
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "fairy_dish",
    "name": "נוזל כלים פיירי 650 מ\"ל",
    "aliases": [
      "נוזל כלים פיירי",
      "סבון כלים פיירי 650",
      "פיירי 650"
    ],
    "supermarketPrice": 12.2,
    "chains": {
      "osherAd": 11.5,
      "ramiLevy": 12.2,
      "yeshHesed": 12.9,
      "netoChisachon": 12.2
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "persil_gel",
    "name": "ג'ל כביסה פרסיל / אריאל 2.5 ליטר",
    "aliases": [
      "ג'ל כביסה פרסיל",
      "גל כביסה פרסיל",
      "פרסיל כביסה",
      "אריאל ג'ל"
    ],
    "supermarketPrice": 35.57,
    "chains": {
      "osherAd": 33.9,
      "ramiLevy": 35.9,
      "yeshHesed": 36.9,
      "netoChisachon": 35.4
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "badin_softener",
    "name": "מרכך כביסה מרוכז בדין 1 ליטר",
    "aliases": [
      "מרכך בדין",
      "בדין מרוכז"
    ],
    "supermarketPrice": 15.9,
    "chains": {
      "osherAd": 14.9,
      "ramiLevy": 15.9,
      "yeshHesed": 16.9,
      "netoChisachon": 15.9
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "sano_bleach",
    "name": "אקונומיקה סנו ג'ל 750 מ\"ל",
    "aliases": [
      "אקונומיקה סנו ג'ל",
      "אקונומיקה סנו גל",
      "סנו ג'ל"
    ],
    "supermarketPrice": 10.97,
    "chains": {
      "osherAd": 10.5,
      "ramiLevy": 10.9,
      "yeshHesed": 11.5,
      "netoChisachon": 11
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "toilet_paper_30",
    "name": "נייר טואלט דו-שכבתי 30 גלילים",
    "aliases": [
      "נייר טואלט 30",
      "לילי 30",
      "מולט 30"
    ],
    "supermarketPrice": 33.43,
    "chains": {
      "osherAd": 31.9,
      "ramiLevy": 33.5,
      "yeshHesed": 34.9,
      "netoChisachon": 33.4
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "garbage_bags",
    "name": "שקיות אשפה עם שרוך מארז 50-60 יח'",
    "aliases": [
      "שקיות אשפה שרוך",
      "שקיות לפח"
    ],
    "supermarketPrice": 18.9,
    "chains": {
      "osherAd": 17.9,
      "ramiLevy": 18.9,
      "yeshHesed": 19.9,
      "netoChisachon": 18.9
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "colgate_total",
    "name": "משחת שיניים קולגייט טוטאל 100 מ\"ל",
    "aliases": [
      "קולגייט טוטאל",
      "משחת שיניים קולגייט"
    ],
    "supermarketPrice": 13.9,
    "chains": {
      "osherAd": 12.9,
      "ramiLevy": 13.9,
      "yeshHesed": 14.9,
      "netoChisachon": 13.9
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "hand_soap_1l",
    "name": "אל סבון נוזלי לידיים מילוי 1 ליטר",
    "aliases": [
      "סבון נוזלי 1 ליטר",
      "אל סבון מילוי",
      "סבון ידיים 1"
    ],
    "supermarketPrice": 9.2,
    "chains": {
      "osherAd": 8.5,
      "ramiLevy": 9.2,
      "yeshHesed": 9.9,
      "netoChisachon": 9.2
    },
    "lastVerified": "2026-11-09"
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
    "supermarketPrice": 11.2,
    "chains": {
      "osherAd": 10.5,
      "ramiLevy": 11.2,
      "yeshHesed": 11.9,
      "netoChisachon": 11.2
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "peas_frozen_sunfrost",
    "name": "אפונה עדינה סנפרוסט 800 גרם",
    "aliases": [
      "אפונה סנפרוסט",
      "סנפרוסט אפונה"
    ],
    "supermarketPrice": 16.9,
    "chains": {
      "osherAd": 15.9,
      "ramiLevy": 16.9,
      "yeshHesed": 17.9,
      "netoChisachon": 16.9
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "green_beans_sunfrost",
    "name": "שעועית ירוקה עדינה סנפרוסט 800 גרם",
    "aliases": [
      "שעועית ירוקה סנפרוסט",
      "סנפרוסט שעועית"
    ],
    "supermarketPrice": 16.9,
    "chains": {
      "osherAd": 15.9,
      "ramiLevy": 16.9,
      "yeshHesed": 17.9,
      "netoChisachon": 16.9
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "fries_frozen",
    "name": "צ'יפס אמריקאי קפוא 1.5-2 ק\"ג",
    "aliases": [
      "ציפס קפוא",
      "צ'יפס אמריקאי",
      "תפודים ציפס"
    ],
    "supermarketPrice": 20.43,
    "chains": {
      "osherAd": 18.9,
      "ramiLevy": 20.5,
      "yeshHesed": 21.9,
      "netoChisachon": 20.4
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "bourekas_potato",
    "name": "בורקס תפוחי אדמה מעדנות 800 גרם",
    "aliases": [
      "בורקס תפוחי אדמה",
      "בורקס מעדנות"
    ],
    "supermarketPrice": 18.9,
    "chains": {
      "osherAd": 17.9,
      "ramiLevy": 18.9,
      "yeshHesed": 19.9,
      "netoChisachon": 18.9
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "malawach",
    "name": "מלוואח מעדנות 700 גרם",
    "aliases": [
      "מלוואח מעדנות",
      "מלוח מעדנות"
    ],
    "supermarketPrice": 15.9,
    "chains": {
      "osherAd": 14.9,
      "ramiLevy": 15.9,
      "yeshHesed": 16.9,
      "netoChisachon": 15.9
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "schnitzel_corn",
    "name": "שניצל תירס טבעול 750 גרם",
    "aliases": [
      "שניצל תירס",
      "טבעול תירס"
    ],
    "supermarketPrice": 28.43,
    "chains": {
      "osherAd": 26.9,
      "ramiLevy": 28.5,
      "yeshHesed": 29.9,
      "netoChisachon": 28.4
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "chicken_breast_fresh",
    "name": "חזה עוף טרי מוכשר 1 ק\"ג",
    "aliases": [
      "חזה עוף טרי",
      "חזה עוף נקי"
    ],
    "supermarketPrice": 38.23,
    "chains": {
      "osherAd": 36.9,
      "ramiLevy": 37.9,
      "yeshHesed": 39.9,
      "netoChisachon": 38.4
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "ground_beef_frozen",
    "name": "בשר טחון קפוא חלק 500 גרם",
    "aliases": [
      "בשר בקר טחון",
      "בקר טחון קפוא",
      "טחון חלק"
    ],
    "supermarketPrice": 21.57,
    "chains": {
      "osherAd": 19.9,
      "ramiLevy": 21.9,
      "yeshHesed": 22.9,
      "netoChisachon": 21.4
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "salmon_fillet_frozen",
    "name": "פילה סלמון קפוא בוואקום 1 ק\"ג",
    "aliases": [
      "פילה סלמון",
      "סלמון קפוא"
    ],
    "supermarketPrice": 62.57,
    "chains": {
      "osherAd": 59.9,
      "ramiLevy": 62.9,
      "yeshHesed": 64.9,
      "netoChisachon": 62.4
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "fairy_1_5l",
    "name": "סבון כלים פיירי 1.5 ליטר",
    "aliases": [
      "פיירי 1.5",
      "סבון כלים פיירי - 1.5",
      "פיירי 1.5 ליטר"
    ],
    "supermarketPrice": 18.9,
    "chains": {
      "osherAd": 17.9,
      "ramiLevy": 18.9,
      "yeshHesed": 19.9,
      "netoChisachon": 18.9
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "sano_maxima_softener",
    "name": "מרכך כביסה מרוכז סנו מקסימה 1 ליטר",
    "aliases": [
      "סנו מקסימה",
      "מרכך סנו מקסימה",
      "מקסימה מרוכז"
    ],
    "supermarketPrice": 15.9,
    "chains": {
      "osherAd": 14.9,
      "ramiLevy": 15.9,
      "yeshHesed": 16.9,
      "netoChisachon": 15.9
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "persil_gel_3_8l",
    "name": "ג'ל כביסה פרסיל 3.8 ליטר",
    "aliases": [
      "פרסיל 3.8",
      "ג'ל כביסה פרסיל - 3.8",
      "גל כביסה פרסיל 3.8"
    ],
    "supermarketPrice": 47.57,
    "chains": {
      "osherAd": 44.9,
      "ramiLevy": 47.9,
      "yeshHesed": 49.9,
      "netoChisachon": 47.4
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "delipekan_telma",
    "name": "דגני בוקר דליפקאן תלמה 400-500 גרם",
    "aliases": [
      "דליפקאן",
      "דלי פקאן",
      "דליפקאן תלמה"
    ],
    "supermarketPrice": 23.43,
    "chains": {
      "osherAd": 21.9,
      "ramiLevy": 23.5,
      "yeshHesed": 24.9,
      "netoChisachon": 23.4
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "shugi_bars",
    "name": "מארז חטיף דגנים שוגי תלמה (שוקולד/וניל)",
    "aliases": [
      "חטיף דגנים שוגי",
      "שוגי תלמה",
      "חטיפי שוגי"
    ],
    "supermarketPrice": 14.9,
    "chains": {
      "osherAd": 13.9,
      "ramiLevy": 14.9,
      "yeshHesed": 15.9,
      "netoChisachon": 14.9
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "quaker_oats",
    "name": "קוואקר שיבולת שועל להכנה מהירה 500 גרם",
    "aliases": [
      "קווקר",
      "קוואקר",
      "שיבולת שועל להכנה מהירה"
    ],
    "supermarketPrice": 10.9,
    "chains": {
      "osherAd": 9.9,
      "ramiLevy": 10.9,
      "yeshHesed": 11.9,
      "netoChisachon": 10.9
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "soup_almonds_osem",
    "name": "שקדי מרק אסם 400 גרם",
    "aliases": [
      "שקדי מרק",
      "שקדי מרק אסם"
    ],
    "supermarketPrice": 12.9,
    "chains": {
      "osherAd": 11.9,
      "ramiLevy": 12.9,
      "yeshHesed": 13.9,
      "netoChisachon": 12.9
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "sweet_chili_sauce",
    "name": "רוטב צ'ילי מתוק 700 מ\"ל",
    "aliases": [
      "רוטב צ'ילי מתוק",
      "רוטב צילי מתוק",
      "צילי מתוק"
    ],
    "supermarketPrice": 10.9,
    "chains": {
      "osherAd": 9.9,
      "ramiLevy": 10.9,
      "yeshHesed": 11.9,
      "netoChisachon": 10.9
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "silan_pure_squeeze",
    "name": "סילאן תמרים טבעי 100% בקבוק לחיץ",
    "aliases": [
      "סילאן טבעי",
      "סילאן לחיץ",
      "סילאן תמרים"
    ],
    "supermarketPrice": 16.77,
    "chains": {
      "osherAd": 15.5,
      "ramiLevy": 16.9,
      "yeshHesed": 17.9,
      "netoChisachon": 16.7
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "honey_squeeze",
    "name": "דבש טהור בקבוק לחיץ / צנצנת (יד מרדכי/עמק חפר)",
    "aliases": [
      "דבש טבעי",
      "דבש בבקבוק לחיץ",
      "דבש לחיץ"
    ],
    "supermarketPrice": 23.57,
    "chains": {
      "osherAd": 21.9,
      "ramiLevy": 23.9,
      "yeshHesed": 24.9,
      "netoChisachon": 23.4
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "sano_clear_windows",
    "name": "נוזל לניקוי חלונות סנו קליר 1 ליטר",
    "aliases": [
      "סנו קליר",
      "נוזל לניקוי חלונות 1 ליטר",
      "ניקוי חלונות סנו"
    ],
    "supermarketPrice": 10.9,
    "chains": {
      "osherAd": 9.9,
      "ramiLevy": 10.9,
      "yeshHesed": 11.9,
      "netoChisachon": 10.9
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "sano_ratzpaz",
    "name": "רצפז נוזל רצפות לשואב שוטף / מרוכז סנו",
    "aliases": [
      "רצפז",
      "נוזל רצפות לשואב שוטף",
      "רצפז נוזל"
    ],
    "supermarketPrice": 18.9,
    "chains": {
      "osherAd": 17.9,
      "ramiLevy": 18.9,
      "yeshHesed": 19.9,
      "netoChisachon": 18.9
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "dr_fischer_baby_shampoo",
    "name": "שמפו אל דמע לתינוקות ד\"ר פישר 750 מ\"ל - 1 ליטר",
    "aliases": [
      "אל דמע לתינוקות",
      "שמפו אל דמע",
      "ד\"ר פישר לתינוקות"
    ],
    "supermarketPrice": 20.57,
    "chains": {
      "osherAd": 18.9,
      "ramiLevy": 20.9,
      "yeshHesed": 21.9,
      "netoChisachon": 20.4
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "sano_anti_calc",
    "name": "תרסיס אנטי קאלק 4 ב-1 סנו 1 ליטר",
    "aliases": [
      "אנטי קאלק",
      "תרסיס אנטי קאלק",
      "אנטיקאלק סנו"
    ],
    "supermarketPrice": 15.77,
    "chains": {
      "osherAd": 14.5,
      "ramiLevy": 15.9,
      "yeshHesed": 16.9,
      "netoChisachon": 15.7
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "sano_javel_spray",
    "name": "תרסיס ז'אוול קצף ניקוי בתוספת אקונומיקה סנו 750 מ\"ל",
    "aliases": [
      "ז'אוול קצף",
      "זאוול סנו",
      "תרסיס ז'אוול"
    ],
    "supermarketPrice": 15.77,
    "chains": {
      "osherAd": 14.5,
      "ramiLevy": 15.9,
      "yeshHesed": 16.9,
      "netoChisachon": 15.7
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "chocolate_chips_baking",
    "name": "שוקולד צ'יפס לאפייה (אופנהיימר / מיה / כרמית)",
    "aliases": [
      "שוקולד צ'יפס",
      "שוקולד ציפס אמיתי",
      "נטיפי שוקולד מריר"
    ],
    "supermarketPrice": 11.9,
    "chains": {
      "osherAd": 10.9,
      "ramiLevy": 11.9,
      "yeshHesed": 12.9,
      "netoChisachon": 11.9
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "pizza_snacks_maadanot",
    "name": "חטיפי פיצה קפואים מעדנות 700 גרם",
    "aliases": [
      "חטיפי פיצה",
      "פיצה מעדנות",
      "חטיפי פיצה קפואים"
    ],
    "supermarketPrice": 25.43,
    "chains": {
      "osherAd": 23.9,
      "ramiLevy": 25.5,
      "yeshHesed": 26.9,
      "netoChisachon": 25.4
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "green_beans_cut",
    "name": "שעועית ירוקה חתוכה קפואה 800 גרם",
    "aliases": [
      "שעועית ירוקה חתוכה",
      "שעועית ירוקה קפואה"
    ],
    "supermarketPrice": 13.9,
    "chains": {
      "osherAd": 12.9,
      "ramiLevy": 13.9,
      "yeshHesed": 14.9,
      "netoChisachon": 13.9
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "bread_crumbs_golden",
    "name": "פירורי לחם מוזהבים 400-500 גרם",
    "aliases": [
      "פירורי לחם מוזהבים",
      "פירורי לחם אסם"
    ],
    "supermarketPrice": 7.2,
    "chains": {
      "osherAd": 6.5,
      "ramiLevy": 7.2,
      "yeshHesed": 7.9,
      "netoChisachon": 7.2
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "axe_deodorant_spray",
    "name": "דאודורנט ספריי אקס AXE לגברים 150-200 מ\"ל",
    "aliases": [
      "דאודורנט אקס",
      "אקס לגברים",
      "ספריי אקס"
    ],
    "supermarketPrice": 14.77,
    "chains": {
      "osherAd": 13.5,
      "ramiLevy": 14.9,
      "yeshHesed": 15.9,
      "netoChisachon": 14.7
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "marshmallow_carmit",
    "name": "מרשמלו 150 גרם כרמית",
    "aliases": [
      "מרשמלו 150",
      "מרשמלו כרמית"
    ],
    "supermarketPrice": 5.43,
    "chains": {
      "osherAd": 4.9,
      "ramiLevy": 5.5,
      "yeshHesed": 5.9,
      "netoChisachon": 5.4
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "frozen_mango_chunks",
    "name": "קוביות מנגו קפוא 1 ק\"ג / מוגדלת",
    "aliases": [
      "קוביות מנגו",
      "מנגו קפוא"
    ],
    "supermarketPrice": 23.43,
    "chains": {
      "osherAd": 21.9,
      "ramiLevy": 23.5,
      "yeshHesed": 24.9,
      "netoChisachon": 23.4
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "frozen_strawberries",
    "name": "תות שדה קפוא נקי 1 ק\"ג",
    "aliases": [
      "תות שדה קפוא",
      "תות קפוא"
    ],
    "supermarketPrice": 23.43,
    "chains": {
      "osherAd": 21.9,
      "ramiLevy": 23.5,
      "yeshHesed": 24.9,
      "netoChisachon": 23.4
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "canned_peach_halves",
    "name": "חצאי אפרסק בסירופ שימורים 820 גרם",
    "aliases": [
      "חצאי אפרסק",
      "אפרסק שימורים"
    ],
    "supermarketPrice": 9.2,
    "chains": {
      "osherAd": 8.5,
      "ramiLevy": 9.2,
      "yeshHesed": 9.9,
      "netoChisachon": 9.2
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "chocolate_spread_mehadrin",
    "name": "רביעיית שוקולד מריר כרמית 400 גרם",
    "aliases": [
      "רביעיית שוקולד",
      "שוקולד מריר כרמית",
      "רביעיית שוקולד מריר כרמית"
    ],
    "supermarketPrice": 14.9,
    "chains": {
      "osherAd": 13.9,
      "ramiLevy": 14.9,
      "yeshHesed": 15.9,
      "netoChisachon": 14.9
    },
    "lastVerified": "2026-11-09"
  },
  {
    "id": "cucumber_fresh",
    "name": "מלפפון טרי 1 ק\"ג",
    "aliases": [
      "מלפפון",
      "מלפפונים",
      "מלפפון ירוק",
      "מלפפון שדה"
    ],
    "supermarketPrice": 5.9,
    "chains": {
      "osherAd": 5.9,
      "ramiLevy": 5.9,
      "yeshHesed": 5.9,
      "netoChisachon": 5.9
    },
    "lastVerified": "2026-11-15"
  },
  {
    "id": "tomato_fresh",
    "name": "עגבניות טריות 1 ק\"ג",
    "aliases": [
      "עגבניה",
      "עגבניות",
      "עגבניות חממה",
      "עגבניה שדה"
    ],
    "supermarketPrice": 5.9,
    "chains": {
      "osherAd": 5.9,
      "ramiLevy": 5.9,
      "yeshHesed": 5.9,
      "netoChisachon": 5.9
    },
    "lastVerified": "2026-11-15"
  },
  {
    "id": "onion_dry",
    "name": "בצל יבש 1 ק\"ג",
    "aliases": [
      "בצל",
      "בצל יבש",
      "בצל צהוב",
      "בצל שקית"
    ],
    "supermarketPrice": 4.9,
    "chains": {
      "osherAd": 4.9,
      "ramiLevy": 4.9,
      "yeshHesed": 4.9,
      "netoChisachon": 4.9
    },
    "lastVerified": "2026-11-15"
  },
  {
    "id": "potato_fresh",
    "name": "תפוחי אדמה 1 ק\"ג",
    "aliases": [
      "תפוח אדמה",
      "תפוחי אדמה",
      "תפו\"א",
      "תפוא",
      "תפוא אדום",
      "תפוחי אדמה אדום",
      "תפוחי אדמה לבן"
    ],
    "supermarketPrice": 4.9,
    "chains": {
      "osherAd": 4.9,
      "ramiLevy": 4.9,
      "yeshHesed": 4.9,
      "netoChisachon": 4.9
    },
    "lastVerified": "2026-11-15"
  },
  {
    "id": "carrot_fresh",
    "name": "גזר ארוז 1 ק\"ג",
    "aliases": [
      "גזר",
      "גזר ארוז",
      "גזר שקית"
    ],
    "supermarketPrice": 4.9,
    "chains": {
      "osherAd": 4.9,
      "ramiLevy": 4.9,
      "yeshHesed": 4.9,
      "netoChisachon": 4.9
    },
    "lastVerified": "2026-11-15"
  },
  {
    "id": "pepper_red_fresh",
    "name": "פלפל אדום (גמבה) 1 ק\"ג",
    "aliases": [
      "פלפל אדום",
      "גמבה",
      "גמבה אדומה",
      "פלפל גמבה"
    ],
    "supermarketPrice": 8.9,
    "chains": {
      "osherAd": 8.9,
      "ramiLevy": 8.9,
      "yeshHesed": 8.9,
      "netoChisachon": 8.9
    },
    "lastVerified": "2026-11-15"
  },
  {
    "id": "sweet_potato_fresh",
    "name": "בטטה 1 ק\"ג",
    "aliases": [
      "בטטה",
      "בטטות"
    ],
    "supermarketPrice": 7.9,
    "chains": {
      "osherAd": 7.9,
      "ramiLevy": 7.9,
      "yeshHesed": 7.9,
      "netoChisachon": 7.9
    },
    "lastVerified": "2026-11-15"
  },
  {
    "id": "zucchini_fresh",
    "name": "קישואים 1 ק\"ג",
    "aliases": [
      "קישוא",
      "קישואים",
      "קישוא ירוק"
    ],
    "supermarketPrice": 7.9,
    "chains": {
      "osherAd": 7.9,
      "ramiLevy": 7.9,
      "yeshHesed": 7.9,
      "netoChisachon": 7.9
    },
    "lastVerified": "2026-11-15"
  },
  {
    "id": "lemon_fresh",
    "name": "לימון 1 ק\"ג",
    "aliases": [
      "לימון",
      "לימונים"
    ],
    "supermarketPrice": 6.9,
    "chains": {
      "osherAd": 6.9,
      "ramiLevy": 6.9,
      "yeshHesed": 6.9,
      "netoChisachon": 6.9
    },
    "lastVerified": "2026-11-15"
  },
  {
    "id": "banana_fresh",
    "name": "בננות 1 ק\"ג",
    "aliases": [
      "בננה",
      "בננות"
    ],
    "supermarketPrice": 6.9,
    "chains": {
      "osherAd": 6.9,
      "ramiLevy": 6.9,
      "yeshHesed": 6.9,
      "netoChisachon": 6.9
    },
    "lastVerified": "2026-11-15"
  },
  {
    "id": "cabbage_white_fresh",
    "name": "כרוב לבן 1 ק\"ג",
    "aliases": [
      "כרוב לבן",
      "כרוב"
    ],
    "supermarketPrice": 4.9,
    "chains": {
      "osherAd": 4.9,
      "ramiLevy": 4.9,
      "yeshHesed": 4.9,
      "netoChisachon": 4.9
    },
    "lastVerified": "2026-11-15"
  },
  {
    "id": "pasta_osem_general",
    "name": "פסטה אסם 500 גרם",
    "aliases": [
      "פסטה אסם",
      "פסטה 500 גרם",
      "פסטה 500",
      "ספגטי אסם 500"
    ],
    "supermarketPrice": 5.9,
    "chains": {
      "osherAd": 5.5,
      "ramiLevy": 5.9,
      "yeshHesed": 6.2,
      "netoChisachon": 5.9
    },
    "lastVerified": "2026-11-15"
  },
  {
    "id": "cheese_white_tara_5_500g",
    "name": "גבינה לבנה 5% טרה 500 גרם",
    "aliases": [
      "גבינה 5% - טרה 500",
      "גבינה 5% טרה 500",
      "גבינה 5% - טרה",
      "גבינה 5% טרה",
      "גבינה לבנה טרה 500"
    ],
    "supermarketPrice": 10.9,
    "chains": {
      "osherAd": 10.9,
      "ramiLevy": 10.8,
      "yeshHesed": 11.2,
      "netoChisachon": null
    },
    "lastVerified": "2026-11-15"
  },
  {
    "id": "cheese_emek_600g",
    "name": "גבינה צהובה עמק 28% תנובה 600 גרם",
    "aliases": [
      "גבינה צהובה עמק - 600",
      "גבינה צהובה עמק 600",
      "פרוסות גבינה צהובה בוואקום",
      "גבינה צהובה עמק - 600 גר'"
    ],
    "supermarketPrice": 37.4,
    "chains": {
      "osherAd": 36.9,
      "ramiLevy": 37.4,
      "yeshHesed": 37.9,
      "netoChisachon": null
    },
    "lastVerified": "2026-11-15"
  },
  {
    "id": "carlo_choco_8",
    "name": "מאגדת מעדן קרלו שוקו תנובה 8 גביעים",
    "aliases": [
      "מאגדת קרלו בטעם שוקו (חום)",
      "מאגדת קרלו בטעם שוקו",
      "קרלו שוקו 8",
      "קרלו 8 גביעים",
      "מעדן קרלו שוקו"
    ],
    "supermarketPrice": 15.5,
    "chains": {
      "osherAd": 14.9,
      "ramiLevy": 15.5,
      "yeshHesed": 16.2,
      "netoChisachon": null
    },
    "lastVerified": "2026-11-15"
  },
  {
    "id": "cookies_tirosh_half_moon_175g",
    "name": "עוגיות ביסקוויט חצי ירח תירוש 175 גרם",
    "aliases": [
      "עוגיות חצי ירח - תירוש",
      "עוגיות חצי ירח תירוש",
      "חצי ירח - תירוש",
      "עוגיות חצי ירח"
    ],
    "supermarketPrice": 9.9,
    "chains": {
      "osherAd": 8.9,
      "ramiLevy": 9.9,
      "yeshHesed": 10.9,
      "netoChisachon": null
    },
    "lastVerified": "2026-11-15"
  },
  {
    "id": "cheese_tara_5_250g",
    "name": "גבינה לבנה 5% טרה 250 גרם",
    "aliases": [
      "גבינה 5% - טרה 250",
      "גבינה 5% טרה 250",
      "גבינה לבנה טרה 250"
    ],
    "supermarketPrice": 5.75,
    "chains": {
      "osherAd": 5.75,
      "ramiLevy": 5.75,
      "yeshHesed": 5.75,
      "netoChisachon": null
    },
    "lastVerified": "2026-11-15"
  },
  {
    "id": "cheese_noam_200g",
    "name": "גבינה צהובה נעם 28% טרה 200 גרם",
    "aliases": [
      "גבינה צהובה נעם 200",
      "נעם פרוסות 200",
      "גבינה צהובה נעם טרה 200"
    ],
    "supermarketPrice": 14.5,
    "chains": {
      "osherAd": 13.9,
      "ramiLevy": 14.5,
      "yeshHesed": 15.2,
      "netoChisachon": null
    },
    "lastVerified": "2026-11-15"
  },
  {
    "id": "cottage_tara_5_250g",
    "name": "קוטג' 5% טרה 250 גרם",
    "aliases": [
      "קוטג' טרה 5%",
      "קוטג' 5% טרה",
      "קוטג' טרה 250"
    ],
    "supermarketPrice": 6.9,
    "chains": {
      "osherAd": 6.8,
      "ramiLevy": 6.9,
      "yeshHesed": 7.1,
      "netoChisachon": null
    },
    "lastVerified": "2026-11-15"
  },
  {
    "id": "my_9228",
    "name": "קצפת צמחית השף הלבן תנובה",
    "aliases": [
      "קצפת צמחית השף הלבן תנובה"
    ],
    "supermarketPrice": 15.6,
    "chains": {
      "osherAd": null,
      "ramiLevy": null,
      "yeshHesed": 15.6,
      "netoChisachon": null
    },
    "lastVerified": "2026-11-15"
  },
  {
    "id": "my_11174",
    "name": "רביעיית גבינה מותכת 18% - משק צוריאל",
    "aliases": [
      "רביעיית גבינה מותכת 18% - משק צוריאל"
    ],
    "supermarketPrice": 8.45,
    "chains": {
      "osherAd": 8.5,
      "ramiLevy": null,
      "yeshHesed": 8.4,
      "netoChisachon": null
    },
    "lastVerified": "2026-11-15"
  },
  {
    "id": "my_900",
    "name": "חמאה טרה",
    "aliases": [
      "חמאה טרה"
    ],
    "supermarketPrice": 9.6,
    "chains": {
      "osherAd": 9.5,
      "ramiLevy": 9.8,
      "yeshHesed": 9.5,
      "netoChisachon": null
    },
    "lastVerified": "2026-11-15"
  },
  {
    "id": "my_6550",
    "name": "בורקס קפוא במילוי גבינה",
    "aliases": [
      "בורקס קפוא במילוי גבינה"
    ],
    "supermarketPrice": 16.85,
    "chains": {
      "osherAd": 16.9,
      "ramiLevy": 16.8,
      "yeshHesed": null,
      "netoChisachon": null
    },
    "lastVerified": "2026-11-15"
  },
  {
    "id": "my_742",
    "name": "טבעות זיתים ירוקים - שימורים {מ.מ.}",
    "aliases": [
      "טבעות זיתים ירוקים - שימורים {מ.מ.}"
    ],
    "supermarketPrice": 12.9,
    "chains": {
      "osherAd": null,
      "ramiLevy": 12.9,
      "yeshHesed": null,
      "netoChisachon": null
    },
    "lastVerified": "2026-11-15"
  },
  {
    "id": "my_1632",
    "name": "שוקולד צ'יפס (נטיפי שוקולד מריר) - אופנהיימר {מ.מ.}",
    "aliases": [
      "שוקולד צ'יפס (נטיפי שוקולד מריר) - אופנהיימר {מ.מ.}"
    ],
    "supermarketPrice": 19.9,
    "chains": {
      "osherAd": null,
      "ramiLevy": 19.9,
      "yeshHesed": null,
      "netoChisachon": null
    },
    "lastVerified": "2026-11-15"
  },
  {
    "id": "my_1508",
    "name": "קרמבו מוקה 8 יח' ריאו {מ.מ.}",
    "aliases": [
      "קרמבו מוקה 8 יח' ריאו {מ.מ.}"
    ],
    "supermarketPrice": 14.57,
    "chains": {
      "osherAd": 14,
      "ramiLevy": 14.8,
      "yeshHesed": 14.9,
      "netoChisachon": null
    },
    "lastVerified": "2026-11-15"
  }
];

  let dynamicMarketItems = MARKET_ANCHOR_ITEMS;

  async function fetchRemoteMarketPrices() {
    try {
      const cached = localStorage.getItem('myfam_market_prices');
      const cachedTime = localStorage.getItem('myfam_market_prices_time');
      const now = Date.now();
      if (cached && cachedTime && (now - Number(cachedTime) < 4 * 3600 * 1000)) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          dynamicMarketItems = parsed;
          marketComparisonCache.clear();
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
        marketComparisonCache.clear();
        localStorage.setItem('myfam_market_prices', JSON.stringify(data));
        localStorage.setItem('myfam_market_prices_time', String(now));
        updateSavingsUI();
        scheduleRender();
      }
    } catch (_) {
      // Fallback silently to bundled MARKET_ANCHOR_ITEMS
    }
  }

  /* ---------- מנוע זיהוי יחידות מידה ומשקלים (Weight & Unit Parser) ---------- */
  function parseProductUnits(rawStr) {
    if (!rawStr) {
      return {
        weightGrams: null, weightMin: null, weightMax: null,
        volumeMl: null, volumeMin: null, volumeMax: null,
        packCount: null, packMin: null, packMax: null,
        isBig: false, isSmall: false
      };
    }
    const s = rawStr.toString().toLowerCase();

    let weightGrams = null, weightMin = null, weightMax = null;
    let volumeMl = null, volumeMin = null, volumeMax = null;
    let packCount = null, packMin = null, packMax = null;

    // 1. משקל בקילוגרמים (כולל תמיכה בטווח כגון 1.5-2 ק"ג)
    const kgRangeMatch = s.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*(?:ק["'״׳]?ג|קג|קילו|kg)(?:[^\u0590-\u05fea-z0-9]|$)/i);
    if (kgRangeMatch) {
      weightMin = Math.round(parseFloat(kgRangeMatch[1]) * 1000);
      weightMax = Math.round(parseFloat(kgRangeMatch[2]) * 1000);
      weightGrams = weightMax;
    } else {
      const kgMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:ק["'״׳]?ג|קג|קילו|kg)(?:[^\u0590-\u05fea-z0-9]|$)/i);
      if (kgMatch) {
        weightGrams = Math.round(parseFloat(kgMatch[1]) * 1000);
        weightMin = weightGrams;
        weightMax = weightGrams;
      }
    }

    // 2. משקל בגרמים (כולל תמיכה בטווח כגון 150-200 גרם, 400-500 גרם)
    if (!weightGrams) {
      const gRangeMatch = s.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*(?:גרם|גר["'״׳]|ג["'״׳]|גר|ג|gr|g)(?:[^\u0590-\u05fea-z0-9]|$)/i);
      if (gRangeMatch) {
        weightMin = Math.round(parseFloat(gRangeMatch[1]));
        weightMax = Math.round(parseFloat(gRangeMatch[2]));
        weightGrams = weightMax;
      } else {
        const gMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:גרם|גר["'״׳]|ג["'״׳]|גר|ג|gr|g)(?:[^\u0590-\u05fea-z0-9]|$)/i);
        if (gMatch) {
          weightGrams = Math.round(parseFloat(gMatch[1]));
          weightMin = weightGrams;
          weightMax = weightGrams;
        }
      }
    }

    // 3. נפח: בדיקת טווח משולב (כגון 750 מ"ל - 1 ליטר)
    const mixedVolRange = s.match(/(\d+(?:\.\d+)?)\s*(?:מ["'״׳]?ל|מל|ml)\s*-\s*(\d+(?:\.\d+)?)\s*(?:ליטר|ל["'״׳]|ל|liter|l)(?:[^\u0590-\u05fea-z0-9]|$)/i);
    if (mixedVolRange) {
      volumeMin = Math.round(parseFloat(mixedVolRange[1]));
      volumeMax = Math.round(parseFloat(mixedVolRange[2]) * 1000);
      volumeMl = volumeMax;
    }

    // 4. נפח בליטרים (כולל תמיכה בטווח)
    if (!volumeMl) {
      const lRangeMatch = s.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*(?:ליטר|ל["'״׳]|ל|liter|l)(?:[^\u0590-\u05fea-z0-9]|$)/i);
      if (lRangeMatch) {
        volumeMin = Math.round(parseFloat(lRangeMatch[1]) * 1000);
        volumeMax = Math.round(parseFloat(lRangeMatch[2]) * 1000);
        volumeMl = volumeMax;
      } else {
        const lMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:ליטר|ל["'״׳]|ל|liter|l)(?:[^\u0590-\u05fea-z0-9]|$)/i);
        if (lMatch) {
          volumeMl = Math.round(parseFloat(lMatch[1]) * 1000);
          volumeMin = volumeMl;
          volumeMax = volumeMl;
        }
      }
    }

    // 5. נפח במיליליטר (כולל תמיכה בטווח כגון 150-200 מ"ל)
    if (!volumeMl) {
      const mlRangeMatch = s.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*(?:מ["'״׳]?ל|מל|ml)(?:[^\u0590-\u05fea-z0-9]|$)/i);
      if (mlRangeMatch) {
        volumeMin = Math.round(parseFloat(mlRangeMatch[1]));
        volumeMax = Math.round(parseFloat(mlRangeMatch[2]));
        volumeMl = volumeMax;
      } else {
        const mlMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:מ["'״׳]?ל|מל|ml)(?:[^\u0590-\u05fea-z0-9]|$)/i);
        if (mlMatch) {
          volumeMl = Math.round(parseFloat(mlMatch[1]));
          volumeMin = volumeMl;
          volumeMax = volumeMl;
        }
      }
    }

    // 6. מארזים וכמויות (למעט פריטים שמטבעם נמכרים בזוג כגון כפפות/גרביים/נעליים):
    const isNaturallyPaired = /(?:כפפות|גרביים|גרבי|נעלי|נעליים|מגפיים|כפכפים|סנדלים|רפידות|משקפיים|אוזניות)/i.test(s);
    if (/(?:^|\s)זוג(?:\s|$)/.test(s) && !isNaturallyPaired) {
      packCount = 2; packMin = 2; packMax = 2;
    } else if (/שלישיי?ה|שלישיית/.test(s)) {
      packCount = 3; packMin = 3; packMax = 3;
    } else if (/רביעיי?ה|רביעיית/.test(s)) {
      packCount = 4; packMin = 4; packMax = 4;
    } else if (/חמישיי?ה|חמישיית/.test(s)) {
      packCount = 5; packMin = 5; packMax = 5;
    } else if (/שישיי?ה|שישיית/.test(s)) {
      packCount = 6; packMin = 6; packMax = 6;
    } else if (/שמינ?יי?ה|שמינ?יית/.test(s)) {
      packCount = 8; packMin = 8; packMax = 8;
    } else if (/עשיריי?ה|עשיריית/.test(s)) {
      packCount = 10; packMin = 10; packMax = 10;
    } else if (/תריסר/.test(s)) {
      packCount = 12; packMin = 12; packMax = 12;
    }

    if (!packCount) {
      const unitCountMatch = s.match(/(\d+)(?:\s*-\s*(\d+))?\s*(?:יח['"״׳]?|יחידות|גלילים|שקיקים|ביצים|פחיות|בקבוקים|גביעים|כוסות|חבילות|שלגונים|ארטיקים)(?:[^\u0590-\u05fea-z0-9]|$)/i);
      if (unitCountMatch) {
        packMin = parseInt(unitCountMatch[1], 10);
        packMax = unitCountMatch[2] ? parseInt(unitCountMatch[2], 10) : packMin;
        packCount = packMax;
      }
    }

    if (!packCount) {
      const packMatch = s.match(/(?:מארז|תבנית)\s*(\d+)(?:\s*-\s*(\d+))?(?!\s*(?:\.\d+)?\s*(?:גר|ג['"״׳]?|ק["'״׳]?ג|קג|קילו|מ["'״׳]?ל|מל|ליטר|ל['"״׳]?|kg|gr|ml|l\b|%))/i);
      if (packMatch && packMatch[1]) {
        packMin = parseInt(packMatch[1], 10);
        packMax = packMatch[2] ? parseInt(packMatch[2], 10) : packMin;
        packCount = packMax;
      }
    }

    if (!packCount) {
      const trayMatch = s.match(/(?:תבנית|מארז)(?:\s+[^\d\s]+){0,4}\s+(\d+)/i);
      if (trayMatch) {
        const n = parseInt(trayMatch[1], 10);
        if (n >= 6 && n <= 60) {
          packCount = n; packMin = n; packMax = n;
        }
      }
    }

    if (!packCount) {
      const multiMatch = s.match(/(\d+)\s*[\*xX×]\s*(\d+(?:\.\d+)?)\s*(גרם|גר['"״׳]?|ג['"״׳]?|gr|g)?/i);
      if (multiMatch) {
        packCount = parseInt(multiMatch[1], 10);
        packMin = packCount;
        packMax = packCount;
        if (multiMatch[3]) {
          const totalG = Math.round(packCount * parseFloat(multiMatch[2]));
          weightGrams = totalG;
          weightMin = totalG;
          weightMax = totalG;
        }
      }
    }

    const isBig = /(?:אריזה\s*גדולה|משפחתי|פארטי|מיקס|מגה|ג['"״׳]?מבו|ענק|חיסכון)/i.test(s) 
      || (weightGrams != null && weightGrams >= 140 && weightGrams <= 500 && /(?:חטיף|ביסלי|במבה|תפוצ[יפ]ס|דוריטוס)/i.test(s));
    const isSmall = /(?:אישי|קטן|מיני|כיס)/i.test(s) 
      || (weightGrams != null && weightGrams <= 80 && /(?:חטיף|ביסלי|במבה|תפוצ[יפ]ס|דוריטוס)/i.test(s));

    return {
      weightGrams, weightMin, weightMax,
      volumeMl, volumeMin, volumeMax,
      packCount, packMin, packMax,
      isBig, isSmall
    };
  }

  function rangesCompatible(min1, max1, min2, max2, tolerance = 0.08) {
    const aMin = min1 ?? max1;
    const aMax = max1 ?? min1;
    const bMin = min2 ?? max2;
    const bMax = max2 ?? min2;
    if (aMin == null || bMin == null) return true;

    if (aMax < bMin) {
      return (bMin - aMax) / bMin <= tolerance;
    }
    if (bMax < aMin) {
      return (aMin - bMax) / aMin <= tolerance;
    }
    return true;
  }

  function areUnitsCompatible(u1, u2) {
    if (!u1 || !u2) return true;

    // 1. בדיקת משקל (כולל תמיכה בטווחים ובסטייה של עד 8%)
    if (u1.weightGrams && u2.weightGrams) {
      if (!rangesCompatible(u1.weightMin, u1.weightMax, u2.weightMin, u2.weightMax, 0.08)) {
        return false;
      }
    }

    // 2. בדיקת נפח (כולל תמיכה בטווחים ובסטייה של עד 8%)
    if (u1.volumeMl && u2.volumeMl) {
      if (!rangesCompatible(u1.volumeMin, u1.volumeMax, u2.volumeMin, u2.volumeMax, 0.08)) {
        return false;
      }
    }

    // 2ב. אי-תאימות בין משקל לנפח (למשל 100 גרם מול 1 ליטר = 1000 מ"ל)
    if (u1.weightGrams && !u1.volumeMl && u2.volumeMl && !u2.weightGrams) {
      if (!rangesCompatible(u1.weightMin, u1.weightMax, u2.volumeMin, u2.volumeMax, 0.15)) {
        return false;
      }
    }
    if (u1.volumeMl && !u1.weightGrams && u2.weightGrams && !u2.volumeMl) {
      if (!rangesCompatible(u1.volumeMin, u1.volumeMax, u2.weightMin, u2.weightMax, 0.15)) {
        return false;
      }
    }

    // 3. בדיקת כמות במארז (כולל תמיכה בטווח כגון 50-60 יח')
    if (u1.packCount && u2.packCount) {
      if (!rangesCompatible(u1.packMin, u1.packMax, u2.packMin, u2.packMax, 0.0)) {
        return false;
      }
    }

    // 4. אי-התאמה של מארז מול יחידה בודדת (אלא אם המשקל הכולל זהה לחלוטין)
    if ((u1.packCount && u1.packCount > 1 && !u2.packCount) || (u2.packCount && u2.packCount > 1 && !u1.packCount)) {
      const sameTotalWeight = u1.weightGrams && u2.weightGrams && !u1.volumeMl && !u2.volumeMl
        && rangesCompatible(u1.weightMin, u1.weightMax, u2.weightMin, u2.weightMax, 0.05);
      if (!sameTotalWeight) {
        return false;
      }
    }

    // 5. בדיקת אריזה גדולה מול אריזה אישית/קטנה
    if ((u1.isBig && u2.isSmall) || (u1.isSmall && u2.isBig)) {
      return false;
    }

    return true;
  }

  const PROD_BOUNDARY_START = '(?:^|(?<=[\\s()\\[\\]{}/\\-–—.,:]))';
  const PROD_BOUNDARY_END = '(?=$|[\\s()\\[\\]{}/\\-–—.,:])';

  function containsWholePhrase(haystackNorm, needleNorm) {
    if (!haystackNorm || !needleNorm) return false;
    const escRe = needleNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`${PROD_BOUNDARY_START}${escRe}${PROD_BOUNDARY_END}`).test(haystackNorm);
  }

  function tokenMatches(n, nWords, tok) {
    if (nWords.includes(tok)) {
      return true;
    }
    if (tok.length >= 4) {
      return containsWholePhrase(n, tok);
    }
    return false;
  }

  const marketComparisonCache = new Map();

  function findMarketComparison(itemName, unitHint = '') {
    if (!itemName) return null;
    const cacheKey = itemName + '||' + unitHint;
    if (marketComparisonCache.has(cacheKey)) {
      return marketComparisonCache.get(cacheKey);
    }
    const res = _rawFindMarketComparison(itemName, unitHint);
    marketComparisonCache.set(cacheKey, res);
    return res;
  }

  function _rawFindMarketComparison(itemName, unitHint = '') {
    if (!itemName) return null;
    const n = norm(itemName);
    const nWords = n.split(/\s+/);
    const catalog = dynamicMarketItems || MARKET_ANCHOR_ITEMS;
    if (!Array.isArray(catalog)) return null;

    const fullSourceName = unitHint ? `${itemName} ${unitHint}` : itemName;
    const targetUnits = parseProductUnits(fullSourceName);
    const isPlantOrChocMilk = /(?:שקדים|סויה|שיבולת\s*שועל|קוקוס|אורז|שוקולד|מרוכז)/i.test(n);
    const isNonFoodOil = /(?:קרם|סבון|שמפו|מרכך|טיפוח|הדלקה|נרות|נר|חנוכי|פתיל|ערכה|גוף|רגליים|ידיים|שיער|עיסוי)/i.test(n);
    const PRODUCE_EXCLUDED_RE = /(?:מרק|אבקת|טבעות|קמח|מלח|חמוץ|חמוצים|סלט|מיץ|עוגת|עוגיות|חטיף|נשנושים|איירביס|בייגל[ה]?|קרקר|צ['׳]?יפס|תפוצ['׳]?יפס|דוריטוס|ביסלי|במבה|בורקס|שבבי|רסק|רוטב|קטשופ|מיונז|חרדל|ממרח|מטבל|שמנת|גבינ[הת]|מחיות|מחית|פאווץ|סיגרים|סיגר|מילוי|במילוי|כרובית|מוקפא|קפוא|שימורים|מיובש|תבלין|מטוגן|קלוי|בטעם|טעם|קרוטונים|גליד[הת]?|ארטיק|סורבה|מעדן|יוגורט|מילקשייק|קונפיטור|ריבת|ממתק|סוכרי|שוקולד|וופל|חליטה|ניחוח|בושם|תרסיס|סבון|שמפו|קרם|נוזל|ג['׳]?ל|כביסה|שניצל|קציצ|פשטיד|פסטה|אטריות|אורז|קוסקוס|מצה|לחם|לחמני|פיתות|חלה|בלינ[צץ])|(?:^|\s)תה(?:\s|$)/i;
    const isProduceExcluded = PRODUCE_EXCLUDED_RE.test(n);
    const isWholeWheat = /(?:מלאה|כוסמין)/i.test(n);
    const isFreshItem = item => !PRODUCE_EXCLUDED_RE.test(norm(item.name))
      && (item.id.endsWith('_fresh') || item.id === 'onion_dry'
        || /^(?:אגס|אפרסק|אבוקדו|אבטיח|מלון|קלמנטינה|תפוז|תפוח|בננ|גזר|מלפפון|עגבני|פלפל|חציל|קישוא|דלורית|בטטה|סלק|קולרבי|שום|לימון|כרוב|כוסברה|שמיר|פטרוזיליה|בזיליקום|נענע|חסה|סלרי|בצל\s*ירוק|צנון|צנונית|פומלה|אשכולית|מנגו|רימון|שזיף|ענבים|תות|דובדבן|תמר|פטריות|נבטים)(?:\s|$)/i.test(norm(item.name)));

    const formatWeightLabel = grams => {
      if (!grams || grams <= 0) return '';
      if (grams >= 1000) {
        const kg = Math.round((grams / 1000) * 100) / 100;
        return `${kg} ק"ג`;
      }
      return `${Math.round(grams)} גרם`;
    };

    const resolveUnitScale = item => {
      const itemUnits = parseProductUnits(item.name);
      if (areUnitsCompatible(targetUnits, itemUnits)) {
        return { compatible: true, exact: true, scale: 1 };
      }
      // בפירות וירקות טריים הנמכרים במשקל (למשל מלפפון 1.5 ק"ג מול 1 ק"ג), מתאימים את מחיר השוק ליחס המשקל
      if (isFreshItem(item) && targetUnits.weightGrams > 0 && itemUnits.weightGrams > 0) {
        const scale = targetUnits.weightGrams / itemUnits.weightGrams;
        if (scale >= 0.2 && scale <= 10) {
          return { compatible: true, exact: false, scale };
        }
      }
      return { compatible: false, exact: false, scale: 1 };
    };

    const attachScaleMeta = (item, unitRes) => {
      if (!item || !unitRes || unitRes.scale === 1) return item;
      const wLabel = formatWeightLabel(targetUnits.weightGrams);
      return {
        ...item,
        _unitScale: unitRes.scale,
        _scaleLabel: wLabel ? `ל-${wLabel}` : '',
        _scaleNote: wLabel ? `מחיר הרשתות הותאם יחסית למשקל האריזה במשנת יוסף (${wLabel})` : ''
      };
    };

    // 1. התאמה ישירה לפי שם מנורמל או כינוי מדויק (עדיפות מוחלטת להתאמת יחידות 1:1)
    let bestStep1 = null;
    let bestStep1Score = 0;
    let bestStep1Unit = null;
    for (const item of catalog) {
      if ((item.id === 'milk_3' || item.id === 'milk_1') && isPlantOrChocMilk) continue;
      if (item.id === 'oil_olive' && isNonFoodOil) continue;
      if (isFreshItem(item) && isProduceExcluded) continue;
      if (item.id === 'onion_dry' && containsWholePhrase(n, 'ירוק')) continue;
      if (item.id.includes('pasta') && isWholeWheat) continue;
      const unitRes = resolveUnitScale(item);
      if (!unitRes.compatible) continue;
      const exactBonus = unitRes.exact ? 1000 : 0;

      const iname = norm(item.name);
      if (iname.length >= 3 && (containsWholePhrase(n, iname) || (containsWholePhrase(iname, n) && n.length >= iname.length * 0.7))) {
        const score = exactBonus + iname.length + 100;
        if (score > bestStep1Score) {
          bestStep1Score = score;
          bestStep1 = item;
          bestStep1Unit = unitRes;
        }
      }

      if (item.aliases) {
        for (const alias of item.aliases) {
          const na = norm(alias);
          if (na.length >= 2 && containsWholePhrase(n, na)) {
            const score = exactBonus + na.length;
            if (score > bestStep1Score) {
              bestStep1Score = score;
              bestStep1 = item;
              bestStep1Unit = unitRes;
            }
          }
        }
      }
    }
    if (bestStep1) return attachScaleMeta(bestStep1, bestStep1Unit);

    // 2. התאמה חכמה לפי מילות מפתח (מילים מהותיות בסדר שונה, כגון "חלב 3% 1 ליטר תנובה" מול "חלב תנובה 3%")
    let bestStep2 = null;
    let bestStep2Unit = null;
    let bestStep2Exact = false;
    for (const item of catalog) {
      if ((item.id === 'milk_3' || item.id === 'milk_1') && isPlantOrChocMilk) continue;
      if (item.id === 'oil_olive' && isNonFoodOil) continue;
      if (isFreshItem(item) && isProduceExcluded) continue;
      if (item.id === 'onion_dry' && containsWholePhrase(n, 'ירוק')) continue;
      if (item.id.includes('pasta') && isWholeWheat) continue;
      const unitRes = resolveUnitScale(item);
      if (!unitRes.compatible) continue;

      let matched = false;
      if (item.aliases) {
        for (const alias of item.aliases) {
          const na = norm(alias);
          const tokens = na.split(/\s+/).filter(w => w.length >= 2 || /\d/.test(w));
          if (tokens.length >= 2 && tokens.every(tok => tokenMatches(n, nWords, tok))) {
            matched = true;
            break;
          }
        }
      }
      if (!matched) {
        const itemTokens = norm(item.name).split(/\s+/).filter(w => w.length >= 3 || /\d/.test(w));
        if (itemTokens.length >= 3 && itemTokens.every(tok => tokenMatches(n, nWords, tok))) {
          matched = true;
        }
      }

      if (matched) {
        if (unitRes.exact) return attachScaleMeta(item, unitRes);
        if (!bestStep2 && !bestStep2Exact) {
          bestStep2 = item;
          bestStep2Unit = unitRes;
        }
      }
    }
    if (bestStep2) return attachScaleMeta(bestStep2, bestStep2Unit);

    return null;
  }

  function getEffectiveMarketComparison(item) {
    if (!item) return null;
    const selChains = (Array.isArray(prefs.selectedChains) && prefs.selectedChains.length > 0)
      ? prefs.selectedChains
      : DEFAULT_SELECTED_CHAINS;

    const scale = (typeof item._unitScale === 'number' && item._unitScale > 0) ? item._unitScale : 1;
    const chains = item.chains || {};
    const activeChainEntries = [];
    for (const c of selChains) {
      if (chains[c] != null && typeof chains[c] === 'number' && chains[c] > 0) {
        activeChainEntries.push([c, Math.round(Number(chains[c]) * scale * 100) / 100]);
      }
    }

    let effectivePrice = 0;
    if (activeChainEntries.length > 0) {
      const sum = activeChainEntries.reduce((acc, [, price]) => acc + price, 0);
      effectivePrice = Math.round((sum / activeChainEntries.length) * 100) / 100;
    } else if (!item.chains || Object.keys(item.chains).length === 0) {
      effectivePrice = Math.round(((item.supermarketPrice || 0) * scale) * 100) / 100;
    }

    return {
      ...item,
      effectivePrice,
      activeChainEntries,
      selectedChains: selChains
    };
  }

  function getCartSavingsStats(customLines = null, customLabel = null) {
    let lines = null;
    let isHistorical = false;
    let label = customLabel || '';

    if (Array.isArray(customLines) && customLines.length) {
      lines = customLines;
      isHistorical = true;
    } else if (live && live.lines && live.lines.size > 0 && !isHistoryPage()) {
      lines = [...live.lines.values()];
    } else if (prefs.compareInHistory !== false && viewedOrder && viewedOrder.lines && viewedOrder.lines.size > 0) {
      lines = [...viewedOrder.lines.values()];
      isHistorical = true;
      label = viewedOrder.week || 'הזמנה היסטורית';
    } else if (live && live.lines && live.lines.size > 0) {
      lines = [...live.lines.values()];
    }
    if (!lines || !lines.length) return null;

    let matchedCount = 0;
    let totalMyCost = 0;
    let totalMarketCost = 0;
    let totalSavings = 0;
    const matchedItems = [];

    for (const l of lines) {
      const myUnitPrice = l.price || itemPrices['p' + l.pid] || itemPrices[l.key] || 0;
      if (myUnitPrice <= 0) continue;

      const unitHint = itemUnitTexts[l.key] || itemUnitTexts['p' + l.pid] || itemUnitTexts[norm(l.name)] || '';
      const rawMatch = findMarketComparison(l.name, unitHint);
      if (!rawMatch) continue;
      const match = getEffectiveMarketComparison(rawMatch);
      if (!match || match.effectivePrice <= 0) continue;

      const marketUnitPrice = match.effectivePrice;
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

      const activeChains = {};
      if (match.activeChainEntries) {
        for (const [c, p] of match.activeChainEntries) {
          activeChains[c] = p;
        }
      }

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
        chains: activeChains,
        sourceLabel: match.sourceLabel || '',
        isEquivalentBrand: !!match.isEquivalentBrand,
        matchedName: match.matchedName || '',
        scaleLabel: match._scaleLabel || ''
      });
    }

    const coveragePct = lines.length > 0 ? (matchedCount / lines.length) * 100 : 0;
    const isReliable = matchedCount >= 3;

    return {
      isHistorical,
      label,
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

  let lastAnimatedSavings = null;
  function triggerSavingsBannerEffect(container, valEl) {
    if (!container) return;
    requestAnimationFrame(() => {
      container.classList.remove('myfam-sav-celebrate');
      requestAnimationFrame(() => {
        container.classList.add('myfam-sav-celebrate');
        setTimeout(() => container.classList.remove('myfam-sav-celebrate'), 850);
      });
    });

    if (valEl) {
      requestAnimationFrame(() => {
        valEl.classList.remove('myfam-sav-num-pop');
        requestAnimationFrame(() => {
          valEl.classList.add('myfam-sav-num-pop');
          setTimeout(() => valEl.classList.remove('myfam-sav-num-pop'), 600);
        });
      });
    }

    const colors = ['#10b981', '#f59e0b', '#34d399', '#fbbf24', '#059669', '#a3e635'];
    const rect = container.getBoundingClientRect();
    const w = Math.max(rect.width || 90, 60);
    const h = Math.max(rect.height || 36, 28);
    for (let i = 0; i < 10; i++) {
      const sp = document.createElement('span');
      sp.className = 'myfam-sav-spark';
      sp.style.background = colors[i % colors.length];
      sp.style.left = Math.round(15 + Math.random() * (w - 30)) + 'px';
      sp.style.top = Math.round(h * 0.4 + Math.random() * (h * 0.35)) + 'px';
      sp.style.setProperty('--tx', Math.round((Math.random() - 0.5) * 44) + 'px');
      sp.style.setProperty('--ty', Math.round(-10 - Math.random() * 24) + 'px');
      container.appendChild(sp);
      setTimeout(() => sp.remove(), 900);
    }
  }

  function updateSavingsUI() {
    if (checkExcluded()) return;
    const pill = $('#myfam-savings-pill');
    const savCard = $('#myfam-savings-card');
    const savVal = $('#myfam-sav-val');
    const savDetail = $('#myfam-sav-detail');

    const stats = getCartSavingsStats();
    if (!stats || !stats.items || !stats.items.length) {
      lastAnimatedSavings = 0;
      if (pill) pill.style.display = 'none';
      if (savVal) {
        savVal.textContent = '₪0.0';
        savVal.style.color = '#059669';
      }
      if (savDetail) savDetail.textContent = isHistoryPage() ? 'בהזמנה היסטורית' : 'בסל הנוכחי';
      return;
    }

    const increased = !stats.isHistorical && lastAnimatedSavings !== null && stats.totalSavings > lastAnimatedSavings + 0.05 && stats.totalSavings > 0;
    if (!stats.isHistorical) {
      lastAnimatedSavings = stats.totalSavings;
    }

    // עדכון כרטיס החיסכון בתפריט
    if (savVal) {
      savVal.textContent = stats.totalSavings < 0 ? `-₪${Math.abs(stats.totalSavings).toFixed(1)}` : `₪${stats.totalSavings.toFixed(1)}`;
      savVal.style.color = stats.totalSavings < 0 ? '#dc2626' : '#059669';
    }
    if (savDetail) {
      const ctxSuffix = stats.isHistorical ? ' · היסטוריה' : '';
      if (stats.totalSavings >= 0) {
        savDetail.textContent = `(${Math.round(stats.savingsPct)}% חיסכון) (${stats.matchedCount} מוצרים${ctxSuffix})`;
      } else {
        savDetail.textContent = `(יקר יותר מהרשתות) (${stats.matchedCount} מוצרים${ctxSuffix})`;
      }
    }

    // תגית חיסכון צפה ליד כפתור הסל
    if (stats.isReliable && stats.totalSavings > 0) {
      if (pill) {
        pill.style.display = 'flex';
        pill.innerHTML = `
          <span style="font-size:14px;">💰</span>
          <span>חיסכון: <b class="myfam-pill-num">₪${Math.round(stats.totalSavings)}</b></span>
        `;
        pill.title = `חיסכון משוער של ₪${stats.totalSavings.toFixed(2)} (${Math.round(stats.savingsPct)}%) מול רשתות השיווק ב-${stats.matchedCount} מוצרים${stats.isHistorical ? ' (הזמנה היסטורית)' : ' בסל'}. לחץ לצפייה בדוח!`;
        pill.onclick = e => {
          e.stopPropagation();
          showSavingsModal();
        };
      }
    } else {
      if (pill) pill.style.display = 'none';
    }

    if (increased) {
      if (pill && pill.style.display !== 'none') {
        triggerSavingsBannerEffect(pill, pill.querySelector('.myfam-pill-num'));
      }
      if (savCard) {
        triggerSavingsBannerEffect(savCard, savVal);
      }
    }
  }

  function showSavingsModal(customLines = null, customLabel = null) {
    $('#myfam-savings-modal')?.remove();
    const stats = getCartSavingsStats(customLines, customLabel);

    if (!stats || !stats.items.length) {
      showAppAlert('טרם אותרו מוצרים עם מחיר ותואם להשוואה מול רשתות השיווק בהזמנה זו.\n(אם זו הזמנת עבר, ודא שסונכרנו מחיריה מהאתר).', 'השוואת מחירים וחיסכון');
      return;
    }

    const m = document.createElement('div');
    m.id = 'myfam-savings-modal';

    const selChainNames = (prefs.selectedChains || DEFAULT_SELECTED_CHAINS)
      .map(c => ALL_CHAINS[c]?.name)
      .filter(Boolean)
      .join(', ');

    const rowsHtml = stats.items.map(it => {
      const chainsText = Object.entries(it.chains)
        .map(([cName, cPrice]) => {
          const heName = ALL_CHAINS[cName]?.name || cName;
          return `<span class="myfam-chain-pill">${heName}: ₪${Number(cPrice).toFixed(2)}</span>`;
        }).join('') || (it.sourceLabel ? `<span class="myfam-chain-pill">${esc(it.sourceLabel)}</span>` : '');
      const eqBadge = (it.isEquivalentBrand
        ? `<div style="font-size:11px; color:#92400e; background:#fef3c7; border:1px solid #fde68a; border-radius:4px; padding:1px 6px; display:inline-block; margin-top:3px;">מותג מקביל שאינו זהה${it.matchedName ? `: ${esc(it.matchedName)}` : ''}</div>`
        : '')
        + (it.scaleLabel
          ? `<div style="font-size:11px; color:#0369a1; background:#e0f2fe; border:1px solid #bae6fd; border-radius:4px; padding:1px 6px; display:inline-block; margin-top:3px; margin-right:4px;">המחיר הותאם ${esc(it.scaleLabel)}</div>`
          : '');

      return `
        <tr>
          <td style="width:36px; text-align:center;">
            ${it.image ? `<img src="${esc(it.image)}" style="width:32px;height:32px;object-fit:contain;border-radius:6px;border:1px solid #e2e8f0;">` : `<span style="color:#94a3b8;">${ICONS.package}</span>`}
          </td>
          <td>
            <div style="font-weight:700; color:#1e293b;">${esc(it.name)}</div>
            ${eqBadge}
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

    const modalSub = stats.isHistorical
      ? `השוואת הזמנה היסטורית (${esc(stats.label || 'הזמנת עבר')}) מול רשתות השיווק המובילות`
      : 'השוואת סל הקניות הנוכחי מול רשתות השיווק המובילות';

    m.innerHTML = `
      <div class="myfam-savings-box">
        <button class="myfam-x" title="סגור">${ICONS.close}</button>

        <div class="myfam-savings-header">
          <div class="myfam-savings-h-title">
            <div class="myfam-savings-h-icon">💰</div>
            <div class="myfam-savings-h-text">
              <h3>מחשבון חיסכון והשוואת מחירים</h3>
              <div>${modalSub}</div>
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

        <div class="myfam-savings-scroll">
          ${(() => {
            const expensiveItems = stats.items.filter(it => it.itemSavings < -0.4);
            if (!expensiveItems.length) return '';
            const totalExtra = expensiveItems.reduce((acc, it) => acc + Math.abs(it.itemSavings), 0);
            return `
              <div style="background:#fff1f2;border:1px solid #fecdd3;color:#9f1239;border-radius:10px;padding:9px 14px;margin-bottom:12px;font-size:12.5px;display:flex;align-items:center;gap:8px;">
                <span style="font-size:16px;">⚠️</span>
                <span><b>שימו לב:</b> אותרו <b>${expensiveItems.length}</b> מוצרים בסל שבהם משנת יוסף יקרה יותר מרשתות השיווק (בסך מצטבר של ₪${totalExtra.toFixed(2)}). המוצרים מסומנים באדום בטבלה.</span>
              </div>
            `;
          })()}

          <div class="myfam-savings-disclaimer">
            ℹ️ ההשוואה התאפשרה ב-<b>${stats.matchedCount}</b> מתוך <b>${stats.totalLines}</b> מוצרים בסל, מול הרשתות שנבחרו בהגדרות (${selChainNames}).<br>
            <b>הבהרה ואחריות:</b> נתוני המחירים וחישובי החיסכון מוצגים כ<b>הערכה והמלצה בלבד</b> לצורך קבלת אינדיקציה כללית. המחירים ברשתות השיווק משתנים תדיר בין סניפים, אזורים ומבצעים, ואין המפתחים אחראים לדיוקם או לכל החלטת רכישה שתתקבל על בסיסם (ט.ל.ח).
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
    attachModalFullscreenBtn($('.myfam-savings-box', m), { value: false });

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

    const selChainNames = (prefs.selectedChains || DEFAULT_SELECTED_CHAINS)
      .map(c => ALL_CHAINS[c]?.name)
      .filter(Boolean)
      .join(', ');

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
    <div>הופק באמצעות תוסף "מוסיף למשנת" (גרסה ${APP_VERSION}) · פותח ע"י <b>לב טוב דיגיטל</b> (https://digital.levtov.uk/)</div>
    <div>ההשוואה מול הרשתות (${selChainNames}) מוצגת כהערכה והמלצה בלבד וללא אחריות (ט.ל.ח).</div>
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

          .cuts-notice { background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 7px 11px; margin-bottom: 12px; font-size: 12px; line-height: 1.45; color: #78350f; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body.dense .cuts-notice { padding: 4px 8px !important; margin-bottom: 6px !important; font-size: 10.5px !important; }
          body.narrow-slip .cuts-notice { padding: 5px 8px !important; margin-bottom: 8px !important; font-size: 10.5px !important; }

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

          <div class="cuts-notice">
            <b>⚠️ שימו לב לקיצוצים:</b> ייתכן שמוצר מסוים יופיע ברשימה זו (ואף יחולק בתחנה עבור מזמינים אחרים) אך יקוצץ מהזמנתכם האישית עקב חוסר במלאי. מומלץ תמיד לוודא מול דפי החלוקה הרשמיים של משנת יוסף.
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
    const histFsState = { value: false };

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
                  const lastInfo = lastSale ? `${esc(lastSale.week)}${lastSale.date ? ` (${lastSale.date})` : ''} · ${lastSale.qty} יח'` : '—';
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
                  <button class="myfam-hist-print-order-btn myfam-hist-compare-order-btn" data-compare-ord="${esc(o.id)}" title="השווה מחירי הזמנה זו מול רשתות השיווק">
                    <span>💰 השווה מחירים</span>
                  </button>
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

      // כפתורי השוואת מחירים להזמנה ספציפית מהיסטוריה
      m.querySelectorAll('.myfam-hist-compare-order-btn').forEach(btn => {
        btn.onclick = async ev => {
          ev.stopPropagation();
          const ordId = btn.dataset.compareOrd;
          const targetOrd = validOrders.find(o => o.id === ordId);
          if (!targetOrd || !targetOrd.items || !targetOrd.items.length) {
            showAppAlert('לא נמצאו פריטים בהזמנה זו להשוואה.', 'השוואת מחירים');
            return;
          }
          const hasPrices = targetOrd.items.some(it => (it.price && it.price > 0) || itemPrices[it.key] > 0);
          if (!hasPrices) {
            try {
              const numericId = (targetOrd.id || '').replace(/^sale-\d+-/, '');
              const realId = targetOrd.orderId || (numericId && !isNaN(numericId) ? numericId : null);
              if (realId) {
                const oData = await siteApiRequest(`${API_HOST}/api/orders/${realId}`, 'GET');
                const o = oData?.order;
                if (o && Array.isArray(o.items)) {
                  o.items.forEach(it => {
                    if (it.del) return;
                    const l = lineFrom(it);
                    if (l && l.price > 0) {
                      const match = targetOrd.items.find(x => x.key === l.key || norm(x.name) === norm(l.name));
                      if (match) match.price = l.price;
                    }
                  });
                  saveItemPrices();
                  save();
                }
              }
            } catch (e) {
              console.warn('[myfam compareOrder fetch]', e);
            }
          }
          showSavingsModal(targetOrd.items, targetOrd.week || 'הזמנה היסטורית');
        };
      });

      // כפתורי הדפסת הזמנה ספציפית לאיסוף
      m.querySelectorAll('.myfam-hist-print-order-btn[data-print-ord]').forEach(btn => {
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

      attachModalFullscreenBtn($('.myfam-hist-box', m), histFsState);
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
        <div class="myfam-row" style="margin-top:10px;">
          <span>טווח סימון היסטוריה וקבועים:</span>
          <select id="mf-historyWindow" class="myfam-select-box" style="flex:1;">
            <option value="4">4 מכירות אחרונות שהמוצר הוצע</option>
            <option value="6">6 מכירות אחרונות שהמוצר הוצע (מומלץ)</option>
            <option value="8">8 מכירות אחרונות שהמוצר הוצע</option>
            <option value="0">כל ההיסטוריה (ללא הגבלה)</option>
          </select>
        </div>
        <div style="font-size:11.5px;color:#64748b;margin-top:3px;line-height:1.4;">
          מוצרים שלא הוצעו במכירה (כמו מוצרי חגים) אינם נספרים כדילוג. הארכיון ב"היסטוריית הזמנות" נשמר תמיד במלואו.
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

      <!-- חלק 4: רשתות להשוואת מחירים -->
      <div class="myfam-set-section">
        <h4 class="myfam-set-sec-title">🛒 רשתות להשוואת מחירים</h4>
        <div style="font-size:12px; color:#64748b; margin-bottom:8px;">
          בחרו את הרשתות שברצונכם להשוות מולן (תגיות המחיר וחישובי החיסכון יותאמו רק לרשתות שסומנו):
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
          ${Object.values(ALL_CHAINS).map(ch => `
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:13px; font-weight:600; color:#1e293b;">
              <input type="checkbox" class="mf-chain-cb" value="${ch.id}" style="accent-color:#2e9e5b; width:16px; height:16px;">
              <span>${ch.name}</span>
            </label>
          `).join('')}
        </div>
        <div id="mf-chain-warning" style="display:none; color:#dc2626; font-size:11.5px; margin-top:6px; font-weight:bold;">
          ⚠️ יש לבחור לפחות רשת שיווק אחת להשוואה.
        </div>
        <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:12.5px; font-weight:600; color:#1e293b; margin-top:10px; padding-top:10px; border-top:1px dashed #bbf7d0;">
          <input type="checkbox" id="mf-compare-history" style="accent-color:#2e9e5b; width:16px; height:16px;">
          <span>הצג השוואת מחירים גם בדפי היסטוריית ההזמנות באתר</span>
        </label>
      </div>

      <!-- חלק 5: סנכרון מאובטח -->
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

      <!-- חלק 6: אודות ותנאי שימוש -->
      <div class="myfam-set-section" style="background:#fffbeb; border-color:#fde68a;">
        <h4 class="myfam-set-sec-title" style="color:#92400e; display:flex; align-items:center; justify-content:space-between;">
          <span>ℹ️ אודות והגבלת אחריות (גרסה ${APP_VERSION})</span>
          <button id="mf-open-about" style="background:#ffffff; border:1px solid #f59e0b; color:#92400e; border-radius:6px; padding:3px 9px; font-size:11.5px; font-weight:bold; cursor:pointer;">קרא בהרחבה</button>
        </h4>
        <div style="font-size:12px; color:#78350f; line-height:1.55;">
          נתוני השוואת המחירים וחישובי החיסכון מוצגים כ<b>המלצה והערכה בלבד</b> לצורך מידע כללי. אין המפתחים אחראים לדיוק המחירים, לזמינות המוצרים או לכל החלטת רכישה או נזק ישיר/עקיף הנובע מהסתמכות על הנתונים (ט.ל.ח).
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
      const hwSel = g('mf-historyWindow');
      if (hwSel) hwSel.value = String(typeof prefs.historyWindow === 'number' ? prefs.historyWindow : 6);
      const selChains = (Array.isArray(prefs.selectedChains) && prefs.selectedChains.length)
        ? prefs.selectedChains
        : DEFAULT_SELECTED_CHAINS;
      $$('.mf-chain-cb', m).forEach(cb => {
        cb.checked = selChains.includes(cb.value);
      });
      const cmpHistCb = g('mf-compare-history');
      if (cmpHistCb) cmpHistCb.checked = prefs.compareInHistory !== false;
    };
    fill();

    const hwSel = g('mf-historyWindow');
    if (hwSel) {
      hwSel.onchange = () => {
        const val = parseInt(hwSel.value, 10);
        prefs = { ...prefs, historyWindow: Number.isFinite(val) && val >= 0 ? val : 6 };
        jset('prefs', prefs);
        syncSaveGoogle({ myfam_prefs: prefs });
        invalidateCountsCache();
        render();
        updateForgottenUI();
      };
    }

    const cmpHistCb = g('mf-compare-history');
    if (cmpHistCb) {
      cmpHistCb.onchange = () => {
        prefs = { ...prefs, compareInHistory: cmpHistCb.checked };
        jset('prefs', prefs);
        syncSaveGoogle({ myfam_prefs: prefs });
        render();
        updateSavingsUI();
      };
    }

    $$('.mf-chain-cb', m).forEach(cb => {
      cb.onchange = () => {
        const checked = $$('.mf-chain-cb', m).filter(c => c.checked).map(c => c.value);
        const warn = $('#mf-chain-warning', m);
        if (!checked.length) {
          cb.checked = true;
          if (warn) {
            warn.style.display = 'block';
            setTimeout(() => { if (warn) warn.style.display = 'none'; }, 3000);
          }
          return;
        }
        if (warn) warn.style.display = 'none';
        prefs = { ...prefs, selectedChains: checked };
        jset('prefs', prefs);
        syncSaveGoogle({ myfam_prefs: prefs });
        render();
        updateSavingsUI();
      };
    });

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
    const playNotificationChime = () => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        const playTone = (freq, startOffset, duration) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + startOffset);
          gain.gain.setValueAtTime(0.001, now + startOffset);
          gain.gain.exponentialRampToValueAtTime(0.18, now + startOffset + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + startOffset + duration);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + startOffset);
          osc.stop(now + startOffset + duration + 0.02);
        };
        playTone(880, 0, 0.18);
        playTone(1174.66, 0.14, 0.28);
        setTimeout(() => { try { ctx.close(); } catch (_) {} }, 700);
      } catch (_) {}
    };

    g('mf-test-notify').onclick = () => {
      playNotificationChime();
      if (typeof chrome !== 'undefined' && chrome?.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ type: 'testNotification' });
      } else if (typeof Notification !== 'undefined') {
        if (Notification.permission === 'granted') {
          new Notification('התראת בדיקה - מוסיף למשנת 🔔', { body: 'ההתראות פועלות כשורה! תקבלו תזכורות בזמן על פתיחת וסגירת מכירות.' });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(perm => {
            if (perm === 'granted') {
              new Notification('התראת בדיקה - מוסיף למשנת 🔔', { body: 'ההתראות פועלות כשורה!' });
            }
          });
        }
      }
      showToast('התראת בדיקה נשלחה! 🔔', 'info');
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
      prefs = { 
        ...prefs,
        seenColor: g('mf-seenColor').value, 
        fixedColor: g('mf-fixedColor').value,
        seenFill: g('mf-seenFill').value === '1', 
        fixedFill: g('mf-fixedFill').value === '1' 
      };
      jset('prefs', prefs);
      syncSaveGoogle({ myfam_prefs: prefs });
      applyPrefs();
      if (rerender) render();
    };
    g('mf-seenColor').oninput = () => upd(false);
    g('mf-fixedColor').oninput = () => upd(false);
    g('mf-seenFill').onchange = () => upd(true);
    g('mf-fixedFill').onchange = () => upd(true);
    g('mf-reset').onclick = () => { 
      prefs = { ...PREF_DEFAULT }; 
      jset('prefs', prefs); 
      syncSaveGoogle({ myfam_prefs: prefs }); 
      applyPrefs(); 
      fill(); 
      render(); 
      updateSavingsUI();
    };
    g('mf-reset-fixed').onclick = async () => {
      if (await showAppConfirm('לאפס את כל הסימונים הידניים של מוצרים קבועים?\nכל המוצרים שהוזמנו 3 פעמים ומעלה יחזרו להיות קבועים אוטומטית.', 'איפוס סימונים ידניים')) {
        state.fixed = {};
        save();
        render();
        showToast('הסימונים הידניים אופסו בהצלחה!', 'success');
      }
    };
    g('mf-open-feedback').onclick = () => { m.remove(); openFeedbackPage(); };
    const openAboutBtn = g('mf-open-about');
    if (openAboutBtn) openAboutBtn.onclick = () => { m.remove(); showAboutModal(); };

    // סגירה ודאית באמצעות X או לחיצה על הרקע
    const closeBtn = $('.myfam-x', m);
    if (closeBtn) closeBtn.onclick = () => m.remove();
    m.onclick = e => { if (e.target === m || e.target.closest('.myfam-x')) m.remove(); };
  }

  /* ---------- חלון אודות, תנאי שימוש והגבלת אחריות ---------- */
  function showAboutModal() {
    $('#myfam-modal')?.remove();
    const m = document.createElement('div');
    m.id = 'myfam-modal';
    m.innerHTML = `<div class="myfam-box myfam-set" style="max-width:510px;">
      <button class="myfam-x" title="סגור">${ICONS.close}</button>

      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #e2e8f0;">
        <div style="background:#eef7f1;color:#2e9e5b;padding:10px;border-radius:12px;display:flex;">${ICONS.basket}</div>
        <div>
          <h3 style="margin:0;font-size:18px;color:#0f172a;">אודות "${APP_NAME}" · גרסה ${APP_VERSION}</h3>
          <div style="font-size:12.5px;color:#64748b;">מידע כללי, פרטיות, תנאי שימוש והגבלת אחריות</div>
        </div>
      </div>

      <div class="myfam-set-section" style="background:#f8fafc;border-color:#e2e8f0;">
        <h4 class="myfam-set-sec-title" style="color:#0f172a;">✨ על התוסף</h4>
        <div style="font-size:13px;color:#334155;line-height:1.6;">
          <b>"${APP_NAME}"</b> הוא עוזר קניות חכם ופרטי שפותח במטרה להקל ולייעל את חוויית הקנייה השבועית באתר "משנת יוסף" — באמצעות סימון מוצרים קבועים, הוספה מהירה לסל, מעקב תקציב, הדפסת רשימת איסוף נוחה והשוואת מחירים.
        </div>
      </div>

      <div class="myfam-set-section" style="background:#fffbeb;border-color:#fde68a;">
        <h4 class="myfam-set-sec-title" style="color:#92400e;">⚖️ כתב ויתור והגבלת אחריות (השוואת מחירים)</h4>
        <ul style="margin:0;padding-right:18px;font-size:12.5px;color:#78350f;line-height:1.65;">
          <li><b>המלצה והערכה בלבד:</b> כל נתוני המחירים של רשתות השיווק, אחוזי החיסכון ותגיות ההשוואה המוצגים בתוסף הינם בגדר <b>הערכה, אינדיקציה כללית והמלצה בלבד</b>.</li>
          <li><b>אין אחריות לדיוק הנתונים:</b> מחירי הרשתות נאספים ממקורות פומביים ועשויים להשתנות בכל עת בין סניפים שונים, ערים שונות, מבצעים נקודתיים, הבדלי כשרות, מותגים או אריזות.</li>
          <li><b>אחריות המשתמש:</b> התוסף מסופק כמות שהוא ("AS-IS"). מפתחי התוסף ("לב טוב דיגיטל") אינם נושאים בכל אחריות, ישירה או עקיפה, לטעויות, אי-דיוקים, הפרשי מחירים או לכל החלטת קנייה, הפסד או נזק שייגרמו כתוצאה מהסתמכות על המידע המוצג בתוסף (ט.ל.ח).</li>
        </ul>
      </div>

      <div class="myfam-set-section" style="background:#f0fdf4;border-color:#bbf7d0;">
        <h4 class="myfam-set-sec-title" style="color:#166534;">🔒 פרטיות ועצמאות</h4>
        <div style="font-size:12.5px;color:#1e293b;line-height:1.6;">
          • <b>תוסף עצמאי:</b> תוסף זה פותח באופן עצמאי על ידי "לב טוב דיגיטל" ואינו קשור, מופעל או נתמך על ידי ארגון או מערכת "משנת יוסף".<br>
          • <b>פרטיות מלאה:</b> נתוני ההזמנות והמוצרים הקבועים שלכם נשמרים מקומית בדפדפן ובחשבון ה-Google האישי שלכם בלבד, ואינם מועברים לשום גורם צד שלישי.
        </div>
      </div>

      <div class="myfam-footer-credits" style="margin-top:12px;padding-top:10px;">
        פותח ע"י <b><a href="https://digital.levtov.uk/" target="_blank" rel="noopener">לב טוב דיגיטל</a></b> | לפניות: <a href="mailto:mytovmail@gmail.com">mytovmail@gmail.com</a><br>
        <small>© כל הזכויות שמורות · גרסה ${APP_VERSION}</small>
      </div>

      <div style="margin-top:14px;display:flex;justify-content:space-between;align-items:center;">
        <button id="myfam-about-whatsnew" style="background:#f1f5f9;color:#0f172a;border:1px solid #cbd5e1;border-radius:10px;padding:8px 14px;font-size:12.5px;font-weight:700;cursor:pointer;">✨ מה חדש בגרסה ${APP_VERSION}?</button>
        <button id="myfam-about-close" class="myfam-btn-primary">הבנתי, סגור</button>
      </div>
    </div>`;
    document.body.appendChild(m);

    const close = () => m.remove();
    const xBtn = $('.myfam-x', m);
    if (xBtn) xBtn.onclick = close;
    const btnClose = $('#myfam-about-close', m);
    if (btnClose) btnClose.onclick = close;
    const btnWhatsNew = $('#myfam-about-whatsnew', m);
    if (btnWhatsNew) btnWhatsNew.onclick = () => { m.remove(); showWhatsNewModal(); };
    m.onclick = e => { if (e.target === m || e.target.closest('.myfam-x')) close(); };
  }

  /* ---------- חלון קופץ: מה חדש בגרסה (What's New) ---------- */
  function isUpgradeFrom065(prevVersion) {
    if (!prevVersion || typeof prevVersion !== 'string') return false;
    const parts = prevVersion.split('.').map(Number);
    const major = parts[0] || 0;
    const minor = parts[1] || 0;
    const patch = parts[2] || 0;
    if (major < 0) return true;
    if (major === 0) {
      if (minor < 6) return true;
      if (minor === 6 && patch <= 5) return true;
    }
    return false;
  }

  function showWhatsNewModal(fromVersion = '0.6.5') {
    $('#myfam-whatsnew-modal')?.remove();
    const m = document.createElement('div');
    m.id = 'myfam-whatsnew-modal';
    m.innerHTML = `
      <div class="myfam-box myfam-whatsnew-box">
        <button class="myfam-x" title="סגור">${ICONS.close}</button>

        <div class="myfam-whatsnew-header">
          <div class="myfam-whatsnew-icon">🚀</div>
          <div>
            <h3 class="myfam-whatsnew-title">מה חדש בתוסף "מוסיף למשנת"? (גרסה ${APP_VERSION})</h3>
            <div class="myfam-whatsnew-sub">שדרגנו את התוסף במיוחד עבורכם! הנה החידושים והשיפורים המרכזיים:</div>
          </div>
        </div>

        <div class="myfam-whatsnew-list">
          <div class="myfam-whatsnew-item">
            <div class="myfam-whatsnew-item-icon" style="background:#ecfdf5;color:#059669;">⚡</div>
            <div class="myfam-whatsnew-item-content">
              <h4>מהירות שיא וביצועים חלקים</h4>
              <p>פתרנו לחלוטין את בעיות האיטיות! הוספת והסרת מוצרים מהסל, עדכון כמויות וגלילה באתר מתבצעים כעת במהירות מיידית וללא שום השהיה.</p>
            </div>
          </div>

          <div class="myfam-whatsnew-item">
            <div class="myfam-whatsnew-item-icon" style="background:#eff6ff;color:#2563eb;">🧲</div>
            <div class="myfam-whatsnew-item-content">
              <h4>גרירה חופשית של כפתור הסל הצף</h4>
              <p>רוצים לשנות את מיקום הכפתור הירוק של התוסף? מעכשיו תוכלו ללחוץ עליו ולגרור אותו בחופשיות לכל מקום שנוח לכם במסך! המיקום יישמר אוטומטית.</p>
            </div>
          </div>

          <div class="myfam-whatsnew-item">
            <div class="myfam-whatsnew-item-icon" style="background:#fef3c7;color:#d97706;">🛒</div>
            <div class="myfam-whatsnew-item-content">
              <h4>הוספת קבועים חכמה לפי הכמות הרגילה שלכם</h4>
              <p>רגילים להזמין 2 יחידות (או יותר) מחלב או ממוצר קבוע אחר? בלחיצה על "הוסף קבועים לסל" התוסף יוסיף ישירות את הכמות שאתם רגילים להזמין ולא יחידה אחת בלבד.</p>
            </div>
          </div>

          <div class="myfam-whatsnew-item">
            <div class="myfam-whatsnew-item-icon" style="background:#f3e8ff;color:#7e22ce;">⚖️</div>
            <div class="myfam-whatsnew-item-content">
              <h4>השוואת מחירים מדויקת מול הרשתות</h4>
              <p>שכללנו את אלגוריתם ההשוואה של מחירי רשתות השיווק: חישוב מדויק והוגן לפי יחידות משקל ומארזים (למשל השוואת מארז 1.5 ק"ג מול מחיר לק"ג ברשתות).</p>
            </div>
          </div>

          <div class="myfam-whatsnew-item">
            <div class="myfam-whatsnew-item-icon" style="background:#f1f5f9;color:#475569;">🛡️</div>
            <div class="myfam-whatsnew-item-content">
              <h4>יציבות, תיקוני רשת וסנכרון משופר</h4>
              <p>ביטול שגיאות רשת ברקע, התאמה מלאה לשינויים באתר משנת יוסף וחוויית קנייה מהירה, נוחה ואמינה.</p>
            </div>
          </div>
        </div>

        <div style="margin-top:16px;">
          <button id="myfam-whatsnew-close-btn" class="myfam-whatsnew-btn">מעולה, בואו נתחיל לקנות! 🛒</button>
        </div>
      </div>
    `;
    document.body.appendChild(m);

    const dismiss = () => {
      m.remove();
      try {
        localStorage.setItem(LS + 'whatsnew_dismissed_' + APP_VERSION, 'true');
        if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
          chrome.storage.local.set({ myfam_show_whatsnew_modal: false, myfam_whatsnew_dismissed: true });
        }
      } catch (_) {}
    };

    const xBtn = $('.myfam-x', m);
    if (xBtn) xBtn.onclick = dismiss;
    const btn = $('#myfam-whatsnew-close-btn', m);
    if (btn) btn.onclick = dismiss;
    m.onclick = e => { if (e.target === m || e.target.closest('.myfam-x')) dismiss(); };
  }

  function checkWhatsNewUpdateModal() {
    if (checkExcluded()) return;
    const dismissedKey = LS + 'whatsnew_dismissed_' + APP_VERSION;
    if (localStorage.getItem(dismissedKey) === 'true') return;

    // בדיקה 1: דרך chrome.storage.local שנרשם ב-background.js בעת שדרוג התוסף
    if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
      chrome.storage.local.get(['myfam_show_whatsnew_modal', 'myfam_whatsnew_dismissed', 'myfam_upgraded_from'], res => {
        if (chrome.runtime.lastError) return;
        if (res && res.myfam_show_whatsnew_modal === true && !res.myfam_whatsnew_dismissed) {
          setTimeout(() => {
            showWhatsNewModal(res.myfam_upgraded_from || '0.6.5');
          }, 800);
          return;
        }
      });
    }

    // בדיקה 2: דרך גרסה שנשמרה ב-localStorage (עבור גיבוי או משתמשי userscript)
    const storedAppVer = localStorage.getItem(LS + 'app_version');
    if (!storedAppVer) {
      // התקנה חדשה לגמרי - רושמים את הגרסה וממשיכים כרגיל ללא מודאל
      localStorage.setItem(LS + 'app_version', APP_VERSION);
      return;
    }

    if (storedAppVer !== APP_VERSION) {
      localStorage.setItem(LS + 'app_version', APP_VERSION);
      if (isUpgradeFrom065(storedAppVer)) {
        setTimeout(() => {
          showWhatsNewModal(storedAppVer);
        }, 800);
      }
    }
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
    },
    {
      title: 'טיפ זהב: צפייה ביותר מוצרים במסך',
      badge: 'נוחות וחיסכון בגלילה',
      icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>`,
      text: `רוצים לראות הרבה יותר מוצרים בבת אחת ולחסוך גלילה ממושכת?<br>
        אתר משנת יוסף מתאים את מספר הטורים לגודל המסך. פשוט הקטינו מעט את הזום של הדף:<br>
        1. לחצו על <b>3 הנקודות ⋮</b> בפינה העליונה בדפדפן כרום.<br>
        2. תחת <b>"מרחק מתצוגה" (Zoom)</b> הקטינו ל-<b>75%</b> (או 80%).<br>
        <span style="display:inline-block;margin-top:6px;background:#f0fdf4;color:#166534;padding:4px 8px;border-radius:6px;font-size:12px;border:1px solid #bbf7d0;">
          💡 <b>קיצור מקלדת מהיר:</b> לחצו על <b>Ctrl</b> וביחד על מקש המינוס <b>-</b> כדי להקטין מיד!
        </span><br>
        הקטנה קלה זו תוסיף <b>מוצר שלישי בכל שורה</b> ותקל משמעותית על חוויית הקנייה!`
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
      /* מניעה מוחלטת של הופעת מסגרות או רקע צהוב בתוך סל הקניות */
      #cart .myfam-fixed, #cart .myfam-fill, #cart .myfam-seen,
      [id*="cart" i] .myfam-fixed, [id*="cart" i] .myfam-fill, [id*="cart" i] .myfam-seen,
      [class*="cart-product" i] { outline: none !important; background-color: transparent !important; }
      .myfam-hide{display:none!important}
      .myfam-tag{position:absolute;top:8px;left:50%;transform:translateX(-50%);z-index:4;pointer-events:auto;display:inline-flex;align-items:center;gap:4px;width:fit-content;max-width:calc(100% - 110px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:0;padding:2px 8px;background:#fff7ed;color:#c2410c;border:1px solid #ffedd5;border-radius:10px;font:bold 11.5px sans-serif;direction:rtl;box-sizing:border-box;box-shadow:0 1px 3px rgba(0,0,0,.12);cursor:help}
      .myfam-tag.fixed{background:#fef3c7;color:#92400e;border:1px solid #fde68a}
      .myfam-tag svg{flex-shrink:0}

      #myfam-import-modal{position:fixed;bottom:18px;left:18px;z-index:100002;direction:rtl;font-family:sans-serif;pointer-events:none;width:min(350px,calc(100vw - 36px))}
      .myfam-import-box{width:100%;background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:14px 16px;position:relative;box-shadow:0 10px 28px rgba(15,23,42,0.18);pointer-events:auto;box-sizing:border-box}
      @keyframes myfam-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

      .myfam-card{position:relative}
      .myfam-starbtn{position:absolute;top:50px;right:14px;z-index:5;width:34px;height:34px;border:2px solid transparent;border-radius:50%;background:transparent;color:#888;font-size:20px;line-height:1;padding:0;cursor:pointer;opacity:0;transition:opacity .15s,background .15s,border-color .15s}
      .myfam-card:hover .myfam-starbtn, .myfam-starbtn.on{opacity:1}
      .myfam-starbtn:hover{background:#ffe08a;border-color:#e0a800;color:#8a6500;opacity:1}
      .myfam-starbtn.on{color:#e0a800;opacity:1}

      /* כפתור פאנל ראשי */
      #myfam-panel{position:relative;display:inline-flex;align-items:center;flex:0 0 auto;margin:0 8px;direction:rtl;font:14px system-ui,-apple-system,sans-serif}
      #myfam-panel.floating{position:fixed;z-index:99999;margin:0}
      #myfam-panel.dragging{transition:none !important;user-select:none !important}
      #myfam-toggle{width:42px;height:42px;border:1.5px solid #10b981;border-radius:12px;background:#ffffff;color:#059669;font-size:20px;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(16,185,129,0.22);transition:all .2s ease;user-select:none;-webkit-user-drag:none;touch-action:none}
      #myfam-toggle:hover{background:#ecfdf5;transform:translateY(-2px);box-shadow:0 6px 18px rgba(16,185,129,0.32)}
      #myfam-panel.dragging #myfam-toggle:hover{transform:none !important}

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
      .tool-hist{background:#fdf2f8;border-color:#fbcfe8;color:#9d174d}
      .tool-hist:hover{background:#fce7f3}
      .tool-set{background:#f1f5f9;border-color:#cbd5e1;color:#334155}
      .tool-set:hover{background:#e2e8f0}
      .tool-about{background:#ecfeff;border-color:#a5f3fc;color:#0e7490}
      .tool-about:hover{background:#cffafe}
      .tool-author{background:#fefce8;border-color:#fef08a;color:#854d0e;text-decoration:none}
      .tool-author:hover{background:#fef9c3}

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
      
      /* כפתור סגירה X + כפתור מסך מלא - אמין וחסין ללחיצות על svg */
      .myfam-x{position:absolute;top:14px;left:14px;border:none;background:#f1f5f9;color:#64748b;width:32px;height:32px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;transition:all .15s;z-index:5}
      .myfam-x:hover{background:#e2e8f0;color:#0f172a;transform:scale(1.05)}
      .myfam-x svg,.myfam-x line,.myfam-x path,.myfam-fs-btn svg,.myfam-fs-btn polyline,.myfam-fs-btn line{pointer-events:none}
      .myfam-fs-btn{position:absolute;top:14px;left:52px;border:none;background:#f1f5f9;color:#475569;width:32px;height:32px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;transition:all .15s;z-index:5}
      .myfam-fs-btn:hover{background:#e2e8f0;color:#0f172a;transform:scale(1.05)}
      .myfam-modal-fs{width:98vw !important;max-width:98vw !important;height:95vh !important;max-height:95vh !important;border-radius:12px !important}
      .myfam-modal-fs .myfam-hist-body,.myfam-modal-fs .myfam-savings-table-wrap,.myfam-modal-fs .myfam-forgotten-list{max-height:none !important;flex:1 !important}

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
      .myfam-hist-box{width:min(940px,95vw);max-height:90vh;display:flex;flex-direction:column;padding:22px 24px}
      .myfam-hist-header{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px;padding-bottom:12px;padding-left:82px;border-bottom:1px solid #e2e8f0;flex-wrap:wrap}
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
      .myfam-forgotten-box{width:min(620px,94vw);max-height:88vh;background:#fff;border-radius:18px;padding:22px 24px;position:relative;box-shadow:0 24px 50px -12px rgba(15,23,42,0.32);display:flex;flex-direction:column;box-sizing:border-box}
      .myfam-forgotten-header{display:flex;align-items:center;gap:12px;margin-bottom:14px;padding-bottom:12px;padding-left:82px;border-bottom:1px solid #e2e8f0}
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
      .myfam-savings-pill{position:relative;overflow:hidden;cursor:pointer;display:flex;align-items:center;gap:6px;padding:0 10px;border-radius:10px;background:#ecfdf5;border:1.5px solid #a7f3d0;color:#065f46;font-size:11.5px;font-weight:700;height:42px;box-sizing:border-box;box-shadow:0 3px 10px rgba(16,185,129,0.12);user-select:none;transition:all .18s}
      .myfam-savings-pill:hover{background:#dcfce7;border-color:#10b981;transform:translateY(-2px);box-shadow:0 5px 14px rgba(16,185,129,0.2)}
      .myfam-side-card.savings-green{position:relative;overflow:hidden}
      .myfam-sav-celebrate::after{content:'';position:absolute;inset:0;background:linear-gradient(110deg,transparent 20%,rgba(255,255,255,0.75) 50%,rgba(253,224,71,0.35) 60%,transparent 80%);transform:translateX(-120%);animation:myfam-sav-shimmer .8s ease-out forwards;pointer-events:none;z-index:2}
      .myfam-sav-num-pop{display:inline-block;animation:myfam-sav-pop .55s cubic-bezier(.34,1.56,.64,1)}
      .myfam-sav-spark{position:absolute;width:6px;height:6px;border-radius:50%;pointer-events:none;z-index:3;animation:myfam-sav-spark .85s cubic-bezier(.16,1,.3,1) forwards}
      @keyframes myfam-sav-shimmer{0%{transform:translateX(-120%)}100%{transform:translateX(120%)}}
      @keyframes myfam-sav-pop{0%{transform:scale(1)}40%{transform:scale(1.22);color:#047857}100%{transform:scale(1)}}
      @keyframes myfam-sav-spark{0%{opacity:1;transform:translate(0,0) scale(1) rotate(0deg)}100%{opacity:0;transform:translate(var(--tx),var(--ty)) scale(0.3) rotate(180deg)}}

      /* בועית היכרות מהבהבת בפעם הראשונה */
      .myfam-first-callout{position:absolute;top:calc(100% + 10px);right:0;width:235px;background:linear-gradient(135deg,#065f46,#047857);color:#fff;border:2px solid #fde047;border-radius:12px;padding:9px 11px 9px 26px;font-size:12px;font-weight:700;line-height:1.45;box-shadow:0 10px 25px rgba(4,120,87,0.35);z-index:100006;cursor:pointer;animation:myfam-callout-pulse 1.5s ease-in-out infinite}
      .myfam-first-callout-arrow{position:absolute;top:-11px;right:14px;color:#fde047;font-size:12px;line-height:1;text-shadow:0 -1px 0 #065f46}
      #myfam-first-callout-x{position:absolute;top:5px;left:6px;background:rgba(255,255,255,0.18);border:none;color:#fff;width:18px;height:18px;border-radius:50%;font-size:10px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center}
      #myfam-first-callout-x:hover{background:rgba(255,255,255,0.35)}
      @keyframes myfam-callout-pulse{0%,100%{transform:translateY(0);box-shadow:0 8px 20px rgba(4,120,87,0.35),0 0 0 0 rgba(253,224,71,0.7)}50%{transform:translateY(-3px);box-shadow:0 12px 26px rgba(4,120,87,0.5),0 0 0 7px rgba(253,224,71,0)}}

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
      .myfam-price-comp-tag.tag-expensive{background:#fff1f2;color:#be123c;border-color:#fecdd3;font-weight:700}
      .myfam-price-comp-tag.tag-equal{background:#f8fafc;color:#475569;border-color:#cbd5e1;font-weight:600}
      #myfam-panel #myfam-toggle{cursor:grab}
      #myfam-panel.dragging #myfam-toggle{cursor:grabbing !important}

      /* מודאל השוואת מחירים וחיסכון */
      #myfam-savings-modal{position:fixed;inset:0;background:rgba(15,23,42,0.6);backdrop-filter:blur(3px);z-index:100007;display:flex;align-items:center;justify-content:center;direction:rtl;font-family:system-ui,-apple-system,sans-serif}
      .myfam-savings-box{width:min(900px,95vw);max-height:90vh;background:#fff;border-radius:20px;padding:24px 26px;position:relative;box-shadow:0 24px 50px -12px rgba(15,23,42,0.32);display:flex;flex-direction:column;box-sizing:border-box}
      .myfam-savings-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;padding-bottom:12px;padding-left:82px;border-bottom:1px solid #e2e8f0;flex-wrap:wrap;gap:10px}
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
      
      .myfam-savings-scroll{flex:1;min-height:0;overflow-y:auto;padding-left:4px;margin-bottom:12px}
      .myfam-savings-table-wrap{border:1px solid #e2e8f0;border-radius:10px;overflow-x:auto}
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

      /* מודאל מה חדש בגרסה */
      #myfam-whatsnew-modal{position:fixed;inset:0;background:rgba(15,23,42,0.65);backdrop-filter:blur(4px);z-index:100008;display:flex;align-items:center;justify-content:center;direction:rtl;font-family:system-ui,-apple-system,sans-serif}
      .myfam-whatsnew-box{width:min(540px,94vw);max-height:88vh;display:flex;flex-direction:column;background:#ffffff;border-radius:20px;padding:24px 22px;position:relative;box-shadow:0 25px 50px -12px rgba(15,23,42,0.35);box-sizing:border-box}
      .myfam-whatsnew-header{display:flex;align-items:center;gap:12px;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid #f1f5f9}
      .myfam-whatsnew-icon{width:46px;height:46px;border-radius:14px;background:#ecfdf5;border:1px solid #a7f3d0;font-size:24px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
      .myfam-whatsnew-title{margin:0 0 3px;font-size:17px;font-weight:800;color:#0f172a}
      .myfam-whatsnew-sub{font-size:12.5px;color:#64748b}
      .myfam-whatsnew-list{display:flex;flex-direction:column;gap:10px;overflow-y:auto;padding-left:4px;padding-right:2px;max-height:calc(88vh - 170px);scrollbar-width:thin}
      .myfam-whatsnew-item{display:flex;gap:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:12px 14px;align-items:flex-start}
      .myfam-whatsnew-item-icon{width:32px;height:32px;border-radius:10px;font-size:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px}
      .myfam-whatsnew-item-content h4{margin:0 0 3px;font-size:14px;font-weight:700;color:#0f172a}
      .myfam-whatsnew-item-content p{margin:0;font-size:12.5px;color:#475569;line-height:1.55}
      .myfam-whatsnew-btn{width:100%;padding:11px 18px;background:#10b981;color:#ffffff;border:none;border-radius:12px;font-size:14.5px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(16,185,129,0.3);transition:all .15s ease}
      .myfam-whatsnew-btn:hover{background:#059669;transform:translateY(-1px);box-shadow:0 6px 18px rgba(16,185,129,0.38)}

    `;
    document.head.appendChild(css);

    // פאנל כפתור התוסף
    const p = document.createElement('div');
    p.id = 'myfam-panel';
    const showFirstCallout = !localStorage.getItem(LS + 'menu_opened_once');
    p.innerHTML = `
      <button id="myfam-toggle" title="${APP_NAME}">${ICONS.basket}</button>
      <div id="myfam-budget-pill" class="myfam-budget-pill" style="display:none;"></div>
      <div id="myfam-forgotten-badge" class="myfam-forgotten-badge" style="display:none;" title="מוצרים קבועים שנשכחו - לחץ להצגה והוספה מהירה"></div>
      <div id="myfam-savings-pill" class="myfam-savings-pill" style="display:none;" title="חיסכון משוער בסל - לחץ לדוח השוואה"></div>
      ${showFirstCallout ? `
      <div id="myfam-first-callout" class="myfam-first-callout">
        <span class="myfam-first-callout-arrow">▲</span>
        <span>פעם ראשונה בחוויית הקנייה עם התוסף שלנו? לחצו על הכפתור הזה לפתיחת התפריט המלא!</span>
        <button id="myfam-first-callout-x" title="סגור">✕</button>
      </div>` : ''}
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

      <!-- אזור כלים ושימוש (2x4) -->
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
            <span>ייבוא היסטוריית הזמנות</span>
          </button>
          <button id="myfam-b-hist" class="myfam-tool-btn tool-hist">
            ${ICONS.history}
            <span>היסטוריית קניות</span>
          </button>
          <button id="myfam-b-set" class="myfam-tool-btn tool-set">
            ${ICONS.settings}
            <span>הגדרות והתראות</span>
          </button>
          <button id="myfam-b-about" class="myfam-tool-btn tool-about">
            ${ICONS.info}
            <span>אודות ותנאי שימוש</span>
          </button>
          <a href="https://digital.levtov.uk/" target="_blank" rel="noopener" class="myfam-tool-btn tool-author">
            ${ICONS.starFilled}
            <span>פותח ע"י לב טוב דיגיטל</span>
          </a>
        </div>
      </div>

      <!-- סטטוס וגרסה -->
      <div class="myfam-bottom-panel">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div><span class="myfam-status-dot"></span><span id="myfam-info">ממתין לנתוני המכירה...</span></div>
          <div style="color:#64748b;font-size:11px;font-weight:600;">גרסה ${APP_VERSION}</div>
        </div>
      </div>
    `;
    document.body.appendChild(b);

    const dismissFirstCallout = () => {
      try { localStorage.setItem(LS + 'menu_opened_once', '1'); } catch (_) {}
      $('#myfam-first-callout')?.remove();
    };

    const callout = $('#myfam-first-callout');
    if (callout) {
      callout.onclick = e => {
        e.stopPropagation();
        dismissFirstCallout();
        if (!e.target.closest('#myfam-first-callout-x')) {
          b.classList.remove('collapsed');
          positionBody();
        }
      };
    }

    $('#myfam-toggle').onclick = e => {
      if (panelDragMoved || (Date.now() - lastDragEndTime < 250)) {
        panelDragMoved = false;
        e.stopPropagation();
        e.preventDefault();
        return;
      }
      e.stopPropagation();
      dismissFirstCallout();
      b.classList.toggle('collapsed');
      positionBody();
    };

    if (!window._myfamGlobalListenersBound) {
      window._myfamGlobalListenersBound = true;
      if (typeof chrome !== 'undefined' && chrome?.runtime?.onMessage) {
        chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
          if (msg && msg.type === 'openExtensionMenu') {
            if (checkExcluded()) return;
            ensureUI();
            const bodyEl = $('#myfam-body');
            if (bodyEl) {
              bodyEl.classList.remove('collapsed');
              positionBody();
            }
            dismissFirstCallout();
            try { sendResponse({ ok: true }); } catch (_) {}
          }
        });
      }
      document.addEventListener('keydown', e => {
        const bodyEl = $('#myfam-body');
        if (e.key === 'Escape' && bodyEl && !bodyEl.classList.contains('collapsed')) {
          bodyEl.classList.add('collapsed');
        }
      });

      document.addEventListener('click', e => {
        const bodyEl = $('#myfam-body');
        if (bodyEl && !bodyEl.classList.contains('collapsed') && !e.target.closest('#myfam-panel,#myfam-body,#myfam-modal,#myfam-whatsnew-modal')) {
          bodyEl.classList.add('collapsed');
        }
      });

      addEventListener('scroll', positionBody, { passive: true, capture: true });
    }

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

    $('#myfam-b-hist').onclick = () => { b.classList.add('collapsed'); showHistory(); };
    $('#myfam-b-set').onclick  = () => { b.classList.add('collapsed'); showSettings(); };
    $('#myfam-b-about').onclick = () => { b.classList.add('collapsed'); showAboutModal(); };
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
    invalidateCountsCache();
    ensureUI();
    extractSaleIdFromUrl();
    fetchRemoteMarketPrices();
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
  let lastRenderTime = 0;
  const obs = new MutationObserver(mutations => {
    if (checkExcluded()) return;
    if (!isProductSelectionPage() && !isHistoryPage()) return;

    // רינדור קטלוג נדרש אך ורק כאשר נוספו אלמנטים חדשים לעמוד (למשל גלילה אינסופית או החלפת קטגוריה)
    // פעולות סל, שינויי כמויות ומספרים בכרטיסים קיימים לא מוסיפים כרטיסים חדשים ולכן לא דורשים רינדור!
    const hasAddedElements = mutations.some(m => {
      if (m.type !== 'childList' || !m.addedNodes || !m.addedNodes.length) return false;
      for (let i = 0; i < m.addedNodes.length; i++) {
        const node = m.addedNodes[i];
        if (node.nodeType === 1) {
          // התעלם מכל אלמנט פנימי של התוסף עצמו
          if (node.closest?.('#myfam-panel, #myfam-body, #myfam-modal, #myfam-whatsnew-modal, #myfam-budget-modal, #myfam-forgotten-modal, #myfam-savings-modal, #myfam-toast, .myfam-tag, .myfam-starbtn, .myfam-price-comp-tag')) continue;
          // התעלם מכל שינוי בתוך אזורי סל הקניות, עמודה צדדית, כותרות וניווט
          if (node.closest?.('header, nav, footer, #cart, [id*="cart" i], [class*="cart" i], [class*="basket" i], [class*="drawer" i], aside, dialog')) continue;
          // התעלם משינויים פנימיים בכרטיסי מוצר קיימים (למשל כפתור הוסף לסל או שליטת כמויות)
          if (node.closest?.('.myfam-card')) continue;
          // התעלם מטאגים בודדים שאינם כרטיסי מוצר או קונטיינרים של כרטיסים
          if (['BUTTON', 'SPAN', 'I', 'SVG', 'PATH', 'P', 'INPUT', 'LABEL', 'IMG'].includes(node.tagName) && !node.querySelector?.('.myfam-card, [class*="product"], [class*="item"]')) continue;
          return true;
        }
      }
      return false;
    });
    if (!hasAddedElements) return;

    clearTimeout(timer);
    const now = performance.now();
    const elapsed = now - lastRenderTime;
    const delay = elapsed > 800 ? 150 : Math.max(300, 600 - elapsed);
    timer = setTimeout(() => {
      lastRenderTime = performance.now();
      render();
    }, delay);
  });

  function init() {
    if (checkExcluded()) {
      return;
    }
    extractSaleIdFromUrl();
    applyPrefs();
    buildUI();
    render();
    fetchRemoteMarketPrices();
    updateBudgetUI();
    updateForgottenUI();
    syncLoadGoogle();
    checkFeedbackReminder();
    checkTipsReminder();
    checkDailyHistorySync();
    checkWhatsNewUpdateModal();
    window.addEventListener('resize', scheduleRender);
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
