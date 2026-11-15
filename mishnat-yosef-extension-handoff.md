# סיכום פרויקט והעברת מקל: תוסף "מוסיף למשנת"

## 1. אודות התוסף
* **שם התוסף:** מוסיף למשנת (גרסה 0.3)
* **מפתח:** לב טוב דיגיטל (יהודה)
* **אתר אינטרנט לפרויקטים נוספים:** https://digital.levtov.uk/
* **דוא"ל למשוב:** mytovmail@gmail.com
* **הצהרה משפטית:** תוסף אישי ועצמאי לחלוטין. אינו קשור כלל למערכת "משנת יוסף". כל הזכויות שמורות.
* **ייעוד:** סל קניות משפחתי חכם למשנת יוסף - סימון מוצרים שהוזמנו בעבר, סימון מוצרים קבועים (אוטומטי מ-3 הזמנות ומעלה, או ידני ע"י כוכב), הוספת כל הקבועים לסל בלחיצה אחת, מד תקציב ויזואלי שבועי, תזכורת חכמה לקבועים שנשכחו (Exit-Intent וחיווי פסיבי), הדפסת עגלת קניות לאיסוף (כולל פורמט פתק צר) בתחנת החלוקה, התראות דפדפן חכמות על מועדי פתיחה וסגירה של מכירות, וייבוא היסטוריית הזמנות ישירות מחשבון המשתמש באתר.

## 2. מבנה הקבצים

### manifest.json
``json
{
  "manifest_version": 3,
  "name": "מוסיף למשנת",
  "version": "0.3",
  "description": "תוסף אישי ועצמאי לסל קניות משפחתי חכם במשנת יוסף. פותח ע''י לב טוב דיגיטל. אינו קשור כלל למערכת משנת יוסף. כל הזכויות שמורות.",
  "icons": {
    "128": "icon128.png"
  },
  "permissions": [
    "storage",
    "cookies",
    "notifications",
    "alarms"
  ],
  "host_permissions": [
    "https://v2.mishnatyosef.org/*",
    "https://*.mishnatyosef.org/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": [
        "https://mishnatyosef.org/*",
        "https://*.mishnatyosef.org/*"
      ],
      "js": ["inject.js"],
      "run_at": "document_start",
      "world": "MAIN"
    },
    {
      "matches": [
        "https://mishnatyosef.org/*",
        "https://*.mishnatyosef.org/*"
      ],
      "js": ["transport.js", "core.js"],
      "run_at": "document_start"
    }
  ],
  "web_accessible_resources": [
    {
      "resources": ["feedback.html"],
      "matches": ["https://mishnatyosef.org/*", "https://*.mishnatyosef.org/*"]
    }
  ]
}

``

### background.js
``javascript
/* מוסיף למשנת - שירות רקע והתראות דפדפן */

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('check_sales_periodic', { periodInMinutes: 30 });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create('check_sales_periodic', { periodInMinutes: 30 });
});

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'check_sales_periodic') {
    checkSalesInBackground();
  }
});

chrome.notifications.onClicked.addListener(() => {
  chrome.tabs.create({ url: 'https://mishnatyosef.org/' });
});

