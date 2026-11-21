import { validateCommentPayload } from './src/moderation.js';

const shouldPass = [
  { pid: 'p9771', author: 'משה', body: 'העגבניות השבוע היו מעולות וטריות מאוד!' },
  { pid: 'p160', author: 'שרה', body: 'שימו לב שהאריזה של 30 ביצים מעולה, הגיעו שלמות.' },
  { pid: 'p100', author: '', body: 'קניתי כוסברה ופטרוזיליה, היה נקי וטרי.' }
];

const shouldFail = [
  { pid: 'p1', author: 'א', body: '<script>alert(1)</script>', reason: 'XSS script tag' },
  { pid: 'p1', author: 'א', body: '<img src=x onerror=alert(1)>', reason: 'XSS img onerror' },
  { pid: 'p1', author: 'א', body: 'javascript:alert(1)', reason: 'javascript: protocol' },
  { pid: 'p1', author: 'א', body: 'כנסו ל https://spam.co.il למבצעים', reason: 'spam URL' },
  { pid: 'p1', author: 'א', body: 'מוצר חראאאא אל תקנו', reason: 'profanity with repeated chars' },
  { pid: 'p1', author: 'א', body: 'המוכר מט.ו.מ.ט.ם', reason: 'obfuscated profanity' },
  { pid: 'p1', author: 'זונה', body: 'מוצר טוב', reason: 'profanity in author name' }
];

let failed = 0;
for (const tc of shouldPass) {
  const res = validateCommentPayload(tc);
  if (!res.ok) {
    console.error('FAIL expected pass:', tc, res);
    failed++;
  }
}
for (const tc of shouldFail) {
  const res = validateCommentPayload(tc);
  if (res.ok) {
    console.error('FAIL expected block:', tc.reason, tc);
    failed++;
  }
}

if (failed > 0) process.exit(1);
console.log(`SUCCESS: All ${shouldPass.length} valid & ${shouldFail.length} security/moderation tests passed!`);
