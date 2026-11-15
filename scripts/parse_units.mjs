/**
 * parse_units.mjs
 * מנוע זיהוי יחידות מידה, משקלים (כולל טווחים) ובקרת תאימות עבור השוואת מחירים
 */

export function parseProductUnits(rawStr) {
  if (!rawStr) {
    return {
      weightGrams: null, weightMin: null, weightMax: null,
      volumeMl: null, volumeMin: null, volumeMax: null,
      packCount: null, packMin: null, packMax: null,
      isBig: false, isSmall: false
    };
  }
  const s = rawStr.toString().toLowerCase();

  let weightGrams = null, weightMin = null, weightMax = null;
  let volumeMl = null, volumeMin = null, volumeMax = null;
  let packCount = null, packMin = null, packMax = null;

  // 1. משקל בקילוגרמים (כולל תמיכה בטווח כגון 1.5-2 ק"ג)
  const kgRangeMatch = s.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*(?:ק["'״׳]?ג|קג|קילו|kg)(?:[^\u0590-\u05fea-z0-9]|$)/i);
  if (kgRangeMatch) {
    weightMin = Math.round(parseFloat(kgRangeMatch[1]) * 1000);
    weightMax = Math.round(parseFloat(kgRangeMatch[2]) * 1000);
    weightGrams = weightMax;
  } else {
    const kgMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:ק["'״׳]?ג|קג|קילו|kg)(?:[^\u0590-\u05fea-z0-9]|$)/i);
    if (kgMatch) {
      weightGrams = Math.round(parseFloat(kgMatch[1]) * 1000);
      weightMin = weightGrams;
      weightMax = weightGrams;
    }
  }

  // 2. משקל בגרמים (כולל תמיכה בטווח כגון 150-200 גרם, 400-500 גרם)
  if (!weightGrams) {
    const gRangeMatch = s.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*(?:גרם|גר["'״׳]|ג["'״׳]|גר|ג|gr|g)(?:[^\u0590-\u05fea-z0-9]|$)/i);
    if (gRangeMatch) {
      weightMin = Math.round(parseFloat(gRangeMatch[1]));
      weightMax = Math.round(parseFloat(gRangeMatch[2]));
      weightGrams = weightMax;
    } else {
      const gMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:גרם|גר["'״׳]|ג["'״׳]|גר|ג|gr|g)(?:[^\u0590-\u05fea-z0-9]|$)/i);
      if (gMatch) {
        weightGrams = Math.round(parseFloat(gMatch[1]));
        weightMin = weightGrams;
        weightMax = weightGrams;
      }
    }
  }

  // 3. נפח: בדיקת טווח משולב (כגון 750 מ"ל - 1 ליטר)
  const mixedVolRange = s.match(/(\d+(?:\.\d+)?)\s*(?:מ["'״׳]?ל|מל|ml)\s*-\s*(\d+(?:\.\d+)?)\s*(?:ליטר|ל["'״׳]|ל|liter|l)(?:[^\u0590-\u05fea-z0-9]|$)/i);
  if (mixedVolRange) {
    volumeMin = Math.round(parseFloat(mixedVolRange[1]));
    volumeMax = Math.round(parseFloat(mixedVolRange[2]) * 1000);
    volumeMl = volumeMax;
  }

  // 4. נפח בליטרים (כולל תמיכה בטווח)
  if (!volumeMl) {
    const lRangeMatch = s.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*(?:ליטר|ל["'״׳]|ל|liter|l)(?:[^\u0590-\u05fea-z0-9]|$)/i);
    if (lRangeMatch) {
      volumeMin = Math.round(parseFloat(lRangeMatch[1]) * 1000);
      volumeMax = Math.round(parseFloat(lRangeMatch[2]) * 1000);
      volumeMl = volumeMax;
    } else {
      const lMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:ליטר|ל["'״׳]|ל|liter|l)(?:[^\u0590-\u05fea-z0-9]|$)/i);
      if (lMatch) {
        volumeMl = Math.round(parseFloat(lMatch[1]) * 1000);
        volumeMin = volumeMl;
        volumeMax = volumeMl;
      }
    }
  }

  // 5. נפח במיליליטר (כולל תמיכה בטווח כגון 150-200 מ"ל)
  if (!volumeMl) {
    const mlRangeMatch = s.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*(?:מ["'״׳]?ל|מל|ml)(?:[^\u0590-\u05fea-z0-9]|$)/i);
    if (mlRangeMatch) {
      volumeMin = Math.round(parseFloat(mlRangeMatch[1]));
      volumeMax = Math.round(parseFloat(mlRangeMatch[2]));
      volumeMl = volumeMax;
    } else {
      const mlMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:מ["'״׳]?ל|מל|ml)(?:[^\u0590-\u05fea-z0-9]|$)/i);
      if (mlMatch) {
        volumeMl = Math.round(parseFloat(mlMatch[1]));
        volumeMin = volumeMl;
        volumeMax = volumeMl;
      }
    }
  }

  // 6. מארזים וכמויות:
  // א. מילים מפורשות לכמות במארז
  if (/(?:^|\s)זוג(?:\s|$)/.test(s)) {
    packCount = 2; packMin = 2; packMax = 2;
  } else if (/שלישיי?ה|שלישיית/.test(s)) {
    packCount = 3; packMin = 3; packMax = 3;
  } else if (/רביעיי?ה|רביעיית/.test(s)) {
    packCount = 4; packMin = 4; packMax = 4;
  } else if (/חמישיי?ה|חמישיית/.test(s)) {
    packCount = 5; packMin = 5; packMax = 5;
  } else if (/שישיי?ה|שישיית/.test(s)) {
    packCount = 6; packMin = 6; packMax = 6;
  } else if (/שמינ?יי?ה|שמינ?יית/.test(s)) {
    packCount = 8; packMin = 8; packMax = 8;
  } else if (/עשיריי?ה|עשיריית/.test(s)) {
    packCount = 10; packMin = 10; packMax = 10;
  } else if (/תריסר/.test(s)) {
    packCount = 12; packMin = 12; packMax = 12;
  }

  // ב. מספר לפני יחידת מנייה מפורשת (כגון: 30 יח', 50-60 יח', 30 גלילים, 100 שקיקים, 12 ביצים)
  if (!packCount) {
    const unitCountMatch = s.match(/(\d+)(?:\s*-\s*(\d+))?\s*(?:יח['"״׳]?|יחידות|גלילים|שקיקים|ביצים|פחיות|בקבוקים)(?:[^\u0590-\u05fea-z0-9]|$)/i);
    if (unitCountMatch) {
      packMin = parseInt(unitCountMatch[1], 10);
      packMax = unitCountMatch[2] ? parseInt(unitCountMatch[2], 10) : packMin;
      packCount = packMax;
    }
  }

  // ג. מארז / תבנית + מספר (כשלאחריו אין יחידת משקל/נפח/אחוז)
  if (!packCount) {
    const packMatch = s.match(/(?:מארז|תבנית)\s*(\d+)(?:\s*-\s*(\d+))?(?!\s*(?:\.\d+)?\s*(?:גר|ג['"״׳]?|ק["'״׳]?ג|קג|קילו|מ["'״׳]?ל|מל|ליטר|ל['"״׳]?|kg|gr|ml|l\b|%))/i);
    if (packMatch && packMatch[1]) {
      packMin = parseInt(packMatch[1], 10);
      packMax = packMatch[2] ? parseInt(packMatch[2], 10) : packMin;
      packCount = packMax;
    }
  }

  // ד. כפל (כגון 4*100 גרם או 6*1.5 ליטר)
  if (!packCount) {
    const multiMatch = s.match(/(\d+)\s*[\*xX×]\s*(\d+(?:\.\d+)?)\s*(גרם|גר['"״׳]?|ג['"״׳]?|gr|g)?/i);
    if (multiMatch) {
      packCount = parseInt(multiMatch[1], 10);
      packMin = packCount;
      packMax = packCount;
      if (multiMatch[3]) {
        const totalG = Math.round(packCount * parseFloat(multiMatch[2]));
        weightGrams = totalG;
        weightMin = totalG;
        weightMax = totalG;
      }
    }
  }

  // ה. תבניות ביצים (כגון "תבנית ביצים L 30", "תבנית 30 ביצים")
  if (!packCount) {
    const trayMatch = s.match(/(?:תבנית|מארז)\s+(?:[^\d\s]+\s+)*(\d+)/i);
    if (trayMatch) {
      const n = parseInt(trayMatch[1], 10);
      if (n >= 6 && n <= 60) {
        packCount = n; packMin = n; packMax = n;
      }
    }
  }

  const isBig = /(?:אריזה\s*גדולה|משפחתי|פארטי|מיקס|מגה|ג['"״׳]?מבו|ענק|חיסכון)/i.test(s)
    || (weightGrams != null && weightGrams >= 140 && weightGrams <= 500 && /(?:חטיף|ביסלי|במבה|תפוצ[יפ]ס|דוריטוס)/i.test(s));
  const isSmall = /(?:אישי|קטן|מיני|כיס)/i.test(s)
    || (weightGrams != null && weightGrams <= 80 && /(?:חטיף|ביסלי|במבה|תפוצ[יפ]ס|דוריטוס)/i.test(s));

  return {
    weightGrams, weightMin, weightMax,
    volumeMl, volumeMin, volumeMax,
    packCount, packMin, packMax,
    isBig, isSmall
  };
}

function rangesCompatible(min1, max1, min2, max2, tolerance = 0.08) {
  const aMin = min1 ?? max1;
  const aMax = max1 ?? min1;
  const bMin = min2 ?? max2;
  const bMax = max2 ?? min2;
  if (aMin == null || bMin == null) return true;

  if (aMax < bMin) {
    return (bMin - aMax) / bMin <= tolerance;
  }
  if (bMax < aMin) {
    return (aMin - bMax) / aMin <= tolerance;
  }
  return true;
}

export function areUnitsCompatible(u1, u2) {
  if (!u1 || !u2) return true;

  // 1. בדיקת משקל (כולל תמיכה בטווחים ובסטייה של עד 8%)
  if (u1.weightGrams && u2.weightGrams) {
    if (!rangesCompatible(u1.weightMin, u1.weightMax, u2.weightMin, u2.weightMax, 0.08)) {
      return false;
    }
  }

  // 2. בדיקת נפח (כולל תמיכה בטווחים ובסטייה של עד 8%)
  if (u1.volumeMl && u2.volumeMl) {
    if (!rangesCompatible(u1.volumeMin, u1.volumeMax, u2.volumeMin, u2.volumeMax, 0.08)) {
      return false;
    }
  }

  // 2ב. אי-תאימות בין משקל לנפח (למשל 100 גרם מול 1 ליטר = 1000 מ"ל)
  if (u1.weightGrams && !u1.volumeMl && u2.volumeMl && !u2.weightGrams) {
    if (!rangesCompatible(u1.weightMin, u1.weightMax, u2.volumeMin, u2.volumeMax, 0.15)) {
      return false;
    }
  }
  if (u1.volumeMl && !u1.weightGrams && u2.weightGrams && !u2.volumeMl) {
    if (!rangesCompatible(u1.volumeMin, u1.volumeMax, u2.weightMin, u2.weightMax, 0.15)) {
      return false;
    }
  }

  // 3. בדיקת כמות במארז (כולל תמיכה בטווח כגון 50-60 יח')
  if (u1.packCount && u2.packCount) {
    if (!rangesCompatible(u1.packMin, u1.packMax, u2.packMin, u2.packMax, 0.0)) {
      return false;
    }
  }

  // 4. אי-התאמה בין מארז מרובה יחידות ליחידה בודדת (אלא אם המשקל הכולל זהה לחלוטין)
  if ((u1.packCount && u1.packCount > 1 && !u2.packCount) || (u2.packCount && u2.packCount > 1 && !u1.packCount)) {
    const sameTotalWeight = u1.weightGrams && u2.weightGrams && !u1.volumeMl && !u2.volumeMl
      && rangesCompatible(u1.weightMin, u1.weightMax, u2.weightMin, u2.weightMax, 0.05);
    if (!sameTotalWeight) {
      return false;
    }
  }

  // 5. אריזה גדולה/משפחתית מול אישית/קטנה
  if ((u1.isBig && u2.isSmall) || (u1.isSmall && u2.isBig)) {
    return false;
  }

  return true;
}
