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

/**
 * בודק האם יש כרגע טאב פעיל שבו המשתמש גולש באתר משנת יוסף.
 * אם המשתמש כבר נמצא באתר, אין צורך להקפיץ לו התראה חיצונית של הדפדפן.
 */
async function isUserCurrentlyActiveOnSite() {
  try {
    // 1. נבדוק את הטאב הפעיל כרגע בחלון האחרון
    const activeTabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (activeTabs && activeTabs.length > 0) {
      const url = activeTabs[0].url || '';
      if (/mishnatyosef\.org/i.test(url)) {
        return true;
      }
    }
    // 2. נבדוק האם יש טאב כלשהו שנמצא באזור בחירת המוצרים/הזמנה
    const allSiteTabs = await chrome.tabs.query({ url: '*://*.mishnatyosef.org/*' });
    if (allSiteTabs && allSiteTabs.some(t => t.active)) {
      return true;
    }
  } catch (e) {
    // אם חסרה הרשאה או שגיאה כללית, לא נחסום את ההתראה
  }
  return false;
}

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

    // אם המשתמש כבר נמצא כרגע בתוך האתר ומבצע קניות, לא נקפיץ התראת דפדפן חיצונית
    const userIsOnSite = await isUserCurrentlyActiveOnSite();
    if (userIsOnSite) {
      return;
    }

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

      // א. התראה בעת פתיחת המכירה (כשאינך באתר)
      if (ns.onStart && beginTime) {
        const startKey = `start_${sid}`;
        // אם המכירה נפתחה ב-16 השעות האחרונות ועדיין לא הודענו
        if (now >= beginTime && now <= beginTime + 16 * 3600 * 1000 && !sent[startKey]) {
          sent[startKey] = now;
          showNotification(startKey, 'המכירה נפתחה להזמנות! 🛒', `מכירת ${week} פתוחה כעת להזמנת מוצרים באתר משנת יוסף. לחצו לבחירת המוצרים.`);
        }
      }

      // ב. התראה ביום האחרון להזמנה (כשאינך באתר)
      if (ns.onLastDay && closeTime) {
        const lastDayKey = `lastday_${sid}`;
        const diffHours = (closeTime - now) / (1000 * 3600);
        // אם נותרו פחות מ-26 שעות ועדיין מעל הזמן של ההתראה הדחופה
        if (diffHours > ns.hoursBefore && diffHours <= 26 && !sent[lastDayKey]) {
          sent[lastDayKey] = now;
          showNotification(lastDayKey, 'תזכורת: יום אחרון להזמנה! ⏰', `מכירת ${week} תיסגר בקרוב להזמנות. לחצו עכשיו כדי לא לפספס.`);
        }
      }

      // ג. התראה דחופה לפני סגירת ההזמנות (כשאינך באתר)
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
    const headers = { 'Accept': 'application/json' };
    if (o.body) {
      headers['Content-Type'] = 'application/json';
    }
    const auth = o.headers?.['Authorization'] || o.headers?.['authorization'] || o.auth;
    if (auth) headers['Authorization'] = auth;
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
        // המטא עודכן מתוך הדף הפעיל – אין צורך להקפיץ התראה כעת כי המשתמש כבר באתר
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
