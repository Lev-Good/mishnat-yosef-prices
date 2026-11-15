/**
 * parse_units.mjs
 * מנוע זיהוי יחידות מידה, משקלים ובקרת תאימות עבור השוואת מחירים
 */

export function parseProductUnits(rawStr) {
  if (!rawStr) return { weightGrams: null, volumeMl: null, packCount: null, isBig: false, isSmall: false };
  const s = rawStr.toString().toLowerCase();

  let weightGrams = null;
  let volumeMl = null;
  let packCount = null;

  // 1. משקל בקילוגרמים: 1.5 ק"ג, 1 קג, 2 קילו, 1.25 ק''ג, kg
  const kgMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:ק["'״׳]?ג|קג|קילו|kg)(?:[^\u0590-\u05fea-z0-9]|$)/i);
  if (kgMatch) {
    weightGrams = Math.round(parseFloat(kgMatch[1]) * 1000);
  }

  // 2. משקל בגרמים: 70 גרם, 250 גר', 500 ג', 100 גר, 100ג, g, gr
  if (!weightGrams) {
    const gMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:גרם|גר["'״׳]|ג["'״׳]|גר|ג|gr|g)(?:[^\u0590-\u05fea-z0-9]|$)/i);
    if (gMatch) {
      weightGrams = Math.round(parseFloat(gMatch[1]));
    }
  }

  // 3. נפח בליטרים: 1.5 ליטר, 1 ל', 2ל, liter, l
  const lMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:ליטר|ל["'״׳]|ל|liter|l)(?:[^\u0590-\u05fea-z0-9]|$)/i);
  if (lMatch) {
    volumeMl = Math.round(parseFloat(lMatch[1]) * 1000);
  }

  // 4. נפח במיליליטר: 330 מ"ל, 250 מל, 750 מ''ל, ml
  if (!volumeMl) {
    const mlMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:מ["'״׳]?ל|מל|ml)(?:[^\u0590-\u05fea-z0-9]|$)/i);
    if (mlMatch) {
      volumeMl = Math.round(parseFloat(mlMatch[1]));
    }
  }

  // 5. מארזים וכמויות: מארז 4 יח', 6 יחידות, תבנית 30, מארז 12, רביעיית, שישיית, זוג, שלישייה
  const packMatch = s.match(/(?:מארז|תבנית|חבילת|רביעיית|שישיית|זוג|שלישיית|עשיריית)\s*(\d+)?(?:\s*יח['"״׳]?|\s*יחידות)?/i);
  if (packMatch && packMatch[1]) {
    packCount = parseInt(packMatch[1], 10);
  } else if (/זוג(?:\s|$)/.test(s)) {
    packCount = 2;
  } else if (/שלישיי?ה|שלישיית/.test(s)) {
    packCount = 3;
  } else if (/רביעיי?ה|רביעיית/.test(s)) {
    packCount = 4;
  } else if (/חמישיי?ה|חמישיית/.test(s)) {
    packCount = 5;
  } else if (/שישיי?ה|שישיית/.test(s)) {
    packCount = 6;
  } else if (/שמינ?יי?ה|שמינ?יית/.test(s)) {
    packCount = 8;
  } else if (/עשיריי?ה|עשיריית/.test(s)) {
    packCount = 10;
  } else {
    const multiMatch = s.match(/(\d+)\s*[\*xX×]\s*(\d+)/);
    if (multiMatch) {
      packCount = parseInt(multiMatch[1], 10);
      if (!weightGrams && multiMatch[2]) {
        weightGrams = packCount * parseInt(multiMatch[2], 10);
      }
    }
  }

  const isBig = /(?:אריזה\s*גדולה|משפחתי|פארטי|מיקס|מגה|ג['"״׳]?מבו|ענק|חיסכון)/i.test(s) 
    || (weightGrams != null && weightGrams >= 140 && weightGrams <= 500 && /(?:חטיף|ביסלי|במבה|תפוצ[יפ]ס|דוריטוס)/i.test(s));
  const isSmall = /(?:אישי|קטן|מיני|כיס)/i.test(s) 
    || (weightGrams != null && weightGrams <= 80 && /(?:חטיף|ביסלי|במבה|תפוצ[יפ]ס|דוריטוס)/i.test(s));

  return { weightGrams, volumeMl, packCount, isBig, isSmall };
}

export function areUnitsCompatible(u1, u2) {
  if (!u1 || !u2) return true;

  // 1. בדיקת משקל: התאמה בטווח של עד 8%
  if (u1.weightGrams && u2.weightGrams) {
    const diffPct = Math.abs(u1.weightGrams - u2.weightGrams) / Math.max(u1.weightGrams, u2.weightGrams);
    if (diffPct > 0.08) return false;
  }

  // 2. בדיקת נפח: התאמה בטווח של עד 8%
  if (u1.volumeMl && u2.volumeMl) {
    const diffPct = Math.abs(u1.volumeMl - u2.volumeMl) / Math.max(u1.volumeMl, u2.volumeMl);
    if (diffPct > 0.08) return false;
  }

  // 3. בדיקת כמות במארז: שוויון מוחלט
  if (u1.packCount && u2.packCount) {
    if (u1.packCount !== u2.packCount) return false;
  }

  // 4. אי-התאמה בין מארז ליחידה בודדת
  if ((u1.packCount && u1.packCount > 1 && !u2.packCount) || (u2.packCount && u2.packCount > 1 && !u1.packCount)) {
    return false;
  }

  // 5. אריזה גדולה/משפחתית מול אישית/קטנה
  if ((u1.isBig && u2.isSmall) || (u1.isSmall && u2.isBig)) {
    return false;
  }

  return true;
}
