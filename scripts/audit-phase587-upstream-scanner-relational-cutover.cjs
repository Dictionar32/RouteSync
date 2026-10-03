const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const roots = [
  'packages/core/src/types/upstream',
  'packages/core/src/compiler/scanner/subscanners/controller/controllerDataflowContract.ts',
  'packages/core/src/compiler/scanner/subscanners/scannerUtils.ts',
];
const excluded = new Set(['__tests__']);
const patterns = {
  if: /\bif\b/g,
  for: /\bfor\b/g,
  while: /\bwhile\b/g,
  switch: /\bswitch\b/g,
  ternary: /\?[^?\n:]+:/g,
  map: /\.map\s*\(/g,
  filter: /\.filter\s*\(/g,
  reduce: /\.reduce\s*\(/g,
  flatMap: /\.flatMap\s*\(/g,
  undefined: /\bundefined\b/g,
  nullish: /\?\?/g,
  strictEq: /===/g,
  strictNeq: /!==/g,
  and: /&&/g,
  or: /\|\|/g,
  asUnknown: /as\s+unknown/g,
  set: /\bSet\b/g,
  mapType: /\bMap\b/g,
  any: /\bany\b/g,
  new: /\bnew\s+[A-Za-z_$][\w$]*\s*\(/g,
};
function filesFor(entry) {
  const target = path.join(root, entry);
  if (fs.statSync(target).isFile()) return [target];
  const out = [];
  const visit = dir => {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      if (item.isDirectory() && !excluded.has(item.name)) visit(path.join(dir, item.name));
      if (item.isFile() && /\.tsx?$/.test(item.name)) out.push(path.join(dir, item.name));
    }
  };
  visit(target);
  return out;
}
const files = roots.flatMap(filesFor);
const rows = files.map(file => {
  const source = fs.readFileSync(file, 'utf8');
  const counts = Object.fromEntries(Object.entries(patterns).map(([name, re]) => [name, (source.match(re) || []).length]));
  return { file: path.relative(root, file), ...counts };
});
const aggregate = Object.fromEntries(Object.keys(patterns).map(name => [name, rows.reduce((sum, row) => sum + row[name], 0)]));
const changed = rows.filter(row => Object.values(row).slice(1).some(value => value > 0));
const report = {
  phase: 587,
  scope: roots,
  scannedFiles: files.length,
  aggregate,
  filesWithHostConstructs: changed,
  closedSurfaceClean: changed.length === 0,
  semanticVocabularyNote: 'Source-language words such as any/null and comments are not semantic implementation authority; this audit is a lexical frontier detector and must be interpreted with source-AST evidence where necessary.',
};
fs.writeFileSync(path.join(root, 'docs/PHASE587_UPSTREAM_SCANNER_RELATIONAL_CUTOVER_AUDIT.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
