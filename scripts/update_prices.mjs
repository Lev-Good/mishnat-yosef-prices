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
import { parseProductUnits, areUnitsCompatible, findMarketComparison, norm } from './parse_units.mjs';

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
const disableSearchFallback = args.includes('--no-search-fallback');
const searchBatchSizeIndex = args.indexOf('--search-batch-size');
const SEARCH_BATCH_SIZE = searchBatchSizeIndex !== -1 ? parseInt(args[searchBatchSizeIndex + 1], 10) : 6;

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
const SEARCH_GROUNDING_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest'
];
let activeModel = CANDIDATE_MODELS[0];
let activeSearchModel = SEARCH_GROUNDING_MODELS[0];

const TARGET_CITIES = ['ירושלים', 'בני ברק'];
const ALLOWED_CHAINS = ['osherAd', 'ramiLevy', 'yeshHesed', 'netoChisachon', 'shaareiRevaha', 'mechiraLaKehila'];
const createEmptyChainsObj = (initVal = null) => Object.fromEntries(ALLOWED_CHAINS.map(c => [c, typeof initVal === 'function' ? initVal() : initVal]));
const CHP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
let chpCookie = '';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isLeafHerbItem(name) {
  return /(?:כוסברה|שמיר|פטרוזיליה|בזיליקום|נענע|רוזמרין|סלרי|חסה|רוקט|תרד|בצל\s*ירוק|עירית)/i.test(name || '');
}

