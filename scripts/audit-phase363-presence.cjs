const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const files = [
  'packages/core/src/types/upstream/presence.ts',
  'packages/core/src/semantic/kernel/semanticRelations.ts',
];
const patterns = {
  if: /\bif\b/g,
  for: /\bfor\b/g,
  while: /\bwhile\b/g,
  switch: /\bswitch\b/g,
  collection: /\.(?:map|filter|reduce|flatMap)\s*\(/g,
  undefined: /\bundefined\b/g,
  coalesce: /\?\?/g,
  null: /\bnull\b/g,
  strictEqual: /===|!==/g,
  assertion: /\bas\b/g,
};
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
const result = Object.fromEntries(files.map(file => {
  const source = strip(fs.readFileSync(path.join(root, file), 'utf8'));
  return [file, Object.fromEntries(Object.entries(patterns).map(([key, pattern]) => [key, (source.match(pattern) || []).length]))];
}));
const violations = Object.fromEntries(Object.entries(result).filter(([, counts]) => Object.values(counts).some(Boolean)));
console.log(JSON.stringify({ phase: 363, result, violations }, null, 2));
if (Object.keys(violations).length) process.exit(1);
