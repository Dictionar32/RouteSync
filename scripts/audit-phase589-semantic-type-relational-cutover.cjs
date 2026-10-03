const fs = require('fs');
const path = require('path');

const roots = [
  'packages/core/src/compiler/domain/common/resolved-types',
  'packages/core/src/compiler/domain/common/ts-lowerer',
  'packages/core/src/compiler/domain/common/semantic-resolver',
  'packages/core/src/compiler/domain/common/SemanticTypeResolver.ts',
  'packages/core/src/compiler/scanner/binders/resource/resourceBinder.ts',
  'packages/core/src/compiler/scanner/descriptors/manifest/resourceRouteGroupDescriptor.ts',
  'packages/core/src/compiler/scanner/descriptors/validation/validationRuleEntry.ts',
  'packages/core/src/compiler/scanner/subscanners/FormRequestScanner.ts',
  'packages/core/src/compiler/scanner/subscanners/resource/resourceUpstreamExpressionCanonical.ts',
];

const patterns = Object.freeze({
  if: /\bif\b/g,
  for: /\bfor\b/g,
  while: /\bwhile\b/g,
  switch: /\bswitch\b/g,
  map: /\.map\s*\(/g,
  filter: /\.filter\s*\(/g,
  reduce: /\.reduce\s*\(/g,
  flatMap: /\.flatMap\s*\(/g,
  undefined: /\bundefined\b/g,
  nullish: /\?\?/g,
  null: /\bnull\b/g,
  strictEqual: /===/g,
  strictNotEqual: /!==/g,
  asUnknown: /\bas\s+unknown\b/g,
  set: /\bSet\b/g,
  any: /\bany\b/g,
  new: /\bnew\b/g,
});

const filesOf = entry => {
  const absolute = path.resolve(entry);
  const stat = fs.statSync(absolute);
  if (stat.isFile()) return [entry];
  const out = [];
  const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).forEach(item => {
    const next = path.join(dir, item.name);
    if (item.isDirectory()) walk(next);
    else if (item.isFile() && next.endsWith('.ts') && !next.endsWith('.test.ts')) out.push(path.relative(process.cwd(), next));
  });
  walk(absolute);
  return out;
};

const files = roots.flatMap(filesOf);
const rows = files.map(file => {
  const source = fs.readFileSync(file, 'utf8');
  const counts = Object.fromEntries(Object.entries(patterns).map(([name, pattern]) => [name, [...source.matchAll(pattern)].length]));
  return { file, counts };
});
const aggregate = Object.fromEntries(Object.keys(patterns).map(key => [key, rows.reduce((sum, row) => sum + row.counts[key], 0)]));
const report = Object.freeze({ phase: 589, scope: roots, files: rows.length, aggregate, rows });
fs.writeFileSync('docs/PHASE589_SEMANTIC_TYPE_RELATIONAL_CUTOVER_AUDIT.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
