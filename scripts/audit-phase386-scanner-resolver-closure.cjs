const fs = require('fs');
const path = require('path');
const roots = [
  'packages/core/src/utils/naming/lexer/tokenizer.ts',
  'packages/cli/src/resolvers/SemanticResolutionKernel.ts',
  'packages/cli/src/resolvers/plugins/PrimitiveResolver.ts',
];
const patterns = Object.freeze({
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
  null: /\bnull\b/g,
  strictEquality: /===|!==/g,
  asUnknown: /\bas\s+unknown\b/g,
});
const result = roots.map(file => {
  const source = fs.readFileSync(path.resolve(file), 'utf8');
  return { file, counts: Object.fromEntries(Object.entries(patterns).map(([name, pattern]) => [name, (source.match(pattern) || []).length])) };
});
console.log(JSON.stringify({ phase: 386, scope: roots, result }, null, 2));
