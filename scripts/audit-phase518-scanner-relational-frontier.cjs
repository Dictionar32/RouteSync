const fs = require('fs');
const path = require('path');
const targets = [
  'packages/core/src/compiler/scanner/subscanners/FormRequestScanner.ts',
  'packages/core/src/compiler/scanner/descriptors/validation/validationRuleSet.ts',
].map(value => path.join(process.cwd(), value));
const patterns = {
  if: /\bif\b/g, for: /\bfor\b/g, while: /\bwhile\b/g, switch: /\bswitch\b/g,
  map: /\bmap\b/g, filter: /\bfilter\b/g, reduce: /\breduce\b/g, flatMap: /\bflatMap\b/g,
  undefined: /\bundefined\b/g, nullish: /\?\?/g, null: /\bnull\b/g, strictEquality: /===/g,
  asUnknown: /as\s+unknown/g, or: /\|\|/g, and: /&&/g, trim: /\.trim\(/g, slice: /\.slice\(/g,
  never: /\bnever\b/g, ternary: /(?<!\?)\?(?!\.)[^\n:;{}]+:/g,
};
const results = targets.map(target => {
  const source = fs.readFileSync(target, 'utf8');
  const counts = Object.fromEntries(Object.entries(patterns).map(([key, pattern]) => [key, (source.match(pattern) || []).length]));
  return { target: path.relative(process.cwd(), target), counts, closedSurfaceClean: Object.values(counts).every(value => value === 0) };
});
const closedSurfaceClean = results.every(result => result.closedSurfaceClean);
console.log(JSON.stringify({ phase: 518, results, closedSurfaceClean }, null, 2));
process.exitCode = closedSurfaceClean ? 0 : 1;
