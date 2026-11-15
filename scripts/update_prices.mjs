/**
 * scripts/update_prices.mjs
 * 
 * Pipeline אוטונומי לרענון מחירי סופרמרקטים שבועי עבור "מוסיף למשנת".
 * משתמש ב-Gemini עם Google Search Grounding לשליפת מחירי אמת עדכניים.
 * מופעל מדי יום ראשון ב-GitHub Actions או ידנית.
 */

import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { parseProductUnits, areUnitsCompatible } from './parse_units.mjs';

const PRICES_FILE = path.resolve('prices.json');
const MAPPING_FILE = path.resolve('scripts', 'mapping_cache.json');

// קריאת ארגומנטים משורת הפקודה
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const limitIndex = args.indexOf('--limit');
const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : Infinity;
const batchSizeIndex = args.indexOf('--batch-size');
const BATCH_SIZE = batchSizeIndex !== -1 ? parseInt(args[batchSizeIndex + 1], 10) : 4;
const targetIdIndex = args.indexOf('--id');
const targetId = targetIdIndex !== -1 ? args[targetIdIndex + 1] : null;

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!apiKey) {
  console.error('❌ שגיאה: משתנה הסביבה GEMINI_API_KEY אינו מוגדר.');
  console.error('אנא הגדר את GEMINI_API_KEY או ספק אותו בריצת GitHub Actions Secrets.');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

const CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemma-4-31b-it',
  'gemma-4-26b-a4b-it'
];
let activeModel = CANDIDATE_MODELS[0];
let searchGroundingSupported = true;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isProduceItem(name, mappingEntry) {
  if (mappingEntry && typeof mappingEntry.isProduce === 'boolean') {
    return mappingEntry.isProduce;
  }
  return /(?:בצל|תפוחי?\s*אדמה|עגבני[הו]|מלפפון|גזר|פלפל|חסה|כרוב|בטטה|שום)/i.test(name || '');
}

