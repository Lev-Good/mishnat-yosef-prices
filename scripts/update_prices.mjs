/**
 * scripts/update_prices.mjs
 * 
 * Pipeline אוטונומי לרענון מחירי סופרמרקטים שבועי עבור "מוסיף למשנת".
 * משתמש ב-Gemini 3.8 Flash עם Google Search Grounding לשליפת מחירי אמת עדכניים.
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function queryGeminiPricesForBatch(batchItems) {
  const prompt = `
אתה מומחה ישראלי להשוואת מחירי מזון ומוצרי צריכה ברשתות השיווק בישראל.
משימתך היא למצוא את מחירי המדף המדויקים והעדכניים ביותר בישראל (נכון לשבוע הנוכחי) עבור רשימת המוצרים הבאה.

הרשתות הנבדקות:
1. osherAd ("אושר עד" - סניפי ירושלים / בני ברק)
2. ramiLevy ("רמי לוי" - מחלקות מהדרין / סניפי מהדרין)
3. yeshHesed ("יש חסד" - סניפי המהדרין ירושלים / בני ברק)
4. netoChisachon ("נטו חיסכון" - סניפי אלעד / בני ברק / ירושלים)

הנחיות קריטיות:
1. השתמש בחיפוש גוגל (Google Search) לאיתור מחירי המדף העדכניים באתרי הרשתות, באתרי השוואת מחירים (chp, pricez, פרייסז, זאפ מרקט וכד') או קטלוגי המבצעים השבועיים.
2. התאמת גודל/משקל מדויקת: ודא שהמחיר תואם בדיוק את המשקל והאריזה של המוצר (גרמים, מ"ל, מארזים). אל תשווה מארז ליחידה או 70 גרם ל-150 גרם!
3. פירות וירקות: חפש אך ורק מחיר לקילוגרם (1 ק"ג) במחלקות מהדרין (בד"ץ העדה החרדית / הרב רובין / קהילות וכד') בסניפי הערים החרדיות. אם אין מחיר מהדרין ברור - החזר null!
4. עקרון אפס ניחושים (Zero Estimation): אם לרשת מסוימת אין מחיר מאומת וודאי לשבוע הנוכחי, החזר null עבור אותה רשת. אל תנחש ואל תמציא מחיר!
5. החזר את התוצאה בפורמט JSON תקני בלבד (ללא מלל מיותר לפני או אחרי).

המוצרים לבדיקה:
${JSON.stringify(batchItems.map(p => ({
  id: p.id,
  name: p.name,
  aliases: p.aliases || [],
  lastKnownPrice: p.supermarketPrice,
  isProduce: Boolean(p.isProduce)
})), null, 2)}

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
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      }
    });

    const text = response.text || '';
    
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

  if (!fs.existsSync(PRICES_FILE)) {
    console.error(`❌ קובץ המחירים לא נמצא בנתיב: ${PRICES_FILE}`);
    process.exit(1);
  }

  const prices = JSON.parse(fs.readFileSync(PRICES_FILE, 'utf8'));
  let mappingCache = {};
  if (fs.existsSync(MAPPING_FILE)) {
    mappingCache = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));
  }

  let targetList = prices;
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
  const todayStr = new Date().toISOString().split('T')[0];

  // עיבוד באצוות
  for (let i = 0; i < targetList.length; i += BATCH_SIZE) {
    const batch = targetList.slice(i, i + BATCH_SIZE);
    console.log(`\n📦 מעבד אצווה ${Math.floor(i / BATCH_SIZE) + 1} מתוך ${Math.ceil(targetList.length / BATCH_SIZE)} (${batch.map(b => b.name).join(', ')})...`);

    const results = await queryGeminiPricesForBatch(batch);

    for (const res of results) {
      const item = prices.find(p => p.id === res.id);
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
          // אם אין מחיר מאומת - נשאר null
          validChainPrices[chain] = null;
        }
      }

      // חישוב ממוצע חדש לרשתות שזמינות
      const activeValues = Object.values(validChainPrices).filter(v => typeof v === 'number');
      let newAvg = item.supermarketPrice;
      if (activeValues.length > 0) {
        const sum = activeValues.reduce((a, b) => a + b, 0);
        newAvg = Math.round((sum / activeValues.length) * 100) / 100;
      }

      // עדכון הפריט
      item.chains = validChainPrices;
      item.supermarketPrice = newAvg;
      item.lastVerified = todayStr;
      updatedCount++;

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
    fs.writeFileSync(PRICES_FILE, JSON.stringify(prices, null, 2), 'utf8');
    console.log(`💾 נשמר בהצלחה לקובץ: ${PRICES_FILE}`);
  } else if (isDryRun) {
    console.log('ℹ️ מצב Dry-Run פעיל - לא נשמרו שינויים לקובץ.');
  }
}

main().catch(err => {
  console.error('❌ שגיאה בלתי צפויה בריצה:', err);
  process.exit(1);
});
