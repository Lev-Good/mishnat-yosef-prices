import fs from 'fs';
import { parseProductUnits, areUnitsCompatible, findMarketComparison } from './parse_units.mjs';

console.log('--- 1. Testing parseProductUnits & areUnitsCompatible ---');

const testCases = [
  { raw: 'ביסלי אסם 70 גרם', expectedWeight: 70, isBig: false, isSmall: true },
  { raw: 'ביסלי פארטי 150 גרם', expectedWeight: 150, isBig: true, isSmall: false },
  { raw: 'חלב תנובה 3% 1 ליטר', expectedVol: 1000 },
  { raw: 'קוקה קולה 330 מ"ל', expectedVol: 330 },
  { raw: 'קוקה קולה 1.5 ל', expectedVol: 1500 },
  { raw: 'תפוחי אדמה 2 ק"ג', expectedWeight: 2000 },
  { raw: 'בצל יבש 1 קג', expectedWeight: 1000 },
  { raw: 'ביצים L תבנית 30', expectedPack: 30 },
  { raw: 'ביצים L 30 יח\'', expectedPack: 30 },
  { raw: 'טונה סטארקיסט מארז 4 יח\'', expectedPack: 4 },
  { raw: 'חבילת 500 גרם', expectedWeight: 500, expectedPack: null },
  { raw: 'שישיית 1.5 ליטר', expectedVol: 1500, expectedPack: 6 },
  { raw: '6*1.5 ליטר', expectedVol: 1500, expectedPack: 6, expectedWeight: null },
  { raw: '4*100 גרם', expectedWeight: 400, expectedPack: 4 },
  { raw: 'נייר טואלט 30 גלילים', expectedPack: 30 },
  { raw: 'זוג כפפות אלוורה רב שימושיות M - סנו', expectedPack: null },
  { raw: 'זוג בקבוקי קוקה קולה 1.5 ליטר', expectedVol: 1500, expectedPack: 2 }
];

let allPassed = true;
for (const tc of testCases) {
  const u = parseProductUnits(tc.raw);
  if (tc.expectedWeight !== undefined && u.weightGrams !== tc.expectedWeight) {
    console.error(`FAIL: ${tc.raw} weight: got ${u.weightGrams}, expected ${tc.expectedWeight}`);
    allPassed = false;
  }
  if (tc.expectedVol !== undefined && u.volumeMl !== tc.expectedVol) {
    console.error(`FAIL: ${tc.raw} vol: got ${u.volumeMl}, expected ${tc.expectedVol}`);
    allPassed = false;
  }
  if (tc.expectedPack !== undefined && u.packCount !== tc.expectedPack) {
    console.error(`FAIL: ${tc.raw} pack: got ${u.packCount}, expected ${tc.expectedPack}`);
    allPassed = false;
  }
}

// Unit compatibility tests
const bisliSmall = parseProductUnits('ביסלי אסם 70 גרם');
const bisliParty = parseProductUnits('ביסלי אסם 150 גרם פארטי');
const bisliRange = parseProductUnits('ביסלי פארטי מיקס אריזה גדולה אסם (150-200 גרם)');
if (areUnitsCompatible(bisliSmall, bisliParty)) {
  console.error('FAIL: 70g and 150g should NOT be compatible!');
  allPassed = false;
}
if (!areUnitsCompatible(bisliParty, bisliRange)) {
  console.error('FAIL: 150g and 150-200g range SHOULD be compatible!');
  allPassed = false;
}

const colaCan = parseProductUnits('קוקה קולה 330 מ"ל');
const colaBottle = parseProductUnits('קוקה קולה 1.5 ליטר');
if (areUnitsCompatible(colaCan, colaBottle)) {
  console.error('FAIL: 330ml and 1.5L should NOT be compatible!');
  allPassed = false;
}

const choc100g = parseProductUnits('שוקולד חלב 100 גרם');
const milk1L = parseProductUnits('חלב תנובה 1% 1 ליטר');
if (areUnitsCompatible(choc100g, milk1L)) {
  console.error('FAIL: 100g weight and 1L volume should NOT be compatible!');
  allPassed = false;
}

console.log('--- 2. Testing Catalog Integrity & Matching ---');
const catalog = JSON.parse(fs.readFileSync('prices.json', 'utf8'));

const negativeTests = [
  "ג'ל כביסה מרוכז מקסימה - סנו 3 ליטר",
  "ערכה מוכנה להדלקה עם שמן זית נוזלי",
  'עוגיות חמאה', 'סלט ביצים', 'אבקת מרק בצל', 'בצל ירוק', 'טבעות בצל',
  "'נשנושים' שמנת בצל", 'מאגדת חטיף דמוי ביסלי {באגסי}', 'שקית פרחי כרובית מוקפאים עד"ח',
  'רסק/רוטב עגבניות 22 (4 קופסאות) - פרי מבורך', 'סיגרים קפואים במילוי תפוח אדמה - בלינו (לנדא)',
  "מחיות תפוח בננה לפעוטות בפאווצ' פריפוש - קייטי",
  'קמח תפוחי אדמה', 'מלח לימון', 'שוקולד חלב', 'שוקולד חלב עם אגוזים 100 גרם',
  'לחם שום', 'חלב שקדים 1 ליטר', 'חלב סויה 1 ליטר', 'רוטב סויה 1 ליטר',
  'קמח חיטה מלאה 1 ק"ג', 'פסטה מחיטה מלאה 500 גרם', 'קפסולות פיירי למדיח 50 יח\'',
  'נייר טואלט 48 גלילים', 'קוקה קולה פחית 330 מ"ל', 'קוקה קולה בקבוק 1.5 ליטר יחידה'
];

for (const t of negativeTests) {
  const m = findMarketComparison(t, catalog);
  if (m) {
    console.error(`FAIL False Positive: "${t}" matched ${m.id} (${m.name})`);
    allPassed = false;
  }
}

for (const item of catalog) {
  const m = findMarketComparison(item.name, catalog);
  if (!m || m.id !== item.id) {
    console.error(`FAIL Self-Match: [${item.id}] "${item.name}" matched ${m ? m.id : 'null'}`);
    allPassed = false;
  }
}

const userPositiveTests = [
  { input: "גבינה 5% - טרה 500 גר'", expectedId: "cheese_white_tara_5_500g" },
  { input: "גבינה צהובה עמק - 600 גר' פרוסות גבינה צהובה בוואקום", expectedId: "cheese_emek_600g" },
  { input: "מאגדת קרלו בטעם שוקו (חום) 8 גביעים של 100 גרם", expectedId: "carlo_choco_8" },
  { input: "עוגיות חצי ירח - תירוש 175 גרם, ביסקוויט מצופה שוקולד צד אחד", expectedId: "cookies_tirosh_half_moon_175g" },
  { input: "בצל יבש", expectedId: "onion_dry" }
];

for (const t of userPositiveTests) {
  const m = findMarketComparison(t.input, catalog);
  if (!m || m.id !== t.expectedId) {
    console.error(`FAIL User Positive Test: "${t.input}" expected ${t.expectedId}, got ${m ? m.id : 'null'}`);
    allPassed = false;
  }
}

if (allPassed) {
  console.log(`SUCCESS: All unit, range, user positive (${userPositiveTests.length}), negative (${negativeTests.length}), and catalog self-match (${catalog.length}) tests passed cleanly!`);
} else {
  process.exit(1);
}
