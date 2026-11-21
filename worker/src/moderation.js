/**
 * worker/src/moderation.js
 * סינון אבטחה (מניעת הזרקת קוד/XSS/קישורי ספאם) וחסימת מילים לא נקיות בעברית ובאנגלית.
 */

export function sanitizeText(raw, maxLen = 300) {
  if (typeof raw !== 'string') return '';
  return raw
    // הסרת תווים נסתרים (Zero-width, BiDi overrides, control chars)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
    .slice(0, maxLen);
}

/**
 * זיהוי ניסיונות הזרקת קוד (HTML / JS / XSS / קישורי ספאם).
 */
export function detectCodeOrLink(text) {
  if (!text) return null;

  // תגיות HTML כלשהן (<script>, <img>, <a>, <svg>, <iframe וכו')
  if (/<\s*\/?\s*[a-z!/?][^>]*>/i.test(text) || /<\s*(?:script|iframe|object|embed|svg|img|style|link|meta|form|input)/i.test(text)) {
    return 'לא ניתן לפרסם קוד או תגיות HTML בהערה.';
  }
  // פרוטוקולים מסוכנים ומאזיני אירועים
  if (/(?:javascript|vbscript|data\s*:\s*text\/html)\s*:/i.test(text) || /\bon(?:error|load|click|mouseover|focus|input|submit)\s*=/i.test(text)) {
    return 'לא ניתן לפרסם קוד בהערה.';
  }
  // ביטויי הזרקת תבניות / קוד מובהקים
  if (/\{\{[\s\S]*?\}\}|\$\{[\s\S]*?\}|document\.cookie|window\.location|eval\s*\(|fetch\s*\(/i.test(text)) {
    return 'לא ניתן לפרסם קוד בהערה.';
  }
  // חסימת קישורים חיצוניים (מונע ספאם פרסומי ופישינג)
  if (/(?:https?:\/\/|www\.|[a-z0-9-]+\.(?:com|co\.il|org\.il|net|io|me|tk|xyz|ru|cn)\b)/i.test(text)) {
    return 'לא ניתן לפרסם קישורים או כתובות אינטרנט בהערות.';
  }

  return null;
}

/**
 * נירמול טקסט לבדיקת מילים לא ראויות:
 * מסיר ניקוד, מפרידי תווים מלאכותיים (כמו כ.ל.ב או מ*י*ל*ה) ומכווץ אותיות חוזרות.
 */
function normalizeForModeration(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0591-\u05C7]/g, '') // הסרת ניקוד עברי
    .replace(/["'״׳`´*_\-.~^|\\/]/g, '') // הסרת תווים שמשמשים לעקיפת סינון
    .replace(/(.)\1{2,}/g, '$1$1') // כיווץ אותיות חוזרות (חראאאא -> חראא)
    .replace(/\s+/g, ' ')
    .trim();
}

// רשימת מילים/שורשים חסומים (נבדקים בגבולות מילה כדי לא לחסום מילים תמימות בעברית)
const BLOCKED_EXACT_WORDS = [
  // עברית - קללות, גסויות וביטויים פוגעניים
  'זין', 'זונה', 'זונות', 'מזדיין', 'מזדיינת', 'מזדיינים', 'להזדיין', 'תזדיין', 'יזדיין',
  'כוסאמק', 'כוסעמק', 'כוסאמא', 'כוסאחותך', 'בן זונה', 'בת זונה', 'בני זונות',
  'שרמוטה', 'שרמוטות', 'מניאק', 'מניאקים', 'חרא', 'חראא', 'מחורבן', 'מחורבנת',
  'מטומטם', 'מטומטמת', 'מטומטמים', 'מפגר', 'מפגרת', 'מפגרים', 'אידיוט', 'אידיוטית',
  'דביל', 'דבילית', 'טמבל', 'סתום', 'סתומה', 'זבלים', 'נבלה', 'נוכלים', 'גנבים', 'רמאים',
  'תיחנק', 'תמות', 'ימות', 'שימות', 'לך לעזאזל', 'לעזאזל', 'קיבינימט', 'כוסית',
  'חתיכת זבל', 'חתיכת חרא', 'תחת', 'בולבול', 'שפיך', 'אונס', 'נאצי', 'נאצים',
  // אנגלית
  'fuck', 'fucking', 'fucker', 'shit', 'bitch', 'asshole', 'bastard', 'dick', 'pussy', 'cunt', 'whore', 'slut', 'porn', 'sex', 'nazi'
];

// גרסה מכווצת גם לכפילות אותיות (חראא -> חרא)
function collapseAllRepeats(text) {
  return text.replace(/(.)\1+/g, '$1');
}

const HEB_BOUNDARY_START = '(?:^|\\s)';
const HEB_BOUNDARY_END = '(?=$|\\s)';

const BLOCKED_REGEXES = BLOCKED_EXACT_WORDS.map(w => {
  const esc = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`${HEB_BOUNDARY_START}${esc}${HEB_BOUNDARY_END}`, 'i');
});

const BLOCKED_COLLAPSED_REGEXES = BLOCKED_EXACT_WORDS.map(w => {
  const collapsed = collapseAllRepeats(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`${HEB_BOUNDARY_START}${collapsed}${HEB_BOUNDARY_END}`, 'i');
});

export function containsProfanity(text) {
  if (!text) return false;
  const norm = normalizeForModeration(text);
  const collapsed = collapseAllRepeats(norm);
  for (let i = 0; i < BLOCKED_REGEXES.length; i++) {
    if (BLOCKED_REGEXES[i].test(norm) || BLOCKED_COLLAPSED_REGEXES[i].test(collapsed)) {
      return true;
    }
  }
  return false;
}

export function validateCommentPayload({ pid, author, body }) {
  const cleanPid = sanitizeText(String(pid || ''), 40);
  if (!cleanPid || !/^[a-z0-9_-]{2,40}$/i.test(cleanPid)) {
    return { ok: false, error: 'מזהה מוצר לא תקין.' };
  }

  const cleanAuthor = sanitizeText(author || 'קונה אנונימי', 24) || 'קונה אנונימי';
  const cleanBody = sanitizeText(body || '', 300);

  if (cleanBody.length < 2) {
    return { ok: false, error: 'ההערה קצרה מדי (מינימום 2 תווים).' };
  }

  const authorCodeErr = detectCodeOrLink(cleanAuthor);
  if (authorCodeErr) return { ok: false, error: authorCodeErr };

  const bodyCodeErr = detectCodeOrLink(cleanBody);
  if (bodyCodeErr) return { ok: false, error: bodyCodeErr };

  if (containsProfanity(cleanAuthor) || containsProfanity(cleanBody)) {
    return { ok: false, error: 'ההערה מכילה מילים שאינן מותרות לפרסום. נא לשמור על שיח נקי ומכבד.' };
  }

  return { ok: true, pid: cleanPid, author: cleanAuthor, body: cleanBody };
}