async function fetchChpQuery(queryStr) {
  try {
    const q = encodeURIComponent(queryStr);
    const city = encodeURIComponent('בני ברק');
    const url = `https://chp.co.il/main_page/compare_results?shopping_address=${city}&product_name_or_barcode=${q}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml'
      },
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) return '';
    const html = await res.text();
    const tableIdx = html.indexOf('<table');
    const relevantHtml = tableIdx !== -1 ? html.slice(tableIdx) : html;
    const clean = relevantHtml
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return clean.slice(0, 2200);
  } catch (_) {
    return '';
  }
}

async function fetchChpSnippets(item) {
  const queries = [item.name, ...(item.aliases || [])].filter(Boolean);
  for (const q of queries.slice(0, 2)) {
    const snippet = await fetchChpQuery(q);
    if (snippet && /\d+\.\d{2}/.test(snippet)) {
      return snippet;
    }
  }
  return '';
}

async function generateWithFallback(prompt, useSearchTool = true) {
  let lastErr = null;
  const modelsToTry = [activeModel, ...CANDIDATE_MODELS.filter(m => m !== activeModel)];

  for (const modelName of modelsToTry) {
    // מודלי Gemma אינם תומכים בכלי googleSearch מובנה
    const canUseSearch = useSearchTool && searchGroundingSupported && !modelName.startsWith('gemma-');
    const attempts = canUseSearch ? [true, false] : [false];

    for (const withSearch of attempts) {
      try {
        const config = { temperature: 0.1 };
        if (withSearch) {
          config.tools = [{ googleSearch: {} }];
        }
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config
        });
        if (activeModel !== modelName) {
          console.log(`ℹ️ עבר למודל פעיל: ${modelName} (Search Grounding: ${withSearch})`);
          activeModel = modelName;
        }
        if (!withSearch && useSearchTool && searchGroundingSupported && !modelName.startsWith('gemma-')) {
          console.log('ℹ️ כלי Google Search המובנה חסום במכסה החינמית - עובר לשליפת רשת ישירה + ניתוח AI.');
          searchGroundingSupported = false;
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
          continue;
        }
        throw err;
      }
    }
  }
  throw lastErr;
}

async function queryGeminiPricesForBatch(batchItems, mappingCache) {
  const enrichedItems = [];
  for (const p of batchItems) {
    const chpSnippet = await fetchChpSnippets(p);
    enrichedItems.push({
      id: p.id,
      name: p.name,
      aliases: p.aliases || [],
      lastKnownPrice: p.supermarketPrice,
      isProduce: isProduceItem(p.name, mappingCache[p.id]),
      liveWebData: chpSnippet ? chpSnippet.slice(0, 2000) : undefined
    });
  }

  const prompt = `
אתה מומחה ישראלי להשוואת מחירי מזון ומוצרי צריכה ברשתות השיווק בישראל.
משימתך היא למצוא את מחירי המדף המדויקים והעדכניים ביותר בישראל (נכון לשבוע הנוכחי) עבור רשימת המוצרים הבאה.

הרשתות הנבדקות:
1. osherAd ("אושר עד" - סניפי ירושלים / בני ברק)
2. ramiLevy ("רמי לוי" - מחלקות מהדרין / סניפי מהדרין)
3. yeshHesed ("יש חסד" - סניפי המהדרין ירושלים / בני ברק)
4. netoChisachon ("נטו חיסכון" - סניפי אלעד / בני ברק / ירושלים)

הנחיות קריטיות:
1. התבסס על נתוני הרשת העדכניים המצורפים (liveWebData) ו/או חיפוש גוגל לאיתור מחירי המדף העדכניים.
2. התאמת גודל/משקל מדויקת: ודא שהמחיר תואם בדיוק את המשקל והאריזה של המוצר (גרמים, מ"ל, מארזים). אל תשווה מארז ליחידה או 70 גרם ל-150 גרם!
3. פירות וירקות: חפש אך ורק מחיר לקילוגרם (1 ק"ג) במחלקות מהדרין (בד"ץ העדה החרדית / הרב רובין / קהילות וכד') בסניפי הערים החרדיות. אם אין מחיר מהדרין ברור - החזר null!
4. עקרון אפס ניחושים (Zero Estimation): אם לרשת מסוימת אין מחיר מאומת וודאי לשבוע הנוכחי, החזר null עבור אותה רשת. אל תנחש ואל תמציא מחיר!
5. החזר את התוצאה בפורמט JSON תקני בלבד (ללא מלל מיותר לפני או אחרי).

המוצרים לבדיקה:
${JSON.stringify(enrichedItems, null, 2)}

פורמט התשובה המבוקש (JSON בלבד):
{
  "results": [
    {
      "id": "item_id",
      "matchedName": "שם המוצר שנמצא כולל משקל",
      "chains": {
        "osherAd": 6.90,
        "ramiLevy": 6.90,
        "yeshHesed": 6.90,
        "netoChisachon": null
      },
      "notes": "הערה קצרה על המקור או המבצע"
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

    // חילוץ ה-JSON מתוך תשובת המודל
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

async function main() {
  console.log('🚀 מתחיל הרצת רענון מחירי סופרמרקטים שבועי...');
  console.log(`מצב Dry-Run: ${isDryRun ? 'כן (לא יישמרו שינויים)' : 'לא'}`);
  console.log(`גודל אצווה: ${BATCH_SIZE}, מגבלת פריטים: ${limit === Infinity ? 'הכל' : limit}`);

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

  // שילוב מוצרים חדשים מקטלוג משנת יוסף החי (אם נשלף בסבב הנוכחי)
  const candidates = [];
  const LIVE_CATALOG_FILE = path.resolve('scripts', 'mishnat_live_catalog.json');
  if (fs.existsSync(LIVE_CATALOG_FILE)) {
    try {
      const liveCatalog = JSON.parse(fs.readFileSync(LIVE_CATALOG_FILE, 'utf8'));
      console.log(`ℹ️ נטען קטלוג משנת יוסף חי (${liveCatalog.length} פריטים). בודק מוצרים חדשים למיפוי...`);
      const foodCategories = /(?:חלב|מקרר|סלטים|שימורים|אפיה|חטיפים|ממתקים|שתיה|קפואים|נקיון|היגיינה|טואלטיקה|דגנים|פסטה)/i;
      
      let candidateCount = 0;
      for (const item of liveCatalog) {
        if (!item.name || item.name.length < 3) continue;
        if (item.category && !foodCategories.test(item.category) && !foodCategories.test(item.subCategory || '')) {
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
          if (candidateCount >= 25) break; // מגבלת 25 פריטים חדשים בכל ריצה לשמירה על מכסות
        }
      }
      if (candidateCount > 0) {
        console.log(`✨ נוספו ${candidateCount} מוצרים חדשים מקטלוג משנת יוסף לבדיקת מחירי רשתות!`);
      }
    } catch (e) {
      console.warn('⚠️ שגיאה בקריאת mishnat_live_catalog.json:', e.message);
    }
  }

  let targetList = [...prices, ...candidates];
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

  let updatedCount = 0;

  // עיבוד באצוות
  for (let i = 0; i < targetList.length; i += BATCH_SIZE) {
    const batch = targetList.slice(i, i + BATCH_SIZE);
    console.log(`\n📦 מעבד אצווה ${Math.floor(i / BATCH_SIZE) + 1} מתוך ${Math.ceil(targetList.length / BATCH_SIZE)} (${batch.map(b => b.name).join(', ')})...`);

    const results = await queryGeminiPricesForBatch(batch, mappingCache);

    for (const res of results) {
      const item = targetList.find(p => p.id === res.id);
      if (!item) continue;

      const targetUnits = parseProductUnits(item.name);
      const matchedUnits = parseProductUnits(res.matchedName || item.name);

      // בדיקת תאימות יחידות
      if (!areUnitsCompatible(targetUnits, matchedUnits)) {
        console.warn(`⚠️ אי-התאמת יחידות עבור "${item.name}": נדחה המוצר "${res.matchedName}". נשאר עם הקיים.`);
        continue;
      }

      const validChainPrices = {};
      const allowedChains = ['osherAd', 'ramiLevy', 'yeshHesed', 'netoChisachon'];

      for (const chain of allowedChains) {
        const val = res.chains ? res.chains[chain] : null;
        if (typeof val === 'number' && val > 0) {
          // בדיקת שפיות יחס מחיר (0.4 עד 2.2 מהמחיר המקורי)
          const prevPrice = item.chains?.[chain] || item.supermarketPrice;
          if (prevPrice && (val < prevPrice * 0.4 || val > prevPrice * 2.2)) {
            console.warn(`⚠️ מחיר חריג עבור ${item.name} ברשת ${chain}: ${val} (מחיר קודם: ${prevPrice}) - נפסל.`);
            validChainPrices[chain] = item.chains?.[chain] ?? null;
          } else {
            validChainPrices[chain] = Math.round(val * 100) / 100;
          }
        } else {
          // אם אין מחיר מאומת - נשאר null (ללא ניחושים)
          validChainPrices[chain] = null;
        }
      }

      // חישוב ממוצע חדש לרשתות שזמינות
      const activeValues = Object.values(validChainPrices).filter(v => typeof v === 'number' && v > 0);
      if (activeValues.length === 0) {
        if (item.id.startsWith('my_') && item.supermarketPrice === 0) {
          const idx = prices.indexOf(item);
          if (idx !== -1) prices.splice(idx, 1);
        }
        console.warn(`ℹ️ לא נמצאו מחירי רשתות מאומתים עבור "${item.name}" השבוע - מדלג.`);
        continue;
      }

      const sum = activeValues.reduce((a, b) => a + b, 0);
      const newAvg = Math.round((sum / activeValues.length) * 100) / 100;

      // עדכון הפריט
      item.chains = validChainPrices;
      item.supermarketPrice = newAvg;
      item.lastVerified = todayStr;
      if (!prices.some(p => p.id === item.id)) {
        prices.push(item);
      }
      updatedCount++;

      // עדכון מטמון המיפוי
      if (mappingCache[item.id]) {
        mappingCache[item.id].verifiedChains = Object.keys(validChainPrices).filter(c => validChainPrices[c] != null);
        mappingCache[item.id].lastVerified = todayStr;
      }

      console.log(`✅ עודכן: ${item.name} -> ממוצע: ${newAvg} ש"ח (אושר עד: ${validChainPrices.osherAd ?? '-'}, רמי לוי: ${validChainPrices.ramiLevy ?? '-'}, יש חסד: ${validChainPrices.yeshHesed ?? '-'}, נטו חיסכון: ${validChainPrices.netoChisachon ?? '-'})`);
    }

    // השהיה קלה בין אצוות למניעת Rate Limit
    if (i + BATCH_SIZE < targetList.length) {
      console.log('⏳ ממתין 2 שניות לפני האצווה הבאה...');
      await sleep(2000);
    }
  }

  console.log(`\n🎉 סיום עיבוד. עודכנו ${updatedCount} פריטים בהצלחה.`);

  if (!isDryRun && updatedCount > 0) {
    const cleanPrices = prices.filter(p => typeof p.supermarketPrice === 'number' && p.supermarketPrice > 0);
    fs.writeFileSync(PRICES_FILE, JSON.stringify(cleanPrices, null, 2) + '\n', 'utf8');
    fs.writeFileSync(MAPPING_FILE, JSON.stringify(mappingCache, null, 2) + '\n', 'utf8');
    console.log(`💾 נשמר בהצלחה לקבצים: ${PRICES_FILE}, ${MAPPING_FILE}`);
  } else if (isDryRun) {
    console.log('ℹ️ מצב Dry-Run פעיל - לא נשמרו שינויים לקובץ.');
  }
}

main().catch(err => {
  console.error('❌ שגיאה בלתי צפויה בריצה:', err);
  process.exit(1);
});
