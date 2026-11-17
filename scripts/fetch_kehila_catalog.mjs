/**
 * scripts/fetch_kehila_catalog.mjs
 *
 * שואב באופן אוטונומי את מוצרי ומחירי "המכירה לקהילה" (sales.org.il)
 * תוך שימוש ב-GitHub Secrets (KEHILA_EMAIL, KEHILA_PASSWORD).
 */

import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://sales.org.il';
const OUTPUT_FILE = path.resolve('scripts', 'kehila_live_catalog.json');

const email = process.env.KEHILA_EMAIL;
const password = process.env.KEHILA_PASSWORD;

function decodeHtmlEntities(str) {
  return String(str || '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function loginKehila(userEmail, userPassword) {
  if (!userEmail || !userPassword) {
    console.log('ℹ️ KEHILA_EMAIL או KEHILA_PASSWORD אינם מוגדרים בסביבה – מדלג על המכירה לקהילה.');
    return null;
  }

  console.log(`🔑 מתחבר לאתר "המכירה לקהילה" כמשתמש: ${userEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3')}...`);
  try {
    const body = new URLSearchParams({ email: userEmail, pass: userPassword });
    const res = await fetch(`${BASE_URL}/login.aspx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'text/html,application/xhtml+xml',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: body.toString(),
      redirect: 'manual',
      signal: AbortSignal.timeout(15000)
    });

    const rawCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    const cookieHeader = rawCookies.map(c => c.split(';')[0]).filter(Boolean).join('; ');
    if (!cookieHeader || (res.status !== 302 && res.status !== 200)) {
      console.error(`❌ התחברות למכירה לקהילה נכשלה (סטטוס: ${res.status}).`);
      return null;
    }

    console.log('✅ התחברות לאתר "המכירה לקהילה" הצליחה!');
    return cookieHeader;
  } catch (err) {
    console.error('❌ שגיאה בהתחברות למכירה לקהילה:', err.message);
    return null;
  }
}

function parseKehilaProducts(html) {
  const items = [];
  const seen = new Set();

  // חיפוש שורות טבלה המכילות שדה כמות (inputqty) או מחיר (ש"ח / ₪)
  const trMatches = html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi);
  for (const m of trMatches) {
    const rowHtml = m[1];
    // דילוג על כותרות או סיכום הזמנה
    if (/<th\b/i.test(rowHtml) || /סך הכל לתשלום/i.test(rowHtml)) continue;
    if (!/inputqty/i.test(rowHtml) && !/(?:₪|ש["״']?ח)/i.test(rowHtml)) continue;

    // חילוץ תאים
    const cells = [...rowHtml.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(c =>
      decodeHtmlEntities(c[1].replace(/<[^>]+>/g, ' '))
    ).filter(Boolean);

    if (cells.length < 2) continue;

    let price = 0;
    let name = '';

    for (const cell of cells) {
      const pm = cell.match(/(\d+(?:\.\d{1,2})?)\s*(?:₪|ש["״']?ח)|(?:₪|ש["״']?ח)\s*(\d+(?:\.\d{1,2})?)/i);
      if (pm && !price) {
        const parsed = parseFloat(pm[1] || pm[2]);
        if (parsed > 0 && parsed < 2000) price = parsed;
      } else if (!/^\d+(?:\.\d+)?$/.test(cell) && cell.length >= 2 && /[א-תa-zA-Z]/.test(cell)) {
        if (cell.length > name.length && !/^(?:כמות|מחיר|סה["״']כ|פרטים|יבואן|ארץ מקור)$/i.test(cell)) {
          name = cell;
        }
      }
    }

    if (name && price > 0 && !seen.has(name)) {
      seen.add(name);
      items.push({ name, price });
    }
  }

  return items;
}

async function main() {
  const cookieHeader = await loginKehila(email, password);
  if (!cookieHeader) return;

  try {
    const res = await fetch(`${BASE_URL}/sale.aspx`, {
      headers: {
        'Cookie': cookieHeader,
        'Accept': 'text/html,application/xhtml+xml',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!res.ok) {
      console.warn(`⚠️ שגיאה בטעינת sale.aspx (${res.status})`);
      return;
    }

    const html = await res.text();
    if (/הזמנות עבור מכירה נוכחית סגורה כעת/i.test(html)) {
      console.log('ℹ️ המכירה לקהילה סגורה כעת להזמנות — שומר על הקטלוג הקיים (אם יש).');
      return;
    }

    const items = parseKehilaProducts(html);
    console.log(`🎉 נשלפו ${items.length} מוצרים מאתר "המכירה לקהילה"!`);

    if (items.length > 0) {
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify({
        updatedAt: new Date().toISOString(),
        source: 'sales.org.il',
        items
      }, null, 2), 'utf8');
      console.log(`💾 קטלוג המכירה לקהילה נשמר: ${OUTPUT_FILE}`);
    } else {
      console.warn('⚠️ המכירה נראית פתוחה אך לא זוהו פריטים במבנה הטבלה הצפוי.');
    }
  } catch (err) {
    console.error('❌ שגיאה בשאיבת המכירה לקהילה:', err.message);
  }
}

main();
