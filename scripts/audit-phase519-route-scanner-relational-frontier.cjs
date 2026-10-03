const fs = require('node:fs');
const path = require('node:path');
const targets = [
  'packages/core/src/compiler/scanner/subscanners/RouteScanner.ts',
  'packages/core/src/compiler/scanner/subscanners/route-scanner/routeEmitter.ts',
];
const patterns = {
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
  ternary: /(?<!\?)\?(?!\.|\?)[^\n:;{}]+:/g,
};
const results = {};
let clean = true;
for (const rel of targets) {
  const text = fs.readFileSync(path.resolve(rel), 'utf8');
  const counts = Object.fromEntries(Object.entries(patterns).map(([name, re]) => [name, (text.match(re) || []).length]));
  results[rel] = counts;
  clean &&= Object.values(counts).every(v => v === 0);
}
console.log(JSON.stringify({ phase: 519, targets: results, closedSurfaceClean: clean }, null, 2));
process.exitCode = clean ? 0 : 1;
