import fs from 'fs';

const code = fs.readFileSync('קבצי התוסף/core.js', 'utf8');
const lines = code.split('\n');

console.log('--- Checking for Unescaped Dynamic HTML in core.js ---');
let found = 0;
lines.forEach((l, idx) => {
  const lineNum = idx + 1;
  if ((l.includes('.innerHTML') || l.includes('document.write') || l.includes('html +=') || l.includes('rowsHtml +=') || l.includes('bodyHtml +=')) && l.includes('${')) {
    const matches = l.match(/\$\{([^}]+)\}/g);
    if (matches) {
      matches.forEach(m => {
        const expr = m.slice(2, -1).trim();
        // Check if expr references item properties or user text that might contain special characters (<, >, &, ")
        if (/(?:name|title|note|remark|user|query|search|label|category|catName|brand)/i.test(expr) && 
            !expr.includes('escapeHtml') && 
            !expr.includes('esc(') && 
            !expr.includes('encodeHTML') &&
            !expr.includes('replace(') &&
            !expr.includes('Boolean') &&
            !expr.includes('.length') &&
            !expr.includes('indexOf') &&
            !expr.includes('?') && // ternary often has static strings
            !expr.startsWith('"') &&
            !expr.startsWith("'")) {
          console.log(`Line ${lineNum}: ${m} in: ${l.trim().slice(0, 120)}`);
          found++;
        }
      });
    }
  }
});
console.log(`Done. Found ${found} potential unescaped variables.`);
