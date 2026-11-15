/**
 * scripts/update_prices.mjs
 *
 * Pipeline אוטונומי לרענון מחירי סופרמרקטים עבור "מוסיף למשנת".
 * שולף נתונים מ-chp.co.il (ירושלים + בני ברק) כולל פענוח מלא של הגנת הערפול,
 * מתאם מוצרים וגדלים באמצעות Gemini API, ומעדכן את prices.json.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { parseProductUnits, areUnitsCompatible, findMarketComparison } from './parse_units.mjs';

const PRICES_FILE = path.resolve('prices.json');
const MAPPING_FILE = path.resolve('scripts', 'mapping_cache.json');

// קריאת ארגומנטים משורת הפקודה
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const limitIndex = args.indexOf('--limit');
const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : Infinity;
const batchSizeIndex = args.indexOf('--batch-size');
const BATCH_SIZE = batchSizeIndex !== -1 ? parseInt(args[batchSizeIndex + 1], 10) : 10;
const candidateLimitIndex = args.indexOf('--candidate-limit');
const MAX_CANDIDATES = candidateLimitIndex !== -1 ? parseInt(args[candidateLimitIndex + 1], 10) : Infinity;
const targetIdIndex = args.indexOf('--id');
const targetId = targetIdIndex !== -1 ? args[targetIdIndex + 1] : null;

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
let ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemma-4-31b-it',
  'gemma-4-26b-a4b-it'
];
let activeModel = CANDIDATE_MODELS[0];

const TARGET_CITIES = ['ירושלים', 'בני ברק'];
const ALLOWED_CHAINS = ['osherAd', 'ramiLevy', 'yeshHesed', 'netoChisachon'];
const CHP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
let chpCookie = '';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isProduceItem(name, mappingEntry) {
  if (mappingEntry && typeof mappingEntry.isProduce === 'boolean') {
    return mappingEntry.isProduce;
  }
  return /(?:בצל|תפוחי?\s*אדמה|תפוח\s*אדמה|עגבני[הו]|מלפפון|גזר|פלפל|חסה|כרוב|בטטה|שום|קישוא|חציל|דלורית|אפרסמון|קלמנטינה|תפוז|אגס|בננ|לימון|אבוקדו|סלק|קולרבי|פטרוזיליה|כוסברה|שמיר|סלרי)/i.test(name || '');
}

/**
 * מבצע קריאת HTTP ל-chp.co.il עם ניהול עוגייה (Session) וניסיון חוזר במקרה של ניתוק חיבור.
 */
async function chpFetch(url, isAjax = false) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const headers = {
        'User-Agent': CHP_UA,
        'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8',
        'Referer': 'https://chp.co.il/',
        'Accept': isAjax ? 'application/json, text/javascript, */*; q=0.01' : 'text/html,application/xhtml+xml'
      };
      if (isAjax) headers['X-Requested-With'] = 'XMLHttpRequest';
      if (chpCookie) headers['Cookie'] = chpCookie;

      const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
      const setCookie = res.headers.get('set-cookie');
      if (setCookie) {
        const m = setCookie.match(/us=[^;]+/);
        if (m) chpCookie = m[0];
      }
      if (!res.ok) return null;
      return await res.text();
    } catch (_) {
      if (attempt === 0) await sleep(400);
    }
  }
  return null;
}