function isProduceItem(name, mappingEntry) {
  if (isLeafHerbItem(name)) return false;
  if (mappingEntry && typeof mappingEntry.isProduce === 'boolean') {
    return mappingEntry.isProduce;
  }
  return /(?:בצל|תפוחי?\s*אדמה|תפוח\s*אדמה|עגבני[הו]|מלפפון|גזר|פלפל|כרוב|בטטה|שום|קישוא|חציל|דלורית|אפרסמון|קלמנטינה|תפוז|אגס|בננ|לימון|אבוקדו|סלק|קולרבי)/i.test(name || '');
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
  if (/^שערי\s*רווחה/.test(chainName)) return 'shaareiRevaha';
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
  const heBoundaryStart = '(?:^|(?<=[\\s()[\\]\\/\\-–—"\'״׳.,]))';
  const heBoundaryEnd = '(?=$|[\\s()[\\]\\/\\-–—"\'״׳.,])';
  const stripPhraseRe = phrases => new RegExp(`${heBoundaryStart}(?:${phrases})${heBoundaryEnd}`, 'gi');

  let s = (rawName || '')
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\((?:כתום|חום|ירוק|צהוב|אדום|שחור|לבן|אריזת?\s*[^)]*|מומלץ!?|לאחר הפסח)\)/gi, ' ')
    .replace(/קרטון\s+בצבע\s+[^\s]+(?:\s+[^\s]+)?/gi, ' ')
    .replace(/רשת\s+(?:כתומה|ירוקה|אדומה|לבנה)/gi, ' ')
    .replace(stripPhraseRe('גידולי\\s*אדמה|גוש\\s*קטיף|חסלט|עלי\\s*קטיף|מהדרין|בד["״]?ץ|לנדא|העדה\\s*החרדית|מובחר|טריים|טרי|בשקית|בקופסא|איסוף\\s+כמוצר\\s+בודד|מומלץ!?|אריזה\\s*מוגדלת|מארז\\s*מוגדל|מהדורה\\s*מוגבלת'), ' ')
    .replace(/\b(?:XL|XXL)\b/gi, ' ')
    .replace(stripPhraseRe("גר['\"״׳]?"), 'גרם')
    .replace(stripPhraseRe('קילו'), 'ק"ג')
    .replace(stripPhraseRe("יח['\"״׳]?"), 'יחידות')
    .replace(stripPhraseRe('שלישיית'), 'שלישיה')
    .replace(stripPhraseRe('רביעיית'), 'רביעיה')
    .replace(stripPhraseRe('חמישיית'), 'חמישיה')
    .replace(stripPhraseRe('שישיית'), 'שישיה')
    .replace(stripPhraseRe('שמיניית'), 'שמיניה')
    .replace(stripPhraseRe('עשיריית'), 'עשיריה');

  if (stripPrivateBrands) {
    s = s.replace(stripPhraseRe('קייטי|מ\\.מ\\.?|הדר\\s*גאולה|אשבול|My\\s*VILLAGE|באגסי|ברמן|ריאו|ענבי\\s*טלי'), ' ');
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
  const isHerb = isLeafHerbItem(item.name);

  if (isProduce) {
    const baseProd = genericClean
      .replace(/\([^)]*\)/g, ' ')
      .replace(/(?:^|\s)\d+(?:[.,]\d+)?\s*(?:ק["״]?ג|גרם|יח['׳"]?|יחידות)(?=$|\s|[()[\]/\-–—.,])/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const targetUnits = parseProductUnits(item.name);
    if (targetUnits.weightGrams >= 2000) {
      addQ(fullClean);
    }
    addQ(`${baseProd.split(' ').slice(0, 3).join(' ')} משקל`);
    addQ(baseProd);
  } else if (isHerb) {
    const baseHerb = genericClean.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
    addQ(`${baseHerb} בשקית`);
    addQ(baseHerb);
  }

  addQ(fullClean);
  if (genericClean !== fullClean) addQ(genericClean);

  const words = genericClean.replace(/[()]/g, ' ').split(/\s+/).filter(w => w.length >= 2 || /\d/.test(w));
  const leadStopWords = new Set(['שלישיה', 'שלישיית', 'רביעיה', 'חמישיה', 'חמישיית', 'שישיה', 'שמיניה', 'שמיניית', 'עשיריה', 'ראש', 'מארז', 'קופסא', 'שקית', 'סלסלה', 'זוג', 'עלי']);
  const coreWords = leadStopWords.has(words[0]) ? words.slice(1) : words;

  // אם השם בנוי בתבנית "<תיאור מוצר> - <מותג>" (נפוץ מאוד במשנת יוסף), נוסיף שאילתה ממוקדת עם סוף התיאור + המותג
  // לדוגמה: "נוזל לניקוי והברקת כלי כסף - גודרדס" -> "כלי כסף גודרדס"
  const rawWithoutBraces = (item.name || '').replace(/\{[^}]*\}/g, ' ').replace(/\[[^\]]*\]/g, ' ').trim();
  const hyphenIdx = rawWithoutBraces.lastIndexOf('-');
  if (hyphenIdx > 2 && hyphenIdx < rawWithoutBraces.length - 2) {
    const leftPart = cleanMishnatName(rawWithoutBraces.slice(0, hyphenIdx), true);
    const brandPart = cleanMishnatName(rawWithoutBraces.slice(hyphenIdx + 1), false);
    const leftWords = leftPart.replace(/[()]/g, ' ').split(/\s+/).filter(w => w.length >= 2 || /\d/.test(w));
    const leftCore = leadStopWords.has(leftWords[0]) ? leftWords.slice(1) : leftWords;
    if (brandPart && leftCore.length >= 2) {
      addQ(`${leftCore.slice(-2).join(' ')} ${brandPart}`);
      addQ(`${leftCore.slice(0, 2).join(' ')} ${brandPart}`);
    }
  }

  if (coreWords.length >= 2) {
    addQ(coreWords.slice(0, 3).join(' '));
    addQ(coreWords.slice(0, 2).join(' '));
  } else if (words.length > 4) {
    addQ(words.slice(0, 4).join(' '));
  }
  if (words.length > 2) {
    addQ(words.slice(0, 2).join(' '));
  }

  for (const alias of (item.aliases || []).slice(0, 2)) {
    addQ(cleanMishnatName(alias, false));
  }

  return queries.slice(0, 6);
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
  // מניעת השוואת עלים ירוקים/תבלינים טריים באריזה (צרור/שקית ~5 ש"ח) למחיר לקילו (~100 ש"ח)
  if (isLeafHerbItem(targetName) && !targetUnits.weightGrams && /מחיר לפי משקל/i.test(candLabel)) {
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
  const fullTargetName = item._unitHint ? `${item.name} ${item._unitHint}` : item.name;
  const targetUnits = parseProductUnits(fullTargetName);
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
  const cityChainPrices = createEmptyChainsObj(() => []);
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

    const perChainInCity = createEmptyChainsObj(() => []);
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

function isRetryableModelError(err) {
  const msg = String(err?.message || err);
  return (
    msg.includes('404') ||
    msg.includes('429') ||
    msg.includes('400') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('quota') ||
    msg.includes('not found') ||
    msg.includes('not supported')
  );
}

async function runWithModelFallback(candidateModels, currentActive, onModelSuccess, invokeFn) {
  let lastErr = null;
  const modelsToTry = [currentActive, ...candidateModels.filter(m => m !== currentActive)];

  for (const modelName of modelsToTry) {
    try {
      const result = await invokeFn(modelName);
      onModelSuccess(modelName);
      if (result && typeof result === 'object') result._usedModel = modelName;
      return result;
    } catch (err) {
      lastErr = err;
      const msg = String(err?.message || err);
      if (isRetryableModelError(err)) {
        console.warn(`⚠️ מודל ${modelName} לא זמין לבקשה זו (${msg.slice(0, 120)}) - מנסה מודל חלופי...`);
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

async function generateWithFallback(prompt, extraConfig = {}, candidateModels = CANDIDATE_MODELS) {
  return runWithModelFallback(
    candidateModels,
    activeModel,
    modelName => {
      if (activeModel !== modelName) {
        console.log(`ℹ️ עבר למודל פעיל: ${modelName}`);
        activeModel = modelName;
      }
    },
    modelName => {
      const reqConfig = { ...extraConfig };
      if (!/^gemini-(?:3\.[5-9]|4)/.test(modelName) && reqConfig.temperature === undefined) {
        reqConfig.temperature = 0.1;
      }
      return ai.models.generateContent({ model: modelName, contents: prompt, config: reqConfig });
    }
  );
}

function parseModelJsonResponse(responseOrText) {
  let text = typeof responseOrText === 'string'
    ? responseOrText
    : (responseOrText?.output_text || responseOrText?.text || '');
  if (!text && responseOrText?.candidates?.[0]?.content?.parts) {
    text = responseOrText.candidates[0].content.parts.map(pt => pt.text || '').join('\n');
  }
  if (!text && Array.isArray(responseOrText?.steps)) {
    text = responseOrText.steps
      .filter(s => s?.type === 'model_output' && Array.isArray(s.content))
      .flatMap(s => s.content.map(c => c?.text || ''))
      .join('\n');
  }
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.warn('⚠️ אזהרה: לא נמצא מבנה JSON בתשובת המודל.');
    return null;
  }
  try {
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.warn('⚠️ שגיאה בפענוח JSON מתשובת המודל:', e.message);
    return null;
  }
}

function isPriceSane(item, sourceName, val, livePrice) {
  if (typeof val !== 'number' || !Number.isFinite(val) || val <= 0) return false;
  if (livePrice && livePrice > 0) {
    if (val < livePrice * 0.3 || val > livePrice * 3.0) {
      console.warn(`⚠️ מחיר חריג עבור ${item.name} (${sourceName}): ${val} מול מחיר משנת יוסף ${livePrice} - נפסל.`);
      return false;
    }
    return true;
  }
  const prevPrice = item.chains?.[sourceName] || item.supermarketPrice;
  if (prevPrice && (val < prevPrice * 0.35 || val > prevPrice * 2.8)) {
    console.warn(`⚠️ מחיר חריג עבור ${item.name} (${sourceName}): ${val} (מחיר קודם: ${prevPrice}) - נפסל.`);
    return false;
  }
  return true;
}

/**
 * מבקש מ-Gemini לבחור מתוך מועמדי chp.co.il את המוצר התואם במדויק (או מותג מקביל למוצר בסיסי/פרטי).
 */
async function selectMatchesWithAI(batchPrepared) {
  const payload = batchPrepared.map(entry => ({
    id: entry.item.id,
    name: entry.item._unitHint ? `${entry.item.name} (${entry.item._unitHint})` : entry.item.name,
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
עליך לבחור עבור כל מוצר עד 3 אינדקסים תואמים ("selectedIndices") בסדר עדיפות יורד (הראשון הוא ההתאמה הטובה ביותר, והבאים הם חלופות תואמות של אותו מוצר/גרסה/ברקוד במקרה שלראשון חסרים מחירים בחלק מהרשתות), או מערך ריק [] אם אף מועמד אינו מתאים!

כללי התאמה מחמירים:
1. התאמה מהותית מדויקת: אסור להתאים מוצר שונה במהותו או באחוזי השומן (לדוגמה: אסור להתאים חלב 3% לחלב 1%, אסור להתאים שמנת חמוצה לחמאה, אסור להתאים ממתק/קינדר לביצים, אסור להתאים סבון למלפפון, אסור להתאים פסטה לבושם!).
2. התאמת גודל/משקל/מארז: הקפד שהמשקל, הנפח וכמות היחידות תואמים (סטייה קלה עד ~8% מותרת, למשל 686 גרם מול 700/750 גרם רק אם זה אותו מוצר בדיוק, או טונה 335 מול 340 גרם). לעולם אל תתאים מארז ליחידה או 5 ק"ג ל-1 ק"ג ("מחיר לפי משקל").
3. ירקות ופירות (isProduce=true): בחר "מחיר לפי משקל" (1 ק"ג) אלא אם למשנת יוסף יש שק במשקל נקוב גדול (כמו 5 ק"ג) ואז התאם רק לשק של 5 ק"ג. עבור עשבי תיבול ועלים באריזה (כוסברה, שמיר, פטרוזיליה, בזיליקום, חסה, סלרי) — בחר רק שקית/יחידה/מארז ולא "מחיר לפי משקל" לקילו.
4. מותג פרטי / מוצר בסיסי (כגון קייטי, מ.מ., הדר גאולה, או שם גנרי כמו "פסטה", "אטריות", "וופלים"): אם אין מותג זהה, מותר ורצוי לבחור מוצר מותג מקביל עם אותה מהות, טעם, סוג ומשקל/מארז — ובמקרה כזה חובה לסמן "isEquivalentBrand": true!
   לעומת זאת, אם שם המוצר במשנת יוסף מציין מותג מוכר (תנובה, טרה, אסם, עלית, תלמה, שטראוס, סנו, פיירי, Careline וכו') — העדף התאמה לאותו מותג ("isEquivalentBrand": false), והשתמש במקביל רק אם מדובר במוצר יסוד זהה לחלוטין (כגון סוכר לבן/קמח/מלח).

רשימת המוצרים והמועמדים:
${JSON.stringify(payload, null, 2)}

החזר JSON תקני בלבד בפורמט הבא (ללא מלל נוסף):
{
  "results": [
    {
      "id": "item_id",
      "selectedIndices": [0, 2],
      "isEquivalentBrand": false
    }
  ]
}
`;

  try {
    const response = await generateWithFallback(prompt);
    const parsed = parseModelJsonResponse(response);
    return parsed?.results || [];
  } catch (err) {
    console.error('❌ שגיאה בקריאה ל-Gemini עבור האצווה:', err.message);
    // גיבוי דטרמיניסטי מאובטח במקרה ש-Gemini אינו זמין: בוחר רק מועמדי CHP עם חפיפת מילים גבוהה והתאמת יחידות מלאה
    const fallbackResults = [];
    for (const entry of batchPrepared) {
      const targetTokens = cleanMishnatName(entry.item.name, true)
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length >= 3);
      if (targetTokens.length < 2) continue;
      const matchedIndices = [];
      for (let ci = 0; ci < entry.candidates.length; ci++) {
        const c = entry.candidates[ci];
        const hay = `${c.label} ${c.mfg || ''}`.toLowerCase();
        const hits = targetTokens.filter(t => hay.includes(t)).length;
        if (hits >= Math.ceil(targetTokens.length * 0.75)) {
          matchedIndices.push(ci);
          if (matchedIndices.length >= 2) break;
        }
      }
      if (matchedIndices.length > 0) {
        fallbackResults.push({ id: entry.item.id, selectedIndices: matchedIndices, isEquivalentBrand: false });
      }
    }
    if (fallbackResults.length > 0) {
      console.log(`🛡️ גיבוי דטרמיניסטי חילץ ${fallbackResults.length} התאמות CHP מאומתות למרות שגיאת AI.`);
    }
    return fallbackResults;
  }
}

/**
 * שלב גיבוי היברידי (Google Search Grounding) עבור מוצרים שלא נמצאה להם התאמה במאגר הסופרים CHP
 * (לדוגמה: תוספי תזונה, קוסמטיקה, מוצרי חשמל/מטבח, טקסטיל, ספרים או מוצרי סופר חסרים).
 */
async function searchPricesWithGoogleGrounding(batchItems) {
  const payload = batchItems.map(item => ({
    id: item.id,
    name: item.name,
    cleanQuery: cleanMishnatName(item.name, false)
  }));

  const prompt = `
אתה חוקר מחירים בישראל. עבור רשימת המוצרים מ"משנת יוסף" שלא נמצאו במאגר הסופרים CHP, חובה להשתמש בפועל בכלי החיפוש google_search לכל מוצר כדי לאתר מחירי שוק אמיתיים ועדכניים בש"ח (ILS) בחנויות וברשתות ישראליות (רשתות מזון, סופר-פארם, Be, זאפ, KSP, אייס, הום סנטר, אתרי מותגים וחנויות רשת בישראל).

כללים מחמירים:
1. אל תנחש ואל תמציא מחיר בשום אופן! בצע חיפושים ברשת עבור כל פריט והחזר מחיר ("marketPrice") רק אם מצאת בתוצאות החיפוש מחיר ממשי ועדכני בישראל של המוצר (או של מוצר מקביל זהה במהות ובגודל). אם לאחר חיפוש לא נמצא מידע אמין או שמדובר במוצר ייחודי/בלעדי שאין לו מקבילה בשוק, החזר "marketPrice": null.
2. התאמת גודל/כמות/משקל חובה: ודא שהמחיר שמצאת תואם לאותו נפח, משקל או מספר יחידות במארז (למשל לא להשוות בקבוק 400 מ"ל ל-750 מ"ל או יחידה למארז).
3. מותג מקביל: אם המותג מצוין במשנת יוסף ונמצא אותו מותג בדיוק — סמן "isEquivalentBrand": false. אם זהו מוצר פרטי/גנרי או כלי בית/טקסטיל כללי והשווית לדגם/מותג מקביל נפוץ בישראל בעל אותם מפרט וגודל — סמן "isEquivalentBrand": true.
4. אם במקרה נמצאו מחירים באחת מחמש הרשתות המרכזיות (osherAd = אושר עד, ramiLevy = רמי לוי, yeshHesed = יש חסד, netoChisachon = נטו חיסכון, shaareiRevaha = שערי רווחה), ציין אותם בשדה "chains" (או null אם לא נמצא).
5. בשדה "sourceLabel" ציין בקצרה (2-4 מילים בעברית) מאילו אתרים/רשתות אומת המחיר (למשל: "זאפ / חנויות רשת", "סופר-פארם / פארם", "רמי לוי / שופרסל").

רשימת המוצרים לבדיקה:
${JSON.stringify(payload, null, 2)}

החזר JSON תקני בלבד (ללא הקדמות או הסברים) במבנה הבא:
{
  "results": [
    {
      "id": "item_id",
      "marketPrice": 49.9,
      "matchedName": "שם המוצר שנמצא כולל משקל/גודל",
      "sourceLabel": "זאפ / חנויות רשת",
      "isEquivalentBrand": false,
      "chains": {
        "osherAd": null,
        "ramiLevy": null,
        "yeshHesed": null,
        "netoChisachon": null,
        "shaareiRevaha": null
      }
    }
  ]
}
`;

  try {
    let parsed = null;

    if (ai?.interactions?.create) {
      try {
        const interaction = await runWithModelFallback(
          SEARCH_GROUNDING_MODELS,
          activeSearchModel,
          modelName => {
            if (activeSearchModel !== modelName) {
              console.log(`ℹ️ עבר למודל חיפוש פעיל: ${modelName}`);
              activeSearchModel = modelName;
            }
          },
          modelName => ai.interactions.create({
            model: modelName,
            input: prompt,
            tools: [{ type: 'google_search' }]
          })
        );

        const steps = Array.isArray(interaction?.steps) ? interaction.steps : [];
        const searchCalls = steps.filter(s => s?.type === 'google_search_call' || s?.type === 'google_search_result');
        const hasCitations = steps.some(s =>
          s?.type === 'model_output' &&
          Array.isArray(s.content) &&
          s.content.some(c => Array.isArray(c?.annotations) && c.annotations.some(a => a?.type === 'url_citation'))
        );
        const toolCount = Number(interaction?.usage?.grounding_tool_count?.google_search || 0);

        if (searchCalls.length > 0 || hasCitations || toolCount > 0) {
          console.log(`🌐 [Interactions ${interaction._usedModel}] בוצעו ${searchCalls.length || toolCount} פעולות חיפוש Google Search.`);
          parsed = parseModelJsonResponse(interaction);
        } else {
          console.warn(`⚠️ [Interactions ${interaction?._usedModel || 'unknown'}] לא תועדו קריאות google_search (${JSON.stringify(steps.map(s => s?.type))}) - עובר לבדיקה ב-generateContent.`);
        }
      } catch (interErr) {
        console.warn(`⚠️ שגיאת Interactions API (${interErr.message}) - עובר לבדיקה ב-generateContent.`);
      }
    }

    if (!parsed) {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }], temperature: 0.1 }
      });
      const groundingMeta = response?.candidates?.[0]?.groundingMetadata;
      const hasGroundingQueries = Array.isArray(groundingMeta?.webSearchQueries) && groundingMeta.webSearchQueries.length > 0;
      const hasGroundingChunks = Array.isArray(groundingMeta?.groundingChunks) && groundingMeta.groundingChunks.length > 0;
      if (!hasGroundingQueries && !hasGroundingChunks) {
        console.warn('⚠️ אזהרה (gemini-2.5-flash): תשובת החיפוש ההיברידי לא החזירה מטא-דאטה של Google Search Grounding - מדלג על האצווה.');
        return [];
      }
      console.log(`🌐 [generateContent gemini-2.5-flash] בוצעו ${groundingMeta?.webSearchQueries?.length || groundingMeta?.groundingChunks?.length || 1} אימותי Google Search.`);
      parsed = parseModelJsonResponse(response);
    }

    return parsed?.results || [];
  } catch (err) {
    console.error('❌ שגיאה בשלב הגיבוי (Google Search Grounding):', err.message);
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
    try {
      mappingCache = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));
    } catch (_) {
      mappingCache = {};
    }
  }

  // שילוב מוצרים חדשים מקטלוג משנת יוסף החי (ללא סינון קטגוריות) + שמירת מחיר משנת יוסף כעוגן שפיות
  const candidates = [];
  const livePriceByName = new Map();
  const LIVE_CATALOG_FILE = path.resolve('scripts', 'mishnat_live_catalog.json');
  const hasLiveCatalog = fs.existsSync(LIVE_CATALOG_FILE);
  if (hasLiveCatalog) {
    try {
      const liveCatalog = JSON.parse(fs.readFileSync(LIVE_CATALOG_FILE, 'utf8'));
      console.log(`ℹ️ נטען קטלוג משנת יוסף חי (${liveCatalog.length} פריטים). בודק מוצרים חדשים למיפוי...`);

      let candidateCount = 0;
      for (const item of liveCatalog) {
        if (!item.name || item.name.length < 3) continue;
        if (typeof item.price === 'number' && item.price > 0) {
          livePriceByName.set(norm(item.name), item.price);
          livePriceByName.set(`my_${item.id}`, item.price);
        }

        const unitHint = item.unitText || '';
        const matchedExisting = findMarketComparison(item.name, prices, unitHint);
        if (matchedExisting) {
          // הוספת alias אוטומטית רק בהתאמה הדוקה במיוחד (חפיפת מילים >= 50%) למניעת זיהום כינויים שגוי
          const itemTokens = norm(item.name).split(/\s+/).filter(w => w.length >= 2);
          const baseTokens = norm(matchedExisting.name).split(/\s+/).filter(w => w.length >= 2);
          const overlap = itemTokens.filter(t => baseTokens.includes(t)).length;
          const overlapRatio = itemTokens.length ? overlap / Math.min(itemTokens.length, Math.max(baseTokens.length, 1)) : 0;
          if (baseTokens.length >= 2 && overlapRatio >= 0.5 && (matchedExisting.aliases || []).length < 8) {
            if (!matchedExisting.aliases) matchedExisting.aliases = [];
            if (!matchedExisting.aliases.includes(item.name)) {
              matchedExisting.aliases.push(item.name);
            }
          }
          continue;
        }

        const normName = norm(item.name);
        const exists = prices.some(p =>
          p.id === `my_${item.id}` ||
          p.name === item.name ||
          norm(p.name) === normName ||
          (p.aliases && p.aliases.includes(item.name))
        ) || candidates.some(c => c.id === `my_${item.id}` || norm(c.name) === normName);
        if (!exists) {
          const displayName = (unitHint && !item.name.includes(unitHint))
            ? `${item.name} ${unitHint}`
            : item.name;
          candidates.push({
            id: `my_${item.id}`,
            name: displayName,
            aliases: [item.name],
            _unitHint: unitHint,
            supermarketPrice: 0,
            chains: createEmptyChainsObj(null),
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

  const getLivePriceForItem = item => {
    if (livePriceByName.has(item.id)) return livePriceByName.get(item.id);
    const byName = livePriceByName.get(norm(item.name));
    if (byName) return byName;
    for (const al of (item.aliases || [])) {
      const p = livePriceByName.get(norm(al));
      if (p) return p;
    }
    return null;
  };

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
  const updatedIds = new Set();

  for (let i = 0; i < withCandidates.length; i += BATCH_SIZE) {
    const batch = withCandidates.slice(i, i + BATCH_SIZE);
    console.log(`\n📦 אצווה ${Math.floor(i / BATCH_SIZE) + 1} מתוך ${Math.ceil(withCandidates.length / BATCH_SIZE)} (${batch.map(b => b.item.name).join(', ')})...`);

    const aiDecisions = await selectMatchesWithAI(batch);

    // איסוף בחירות מדורגות (עד 3 מועמדים תואמים למוצר) לשליפת מחירים רב-עירונית והשלמה חלופית
    const toFetchPrices = [];
    for (const entry of batch) {
      const dec = aiDecisions.find(d => d.id === entry.item.id);
      let rawIndices = [];
      if (dec) {
        if (Array.isArray(dec.selectedIndices)) {
          rawIndices = dec.selectedIndices;
        } else if (typeof dec.selectedIdx === 'number') {
          rawIndices = [dec.selectedIdx];
        }
      }

      const targetUnits = parseProductUnits(entry.item.name);
      const chosenList = [];
      const seenIdx = new Set();
      for (const idx of rawIndices) {
        if (typeof idx !== 'number' || seenIdx.has(idx) || !entry.candidates[idx]) continue;
        seenIdx.add(idx);
        const cand = entry.candidates[idx];
        if (!isCandidateUnitCompatible(entry.item.name, targetUnits, cand.label)) {
          console.warn(`⚠️ אי-התאמת יחידות עבור "${entry.item.name}": נדחה המוצר "${cand.label}".`);
          continue;
        }
        chosenList.push(cand);
        if (chosenList.length >= 3) break;
      }

      if (chosenList.length === 0) {
        console.warn(`ℹ️ לא נמצאה התאמת מוצר מאומתת עבור "${entry.item.name}" - מדלג.`);
        continue;
      }
      toFetchPrices.push({ entry, chosenList, isEquivalentBrand: Boolean(dec?.isEquivalentBrand) });
    }

    const fetchedPrices = await mapWithConcurrency(toFetchPrices, 3, async task => {
      const { entry, chosenList } = task;
      const livePrice = getLivePriceForItem(entry.item);
      const mergedChains = createEmptyChainsObj(null);
      let primaryTitle = null;
      let primaryLabel = chosenList[0].label;

      for (const cand of chosenList) {
        const missingChains = ALLOWED_CHAINS.filter(c => mergedChains[c] == null);
        if (missingChains.length === 0) break;

        const priceData = await fetchChpPricesMultiCity(cand);
        let acceptedAnyFromCand = false;
        for (const chain of missingChains) {
          const val = priceData.chains[chain];
          if (typeof val === 'number' && val > 0 && isPriceSane(entry.item, chain, val, livePrice)) {
            mergedChains[chain] = Math.round(val * 100) / 100;
            acceptedAnyFromCand = true;
          }
        }
        if (acceptedAnyFromCand && !primaryTitle) {
          primaryTitle = priceData.resolvedTitle || cand.label;
          primaryLabel = cand.label;
        }
      }

      return { ...task, livePrice, validChainPrices: mergedChains, resolvedTitle: primaryTitle, chosenLabel: primaryLabel };
    });

    for (const { entry, isEquivalentBrand, validChainPrices, resolvedTitle, chosenLabel } of fetchedPrices) {
      const { item } = entry;
      const activeValues = Object.values(validChainPrices).filter(v => typeof v === 'number' && v > 0);
      if (activeValues.length === 0) {
        console.warn(`ℹ️ לא נמצאו מחירי רשתות יעד מאומתים עבור "${item.name}" (${chosenLabel}) השבוע - מדלג.`);
        continue;
      }

      const sum = activeValues.reduce((a, b) => a + b, 0);
      const newAvg = Math.round((sum / activeValues.length) * 100) / 100;

      item.chains = validChainPrices;
      item.supermarketPrice = newAvg;
      item.lastVerified = todayStr;
      item.matchedName = resolvedTitle || chosenLabel;
      delete item.source;
      delete item.sourceLabel;
      if (isEquivalentBrand) {
        item.isEquivalentBrand = true;
      } else {
        delete item.isEquivalentBrand;
      }

      if (!prices.some(p => p.id === item.id)) {
        prices.push(item);
      }
      updatedIds.add(item.id);
      updatedCount++;

      if (mappingCache[item.id]) {
        mappingCache[item.id].verifiedChains = Object.keys(validChainPrices).filter(c => validChainPrices[c] != null);
        mappingCache[item.id].lastVerified = todayStr;
      }

      const eqLabel = isEquivalentBrand ? ` [מותג מקביל: ${item.matchedName}]` : '';
      console.log(`✅ עודכן: ${item.name}${eqLabel} -> ממוצע: ${newAvg} ש"ח (אושר עד: ${validChainPrices.osherAd ?? '-'}, רמי לוי: ${validChainPrices.ramiLevy ?? '-'}, יש חסד: ${validChainPrices.yeshHesed ?? '-'}, נטו חיסכון: ${validChainPrices.netoChisachon ?? '-'}, שערי רווחה: ${validChainPrices.shaareiRevaha ?? '-'})`);
    }

    if (i + BATCH_SIZE < withCandidates.length) {
      await sleep(1500);
    }
  }

  // שלב 3: גיבוי היברידי via Google Search Grounding עבור מוצרים פעילים שלא עודכנו ב-CHP
  if (!disableSearchFallback) {
    const searchFallbackTargets = targetList.filter(item => {
      if (updatedIds.has(item.id)) return false;
      if (targetId || !hasLiveCatalog) return true;
      return getLivePriceForItem(item) != null;
    });

    if (searchFallbackTargets.length > 0) {
      console.log(`\n🔎 שלב 3: מריץ גיבוי היברידי ב-Google Search עבור ${searchFallbackTargets.length} מוצרים ללא התאמת CHP...`);
      let searchUpdatedCount = 0;

      for (let i = 0; i < searchFallbackTargets.length; i += SEARCH_BATCH_SIZE) {
        const searchBatch = searchFallbackTargets.slice(i, i + SEARCH_BATCH_SIZE);
        console.log(`\n🌐 אצוות Search ${Math.floor(i / SEARCH_BATCH_SIZE) + 1} מתוך ${Math.ceil(searchFallbackTargets.length / SEARCH_BATCH_SIZE)} (${searchBatch.map(it => it.name).join(', ')})...`);

        const searchResults = await searchPricesWithGoogleGrounding(searchBatch);
        for (const item of searchBatch) {
          const res = searchResults.find(r => r && r.id === item.id);
          if (!res) continue;

          const matchedName = String(res.matchedName || '').trim();
          if (matchedName && !isCandidateUnitCompatible(item.name, parseProductUnits(item.name), matchedName)) {
            console.warn(`⚠️ [Google Search] אי-התאמת יחידות עבור "${item.name}": נדחה "${matchedName}".`);
            continue;
          }

          const livePrice = getLivePriceForItem(item);
          const validExplicitChains = {};
          for (const chain of ALLOWED_CHAINS) {
            const rawVal = res.chains?.[chain];
            if (typeof rawVal === 'number' && rawVal > 0 && isPriceSane(item, chain, rawVal, livePrice)) {
              validExplicitChains[chain] = Math.round(rawVal * 100) / 100;
            }
          }

          const explicitVals = Object.values(validExplicitChains);
          let finalMarketPrice = null;
          let finalChains = {};

          if (explicitVals.length > 0) {
            finalMarketPrice = Math.round((explicitVals.reduce((a, b) => a + b, 0) / explicitVals.length) * 100) / 100;
            finalChains = { ...createEmptyChainsObj(null), ...validExplicitChains };
          } else if (typeof res.marketPrice === 'number' && isPriceSane(item, 'Google Search', res.marketPrice, livePrice)) {
            finalMarketPrice = Math.round(res.marketPrice * 100) / 100;
          }

          if (!finalMarketPrice || finalMarketPrice <= 0) continue;

          item.chains = finalChains;
          item.supermarketPrice = finalMarketPrice;
          item.lastVerified = todayStr;
          item.matchedName = matchedName || item.name;
          item.source = 'google_search';
          item.sourceLabel = String(res.sourceLabel || 'חיפוש רשת (Google)').trim();

          if (res.isEquivalentBrand) {
            item.isEquivalentBrand = true;
          } else {
            delete item.isEquivalentBrand;
          }

          if (!prices.some(p => p.id === item.id)) {
            prices.push(item);
          }
          updatedIds.add(item.id);
          updatedCount++;
          searchUpdatedCount++;

          const eqLabel = item.isEquivalentBrand ? ` [מותג מקביל: ${item.matchedName}]` : '';
          console.log(`🔍 [Google Search] עודכן: ${item.name}${eqLabel} -> ממוצע: ${finalMarketPrice} ש"ח (${item.sourceLabel})`);
        }

        if (i + SEARCH_BATCH_SIZE < searchFallbackTargets.length) {
          await sleep(1200);
        }
      }

      console.log(`📊 סיכום שלב 3 (Google Search): עודכנו ${searchUpdatedCount} מוצרים נוספים.`);
    }
  }

  // שלב 4: שילוב מחירי "המכירה לקהילה" (sales.org.il) אם נשלפו בהצלחה
  const KEHILA_CATALOG_FILE = path.resolve('scripts', 'kehila_live_catalog.json');
  if (fs.existsSync(KEHILA_CATALOG_FILE)) {
    try {
      const kehilaData = JSON.parse(fs.readFileSync(KEHILA_CATALOG_FILE, 'utf8'));
      const kehilaItems = Array.isArray(kehilaData?.items) ? kehilaData.items : [];
      if (kehilaItems.length > 0) {
        const tokenize = str => cleanMishnatName(str).split(/\s+/).filter(w => w.length >= 2);
        const parsedKehila = kehilaItems.map(k => ({
          ...k,
          normName: norm(k.name),
          tokens: tokenize(k.name),
          units: parseProductUnits(k.name)
        }));

        let kehilaMatched = 0;
        for (const item of prices) {
          const itemTokens = tokenize(item.name);
          if (!itemTokens.length) continue;
          const itemUnits = parseProductUnits(item.name);
          const itemNorm = norm(item.name);

          let best = null;
          let bestScore = 0;
          for (const k of parsedKehila) {
            if (k.normName === itemNorm) {
              best = k;
              bestScore = 1;
              break;
            }
            if (!isCandidateUnitCompatible(item.name, itemUnits, k.name)) continue;
            const overlap = itemTokens.filter(t => k.tokens.includes(t)).length;
            const score = overlap / Math.max(itemTokens.length, k.tokens.length);
            if (score >= 0.65 && overlap >= 2 && score > bestScore) {
              best = k;
              bestScore = score;
            }
          }

          if (best && best.price > 0) {
            const livePrice = getLivePriceForItem(item);
            if (isPriceSane(item, 'mechiraLaKehila', best.price, livePrice)) {
              if (!item.chains || typeof item.chains !== 'object') item.chains = {};
              const rounded = Math.round(best.price * 100) / 100;
              if (item.chains.mechiraLaKehila !== rounded) {
                item.chains.mechiraLaKehila = rounded;
                const vals = Object.values(item.chains).filter(v => typeof v === 'number' && v > 0);
                if (vals.length > 0) {
                  item.supermarketPrice = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
                }
                item.lastVerified = todayStr;
                kehilaMatched++;
                updatedCount++;
              }
            }
          }
        }
        console.log(`🏘️ שלב 4 (המכירה לקהילה): הותאמו ועודכנו ${kehilaMatched} מוצרים מתוך ${kehilaItems.length} פריטים.`);
      }
    } catch (err) {
      console.warn('⚠️ שגיאה בקריאת קטלוג המכירה לקהילה:', err.message);
    }
  }

  console.log(`\n🎉 סיום עיבוד. עודכנו ${updatedCount} פריטים בהצלחה מתוך ${targetList.length}.`);

  if (!isDryRun && updatedCount > 0) {
    const seenNormNames = new Set();
    const cleanPrices = [];
    for (const p of prices) {
      if (typeof p.supermarketPrice !== 'number' || p.supermarketPrice <= 0) continue;
      const key = norm(p.name);
      if (!key || seenNormNames.has(key)) continue;
      seenNormNames.add(key);
      const { _unitHint, ...cleanItem } = p;
      cleanPrices.push(cleanItem);
    }
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
