const fs = require('fs');
const path = require('path');

const targets = [
  'packages/core/src/compiler/scanner/subscanners/resource/resourceBindingTraversalBuilder.ts',
  'packages/core/src/compiler/scanner/subscanners/model/memberPropertiesParser.ts',
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
  ternary: /(?<!\?)\?(?!\.)[^\n:;{}]+:/g,
};

const counts = {};
for (const file of targets) {
  const text = fs.readFileSync(path.resolve(file), 'utf8');
  counts[file] = Object.fromEntries(Object.entries(patterns).map(([name, re]) => [name, (text.match(re) || []).length]));
}

const aggregate = Object.fromEntries(Object.keys(patterns).map(name => [name, targets.reduce((sum, file) => sum + counts[file][name], 0)]));
const closedSurfaceClean = Object.values(aggregate).every(value => value === 0);

console.log(JSON.stringify({ phase: 520, targets, counts, aggregate, closedSurfaceClean }, null, 2));
if (!closedSurfaceClean) process.exitCode = 1;
