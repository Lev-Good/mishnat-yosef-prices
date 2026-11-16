import fs from 'fs';
import path from 'path';

console.log('=== Starting In-Depth Codebase Audit ===\n');

const filesToAudit = [
  'קבצי התוסף/core.js',
  'קבצי התוסף/background.js',
  'קבצי התוסף/inject.js',
  'קבצי התוסף/transport.js',
  'mishnat-yosef.user.js',
  'scripts/update_prices.mjs',
  'scripts/parse_units.mjs'
];

const issues = [];

function addIssue(file, line, type, description, severity = 'WARNING') {
  issues.push({ file, line, type, description, severity });
}

// 1. Audit each file
for (const relPath of filesToAudit) {
  if (!fs.existsSync(relPath)) {
    console.log(`Skipping missing file: ${relPath}`);
    continue;
  }
  const code = fs.readFileSync(relPath, 'utf8');
  const lines = code.split('\n');

  console.log(`Auditing ${relPath} (${lines.length} lines)...`);

  // Check 1: Syntax check with new Function()
  try {
    // For ES modules (update_prices.mjs, parse_units.mjs), new Function won't parse import/export,
    // so we use node --check via child_process later. For scripts, new Function parses syntax.
    if (!relPath.endsWith('.mjs')) {
      new Function(code);
    }
  } catch (syntaxErr) {
    addIssue(relPath, syntaxErr.lineNumber || 1, 'SYNTAX_ERROR', syntaxErr.message, 'CRITICAL');
  }

  // Line-by-line checks
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];

    // Check 2: JSON.parse without try-catch nearby
    if (line.includes('JSON.parse(') && !line.includes('try') && !line.includes('// safe')) {
      // Look back 10 lines and look forward 5 lines for try/catch
      const start = Math.max(0, i - 10);
      const end = Math.min(lines.length, i + 6);
      const surrounding = lines.slice(start, end).join('\n');
      if (!surrounding.includes('try {') && !surrounding.includes('try{')) {
        addIssue(relPath, lineNum, 'UNGUARDED_JSON_PARSE', `JSON.parse call without local try...catch: "${line.trim()}"`, 'MODERATE');
      }
    }

    // Check 3: Raw innerHTML assignments without escaping
    if (line.includes('.innerHTML =') || line.includes('.innerHTML+=') || line.includes('.innerHTML +=') || line.includes('.innerHTML=')) {
      // Check if it's interpolating variables like ${item.name} or ${prod.name} or ${order...}
      if (line.includes('${') && !line.includes('escapeHtml') && !line.includes('esc(') && !line.includes('encodeHTML')) {
        // If it interpolates names or user data without esc, flag it
        if (/\$\{(item|prod|p|order|row|sale|data|title|msg|text|val|key|cat)\.[a-zA-Z0-9_]+/i.test(line)) {
          addIssue(relPath, lineNum, 'POTENTIAL_XSS_OR_UNESCAPED_HTML', `innerHTML interpolation without escapeHtml: "${line.trim()}"`, 'LOW');
        }
      }
    }

    // Check 4: chrome.storage.sync.set with large payloads
    if (line.includes('chrome.storage.sync.set')) {
      // Check surrounding lines to see what is being stored
      const start = Math.max(0, i - 5);
      const end = Math.min(lines.length, i + 5);
      const surrounding = lines.slice(start, end).join('\n');
      if (surrounding.includes('history') || surrounding.includes('sales') || surrounding.includes('prices') || surrounding.includes('cache')) {
        addIssue(relPath, lineNum, 'STORAGE_SYNC_QUOTA_RISK', `chrome.storage.sync.set used for potentially large data: "${line.trim()}"`, 'HIGH');
      }
    }

    // Check 5: Accidentally creating global variables (assignment without declaration at function level)
    // Common typos: assignment to undeclared identifier like `i = 0` inside loop
    if (/^\s*([a-zA-Z0-9_$]+)\s*=\s*[^=]/.test(line)) {
      const match = line.match(/^\s*([a-zA-Z0-9_$]+)\s*=\s*/);
      if (match) {
        const varName = match[1];
        if (['window', 'document', 'module', 'exports', 'globalThis', 'self', 'chrome'].includes(varName)) continue;
        // Check if varName is single letter (like i, j, k, x, y) which often indicates leaked loop counters
        if (['i', 'j', 'k', 'idx', 'item', 'val', 'key', 'res', 'ret'].includes(varName)) {
          // Check if preceded by for (varName = ...) or something
          if (!line.includes('for (') && !line.includes('for(')) {
            addIssue(relPath, lineNum, 'ACCIDENTAL_GLOBAL_LEAK', `Possible assignment to undeclared variable '${varName}': "${line.trim()}"`, 'MODERATE');
          }
        }
      }
    }

    // Check 6: Uncaught fetch calls
    if (line.includes('fetch(') && !line.includes('return fetch') && !line.includes('await fetch')) {
      const start = Math.max(0, i - 5);
      const end = Math.min(lines.length, i + 10);
      const surrounding = lines.slice(start, end).join('\n');
      if (!surrounding.includes('.catch(') && !surrounding.includes('try {')) {
        addIssue(relPath, lineNum, 'UNCAUGHT_FETCH', `fetch() without await/try-catch or .catch: "${line.trim()}"`, 'MODERATE');
      }
    }

    // Check 7: Dangerous regex (potential ReDoS or broken regex)
    const regexMatch = line.match(/\/([^\/\n\\]*(?:\\.[^\/\n\\]*)*)\/([gimsuy]*)/);
    if (regexMatch) {
      const pattern = regexMatch[1];
      // Check for nested quantifiers like (a+)+ or (.*a)+
      if (/(\([^\)]*[\+\*][^\)]*\))[\+\*]/.test(pattern)) {
        addIssue(relPath, lineNum, 'POTENTIAL_REDOS_REGEX', `Potentially vulnerable regex with nested quantifiers: /${pattern}/`, 'HIGH');
      }
    }
  }
}

// 2. Parity check between core.js and mishnat-yosef.user.js
console.log('\n--- Checking Parity between core.js and mishnat-yosef.user.js ---');
const coreCode = fs.readFileSync('קבצי התוסף/core.js', 'utf8');
const userCode = fs.readFileSync('mishnat-yosef.user.js', 'utf8');

// Check key functions and constants
const keyItems = [
  'findMarketComparison',
  'parseProductUnits',
  'areUnitsCompatible',
  'containsWholePhrase',
  'PRODUCE_EXCLUDED_RE',
  'shaareiRevaha',
  'lastQty',
  'totalQty',
  'myfam-fs-btn',
  'cuts-notice',
  'ALL_CHAINS',
  'DEFAULT_SELECTED_CHAINS'
];

for (const item of keyItems) {
  const inCore = coreCode.includes(item);
  const inUser = userCode.includes(item);
  if (inCore !== inUser) {
    addIssue('mishnat-yosef.user.js', 1, 'PARITY_MISMATCH', `Feature/token '${item}' present in core.js (${inCore}) but not in mishnat-yosef.user.js (${inUser})`, 'CRITICAL');
  }
}

// 3. Output results
console.log(`\n=== Audit Finished: Found ${issues.length} potential items ===\n`);
const severities = { CRITICAL: 0, HIGH: 0, MODERATE: 0, LOW: 0, WARNING: 0 };
for (const iss of issues) {
  severities[iss.severity] = (severities[iss.severity] || 0) + 1;
  console.log(`[${iss.severity}] ${iss.file}:${iss.line} - ${iss.type}`);
  console.log(`   ${iss.description}`);
}
console.log('\nSeverity summary:', severities);
