const fs = require('fs');
const path = require('path');
const target = path.join(process.cwd(), 'packages/core/src/compiler/scanner/subscanners/typeDeriverUtils.ts');
const source = fs.readFileSync(target, 'utf8');
const patterns = {
  if: /\bif\b/g, for: /\bfor\b/g, while: /\bwhile\b/g, switch: /\bswitch\b/g,
  map: /\bmap\b/g, filter: /\bfilter\b/g, reduce: /\breduce\b/g, flatMap: /\bflatMap\b/g,
  undefined: /\bundefined\b/g, nullish: /\?\?/g, null: /\bnull\b/g, strictEquality: /===/g,
  asUnknown: /as\s+unknown/g, or: /\|\|/g, and: /&&/g, trim: /\.trim\(/g, slice: /\.slice\(/g,
  never: /\bnever\b/g, ternary: /(?<!\?)\?(?!\.)[^\n:;{}]+:/g,
};
const counts = Object.fromEntries(Object.entries(patterns).map(([k,p]) => [k,(source.match(p)||[]).length]));
console.log(JSON.stringify({target:path.relative(process.cwd(),target),counts,closedSurfaceClean:Object.values(counts).every(v=>v===0)},null,2));
