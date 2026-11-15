import { parseProductUnits, areUnitsCompatible } from './parse_units.mjs';

console.log('--- Testing parseProductUnits & areUnitsCompatible ---');

const testCases = [
  { raw: 'ביסלי אסם 70 גרם', expectedWeight: 70, isBig: false, isSmall: true },
  { raw: 'ביסלי פארטי 150 גרם', expectedWeight: 150, isBig: true, isSmall: false },
  { raw: 'חלב תנובה 3% 1 ליטר', expectedVol: 1000 },
  { raw: 'קוקה קולה 330 מ"ל', expectedVol: 330 },
  { raw: 'קוקה קולה 1.5 ל', expectedVol: 1500 },
  { raw: 'תפוחי אדמה 2 ק"ג', expectedWeight: 2000 },
  { raw: 'בצל יבש 1 קג', expectedWeight: 1000 },
  { raw: 'ביצים L תבנית 30', expectedPack: 30 },
  { raw: 'טונה סטארקיסט מארז 4 יח\'', expectedPack: 4 }
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
if (areUnitsCompatible(bisliSmall, bisliParty)) {
  console.error('FAIL: 70g and 150g should NOT be compatible!');
  allPassed = false;
}

const colaCan = parseProductUnits('קוקה קולה 330 מ"ל');
const colaBottle = parseProductUnits('קוקה קולה 1.5 ליטר');
if (areUnitsCompatible(colaCan, colaBottle)) {
  console.error('FAIL: 330ml and 1.5L should NOT be compatible!');
  allPassed = false;
}

if (allPassed) {
  console.log('SUCCESS: All unit and compatibility tests passed cleanly!');
} else {
  process.exit(1);
}
