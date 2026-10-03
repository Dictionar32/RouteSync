const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const targets = [
  'packages/core/src/semantic/kernel/syntax/tokenCursorRelations.ts',
];
const forbidden = /\b(if|while|for|switch)\b|\.map\(|\.filter\(|\.reduce\(|\.flatMap\(|\bundefined\b|\?\?|===|!==|\bas\b/;
const failures = targets.flatMap(file => {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  return forbidden.test(text) ? [file] : [];
});
console.log(`Phase 341 relational cursor authority violations: ${failures.length}`);
if (failures.length) process.exitCode = 1;
