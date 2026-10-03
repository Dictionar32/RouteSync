const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const targets = [
  'packages/core/src/semantic/SymbolTable.ts',
  'packages/core/src/semantic/CycleDetector.ts',
  'packages/core/src/types/upstream/collections.ts',
];
const forbidden = {
  if: /\bif\s*\(/g,
  for: /\bfor\s*\(/g,
  while: /\bwhile\s*\(/g,
  switch: /\bswitch\s*\(/g,
  map: /\.map\s*\(/g,
  filter: /\.filter\s*\(/g,
  reduce: /\.reduce\s*\(/g,
  flatMap: /\.flatMap\s*\(/g,
  undefined: /\bundefined\b/g,
  nullish: /\?\?/g,
  strictEqual: /===/g,
  strictNotEqual: /!==/g,
  asAssertion: /\bas\s+(?!const\b)/g,
  unknownType: /\bunknown\b/g,
};
const result = { phase: 372, files: targets.length, forbidden: {}, violations: [] };
for (const [key, re] of Object.entries(forbidden)) result.forbidden[key] = 0;
for (const relative of targets) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  for (const [key, re] of Object.entries(forbidden)) {
    const count = source.match(re)?.length ?? 0;
    result.forbidden[key] += count;
    if (count) result.violations.push({ file: relative, kind: key, count });
  }
}
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.violations.length ? 1 : 0;