async function ensureChpSession() {
  if (!chpCookie) {
    await chpFetch('https://chp.co.il/');
  }
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

/**
 * מפענח את טבלת התוצאות של chp.co.il כולל עקיפת הגנת ערפול CSS (display:none, תווים שקופים, HTML entities).
 */
export function parseChpResultsHtml(html) {
  if (!html) return { found: false, rows: [], productTitle: '' };

  const styleBlocks = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]).join('\n');
  const rules = [];
  const ruleRe = /([^{}]+)\{([^}]+)\}/g;
  let m;
  while ((m = ruleRe.exec(styleBlocks)) !== null) {
    const selFull = m[1].trim();
    const sel = selFull.split(/[\s>+~]+/).pop() || selFull;
    const displayMatch = m[2].toLowerCase().match(/display\s*:\s*(none|inline|block)/);
    if (!displayMatch) continue;
    const tagM = sel.match(/^([a-z]+)/i);
    const idM = sel.match(/#([a-z0-9_-]+)/i);
    const attrM = sel.match(/\[(data-[a-z0-9_-]+)=["']([^"']+)["']\]/i);
    if (!tagM && !idM && !attrM) continue;

    rules.push({
      tag: tagM ? tagM[1].toLowerCase() : null,
      id: idM ? idM[1] : null,
      attrKey: attrM ? attrM[1].toLowerCase() : null,
      attrVal: attrM ? attrM[2] : null,
      spec: (idM ? 100 : 0) + (attrM ? 10 : 0) + (tagM ? 1 : 0),
      isHidden: displayMatch[1] === 'none'
    });
  }

  const resultsIdx = html.indexOf('id="results-table"');
  if (resultsIdx === -1) {
    return { found: false, rows: [], productTitle: '' };
  }

  // חילוץ כותרת המוצר שהאתר החזיר לפני הטבלה
  const headerSlice = html.slice(Math.max(0, resultsIdx - 1200), resultsIdx);
  const altMatch = headerSlice.match(/alt="השוואת מחירים בסופרמרקטים של ([^"]+)"/);
  const productTitle = altMatch ? decodeHtmlEntities(altMatch[1]).trim() : '';

  const tableStart = html.lastIndexOf('<table', resultsIdx);
  const tableEnd = html.indexOf('</table>', resultsIdx);
  const tableHtml = html.slice(tableStart, tableEnd !== -1 ? tableEnd + 8 : resultsIdx + 300000);

  const rows = [];
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let trM;
  while ((trM = trRe.exec(tableHtml)) !== null) {
    const openTag = trM[0].split('>')[0];
    if (/display_when_narrow/i.test(openTag) || trM[0].includes('<th>')) continue;

    const tds = [...trM[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(td => {
      const inner = td[1];
      if (!/<(span|div)\b/i.test(inner)) {
        return decodeHtmlEntities(inner.replace(/<[^>]+>/g, ''))
          .replace(/[\u200B-\u200D\uFEFF]/g, '')
          .trim();
      }
      let out = '';
      const elemRe = /<(span|div)([^>]*)>([\s\S]*?)<\/\1>/gi;
      let lastIdx = 0;
      let em;
      while ((em = elemRe.exec(inner)) !== null) {
        if (em.index > lastIdx) {
          out += decodeHtmlEntities(inner.slice(lastIdx, em.index).replace(/<[^>]+>/g, ''));
        }
        lastIdx = elemRe.lastIndex;
        const tag = em[1].toLowerCase();
        const attrsStr = em[2];
        const content = em[3];
        const idMatch = attrsStr.match(/\bid=["']([^"']+)["']/i);
        const elemId = idMatch ? idMatch[1] : null;
        const dataAttrs = [...attrsStr.matchAll(/\b(data-[a-z0-9_-]+)=["']([^"']+)["']/gi)]
          .map(a => [a[1].toLowerCase(), a[2]]);

        let hidden = /display\s*:\s*none/i.test(attrsStr);
        if (!hidden) {
          let bestSpec = -1;
          for (const r of rules) {
            if (r.tag && r.tag !== tag) continue;
            if (r.id && r.id !== elemId) continue;
            if (r.attrKey && !dataAttrs.some(([k, v]) => k === r.attrKey && v === r.attrVal)) continue;
            if (r.spec >= bestSpec) {
              bestSpec = r.spec;
              hidden = r.isHidden;
            }
          }
        }
        if (!hidden) {
          out += decodeHtmlEntities(content.replace(/<[^>]+>/g, ''));
        }
      }
      if (lastIdx < inner.length) {
        out += decodeHtmlEntities(inner.slice(lastIdx).replace(/<[^>]+>/g, ''));
      }
      return out.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
    });

    if (tds.length >= 5) {
      const priceNum = parseFloat((tds[4] || '').replace(/[^\d.]/g, ''));
      if (Number.isFinite(priceNum) && priceNum > 0) {
        rows.push({
          chain: tds[0].replace(/\s+/g, ' ').trim(),
          store: tds[1].replace(/\s+/g, ' ').trim(),
          promo: tds[3].replace(/\s+/g, ' ').trim(),
          price: priceNum
        });
      }
    }
  }
  return { found: rows.length > 0, rows, productTitle };
}

function mapChpChain(chainName) {
  if (!chainName) return null;
  if (/אושר\s*עד/.test(chainName)) return 'osherAd';
  if (/^רמי\s*לוי(?:\s+מהדרין)?(?:\s|$)/.test(chainName)) return 'ramiLevy';
  if (/^יש\s*חסד(?:\s|$)/.test(chainName)) return 'yeshHesed';
  if (/^נטו\s*חיסכון/.test(chainName)) return 'netoChisachon';
  return null;
}

function median(nums) {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * ניקוי שמות מוצרים ממשנת יוסף ובניית שאילתות מדורגות לחיפוש ב-chp.co.il.
 */
function cleanMishnatName(rawName, stripPrivateBrands = false) {
  let s = (rawName || '')
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\((?:כתום|חום|ירוק|צהוב|אדום|שחור|לבן|אריזת?\s*[^)]*|מומלץ!?|לאחר הפסח)\)/gi, ' ')
    .replace(/\bגר['"״׳]?/g, 'גרם')
    .replace(/\bקילו\b/g, 'ק"ג')
    .replace(/\bיח['"״׳]?\b/g, 'יחידות')
    .replace(/\b(?:מומלץ!?|אריזה מוגדלת|מארז מוגדל|מהדורה מוגבלת|בשקית|בקופסא)\b/gi, ' ');

  if (stripPrivateBrands) {
    s = s.replace(/\b(?:קייטי|מ\.מ\.|מ\.מ|הדר גאולה|אשבול|My\s*VILLAGE|באגסי|תירוש|ברמן|ריאו)\b/gi, ' ');
  }

  return s
    .replace(/[\/\-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildSearchQueries(item, isProduce) {
  const queries = [];
  const addQ = q => {
    const clean = (q || '').replace(/\s+/g, ' ').trim();
    if (clean.length >= 2 && !queries.includes(clean)) queries.push(clean);
  };

  const fullClean = cleanMishnatName(item.name, false);
  const genericClean = cleanMishnatName(item.name, true);

  if (isProduce) {
    const baseProd = genericClean.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
    const targetUnits = parseProductUnits(item.name);
    if (targetUnits.weightGrams >= 2000) {
      addQ(fullClean);
    }
    addQ(`${baseProd.split(' ').slice(0, 3).join(' ')} משקל`);
    addQ(baseProd);
  }

  addQ(fullClean);
  if (genericClean !== fullClean) addQ(genericClean);

  const words = genericClean.replace(/[()]/g, ' ').split(/\s+/).filter(w => w.length >= 2 || /\d/.test(w));
  if (words.length > 4) {
    addQ(words.slice(0, 4).join(' '));
  }
  if (words.length > 2) {
    addQ(words.slice(0, 2).join(' '));
  }

  for (const alias of (item.aliases || []).slice(0, 2)) {
    addQ(cleanMishnatName(alias, false));
  }

  return queries.slice(0, 4);
}

function extractBarcode(acItem) {
  const mfg = acItem?.parts?.manufacturer_and_barcode || '';
  const mfgMatch = mfg.match(/ברקוד:\s*(\d{5,14})/);
  if (mfgMatch) return mfgMatch[1];

  const rawId = String(acItem?.id || '');
  const idMatch = rawId.match(/_(\d{5,14})$/);
  if (idMatch) return idMatch[1];

  return null;
}

function isCandidateUnitCompatible(targetName, targetUnits, candLabel) {
  const candUnits = parseProductUnits(candLabel);
  if (!areUnitsCompatible(targetUnits, candUnits)) return false;

  // מניעת השוואת שק של 2+ ק"ג למחיר ליחידת משקל של 1 ק"ג
  if (targetUnits.weightGrams && targetUnits.weightGrams >= 2000 && /מחיר לפי משקל/i.test(candLabel) && !candUnits.weightGrams) {
    return false;
  }
  return true;
}

/**
 * מאתר מועמדים רלוונטיים מ-autocompletion/product_extended של chp.co.il.
 */
async function fetchChpCandidates(item, mappingEntry) {
  const isProduce = isProduceItem(item.name, mappingEntry);
  const queries = buildSearchQueries(item, isProduce);
  const targetUnits = parseProductUnits(item.name);
  const targetTokens = cleanMishnatName(item.name, true)
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length >= 2 || /\d/.test(w));

  const seen = new Map();

  for (const q of queries) {
    const acUrl = `https://chp.co.il/autocompletion/product_extended?term=${encodeURIComponent(q)}&from=0&u=${Math.random()}&shopping_address=${encodeURIComponent('ירושלים')}`;
    const raw = await chpFetch(acUrl, true);
    if (!raw) continue;

    let list = [];
    try {
      list = JSON.parse(raw);
    } catch (_) {
      continue;
    }
    if (!Array.isArray(list) || list.length === 0) continue;

    for (const entry of list) {
      if (!entry || typeof entry.value !== 'string') continue;
      const label = entry.value.trim();
      if (!label || /^אין תוצאות/.test(label)) continue;
      if (!isCandidateUnitCompatible(item.name, targetUnits, label)) continue;

      const barcode = extractBarcode(entry);
      const key = barcode || label;
      if (seen.has(key)) continue;

      const mfg = (entry?.parts?.manufacturer_and_barcode || '').replace(/\s+/g, ' ').trim();
      const lowerCombined = `${label} ${mfg}`.toLowerCase();
      let score = 0;
      for (const tok of targetTokens) {
        if (lowerCombined.includes(tok)) score += tok.length >= 3 ? 3 : 1;
      }
      if (isProduce && /מחיר לפי משקל/i.test(label)) score += 4;
      if (barcode) score += 1;

      seen.set(key, { label, barcode, mfg, score });
    }

    if (seen.size >= 8) break;
  }

  return [...seen.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

/**
 * שולף ומאחד מחירי אמת למוצר הנבחר מ-chp.co.il בכל הערים (ירושלים + בני ברק).
 */
async function fetchChpPricesMultiCity(candidate) {
  const queryTerm = candidate.barcode || candidate.label;
  const cityChainPrices = {
    osherAd: [],
    ramiLevy: [],
    yeshHesed: [],
    netoChisachon: []
  };
  let resolvedTitle = candidate.label;

  const cityResults = await Promise.all(
    TARGET_CITIES.map(async city => {
      const url = `https://chp.co.il/main_page/compare_results?shopping_address=${encodeURIComponent(city)}&product_name_or_barcode=${encodeURIComponent(queryTerm)}`;
      const html = await chpFetch(url, false);
      return parseChpResultsHtml(html);
    })
  );

  for (const parsed of cityResults) {
    if (!parsed.found) continue;
    if (parsed.productTitle) resolvedTitle = parsed.productTitle;

    const perChainInCity = { osherAd: [], ramiLevy: [], yeshHesed: [], netoChisachon: [] };
    for (const row of parsed.rows) {
      const chainKey = mapChpChain(row.chain);
      if (chainKey) perChainInCity[chainKey].push(row.price);
    }

    for (const chainKey of ALLOWED_CHAINS) {
      if (perChainInCity[chainKey].length > 0) {
        cityChainPrices[chainKey].push(median(perChainInCity[chainKey]));
      }
    }
  }

  const finalChains = {};
  for (const chainKey of ALLOWED_CHAINS) {
    const vals = cityChainPrices[chainKey];
    if (vals.length > 0) {
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      finalChains[chainKey] = Math.round(avg * 100) / 100;
    } else {
      finalChains[chainKey] = null;
    }
  }

  return { chains: finalChains, resolvedTitle };
}

async function generateWithFallback(prompt) {
  let lastErr = null;
  const modelsToTry = [activeModel, ...CANDIDATE_MODELS.filter(m => m !== activeModel)];

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: { temperature: 0.1 }
      });
      if (activeModel !== modelName) {
        console.log(`ℹ️ עבר למודל פעיל: ${modelName}`);
        activeModel = modelName;
      }
      return response;
    } catch (err) {
      lastErr = err;
      const msg = String(err?.message || err);
      if (
        msg.includes('404') ||
        msg.includes('429') ||
        msg.includes('400') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('quota') ||
        msg.includes('not found') ||
        msg.includes('not supported')
      ) {
        if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
          await sleep(2000);
        }
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

/**
 * מבקש מ-Gemini לבחור מתוך מועמדי chp.co.il את המוצר התואם במדויק (או מותג מקביל למוצר בסיסי/פרטי).
 */
async function selectMatchesWithAI(batchPrepared) {
  const payload = batchPrepared.map(entry => ({
    id: entry.item.id,
    name: entry.item.name,
    isProduce: entry.isProduce,
    candidates: entry.candidates.map((c, idx) => ({
      idx,
      label: c.label,
      brandInfo: c.mfg
    }))
  }));

  const prompt = `
אתה מומחה ישראלי להתאמת מוצרי סופרמרקט ומוצרי צריכה.
לכל מוצר של "משנת יוסף" ברשימה מטה צורפה רשימת מועמדים אמיתיים שנשלפו ממאגר המחירים הארצי (chp.co.il).
עליך לבחור עבור כל מוצר את האינדקס (selectedIdx) של המועמד שמתאים לו להשוואת מחיר, או null אם אף מועמד אינו מתאים!

כללי התאמה מחמירים:
1. התאמה מהותית מדויקת: אסור להתאים מוצר שונה במהותו או באחוזי השומן (לדוגמה: אסור להתאים חלב 3% לחלב 1%, אסור להתאים שמנת חמוצה לחמאה, אסור להתאים ממתק/קינדר לביצים, אסור להתאים סבון למלפפון, אסור להתאים פסטה לבושם!).
2. התאמת גודל/משקל/מארז: הקפד שהמשקל, הנפח וכמות היחידות תואמים (סטייה קלה עד ~8% מותרת, למשל 686 גרם מול 700/750 גרם רק אם זה אותו מוצר בדיוק, או טונה 335 מול 340 גרם). לעולם אל תתאים מארז ליחידה או 5 ק"ג ל-1 ק"ג ("מחיר לפי משקל").
3. ירקות ופירות (isProduce=true): בחר "מחיר לפי משקל" (1 ק"ג) אלא אם למשנת יוסף יש שק במשקל נקוב גדול (כמו 5 ק"ג) ואז התאם רק לשק של 5 ק"ג.
4. מותג פרטי / מוצר בסיסי (כגון קייטי, מ.מ., הדר גאולה, או שם גנרי כמו "פסטה", "אטריות", "וופלים"): אם אין מותג זהה, מותר ורצוי לבחור מוצר מותג מקביל עם אותה מהות, טעם, סוג ומשקל/מארז — ובמקרה כזה חובה לסמן "isEquivalentBrand": true!
   לעומת זאת, אם שם המוצר במשנת יוסף מציין מותג מוכר (תנובה, טרה, אסם, עלית, תלמה, שטראוס, סנו, פיירי, Careline וכו') — העדף התאמה לאותו מותג ("isEquivalentBrand": false), והשתמש במקביל רק אם מדובר במוצר יסוד זהה לחלוטין (כגון סוכר לבן/קמח/מלח).

רשימת המוצרים והמועמדים:
${JSON.stringify(payload, null, 2)}

החזר JSON תקני בלבד בפורמט הבא (ללא מלל נוסף):
{
  "results": [
    {
      "id": "item_id",
      "selectedIdx": 0,
      "isEquivalentBrand": false
    }
  ]
}
`;

  try {
    const response = await generateWithFallback(prompt);
    let text = response.text || '';
    if (!text && response.candidates?.[0]?.content?.parts) {
      text = response.candidates[0].content.parts.map(pt => pt.text || '').join('\n');
    }
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('⚠️ אזהרה: לא נמצא מבנה JSON בתשובת המודל.');
      return [];
    }
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.results || [];
  } catch (err) {
    console.error('❌ שגיאה בקריאה ל-Gemini עבור האצווה:', err.message);
    return [];
  }
}

async function mapWithConcurrency(items, concurrency, fn) {
  const results = new Array(items.length);
  let nextIdx = 0;
  async function worker() {
    while (nextIdx < items.length) {
      const idx = nextIdx++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

async function main() {
  if (!ai) {
    console.error('❌ שגיאה: משתנה הסביבה GEMINI_API_KEY אינו מוגדר.');
    console.error('אנא הגדר את GEMINI_API_KEY או ספק אותו בריצת GitHub Actions Secrets.');
    process.exit(1);
  }
  console.log('🚀 מתחיל הרצת רענון מחירי סופרמרקטים (chp.co.il רב-עירוני + Gemini)...');
  console.log(`ערים נבדקות: ${TARGET_CITIES.join(', ')}`);
  console.log(`מצב Dry-Run: ${isDryRun ? 'כן (לא יישמרו שינויים)' : 'לא'}`);
  console.log(`גודל אצווה ל-AI: ${BATCH_SIZE}, מגבלת פריטים: ${limit === Infinity ? 'הכל' : limit}`);

  const todayStr = new Date().toISOString().split('T')[0];

  if (!fs.existsSync(PRICES_FILE)) {
    console.error(`❌ קובץ המחירים לא נמצא בנתיב: ${PRICES_FILE}`);
    process.exit(1);
  }

  const prices = JSON.parse(fs.readFileSync(PRICES_FILE, 'utf8'));
  let mappingCache = {};
  if (fs.existsSync(MAPPING_FILE)) {
    mappingCache = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));
  }

  // שילוב מוצרים חדשים מקטלוג משנת יוסף החי (ללא סינון קטגוריות)
  const candidates = [];
  const LIVE_CATALOG_FILE = path.resolve('scripts', 'mishnat_live_catalog.json');
  if (fs.existsSync(LIVE_CATALOG_FILE)) {
    try {
      const liveCatalog = JSON.parse(fs.readFileSync(LIVE_CATALOG_FILE, 'utf8'));
      console.log(`ℹ️ נטען קטלוג משנת יוסף חי (${liveCatalog.length} פריטים). בודק מוצרים חדשים למיפוי...`);

      let candidateCount = 0;
      for (const item of liveCatalog) {
        if (!item.name || item.name.length < 3) continue;

        const matchedExisting = findMarketComparison(item.name, prices);
        if (matchedExisting) {
          if (!matchedExisting.aliases) matchedExisting.aliases = [];
          if (!matchedExisting.aliases.includes(item.name)) {
            matchedExisting.aliases.push(item.name);
          }
          continue;
        }

        const exists = prices.some(p => p.id === `my_${item.id}` || p.name === item.name || (p.aliases && p.aliases.includes(item.name)));
        if (!exists) {
          candidates.push({
            id: `my_${item.id}`,
            name: item.name,
            aliases: [item.name],
            supermarketPrice: 0,
            chains: { osherAd: null, ramiLevy: null, yeshHesed: null, netoChisachon: null },
            lastVerified: todayStr
          });
          candidateCount++;
          if (candidateCount >= MAX_CANDIDATES) break;
        }
      }
      if (candidateCount > 0) {
        console.log(`✨ נוספו ${candidateCount} מוצרים חדשים מקטלוג משנת יוסף לבדיקת מחירי רשתות!`);
      }
    } catch (e) {
      console.warn('⚠️ שגיאה בקריאת mishnat_live_catalog.json:', e.message);
    }
  }

  let targetList = [...candidates, ...prices];
  if (targetId) {
    targetList = prices.filter(p => p.id === targetId);
    if (targetList.length === 0) {
      console.error(`❌ לא נמצא פריט עם מזהה: ${targetId}`);
      process.exit(1);
    }
  }

  if (limit !== Infinity) {
    targetList = targetList.slice(0, limit);
  }

  console.log(`סה"כ מוצרים לסריקה ועדכון: ${targetList.length}`);

  await ensureChpSession();

  console.log('🔎 שלב 1: מאתר מועמדים תואמים ב-chp.co.il (autocompletion)...');
  const preparedAll = await mapWithConcurrency(targetList, 4, async item => {
    const isProduce = isProduceItem(item.name, mappingCache[item.id]);
    const chpCands = await fetchChpCandidates(item, mappingCache[item.id]);
    return { item, isProduce, candidates: chpCands };
  });

  const withCandidates = preparedAll.filter(p => p.candidates.length > 0);
  const withoutCandidates = preparedAll.filter(p => p.candidates.length === 0);
  console.log(`📊 נמצאו מועמדים ב-chp.co.il עבור ${withCandidates.length} מתוך ${targetList.length} מוצרים (${withoutCandidates.length} ללא התאמה במאגר chp).`);

  let updatedCount = 0;

  for (let i = 0; i < withCandidates.length; i += BATCH_SIZE) {
    const batch = withCandidates.slice(i, i + BATCH_SIZE);
    console.log(`\n📦 אצווה ${Math.floor(i / BATCH_SIZE) + 1} מתוך ${Math.ceil(withCandidates.length / BATCH_SIZE)} (${batch.map(b => b.item.name).join(', ')})...`);

    const aiDecisions = await selectMatchesWithAI(batch);

    // איסוף בחירות תקינות לשליפת מחירים רב-עירונית במקביל
    const toFetchPrices = [];
    for (const entry of batch) {
      const dec = aiDecisions.find(d => d.id === entry.item.id);
      if (!dec || typeof dec.selectedIdx !== 'number' || !entry.candidates[dec.selectedIdx]) {
        console.warn(`ℹ️ לא נמצאה התאמת מוצר מאומתת עבור "${entry.item.name}" - מדלג.`);
        continue;
      }
      const chosen = entry.candidates[dec.selectedIdx];
      const targetUnits = parseProductUnits(entry.item.name);
      if (!isCandidateUnitCompatible(entry.item.name, targetUnits, chosen.label)) {
        console.warn(`⚠️ אי-התאמת יחידות עבור "${entry.item.name}": נדחה המוצר "${chosen.label}".`);
        continue;
      }
      toFetchPrices.push({ entry, chosen, isEquivalentBrand: Boolean(dec.isEquivalentBrand) });
    }

    const fetchedPrices = await mapWithConcurrency(toFetchPrices, 3, async task => {
      const priceData = await fetchChpPricesMultiCity(task.chosen);
      return { ...task, priceData };
    });

    for (const { entry, chosen, isEquivalentBrand, priceData } of fetchedPrices) {
      const { item } = entry;
      const validChainPrices = {};

      for (const chain of ALLOWED_CHAINS) {
        const val = priceData.chains[chain];
        if (typeof val === 'number' && val > 0) {
          const prevPrice = item.chains?.[chain] || item.supermarketPrice;
          if (prevPrice && (val < prevPrice * 0.4 || val > prevPrice * 2.2)) {
            console.warn(`⚠️ מחיר חריג עבור ${item.name} ברשת ${chain}: ${val} (מחיר קודם: ${prevPrice}) - נפסל.`);
            validChainPrices[chain] = item.chains?.[chain] ?? null;
          } else {
            validChainPrices[chain] = Math.round(val * 100) / 100;
          }
        } else {
          validChainPrices[chain] = null;
        }
      }

      const activeValues = Object.values(validChainPrices).filter(v => typeof v === 'number' && v > 0);
      if (activeValues.length === 0) {
        console.warn(`ℹ️ לא נמצאו מחירי רשתות יעד מאומתים עבור "${item.name}" (${chosen.label}) השבוע - מדלג.`);
        continue;
      }

      const sum = activeValues.reduce((a, b) => a + b, 0);
      const newAvg = Math.round((sum / activeValues.length) * 100) / 100;

      item.chains = validChainPrices;
      item.supermarketPrice = newAvg;
      item.lastVerified = todayStr;
      item.matchedName = priceData.resolvedTitle || chosen.label;
      if (isEquivalentBrand) {
        item.isEquivalentBrand = true;
      } else {
        delete item.isEquivalentBrand;
      }

      if (!prices.some(p => p.id === item.id)) {
        prices.push(item);
      }
      updatedCount++;

      if (mappingCache[item.id]) {
        mappingCache[item.id].verifiedChains = Object.keys(validChainPrices).filter(c => validChainPrices[c] != null);
        mappingCache[item.id].lastVerified = todayStr;
      }

      const eqLabel = isEquivalentBrand ? ` [מותג מקביל: ${item.matchedName}]` : '';
      console.log(`✅ עודכן: ${item.name}${eqLabel} -> ממוצע: ${newAvg} ש"ח (אושר עד: ${validChainPrices.osherAd ?? '-'}, רמי לוי: ${validChainPrices.ramiLevy ?? '-'}, יש חסד: ${validChainPrices.yeshHesed ?? '-'}, נטו חיסכון: ${validChainPrices.netoChisachon ?? '-'})`);
    }

    if (i + BATCH_SIZE < withCandidates.length) {
      await sleep(1500);
    }
  }

  console.log(`\n🎉 סיום עיבוד. עודכנו ${updatedCount} פריטים בהצלחה מתוך ${targetList.length}.`);

  if (!isDryRun && updatedCount > 0) {
    const cleanPrices = prices.filter(p => typeof p.supermarketPrice === 'number' && p.supermarketPrice > 0);
    fs.writeFileSync(PRICES_FILE, JSON.stringify(cleanPrices, null, 2) + '\n', 'utf8');
    fs.writeFileSync(MAPPING_FILE, JSON.stringify(mappingCache, null, 2) + '\n', 'utf8');
    console.log(`💾 נשמר בהצלחה לקבצים: ${PRICES_FILE}, ${MAPPING_FILE}`);
  } else if (isDryRun) {
    console.log('ℹ️ מצב Dry-Run פעיל - לא נשמרו שינויים לקובץ.');
  }
}

export { cleanMishnatName, buildSearchQueries, fetchChpCandidates, fetchChpPricesMultiCity };

// הרצה רק כאשר הקובץ מופעל ישירות (ולא בייבוא לבדיקות)
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  main().catch(err => {
    console.error('❌ שגיאה בלתי צפויה בריצה:', err);
    process.exit(1);
  });
}
