/* מוסיף למשנת - שירות רקע, תפריט הקשר והתראות דפדפן */

const ACTION_MENU_ID = 'myfam_action_menu';

async function syncActionContextMenu() {
  try {
    if (!chrome.contextMenus) return;
    const siteTabs = await chrome.tabs.query({ url: '*://*.mishnatyosef.org/*' });
    const hasOpenSite = Array.isArray(siteTabs) && siteTabs.length > 0;
    const title = hasOpenSite
      ? '🛒 פתח את תפריט התוסף במשנת יוסף'
      : '🌐 פתח את אתר משנת יוסף';
    chrome.contextMenus.update(ACTION_MENU_ID, { title }, () => {
      if (chrome.runtime.lastError) {
        chrome.contextMenus.create({
          id: ACTION_MENU_ID,
          title,
          contexts: ['action']
        }, () => { void chrome.runtime.lastError; });
      }
    });
  } catch (_) {}
}

async function openSiteOrExtensionMenu() {
  try {
    const siteTabs = await chrome.tabs.query({ url: '*://*.mishnatyosef.org/*' });
    if (Array.isArray(siteTabs) && siteTabs.length > 0) {
      const target = siteTabs.find(t => t.active) || siteTabs[0];
      await chrome.tabs.update(target.id, { active: true });
      if (target.windowId != null) {
        await chrome.windows.update(target.windowId, { focused: true }).catch(() => {});
      }
      chrome.tabs.sendMessage(target.id, { type: 'openExtensionMenu' }, () => {
        void chrome.runtime.lastError;
      });
    } else {
      await chrome.tabs.create({ url: 'https://mishnatyosef.org/sales-board' });
    }
  } catch (_) {
    chrome.tabs.create({ url: 'https://mishnatyosef.org/sales-board' });
  }
}

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

chrome.runtime.onInstalled.addListener(details => {
  chrome.alarms.create('check_sales_periodic', { periodInMinutes: 30 });
  syncActionContextMenu();

  if (details && details.reason === 'update' && details.previousVersion) {
    if (isUpgradeFrom065(details.previousVersion)) {
      chrome.storage.local.set({
        myfam_show_whatsnew_modal: true,
        myfam_upgraded_from: details.previousVersion,
        myfam_upgraded_to: chrome.runtime.getManifest().version
      });
    }
  } else if (details && details.reason === 'install') {
    chrome.storage.local.set({
      myfam_show_whatsnew_modal: false,
      myfam_whatsnew_dismissed: true
    });
  }
});

chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create('check_sales_periodic', { periodInMinutes: 30 });
  syncActionContextMenu();
});

if (chrome.contextMenus) {
  chrome.contextMenus.onClicked.addListener(info => {
    if (info.menuItemId === ACTION_MENU_ID) {
      openSiteOrExtensionMenu();
    }
  });
}

if (chrome.action) {
  chrome.action.onClicked.addListener(() => {
    openSiteOrExtensionMenu();
  });
}

if (chrome.tabs) {
  chrome.tabs.onCreated.addListener(() => syncActionContextMenu());
  chrome.tabs.onRemoved.addListener(() => setTimeout(syncActionContextMenu, 150));
  chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
    if (changeInfo.url || changeInfo.status === 'complete') {
      syncActionContextMenu();
    }
  });
}

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
      let resp = null;
      try {
        resp = await fetch('https://mishnatyosef.org/api/profile/open_sales', {
          credentials: 'include',
          headers: { 'Accept': 'application/json' }
        });
      } catch (_) {
        resp = await fetch('https://v2.mishnatyosef.org/api/profile/open_sales', {
          credentials: 'include',
          headers: { 'Accept': 'application/json' }
        });
      }
      if (resp && resp.ok) {
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
      priority: 2,
      silent: false
    });
  } catch (e) {
    console.warn('[myfam notification error]', e);
  }
}

chrome.runtime.onMessage.addListener((m, s, send) => {
  const safeSend = data => {
    try { send(data); } catch (_) {}
  };

  if (m.type === 'req') {
    const o = m.o || {};
    const headers = Object.assign({
      'Accept': 'application/json, text/plain, */*',
      'X-Requested-With': 'XMLHttpRequest'
    }, o.headers || {});
    if (o.body && !headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/json';
    }
    const auth = o.headers?.['Authorization'] || o.headers?.['authorization'] || o.auth;
    if (auth && !headers['Authorization'] && !headers['authorization']) {
      headers['Authorization'] = auth;
    }
    try {
      fetch(o.url, {
        method: o.method || 'GET',
        body: o.body,
        headers: headers,
        credentials: 'include'
      }).then(async r => {
        const ct = r.headers.get('content-type') || '';
        if (r.status === 401) {
          safeSend({ error: 'unauthorized', status: 401 });
          return;
        }
        if (ct.includes('json')) {
          const data = await r.json();
          if (r.ok) {
            safeSend({ data, status: r.status });
          } else {
            safeSend({ error: data.message || `HTTP ${r.status}`, status: r.status, data });
          }
        } else {
          const text = await r.text();
          if (r.ok) {
            try {
              safeSend({ data: JSON.parse(text), status: r.status });
            } catch (e) {
              safeSend({ error: 'HTML received (' + r.status + ')', status: r.status, text: text.slice(0, 200) });
            }
          } else {
            safeSend({ error: `HTTP ${r.status}`, status: r.status, text: text.slice(0, 200) });
          }
        }
      }).catch(e => {
        safeSend({ error: String(e.message || e) });
      });
    } catch (fetchErr) {
      safeSend({ error: String(fetchErr.message || fetchErr) });
    }
    return true;
  }

  if (m.type === 'getCookies') {
    try {
      chrome.cookies.getAll({ domain: 'mishnatyosef.org' }, cookies => {
        safeSend({ cookies: cookies || [] });
      });
    } catch (e) {
      safeSend({ error: String(e) });
    }
    return true;
  }

  if (m.type === 'openFeedback') {
    chrome.tabs.create({ url: chrome.runtime.getURL('feedback.html') });
    safeSend({ ok: true });
    return true;
  }

  if (m.type === 'updateSalesMeta') {
    if (Array.isArray(m.sales) && m.sales.length) {
      chrome.storage.local.set({ last_known_sales: m.sales }, () => {
        // המטא עודכן מתוך הדף הפעיל – אין צורך להקפיץ התראה כעת כי המשתמש כבר באתר
        safeSend({ ok: true });
      });
      return true;
    }
    safeSend({ ok: false });
    return false;
  }

  if (m.type === 'testNotification') {
    showNotification('test_' + Date.now(), 'התראת בדיקה - מוסיף למשנת 🔔', 'ההתראות פועלות כשורה! תקבלו תזכורות בזמן על פתיחת וסגירת מכירות.');
    safeSend({ ok: true });
    return true;
  }
});
