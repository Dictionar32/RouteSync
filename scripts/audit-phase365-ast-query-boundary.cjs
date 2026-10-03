const fs = require('fs');
const files = [
  'packages/core/src/compiler/scanner/lexer/astClassifier.ts',
  'packages/core/src/compiler/scanner/subscanners/queryProducer.ts',
];
const patterns = {
  hostIf: /\bif\s*\(/,
  hostFor: /\bfor\s*\(/,
  hostWhile: /\bwhile\s*\(/,
  hostSwitch: /\bswitch\s*\(/,
  map: /\.map\s*\(/,
  filter: /\.filter\s*\(/,
  reduce: /\.reduce\s*\(/,
  flatMap: /\.flatMap\s*\(/,
  undefined: /\bundefined\b/,
  coalesce: /\?\?/,
  hostNull: /\bnull\b/,
  strictEqual: /===|!==/,
  assertion: /\bas\s+[A-Za-z_{]/,
  ternary: /\?[^\n:]+:/,
};
const result = Object.fromEntries(files.map(file => {
  const text = fs.readFileSync(file, 'utf8');
  const violations = Object.fromEntries(Object.entries(patterns).filter(([, p]) => p.test(text)).map(([k]) => [k, true]));
  return [file, violations];
}));
console.log(JSON.stringify({ phase: 365, result }, null, 2));
if (Object.values(result).some(v => Object.keys(v).length)) process.exit(1);
