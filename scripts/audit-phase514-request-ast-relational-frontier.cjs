const fs = require('fs');
const path = require('path');

const target = path.join(process.cwd(), 'packages/core/src/compiler/scanner/subscanners/requestAstCanonical.ts');
const source = fs.readFileSync(target, 'utf8');
const checks = {
  if: /\bif\b/g,
  for: /\bfor\b/g,
  while: /\bwhile\b/g,
  switch: /\bswitch\b/g,
  map: /\bmap\b/g,
  filter: /\bfilter\b/g,
  reduce: /\breduce\b/g,
  flatMap: /\bflatMap\b/g,
  undefined: /\bundefined\b/g,
  nullish: /\?\?/g,
  null: /\bnull\b/g,
  strictEquality: /===/g,
  asUnknown: /as\s+unknown/g,
  or: /\|\|/g,
  and: /&&/g,
  trim: /\.trim\s*\(/g,
  slice: /\.slice\s*\(/g,
  never: /\bnever\b/g,
  ternary: /(?<!\?)\?(?!\.)[^\n:;{}]+:/g,
};
const counts = Object.fromEntries(Object.entries(checks).map(([name, regex]) => [name, (source.match(regex) || []).length]));
const failed = Object.entries(counts).filter(([, count]) => count !== 0);
const result = { target: path.relative(process.cwd(), target), counts, closedSurfaceClean: failed.length === 0 };
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.closedSurfaceClean ? 0 : 1;
