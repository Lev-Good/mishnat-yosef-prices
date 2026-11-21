/**
 * scripts/fetch_mishnat_catalog.mjs
 * 
 * שולף באופן אוטונומי את כל מוצרי המכירה הפתוחה של משנת יוסף
 * תוך שימוש בסודות השמורים ב-GitHub Secrets (MISHNAT_EMAIL, MISHNAT_PASSWORD).
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const API_BASE = 'https://v2.mishnatyosef.org/api';
const OUTPUT_FILE = path.resolve('scripts', 'mishnat_live_catalog.json');
const STATE_FILE = path.resolve('scripts', 'catalog_state.json');

const email = process.env.MISHNAT_EMAIL;
const password = process.env.MISHNAT_PASSWORD;

async function login(email, password) {
  if (!email || !password) {
    console.warn('⚠️ MISHNAT_EMAIL או MISHNAT_PASSWORD אינם מוגדרים בסביבה.');
    return null;
  }

  console.log(`🔑 מתחבר לאתר משנת יוסף כמשתמש: ${email.replace(/(.{2})(.*)(@.*)/, '$1***$3')}...`);
  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify({ email, username: email, password }),
      signal: AbortSignal.timeout(15000)
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error(`❌ התחברות נכשלה (סטטוס: ${res.status} ${res.statusText}): ${errText.slice(0, 300)}`);
      return null;
    }

    const data = await res.json();
    const token = data.access_token || data.token || (data.data && data.data.token);
    if (!token) {
      console.error('❌ לא התקבל access_token מתשובת ההתחברות:', JSON.stringify(data).slice(0, 200));
      return null;
    }

    console.log('✅ התחברות הצליחה! התקבל Token מאובטח.');
    return token;
  } catch (err) {
    console.error('❌ שגיאה במהלך התחברות למשנת יוסף:', err.message);
    return null;
  }
}

async function fetchOpenSales(token) {
  try {
    const res = await fetch(`${API_BASE}/profile/open_sales`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(12000)
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
  } catch (err) {
    console.warn('⚠️ שגיאה בשליפת מכירות פתוחות:', err.message);
    return [];
  }
}

async function fetchLatestOrders(token) {
  try {
    const res = await fetch(`${API_BASE}/orders?page=1`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(12000)
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
  } catch (err) {
    console.warn('⚠️ שגיאה בשליפת הזמנות אחרונות:', err.message);
    return [];
  }
}

async function fetchSaleItems(token, targetId) {
  const allItems = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= 10) {
    try {
      console.log(`📦 שולף מוצרים עמוד ${page}...`);
      const url = `${API_BASE}/get_items_for_sale/${targetId}/null?page=${page}&limit=500`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: AbortSignal.timeout(15000)
      });

      if (!res.ok) {
        console.warn(`⚠️ שגיאה בעמוד ${page}: ${res.status}`);
        break;
      }

      const json = await res.json();
      const rows = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
      if (!rows.length) break;

      allItems.push(...rows);

      if (json.pagination && json.pagination.total_pages) {
        totalPages = parseInt(json.pagination.total_pages, 10);
      } else {
        totalPages = 1;
      }
      page++;
    } catch (err) {
      console.warn(`⚠️ שגיאה בשליפת עמוד ${page}:`, err.message);
      break;
    }
  }

  return allItems;
}

function setGithubOutput(key, value) {
  const outPath = process.env.GITHUB_OUTPUT;
  if (outPath) {
    try {
      fs.appendFileSync(outPath, `${key}=${value}\n`, 'utf8');
    } catch (err) {
      console.warn(`⚠️ לא ניתן לכתוב ל-GITHUB_OUTPUT (${key}):`, err.message);
    }
  }
}

const UNIT_HINT_RE = /\d+(?:\.\d+)?(?:\s*[-–*xX×]\s*\d+(?:\.\d+)?)?\s*(?:ק["'״׳]?ג|קג|קילו|גרם|גר['"״׳]?|ג['"״׳]?|מ["'״׳]?ל|מל|ליטר|ל['"״׳]?|יח['"״׳]?|יחידות|גלילים|שקיקים|kg|gr|g|ml|l\b)/i;

function computeCatalogHash(catalog) {
  const normalized = [...catalog]
    .sort((a, b) => Number(a.id) - Number(b.id))
    .map(it => `${it.id}|${it.name}|${it.price}|${it.unitText || ''}`)
    .join('\n');
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
}

function formatIsraelTime(date = new Date()) {
  try {
    return new Intl.DateTimeFormat('he-IL', {
      timeZone: 'Asia/Jerusalem',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

async function main() {
  const token = await login(email, password);
  if (!token) {
    console.log('ℹ️ דילוג על שאיבת קטלוג משנת יוסף (אין גישה פעילה).');
    setGithubOutput('catalog_changed', 'false');
    return;
  }

  const sales = await fetchOpenSales(token);
  console.log(`ℹ️ נמצאו ${sales.length} מכירות פתוחות.`);

  const orders = await fetchLatestOrders(token);
  console.log(`ℹ️ נמצאו ${orders.length} הזמנות בחשבון.`);

  // תעדוף מכירה פתוחה עדכנית על פני הזמנה קודמת, עם גיבוי להזמנה האחרונה אם נדרש
  const candidateTargets = [];
  if (sales.length > 0) {
    const sortedSales = [...sales].sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
    for (const s of sortedSales) {
      if (s.id) candidateTargets.push({ id: s.id, type: 'sale', name: s.name || s.week || '' });
    }
  }
  if (orders.length > 0 && orders[0].id) {
    candidateTargets.push({ id: orders[0].id, type: 'order', name: orders[0].sale?.name || '' });
  }

  if (candidateTargets.length === 0) {
    console.warn('⚠️ לא נמצא מזהה מכירה/הזמנה לשליפת קטלוג.');
    setGithubOutput('catalog_changed', 'false');
    return;
  }

  let rawItems = [];
  let usedTarget = null;
  for (const target of candidateTargets) {
    console.log(`🎯 מנסה לשלוף קטלוג מ-${target.type} #${target.id}${target.name ? ` (${target.name})` : ''}...`);
    rawItems = await fetchSaleItems(token, target.id);
    if (rawItems.length > 0) {
      usedTarget = target;
      break;
    }
  }

  console.log(`🎉 נשלפו ${rawItems.length} מוצרים ממשנת יוסף!`);

  if (rawItems.length === 0) {
    console.warn('⚠️ לא התקבלו מוצרים מהקטלוג.');
    setGithubOutput('catalog_changed', 'false');
    return;
  }

  const cleanCatalog = rawItems.map(r => {
    const name = r.name || (r.product && r.product.name);
    const pid = r.itemID != null ? r.itemID : (r.product && r.product.id);
    const price = parseFloat(r.price ?? (r.item_sale && r.item_sale.price) ?? r.cost ?? 0) || 0;
    const rawUnit = [
      r.unit, r.unit_name, r.weight, r.package_weight, r.sub_title, r.subtitle, r.description,
      r.product?.unit, r.product?.unit_name, r.product?.weight, r.product?.description
    ].filter(v => typeof v === 'string' && v.trim()).join(' ');
    const unitMatch = rawUnit.match(UNIT_HINT_RE);
    const unitText = unitMatch ? unitMatch[0].trim() : '';
    const desc = (r.description || r.sub_title || r.subtitle || r.product?.description || '').toString().replace(/\s+/g, ' ').trim().slice(0, 140);
    return {
      id: pid,
      name,
      unitText,
      description: desc,
      price,
      category: r.category_name || r.category || (r.product && r.product.category_name) || '',
      subCategory: r.sub_category_name || (r.product && r.product.sub_category_name) || '',
      itemSalesId: r.id != null ? r.id : r.item_salesID
    };
  }).filter(it => it.name && it.id);

  const currentHash = computeCatalogHash(cleanCatalog);
  let prevState = {};
  if (fs.existsSync(STATE_FILE)) {
    try {
      prevState = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    } catch {
      prevState = {};
    }
  }

  const isChanged = prevState.lastHash !== currentHash;
  const now = new Date();
  const israelTime = formatIsraelTime(now);

  if (!isChanged) {
    console.log(`⏸️ הקטלוג לא השתנה מאז העדכון האחרון (${prevState.lastUpdatedIsraelTime || 'לא ידוע'}, Hash: ${currentHash.slice(0, 10)}). מדלג על סריקת AI.`);
    setGithubOutput('catalog_changed', 'false');
    return;
  }

  console.log(`🆕 זוהה שינוי בקטלוג משנת יוסף! (שעה בישראל: ${israelTime}, פריטים: ${cleanCatalog.length})`);
  setGithubOutput('catalog_changed', 'true');

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cleanCatalog, null, 2), 'utf8');
  console.log(`💾 קטלוג משנת יוסף נשמר בהצלחה: ${OUTPUT_FILE} (${cleanCatalog.length} פריטים)`);

  const history = Array.isArray(prevState.history) ? prevState.history : [];
  history.unshift({
    targetId: usedTarget?.id || null,
    targetType: usedTarget?.type || null,
    saleName: usedTarget?.name || '',
    detectedAt: now.toISOString(),
    israelTime,
    itemCount: cleanCatalog.length,
    hash: currentHash.slice(0, 12)
  });

  const nextState = {
    lastTargetId: usedTarget?.id || null,
    lastSaleName: usedTarget?.name || '',
    lastHash: currentHash,
    lastUpdatedAt: now.toISOString(),
    lastUpdatedIsraelTime: israelTime,
    itemCount: cleanCatalog.length,
    history: history.slice(0, 20)
  };
  fs.writeFileSync(STATE_FILE, JSON.stringify(nextState, null, 2), 'utf8');
  console.log(`🕒 תועדה שעת גילוי העדכון ב-${STATE_FILE}`);
}

main().catch(err => {
  console.error('❌ שגיאה כללית בריצת שאיבת הקטלוג:', err);
  setGithubOutput('catalog_changed', 'false');
});