async function checkSalesInBackground() {
  try {
    const stored = await new Promise(r => chrome.storage.local.get(['notify_settings', 'sent_notifications', 'last_known_sales'], r));
    const ns = Object.assign({
      enabled: true,
      onStart: true,
      onLastDay: true,
      onClosing: true,
      hoursBefore: 3
    }, stored.notify_settings || {});

    if (!ns.enabled) return;

    const sent = stored.sent_notifications || {};
    const now = Date.now();

    // 1. ננסה לפנות ל-API של משנת יוסף עם הסשן הקיים בדפדפן
    let sales = [];
    try {
      const resp = await fetch('https://v2.mishnatyosef.org/api/profile/open_sales', {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      if (resp.ok) {
        const json = await resp.json();
        sales = Array.isArray(json?.data) ? json.data : [];
        if (sales.length) {
          chrome.storage.local.set({ last_known_sales: sales });
        }
      }
    } catch (e) {}

    // 2. אם לא חזרו מכירות דרך הרשת (למשל אין חיבור זמני), נשתמש במכירות השמורות מביקור קודם באתר
    if (!sales.length) {
      sales = stored.last_known_sales || [];
    }

    for (const s of sales) {
      const sid = s.id || (s.parent && s.parent.id) || 'sale';
      const week = s.name || (s.parent && s.parent.week) || s.week || 'השבוע';

      // פיענוח תאריכים
      const beginTime = s.begin ? new Date(s.begin.replace(' ', 'T')).getTime() : null;
      let closeTime = (s.end || s.closing || s.order_closing_time || s.locked_at)
        ? new Date((s.end || s.closing || s.order_closing_time || s.locked_at).replace(' ', 'T')).getTime()
        : null;

      // אם אין תאריך סגירה מפורש ב-API, במשנת יוסף מכירה נסגרת ביום ראשון בבוקר (09:30)
      if (!closeTime && beginTime) {
        const d = new Date(beginTime);
        while (d.getDay() !== 0) { // 0 = יום ראשון
          d.setDate(d.getDate() + 1);
        }
        d.setHours(9, 30, 0, 0);
        closeTime = d.getTime();
      }

      // א. התראה בעת פתיחת המכירה
      if (ns.onStart && beginTime) {
        const startKey = `start_${sid}`;
        // אם המכירה נפתחה ב-16 השעות האחרונות ועדיין לא הודענו
        if (now >= beginTime && now <= beginTime + 16 * 3600 * 1000 && !sent[startKey]) {
          sent[startKey] = now;
          showNotification(startKey, 'המכירה נפתחה להזמנות! 🛒', `מכירת ${week} פתוחה כעת להזמנת מוצרים באתר משנת יוסף. לחצו לבחירת המוצרים.`);
        }
      }

      // ב. התראה ביום האחרון להזמנה
      if (ns.onLastDay && closeTime) {
        const lastDayKey = `lastday_${sid}`;
        const diffHours = (closeTime - now) / (1000 * 3600);
        // אם נותרו פחות מ-26 שעות ועדיין מעל הזמן של ההתראה הדחופה
        if (diffHours > ns.hoursBefore && diffHours <= 26 && !sent[lastDayKey]) {
          sent[lastDayKey] = now;
          showNotification(lastDayKey, 'תזכורת: יום אחרון להזמנה! ⏰', `מכירת ${week} תיסגר בקרוב להזמנות. לחצו עכשיו כדי לא לפספס.`);
        }
      }

      // ג. התראה דחופה לפני סגירת ההזמנות
      if (ns.onClosing && closeTime) {
        const urgentKey = `urgent_${sid}`;
        const diffHours = (closeTime - now) / (1000 * 3600);
        if (diffHours > 0 && diffHours <= ns.hoursBefore && !sent[urgentKey]) {
          sent[urgentKey] = now;
          const hText = ns.hoursBefore === 1 ? 'שעה אחת' : `${ns.hoursBefore} שעות`;
          showNotification(urgentKey, 'הזדמנות אחרונה להזמנה! ⏳', `נותרו פחות מ-${hText} לסגירת ההזמנות במכירת ${week}. לחצו כאן לסיום ההזמנה.`);
        }
      }
    }

    chrome.storage.local.set({ sent_notifications: sent });
  } catch (err) {
    console.warn('[myfam bg check sales]', err);
  }
}

function showNotification(id, title, message) {
  try {
    chrome.notifications.create(id, {
      type: 'basic',
      iconUrl: 'icon128.png',
      title: title,
      message: message,
      priority: 2
    });
  } catch (e) {
    console.warn('[myfam notification error]', e);
  }
}

chrome.runtime.onMessage.addListener((m, s, send) => {
  if (m.type === 'req') {
    const o = m.o || {};
    const headers = { 'Accept': 'application/json', ...(o.headers || {}) };
    if (o.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'text/plain';
    }
    fetch(o.url, {
      method: o.method || 'GET',
      body: o.body,
      headers: headers,
      credentials: 'include'
    }).then(async r => {
      const ct = r.headers.get('content-type') || '';
      if (r.status === 401) {
        send({ error: 'unauthorized', status: 401 });
        return;
      }
      if (ct.includes('json')) {
        const data = await r.json();
        if (r.ok) {
          send({ data, status: r.status });
        } else {
          send({ error: data.message || `HTTP ${r.status}`, status: r.status, data });
        }
      } else {
        const text = await r.text();
        if (r.ok) {
          try {
            send({ data: JSON.parse(text), status: r.status });
          } catch (e) {
            send({ error: 'HTML received (' + r.status + ')', status: r.status, text: text.slice(0, 200) });
          }
        } else {
          send({ error: `HTTP ${r.status}`, status: r.status, text: text.slice(0, 200) });
        }
      }
    }).catch(e => {
      send({ error: String(e.message || e) });
    });
    return true;
  }

  if (m.type === 'getCookies') {
    try {
      chrome.cookies.getAll({ domain: 'mishnatyosef.org' }, cookies => {
        send({ cookies: cookies || [] });
      });
    } catch (e) {
      send({ error: String(e) });
    }
    return true;
  }

  if (m.type === 'openFeedback') {
    chrome.tabs.create({ url: chrome.runtime.getURL('feedback.html') });
    send({ ok: true });
    return true;
  }

  if (m.type === 'updateSalesMeta') {
    if (Array.isArray(m.sales) && m.sales.length) {
      chrome.storage.local.set({ last_known_sales: m.sales }, () => {
        checkSalesInBackground();
        send({ ok: true });
      });
      return true;
    }
  }

  if (m.type === 'testNotification') {
    showNotification('test_' + Date.now(), 'התראת בדיקה - מוסיף למשנת 🔔', 'ההתראות פועלות כשורה! תקבלו תזכורות בזמן על פתיחת וסגירת מכירות.');
    send({ ok: true });
    return true;
  }
});

``

### inject.js
``javascript
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

``

### transport.js
``javascript
window.__MY_T = {
  request: o => chrome.runtime.sendMessage({ type: 'req', o }).then(r => {
    if (!r || r.error) throw new Error(r && r.error);
    return r.data;
  })
};
``

### core.js
``javascript
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
    chevronDown: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;display:inline-block"><polyline points="6 9 12 15 18 9"/></svg>`
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

  let state = jget('state', { history: [], fixed: {} });
  // איפוס אוטומטי של סימוני בדיקה ישנים (שחסמו מוצרים כמו בצל ועגבניה שהוזמנו 7 פעמים)
  if (!localStorage.getItem(LS + 'clean_fixed_v3')) {
    localStorage.setItem(LS + 'clean_fixed_v3', 'true');
    state.fixed = {};
    jset('state', state);
  }
  let settings = jget('settings', { url: '', token: '' });
  let saleMeta = jget('salemeta', {});          // saleId -> {week, begin}
  let filter = 'all';
  const PREF_DEFAULT = { seenColor: '#2e9e5b', seenFill: false, fixedColor: '#e0a800', fixedFill: true };
  let prefs = { ...PREF_DEFAULT, ...jget('prefs', {}) };
  let sale = { id: null, items: new Map() };    // שם מנורמל -> {pid, name}
  let live = null;                              // ההזמנה הנוכחית: {orderId, saleId, clientId, lines: Map}
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

  const save = () => { jset('state', state); schedulePush(); };

  /* ---------- סנכרון (כולל prefs) ---------- */
  let pushTimer;
  const schedulePush = () => { clearTimeout(pushTimer); pushTimer = setTimeout(push, 1500); };

  async function push() {
    if (!settings.url || !settings.token) return;
    try {
      await T.request({
        method: 'POST',
        url: settings.url,
        body: JSON.stringify({ token: settings.token, data: { ...state, prefs } })
      });
      setStatus('מסונכרן ✓');
    } catch {
      setStatus('שגיאת סנכרון');
    }
  }

  async function pull() {
    if (!settings.url || !settings.token) return setStatus('לא הוגדר שרת');
    try {
      const r = await T.request({ method: 'GET', url: `${settings.url}?token=${encodeURIComponent(settings.token)}` });
      if (r.error) return setStatus('קוד לא תקין');
      const incoming = r.data || {};
      state = merge(state, incoming);
      jset('state', state);
      if (incoming.prefs) {
        prefs = { ...prefs, ...incoming.prefs };
        jset('prefs', prefs);
        applyPrefs();
      }
      render();
      push();
    } catch {
      setStatus('שגיאת חיבור');
    }
  }

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
  function saveProductImages() {
    try { jset('product_images', productImages); } catch (e) {}
  }

  // עקביות מלאה: עדיפות לשם המוצר במכירה, ואז לשם המוצר הכללי + משיכת תמונת המוצר
  const lineFrom = it => {
    const is = it.item_sale || {};
    const pid = is.itemID || it.productID || it.itemID;
    const name = is.name || (is.product && is.product.name) || it.name;
    if (pid == null || !name) return null;
    const rawImg = is.image || is.picture || is.image_url || (is.product && (is.product.image || is.product.image_url)) || (it.product && it.product.image) || it.image;
    let img = '';
    if (rawImg) {
      img = rawImg.startsWith('http') ? rawImg : `${API_HOST}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`;
      productImages['p' + pid] = img;
      productImages[norm(name)] = img;
    } else {
      img = productImages['p' + pid] || productImages[norm(name)] || '';
    }
    return { sid: Number(it.item_salesID ?? is.id), pid, key: 'p' + pid, name, qty: parseFloat(it.amount) || 1, image: img };
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
          sale.items.set(norm(n), { pid: r.itemID, name: n, image: img });
        }
      });
      saveProductImages();
      scheduleRender();

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
        (o.items || []).forEach(it => { if (it.del) return; const l = lineFrom(it); if (l) live.lines.set(l.sid, l); });
        commit();
      } else {
        // זו הזמנת עבר שנטענה (למשל מתוך היסטוריית הזמנות באתר)
        const items = (o.items || [])
          .filter(it => !it.del)
          .map(lineFrom)
          .filter(Boolean)
          .map(l => ({ key: l.key, pid: l.pid, name: l.name, qty: l.qty }))
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
      commit();

    } else if (d.method === 'POST' && (m = path.match(/^\/api\/remove_item\/\d+\/(\d+)$/))) {
      if (!live || !(j && j.status === 'success')) return;
      live.lines.delete(Number(m[1]));
      commit();
    }
  }

  function commit() {
    if (!live) return;
    const items = [...live.lines.values()]
      .map(l => ({ key: l.key, pid: l.pid, name: l.name, qty: l.qty }))
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
    if (!p || !b || !t || p.classList.contains('collapsed')) return;
    const r = t.getBoundingClientRect(), w = 220;
    let left = r.left;
    if (left + w > innerWidth - 8) left = Math.max(8, r.right - w);
    b.style.top = (r.bottom + 6) + 'px';
    b.style.left = left + 'px';
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
        star.onclick = ev => { ev.preventDefault(); ev.stopPropagation(); toggleFixed(star.dataset.key); };
        cd.appendChild(star);
      }
      star.dataset.key = key;   // מתעדכן בכל רינדור — כרטיס ממוחזר מקבל את המוצר הנכון
      // הסרת תגיות של מוצר קודם שהיה בכרטיס זה לפני מיחזור
      cd.querySelectorAll('.myfam-tag').forEach(t => { if (t.getAttribute('data-tag-key') !== key) t.remove(); });
      star.className = 'myfam-starbtn' + (fx ? ' on' : '');
      star.innerHTML = fx ? ICONS.starBtnFilled : ICONS.starBtnEmpty;
      star.title = fx ? 'בטל סימון כמוצר קבוע' : 'סמן כמוצר קבוע';
      stars.push({ cd, star });

      // שמירת תמונת המוצר אם קיימת בכרטיס לטובת הדפסה
      const imgEl = cd.querySelector('img');
      if (imgEl && imgEl.src && !imgEl.src.startsWith('data:') && !imgEl.src.includes('enable-')) {
        productImages[key] = imgEl.src;
        const leafText = (leaf.textContent || '').trim();
        if (leafText) productImages[norm(leafText)] = imgEl.src;
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
    });

    // ניקוי תגיות וכוכבים שאינם שייכים לכרטיסים פעילים
    $$('.myfam-tag').forEach(t => { if (!region.contains(t) || !t.closest('.myfam-card')) t.remove(); });
    $$('.myfam-starbtn').forEach(s => { if (!region.contains(s) || !s.closest('.myfam-card')) s.remove(); });

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

    $('#myfam-b-seen')?.classList.toggle('on', filter === 'seen');
    $('#myfam-b-fixed')?.classList.toggle('on', filter === 'fixed');
    const info = $('#myfam-info');
    if (info) {
      info.textContent = (sale.items.size ? `מוצרים בדף: ${inList} · במכירה: ${sale.items.size}` : 'ממתין לנתוני המכירה…')
        + (toolbarHeart ? '' : ' · מיקום צף');
    }
    placePanel(toolbarHeart);
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
              .map(l => ({ key: l.key, pid: l.pid, name: l.name, qty: l.qty }))
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

  async function addAllFixedToCart() {
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
      alert('כל המוצרים הקבועים במכירה זו כבר נמצאים בסל הקניות שלך!');
      return;
    }

    if (!confirm(`נמצאו ${candidates.length} מוצרים קבועים שעדיין אינם בסל.\nלהוסיף את כולם כעת לסל הקניות?`)) {
      return;
    }

    setStatus(`מוסיף ${candidates.length} פריטים לסל…`);
    let added = 0;
    for (const item of candidates) {
      try {
        item.btn.click();
        added++;
        await new Promise(r => setTimeout(r, 200));
      } catch (err) {
        console.warn('[myfam add fixed]', err);
      }
    }
    setStatus(`נוספו ${added} פריטים לסל ✓`);
    alert(`נוספו ${added} מוצרים קבועים לסל בהצלחה!`);
  }

  /* ---------- הדפסת עגלת הקניות עם תמונות וכמויות מודגשות ---------- */
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
      alert('עגלת הקניות שלך במכירה זו ריקה כרגע.\nיש להוסיף מוצרים לסל לפני ההדפסה.');
      return;
    }

    lines.sort((a, b) => a.name.localeCompare(b.name, 'he'));

    const sid = (live && live.saleId) || extractSaleIdFromUrl();
    const weekName = (sid && saleMeta[sid]?.week) || 'המכירה השבועית';
    const nowStr = new Date().toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' });
    const totalQty = lines.reduce((sum, l) => sum + (parseFloat(l.qty) || 1), 0);

    const rowsHtml = lines.map((l, i) => {
      const qtyNum = parseFloat(l.qty) || 1;
      const isMulti = qtyNum > 1;
      const imgUrl = l.image || productImages[l.key] || productImages[norm(l.name)] || (sale.items.get(norm(l.name))?.image) || '';

      return `
        <tr>
          <!-- ריבוע סימון פיזי לתחנת החלוקה -->
          <td class="col-chk">
            <div class="chk-box"></div>
          </td>

          <!-- תמונת המוצר (ניתנת להסתרה/הצגה) -->
          <td class="col-img">
            ${imgUrl ? `<img src="${esc(imgUrl)}" class="prod-thumb" alt="${esc(l.name)}" onerror="this.parentElement.innerHTML='<div class=\\'no-img-box\\'>📦</div>';">` : `<div class="no-img-box">📦</div>`}
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
        <title>רשימת קניות לאיסוף - ${esc(weekName)}</title>
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
          body.no-images .col-img { display: none !important; }

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
          body.dense td { padding: 4px 6px; }
          body.dense .prod-thumb { width: 30px; height: 30px; }
          body.dense .no-img-box { width: 30px; height: 30px; }
          body.dense .prod-name { font-size: 13.5px; }
          body.dense .qty-multi { font-size: 14px; padding: 1px 6px; }

          .footer { margin-top: 16px; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }

          @media print {
            .toolbar { display: none !important; }
            .page-wrap { max-width: 100% !important; padding: 0 !important; }
            body { background: #fff !important; }
            tr { page-break-inside: avoid; }
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
                <span>הצג תמונות מוצרים בהדפסה</span>
              </label>
              <label class="toolbar-label">
                <input type="checkbox" id="chk-dense">
                <span>מצב שורות צפוף (פחות דפים)</span>
              </label>
            </div>
            <button class="print-now-btn" onclick="window.print()">
              🖨️ הדפס רשימה
            </button>
          </div>

          <!-- כותרת ראשית -->
          <div class="header">
            <div class="title-area">
              <h1>משנת יוסף · רשימת הזמנה לאיסוף</h1>
              <div class="meta"><b>${esc(weekName)}</b> | הודפס: ${nowStr}</div>
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
                <th class="col-img" style="width:48px; text-align:center;">תמונה</th>
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

        <script>
          document.getElementById('chk-images').addEventListener('change', function() {
            document.body.classList.toggle('no-images', !this.checked);
          });
          document.getElementById('chk-dense').addEventListener('change', function() {
            document.body.classList.toggle('dense', this.checked);
          });
        </script>
      </body>
      </html>
    `;

    const printWin = window.open('', '_blank', 'width=850,height=920');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(printHtml);
      printWin.document.close();
    } else {
      alert('חלון ההדפסה נחסם על ידי הדפדפן. יש לאשר פתיחת חלונות קופצים (Popups) עבור אתר משנת יוסף.');
    }
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
        btn.onclick = ev => {
          ev.stopPropagation();
          const key = btn.dataset.key;
          if (key) {
            toggleFixed(key);
            // רענון מיידי של הנתונים במודאל
            const updatedCounts = counts();
            const p = prodMap.get(key);
            if (p) p.isFixed = isFixed(key, updatedCounts);
            renderModalContent();
          }
        };
      });

      // כפתורי מחיקת הזמנה
      m.querySelectorAll('.myfam-hist-del-btn').forEach(btn => {
        btn.onclick = ev => {
          ev.stopPropagation();
          const del = btn.dataset.del;
          if (del && confirm('למחוק הזמנה זו מההיסטוריה השמורה בתוסף?')) {
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
    if (!w) return alert('נא לאשר פתיחת חלונות קופצים (Popups) כדי להדפיס.');

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
    <button onclick="window.print()" style="padding:8px 16px;background:#2e9e5b;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">🖨️ הדפס דוח</button>
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

      <!-- חלק 3: סנכרון ושחזור -->
      <div class="myfam-set-section">
        <h4 class="myfam-set-sec-title">☁️ סנכרון ושחזור מרחוק (אופציונלי)</h4>
        <label style="display:block;margin:6px 0;font-size:12px;color:#475569;">
          כתובת שרת Google Apps Script:
          <input type="text" id="mf-url" dir="ltr" placeholder="https://script.google.com/..." class="myfam-input-text">
        </label>
        <label style="display:block;margin:6px 0;font-size:12px;color:#475569;">
          קוד משפחתי סודי:
          <input type="text" id="mf-token" dir="ltr" placeholder="קוד ייחודי..." class="myfam-input-text">
        </label>
        <div style="margin-top:10px;">
          <button id="mf-save" class="myfam-btn-primary" style="width:100%;">שמור הגדרות סנכרון</button>
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
    fill(); g('mf-url').value = settings.url; g('mf-token').value = settings.token;

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

    const upd = rerender => {
      prefs = { seenColor: g('mf-seenColor').value, fixedColor: g('mf-fixedColor').value,
                seenFill: g('mf-seenFill').value === '1', fixedFill: g('mf-fixedFill').value === '1' };
      jset('prefs', prefs); applyPrefs(); if (rerender) render();
    };
    g('mf-seenColor').oninput = () => upd(false);
    g('mf-fixedColor').oninput = () => upd(false);
    g('mf-seenFill').onchange = () => upd(true);
    g('mf-fixedFill').onchange = () => upd(true);
    g('mf-reset').onclick = () => { prefs = { ...PREF_DEFAULT }; jset('prefs', prefs); applyPrefs(); fill(); render(); };
    g('mf-reset-fixed').onclick = () => {
      if (confirm('לאפס את כל הסימונים הידניים של מוצרים קבועים?\nכל המוצרים שהוזמנו 3 פעמים ומעלה יחזרו להיות קבועים אוטומטית.')) {
        state.fixed = {};
        save();
        render();
        alert('הסימונים הידניים אופסו בהצלחה!');
      }
    };
    g('mf-save').onclick = () => {
      settings = { url: g('mf-url').value.trim(), token: g('mf-token').value.trim() };
      jset('settings', settings); m.remove(); pull();
    };
    g('mf-open-feedback').onclick = () => { m.remove(); openFeedbackPage(); };

    // סגירה ודאית באמצעות X או לחיצה על הרקע
    const closeBtn = $('.myfam-x', m);
    if (closeBtn) closeBtn.onclick = () => m.remove();
    m.onclick = e => { if (e.target === m || e.target.closest('.myfam-x')) m.remove(); };
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

      /* תפריט נפתח ראשי */
      #myfam-body{position:fixed;z-index:100000;width:238px;display:flex;flex-direction:column;gap:7px;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;padding:14px;box-shadow:0 20px 40px -10px rgba(15,23,42,0.2), 0 0 0 1px rgba(15,23,42,0.06);direction:rtl;font-family:system-ui,-apple-system,sans-serif}
      #myfam-body.collapsed{display:none}
      #myfam-body button{cursor:pointer;border:1px solid #e2e8f0;border-radius:10px;padding:8px 12px;background:#f8fafc;font-size:13px;font-weight:600;text-align:right;display:flex;align-items:center;gap:10px;width:100%;color:#1e293b;transition:all .15s ease}
      #myfam-body button svg{flex-shrink:0}
      #myfam-body button:hover{background:#f1f5f9;border-color:#cbd5e1;transform:translateX(-2px)}
      #myfam-body button.on{background:#2e9e5b;color:#fff;border-color:#2e9e5b}

      #myfam-b-seen{background:#f0fdf4!important;border-color:#bbf7d0!important;color:#166534!important}
      #myfam-b-fixed{background:#fffbeb!important;border-color:#fde68a!important;color:#92400e!important}
      #myfam-b-addall{background:linear-gradient(135deg, #10b981 0%, #059669 100%)!important;border:none!important;color:#fff!important;box-shadow:0 2px 8px rgba(16,185,129,0.3)!important}
      #myfam-b-addall:hover{box-shadow:0 4px 12px rgba(16,185,129,0.4)!important}
      #myfam-b-print{background:#f0fdfa!important;border-color:#99f6e4!important;color:#115e59!important}

      #myfam-status,#myfam-info{font-size:11px;color:#64748b;text-align:center;margin-top:2px}
      .myfam-panel-footer{margin-top:8px;padding-top:8px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;text-align:center;line-height:1.4}
      .myfam-panel-footer a{color:#2e9e5b;text-decoration:none;font-weight:600}
      .myfam-panel-footer a:hover{text-decoration:underline}

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
      .myfam-hist-del-btn{display:inline-flex;align-items:center;gap:4px;padding:4px 8px;border:1px solid #fca5a5;background:#fff5f5;color:#b91c1c;border-radius:6px;font-size:11px;font-weight:bold;cursor:pointer}
      .myfam-hist-del-btn:hover{background:#fee2e2}
      .myfam-hist-order-body{padding:10px 14px}
      .myfam-hist-order-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:6px;font-size:12px}
      .myfam-hist-order-item{display:flex;justify-content:space-between;background:#f8fafc;padding:5px 8px;border-radius:6px;border:1px solid #f1f5f9}
      .myfam-hist-item-name{color:#1e293b;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .myfam-hist-item-qty{font-weight:bold;color:#2e9e5b;margin-right:6px}
    `;
    document.head.appendChild(css);

    // פאנל כפתור התוסף
    const p = document.createElement('div');
    p.id = 'myfam-panel';
    p.innerHTML = `<button id="myfam-toggle" title="${APP_NAME}">${ICONS.basket}</button>`;
    document.body.appendChild(p);

    // תפריט הפאנל - מוצמד ישירות ל-body כדי לעקוף בעיות transform/overflow של שורת הכלים
    const b = document.createElement('div');
    b.id = 'myfam-body';
    b.className = 'collapsed';
    b.innerHTML = `
      <div style="font-weight:bold;font-size:14px;text-align:center;padding-bottom:6px;border-bottom:1px solid #eee;display:flex;align-items:center;justify-content:center;gap:6px;color:#1e293b;">
        ${ICONS.basket} <span>${APP_NAME}</span>
      </div>
      <button id="myfam-b-seen">${ICONS.cart} <span>רק מה שהוזמן בעבר</span></button>
      <button id="myfam-b-fixed">${ICONS.star} <span>רק קבועים</span></button>
      <button id="myfam-b-addall" style="background:#eef7f1;border-color:#2e9e5b;color:#1e6b3e;font-weight:bold;">${ICONS.cartPlus} <span>הוסף את כל הקבועים לסל</span></button>
      <button id="myfam-b-print" style="background:#f0fdf4;border-color:#86efac;color:#166534;font-weight:bold;">${ICONS.print} <span>הדפס רשימת קניות לאיסוף</span></button>
      <button id="myfam-b-hist">${ICONS.history} <span>היסטוריית קניות</span></button>
      <button id="myfam-b-import">${ICONS.download} <span>ייבא היסטוריה מהאתר</span></button>
      <button id="myfam-b-set">${ICONS.settings} <span>הגדרות והתראות</span></button>
      <button id="myfam-b-dbg">${ICONS.bug} <span>העתק דגימות ל-AI</span></button>
      <div id="myfam-info"></div>
      <div id="myfam-status"></div>
      <div class="myfam-panel-footer">
        פותח ע"י <a href="https://digital.levtov.uk/" target="_blank">לב טוב דיגיטל</a>
      </div>
    `;
    document.body.appendChild(b);

    $('#myfam-toggle').onclick = e => {
      e.stopPropagation();
      b.classList.toggle('collapsed');
      positionBody();
    };

    document.addEventListener('click', e => {
      if (!b.classList.contains('collapsed') && !e.target.closest('#myfam-panel,#myfam-body,#myfam-modal')) {
        b.classList.add('collapsed');
      }
    });

    addEventListener('scroll', positionBody, { passive: true, capture: true });

    $('#myfam-b-seen').onclick   = () => { filter = filter === 'seen'  ? 'all' : 'seen';  render(); };
    $('#myfam-b-fixed').onclick  = () => { filter = filter === 'fixed' ? 'all' : 'fixed'; render(); };
    $('#myfam-b-addall').onclick = () => { b.classList.add('collapsed'); addAllFixedToCart(); };
    $('#myfam-b-print').onclick  = () => { b.classList.add('collapsed'); printCurrentCart(); };
    $('#myfam-b-hist').onclick   = () => { b.classList.add('collapsed'); showHistory(); };
    $('#myfam-b-import').onclick = () => { b.classList.add('collapsed'); importHistoryFromSite(); };
    $('#myfam-b-set').onclick    = () => { b.classList.add('collapsed'); showSettings(); };
    $('#myfam-b-dbg').onclick   = async () => {
      const txt = JSON.stringify(debugBuf, null, 1);
      try {
        await navigator.clipboard.writeText(txt);
        alert(`הועתקו ${debugBuf.length} דגימות API (פרטי כרטיס ומזהה לקוח הוסתרו בבטחה).`);
      } catch {
        prompt('העתק את הדגימות:', txt.slice(0, 20000));
      }
    };
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
  const obs = new MutationObserver(() => {
    if (checkExcluded()) return;
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
    pull();
    checkFeedbackReminder();
    window.addEventListener('resize', scheduleRender);
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();

`

### feedback.html
``html
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>מוסיף למשנת - איך חוויית השימוש שלך?</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #2e9e5b;
      --primary-dark: #248149;
      --gold: #f59e0b;
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --text: #1e293b;
      --text-muted: #64748b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Assistant', sans-serif;
      background: var(--bg);
      color: var(--text);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px 16px;
    }
    .card {
      background: var(--card-bg);
      border-radius: 20px;
      padding: 40px 32px;
      max-width: 580px;
      width: 100%;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
      text-align: center;
    }
    .logo-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 72px;
      height: 72px;
      background: #eef7f1;
      border-radius: 50%;
      font-size: 38px;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 26px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 12px;
    }
    p.subtitle {
      font-size: 17px;
      color: var(--text-muted);
      line-height: 1.6;
      margin-bottom: 28px;
    }
    .stars-box {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 14px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .stars-row {
      font-size: 32px;
      color: var(--gold);
      letter-spacing: 4px;
      margin-bottom: 10px;
    }
    .action-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: var(--primary);
      color: #fff;
      text-decoration: none;
      font-weight: 700;
      font-size: 16px;
      padding: 12px 24px;
      border-radius: 10px;
      transition: background 0.2s, transform 0.1s;
      cursor: pointer;
      border: none;
      width: 100%;
      margin-top: 6px;
    }
    .action-btn:hover {
      background: var(--primary-dark);
      transform: translateY(-1px);
    }
    .action-btn.secondary {
      background: #f1f5f9;
      color: var(--text);
      border: 1px solid #cbd5e1;
      margin-top: 10px;
    }
    .action-btn.secondary:hover {
      background: #e2e8f0;
    }
    .feedback-section {
      border-top: 1px solid #e2e8f0;
      padding-top: 24px;
      margin-top: 24px;
      text-align: right;
    }
    .feedback-section h2 {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 8px;
      text-align: center;
    }
    .feedback-section p {
      font-size: 15px;
      color: var(--text-muted);
      line-height: 1.6;
      text-align: center;
      margin-bottom: 16px;
    }
    .mail-link {
      color: var(--primary);
      font-weight: 700;
      direction: ltr;
      display: inline-block;
    }
    .footer-credits {
      margin-top: 32px;
      font-size: 13px;
      color: #94a3b8;
      text-align: center;
      line-height: 1.5;
    }
    .footer-credits a {
      color: #64748b;
      text-decoration: underline;
    }
    .share-toast {
      display: none;
      background: #10b981;
      color: #fff;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
      margin-top: 10px;
      text-align: center;
    }
  </style>
</head>
<body>

  <div class="card">
    <div class="logo-badge">
      <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#2e9e5b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
    </div>
    <h1>נהנים מתוסף "מוסיף למשנת"?</h1>
    <p class="subtitle">
      עברו שבועיים מאז שהתקנתם את התוסף לקניות שלכם במשנת יוסף.<br>
      אנו שמחים לעזור לכם לחסוך זמן ולבצע קנייה משפחתית מדויקת ומהירה!
    </p>

    <div class="stars-box">
      <div class="stars-row" style="display:flex; justify-content:center; gap:8px;">
        <svg viewBox="0 0 24 24" width="30" height="30" fill="#f59e0b" stroke="#f59e0b" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <svg viewBox="0 0 24 24" width="30" height="30" fill="#f59e0b" stroke="#f59e0b" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <svg viewBox="0 0 24 24" width="30" height="30" fill="#f59e0b" stroke="#f59e0b" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <svg viewBox="0 0 24 24" width="30" height="30" fill="#f59e0b" stroke="#f59e0b" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <svg viewBox="0 0 24 24" width="30" height="30" fill="#f59e0b" stroke="#f59e0b" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </div>
      <p style="font-size: 15px; margin-bottom: 12px; color: #475569;">
        אוהבים את התוסף? נודה מאוד לדירוג 5 כוכבים בחנות התוספים של כרום!
      </p>
      <!-- קישור לחנות התוספים של כרום (לעדכן לאחר העלאה לחנות) -->
      <a href="https://chrome.google.com/webstore" id="rateBtn" target="_blank" class="action-btn">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="#fff" stroke="#fff" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <span>דרגו אותנו בחנות כרום</span>
      </a>
      <button id="shareBtn" class="action-btn secondary">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        <span>שתפו חברים ובני משפחה</span>
      </button>
      <div id="shareToast" class="share-toast">הקישור הועתק ללוח!</div>
    </div>

    <div class="feedback-section">
      <h2>הערות, הארות והצעות שיפור?</h2>
      <p>
        התוסף פותח במיוחד כדי להקל עליכם. אם יש רעיון לשיפור, תכונה שהייתם רוצים לראות, או כל הערה:<br>
        מוזמנים לכתוב ישירות לכתובת:
        <br>
        <a href="mailto:mytovmail@gmail.com?subject=משוב על תוסף מוסיף למשנת" class="mail-link">mytovmail@gmail.com</a>
      </p>
      
      <p style="margin-top: 12px;">
        לפרויקטים חינמיים נוספים וכלים דיגיטליים, בקרו באתר הבית:<br>
        <!-- קישור לאתר הבית של לב טוב דיגיטל -->
        <a href="https://digital.levtov.uk/" target="_blank" class="mail-link" style="direction: rtl;">אתר לב טוב דיגיטל - פרויקטים חינמיים</a>
      </p>
    </div>

    <div class="footer-credits">
      פותח ע"י <strong>לב טוב דיגיטל</strong>.<br>
      <strong>הבהרה:</strong> תוסף זה פותח באופן אישי ופרטי לתועלת הציבור, ואינו קשור כלל להנהלת או מערכת "משנת יוסף".<br>
      כל הזכויות שמורות.
    </div>
  </div>

  <script>
    document.getElementById('shareBtn').onclick = () => {
      // קישור התוסף בחנות כרום לשיתוף
      const storeUrl = document.getElementById('rateBtn').href;
      const text = 'היי! מומלץ בחום להתקין את תוסף "מוסיף למשנת" לקניות קלות ומהירות במשנת יוסף: ' + storeUrl;
      navigator.clipboard.writeText(text).then(() => {
        const toast = document.getElementById('shareToast');
        toast.style.display = 'block';
        setTimeout(() => toast.style.display = 'none', 3000);
      }).catch(() => {
        prompt('העתק את הקישור לשיתוף:', storeUrl);
      });
    };
  </script>
</body>
</html>

``

---

# עדכון גרסה 0.3 - מחשבון חיסכון והשוואת מחירים (Price Comparison & Savings Engine)

בגרסה זו מומש במלואו **מנגנון השוואת מחירים וחיסכון חכם מול רשתות השיווק החרדיות והמובילות (אושר עד, רמי לוי, יש חסד)**:

### 1. עקרונות המנגנון ודיוק הנתונים
* **סל עוגן מאומת (Benchmark Items):** מאגר נרחב של כ-60 מוצרי צריכה מובהקים ופופולריים מהמותגים המובילים (תנובה, טרה, אסם, תלמה, סוגת, פיירי, סנו וכו') המחולקים לקטגוריות:
  - מוצרי חלב וביצים (חלב 3%, 1%, ביצים L/M 30 ו-12, קוטג', גבינה לבנה, שמנת, צהובה, מילקי).
  - שמנים ויסוד (קנולה, סויה, שמן זית, סוכר, קמח, מלח, אורז פרסי/בסמטי/יסמין).
  - פסטות, קטניות ושימורים (פסטות אסם, פתיתים, טונה רביעייה, תירס, אפונה, חמוצים, זיתים, רסק, קטשופ, מיונז, טחינה גולמית).
  - ממתקים, בוקר ומשקאות (קורנפלקס, כריות, פטיבר, במבה, ביסלי, קוקה קולה, מים, קפה נמס/מגורען, תה ויסוצקי).
  - חומרי ניקוי וטיפוח (פיירי, ג'ל כביסה פרסיל/אריאל, בדין, אקונומיקה סנו ג'ל, נייר טואלט, שקיות אשפה, קולגייט, שמפו).
  - קפואים ובשרים (סנפרוסט, צ'יפס קפוא, בורקס, מלוואח, שניצל תירס, חזה עוף, בקר טחון חלק, פילה סלמון).
* **מנגנון זיהוי חכם (Normalized Fuzzy & Alias Matching):** התאמת שמות מוצרים וכינויים שונים תוך ניקוי רווחים ותווים מיוחדים.
* **מסנני הגנה וסבירות (Outlier & Safety Ratio Filter):** מוצר מושווה נכלל בחישוב החיסכון אך ורק אם היחס בין מחירו במשנת יוסף למחיר ברשתות נמצא בטווח התקין של $0.4 \le \text{ratio} \le 2.2$. זה מונע עיוותים הנובעים מגודלי מארזים שונים (כגון השוואת יחידה בודדת למארז רביעייה).
* **סף אמינות סטטיסטי (Coverage Threshold):** סכום החיסכון הכולל לסל מוצג רק כאשר ישנם לפחות 3 מוצרי עוגן תואמים בסל.
* **ניסוח משפטי שקוף והגון (חוק הגנת הצרכן):** הבהרה שקופה וגלויה שאינה מטעה: *"מבוסס על השוואת מוצרים תואמים בסל מול רשתות השיווק המובילות (אושר עד, רמי לוי, יש חסד). ירקות, פירות, מוצרים שקילים ומוצרים ייחודיים אינם נכללים בהשוואה."*

### 2. ממשק המשתמש (UI / UX)
* **תגית חיסכון אישית בכל כרטיס מוצר (`.myfam-price-comp-tag`):**
  - מוצגת בכרטיסי המוצרים בקטלוג מתחת למחיר: מציגה מחיר משוער ברשתות וסכום חיסכון ליחידה בירוק מעודן.
* **טאב / גלולה צפה (Floating Savings Pill):**
  - מוצג לצד גלולת התקציב ומונה הפריטים: `💰 חיסכון: ₪XX (YY%)`. לחיצה פותחת את מודאל ההשוואה.
* **ווידג'ט חיסכון במגירת התוסף (`#myfam-savings-widget`):**
  - תצוגת סיכום ברורה של החיסכון השבועי המוערך עם כפתור "🔍 פירוט השוואת מחירים".
* **מודאל השוואה מפורט ומודפס (`#myfam-savings-modal`):**
  - כרטיס סיכום עליון עם סך החיסכון, אחוז החיסכון, ומחיר הסל המקביל ברשתות.
  - טבלת השוואה פריט-אחר-פריט המציגה שם מוצר, כמות, מחיר משנת יוסף, מחיר ברשתות השיווק (כולל פירוט עמודות לאושר עד, רמי לוי ויש חסד), וסך החיסכון המצטבר.
  - אפשרות להדפסת דו"ח השוואת מחירים מלא ומעוצב לנייר או PDF (`printSavingsReport`).

### 3. סנכרון דינמי מהרשת (Dynamic CDN Sync)
* **הרשאות Manifest v3:** הוגדרו הרשאות עבור `https://digital.levtov.uk/*` ו-`https://raw.githubusercontent.com/*`.
* **מנגנון עדכון עצמאי ללא צורך בעדכון תוסף:** התוסף בודק פעם ביממה בשרת `https://digital.levtov.uk/mishnat/prices.json` אם קיים עדכון למחירי השוק או מוצרי עוגן חדשים ושומר אותם מקומית (`localStorage`). במידה ואין גישה לרשת, המערכת עובדת מיידית וחלק עם מאגר העוגן המובנה.

---

# עדכון ליטושים, ממשק משתמש ותיקוני דיוק (UI Redesign & Fixes)

### 1. מניעת קפיצת הודעות בדף הכניסה לחשבון (Login Page Exclusion)
* נוספו דפי ההתחברות והאימות (`/login`, `/register`, `/auth`, `/forgot-password`, `/reset-password`) לרשימת `EXCLUDED_PATHS`.
* פונקציות המדריך הראשוני (`checkTipsReminder`) ובאנר ייבוא ההיסטוריה (`showMissingHistoryBanner`) הוגדרו לפעול אך ורק בעת הימצאות בדף בחירת מוצרים או הזמנה פעילה (`isProductSelectionPage`).

### 2. סידור מחדש של תפריט התוסף (התאמה מלאה למודל העיצוב החדש)
* **ממדים וגלילה עצמאית:** הוגדר `width: 300px`, `max-height: calc(100vh - 40px)`, ו-`overflow-y: auto` עם גלילה מעודנת, המונעת גלישת התפריט מעבר למסך במחשבים ניידים ומסכים קטנים.
* **כותרת עליונה:** כפתור טיפים `(?)`, כותרת `✨ מוסיף למשנת 🛒` וכפתור סגירה `✕`.
* **כרטיסים עליונים צמודים (2 עמודות):**
  - **תקציב שבועי:** חוגת מד תקציב מעגלית (SVG Donut Chart) עם הצגת סכום נוכחי ויעד במרכז, וכפתור "✏️ עריכה".
  - **החיסכון שלך:** כרטיס ירוק מעוצב המציג סכום חיסכון כולל, אחוז חיסכון וכמות מוצרים, עם כפתור "⟨ דו\"ח השוואה".
* **סינון מוצרים מהיר:** סרגל כפתורים מחולק (`[ הכל ]` / `🕒 הוזמן בעבר` / `⭐ קבועים`) וכפתור בולט "🛒+ הוסף את כל הקבועים לסל".
* **אזור כלים ושימוש (רשת 2x2):**
  - השוואת רשימה (ירוק)
  - הדפסת רשימה (כחול)
  - מדריך וטיפים (צהוב)
  - ייבוא היסטוריה (סגול)
* **הסרת הכיתוב "מיקום צף":** הוסר לחלוטין מטקסט הסטטוס.
* **תחתית הגדרות מתקפלת:** כוללת גישה להיסטוריית קניות מפורטת, הגדרות והתראות, חיווי סטטוס מכירה וקישור ללב טוב דיגיטל.

### 3. משיכת תמונות מוצרים בהדפסה (DOM Image Harvesting)
* פונקציית `harvestPageImages()` סורקת אוטומטית את כל תמונות המוצרים הקיימות ב-DOM של דף ההזמנה/קטלוג ושומרת אותן ב-`productImages`.
* מנגנון חיפוש תמונה רב-שכבתי (`findImageForProduct`) הכולל התאמה מטושטשת (Fuzzy) לשמות מוצרים עם סיומות (כגון `{לנדא}`).
* הוספת תגיות `<base href="${location.origin}/">` ו-`<meta name="referrer" content="no-referrer">` בראש חלון ההדפסה למניעת שבירת נתיבים יחסיים.

### 4. תיקון חישוב ותצוגת השוואת מחירים (Negative Savings & Bread Mapping)
* כאשר מוצר יקר יותר במשנת יוסף מהרשתות, מוצג בטבלה `-₪X.XX` באדום בליווי כיתוב ברור `(יקר ב-YY%)` במקום `0.00`.
* ההפרש מופחת מסך החיסכון הכולל, והטבלה תואמת לסכום העליון.
* הופרד מוצר העוגן של לחם פרוס: נוסף `bread_wholewheat` (לחם 100% חיטה מלאה פרוס - 12.90 ₪) כך שלחם חיטה מלאה דגנית עין בר אינו מושווה ללחם אחיד כהה מפוקח (7.91 ₪).

---

# מערך אוטומציה ו-CDN חי ב-GitHub (mishnat-yosef-prices)

הוקם מאגר GitHub ייעודי המנהל את מחירי השוק ועדכונם היומי באמצעות GitHub Actions:

* **מאגר הקוד:** [https://github.com/Lev-Good/mishnat-yosef-prices](https://github.com/Lev-Good/mishnat-yosef-prices)
* **כתובת ה-CDN החי:** [https://raw.githubusercontent.com/Lev-Good/mishnat-yosef-prices/main/prices.json](https://raw.githubusercontent.com/Lev-Good/mishnat-yosef-prices/main/prices.json)
* **אוטומציה יומית (`.github/workflows/daily_update.yml`):**
  - תזמון Cron: בכל יום בשעה 04:00 UTC (06:00/07:00 שעון ישראל).
  - מריץ את `update_prices.py`: מאמת ומעדכן מוצרים בפיקוח ממשלתי, מחשב ממוצעי רשתות שיווק (אושר עד, רמי לוי, יש חסד), ודוחף את הנתונים חזרה למאגר.
  - נבדק והופעל בהצלחה מלאה.
* **עדכון התוסף:** `core.js` פונה תחילה לכתובת ה-Raw ב-GitHub, עם fallback לאתר `digital.levtov.uk`, ומאגר מובנה אופליין.

---

# שילוב מפתח ענן והתחברות מאובטחת ל-API של משנת יוסף

* **כספת סודות מוצפנת ב-GitHub:** הוגדרו הסודות `MISHNAT_EMAIL` ו-`MISHNAT_PASSWORD` ב-GitHub Actions Secrets של המאגר `Lev-Good/mishnat-yosef-prices`.
* **אימות אוטונומי בענן:** הסקריפט `update_prices.py` מתחבר ל-`https://v2.mishnatyosef.org/api/login`, מקבל טוקן אימות (Bearer Token), סורק מכירות פתוחות ומסנכרן את המוצרים ומחירי השוק.
* **פתרון שורש לטעינת תמונות מוצרים (100% דיוק):**
  - אותר דומיין האחסון הרשמי של משנת יוסף לתמונות מוצרים: `https://images.mishnatyosef.org/images/items/`.
  - שדות התמונה הרשמיים (`thumb_featured_image`, `featured_image`) מחוברים ישירות לנתיב זה ב-`lineFrom`, מה שמבטיח טעינה מלאה של תמונות כל המוצרים בהדפסה ובהיסטוריה.


---

# עדכוני UX ואוטומציה רציפה (גרסה 0.3.1)

1. **לוח זמנים רציף לסריקה בענן (4 פעמים ביממה):**
   - הוגדר ב-GitHub Actions (`daily_update.yml`) לרוץ 4 פעמים ביום: 05:00 UTC (בוקר), 11:00 UTC (צהריים), 18:30 UTC (ערב), 22:30 UTC (לילה).
   - תופס אוטומטית פתיחת מכירות בכל תחנות החלוקה בארץ (ימי שלישי, רביעי וחמישי), ללא תלות ביום החלוקה הספציפי.

2. **גרירה חופשית של כפתור הסל הצף (Draggable Widget):**
   - כפתור הסל הצף ניתן כעת לגרירה חופשית בכל מקום על המסך (עכבר ומגע).
   - המיקום נשמר אוטומטית ב-localStorage (`myfam_panel_pos`).
   - סמן העכבר מציג `grab` ו-`grabbing` בזמן גרירה.
   - לחיצה על מקש `Escape` סוגרת מיד את המגירה.

3. **חיווי התקדמות מונפש על כפתור "הוסף את כל הקבועים לסל":**
   - מציג התקדמות חיה בזמן אמת: `מוסיף X מתוך Y... ⏳`.
   - בסיום: הכפתור הופך לירוק זוהר עם סימון וי: `נוספו Y מוצרים לסל! ✓`.
   - הצגת טוסט הצלחה אלגנטי ללא חסימת הדפדפן.

4. **תגית חיסכון נקודתית מינימליסטית (Micro-Savings Pill):**
   - תגית קומפקטית ועדינה לצד המחיר: `⚡ חסכון ₪X.X`.
   - הפרשים זניחים מתחת ל-50 אגורות אינם מוצגים כלל, כדי למנוע עומס ויזואלי.
   - ריחוף עכבר מציג פירוט מלא של המחיר הממוצע ברשתות השיווק.


---

# חבילת הפצה רשמית - גרסה 0.4 (Chrome Web Store Ready)

* **תאריך אריזה:** 10/11/2026
* **גרסה מוכנה להעלאה:** `0.4`
* **קובץ ה-ZIP המוכן להעלאה:**
  - `c:\Users\משתמש\Downloads\תוסף משנת יוסף\mishnat-yosef-v0.4.zip` (מומלץ ללוח המפתחים של גוגל)
  - `c:\Users\משתמש\Downloads\תוסף משנת יוסף\מוסיף למשנת - גרסה 0.4.zip`
* **קבצים שנכללו בארכיב:**
  - `manifest.json` (V3, גרסה 0.4, כולל הרשאות host ל-GitHub ול-jsDelivr)
  - `core.js` (כולל גרירה חופשית, חיווי הוספה מהירה, תגית חיסכון מינימליסטית, 96 מוצרי בסיס)
  - `background.js` (שירות רקע והתראות)
  - `inject.js` (הזרקה לעולם הראשי ליירוט נתוני הזמנה ומכירות)
  - `transport.js` (גשר תקשורת בין עולמות התוכן)
  - `feedback.html` (עמוד משוב ודיווח עצמאי של לב טוב דיגיטל)
  - `icon128.png` (אייקון רשמי באיכות גבוהה)
* **בדיקות תקינות:**
  - 25 מתוך 25 בדיקות תקינות עברו בהצלחה (`audit_extension.py`).
  - אפס שימוש ב-`eval()` או `new Function()`.
  - תאימות מלאה ל-CSP של Manifest V3.
