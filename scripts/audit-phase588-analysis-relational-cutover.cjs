const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const files = [
  'packages/core/src/compiler/passes/graph/graphAnalyzer.ts',
  'packages/core/src/compiler/passes/graph/topologicalSorter.ts',
  'packages/core/src/compiler/passes/PassGraph.ts',
];
const patterns = {
  if: /\bif\b/g, for: /\bfor\b/g, while: /\bwhile\b/g, switch: /\bswitch\b/g,
  map: /\.\s*map\s*\(/g, filter: /\.\s*filter\s*\(/g, reduce: /\.\s*reduce\s*\(/g,
  flatMap: /\.\s*flatMap\s*\(/g, undefined: /\bundefined\b/g, null: /\bnull\b/g,
  coalesce: /\?\?/g, strictEqual: /===/g, strictNotEqual: /!==/g, and: /&&/g, or: /\|\|/g,
  asUnknown: /\bas unknown\b/g, set: /\bSet\b/g, any: /\bany\b/g, new: /\bnew\b/g,
};
const report = files.map(file => {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const counts = Object.fromEntries(Object.entries(patterns).map(([key, pattern]) => [key, (source.match(pattern) || []).length]));
  return { file, counts };
});
fs.writeFileSync(path.join(root, 'docs/PHASE588_ANALYSIS_RELATIONAL_CUTOVER_AUDIT.json'), JSON.stringify({ phase: 588, files: report }, null, 2));
console.log(JSON.stringify(report, null, 2));
