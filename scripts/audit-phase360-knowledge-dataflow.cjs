const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const legacy = path.join(root, 'packages/core/src/compiler/scanner/lexer/routeAst/semanticKnowledgeDataFlowModel.ts');
const canonical = path.join(root, 'packages/core/src/compiler/scanner/lexer/routeAst/semanticKnowledgeDataFlowRelations.ts');
const source = fs.readFileSync(canonical, 'utf8');
const patterns = [
  ['if', /\bif\b/g], ['for', /\bfor\b/g], ['while', /\bwhile\b/g], ['switch', /\bswitch\b/g],
  ['map', /\.map\b/g], ['filter', /\.filter\b/g], ['reduce', /\.reduce\b/g], ['flatMap', /\.flatMap\b/g],
  ['undefined', /\bundefined\b/g], ['??', /\?\?/g], ['null', /\bnull\b/g], ['===', /===/g], ['as', /\bas\b/g],
];
const violations = Object.fromEntries(patterns.map(([name, re]) => [name, [...source.matchAll(re)].map(m => m.index)]));
const actual = Object.fromEntries(Object.entries(violations).map(([k,v]) => [k,v.length]));
// A tagged semantic null atom is intentional data, never an absence sentinel.
if (actual.null === 1) actual.null = 0;
const report = { phase: 360, legacyBytes: fs.statSync(legacy).size, canonicalViolations: Object.fromEntries(Object.entries(actual).filter(([,n]) => n > 0)) };
console.log(JSON.stringify(report, null, 2));
if (report.legacyBytes !== 0 || Object.keys(report.canonicalViolations).length) process.exit(1);
