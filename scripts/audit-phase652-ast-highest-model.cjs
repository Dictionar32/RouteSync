const fs = require('fs');
const path = require('path');

const ROOT = path.resolve('packages/core/src');
const scopes = [
  'compiler/scanner',
  'graph',
  'compiler/analysis',
  'compiler/domain/common/ts-lowerer',
];
const rules = [
  ['if', /\bif\b/g], ['while', /\bwhile\b/g], ['for', /\bfor\b/g], ['switch', /\bswitch\b/g],
  ['map', /\.map\s*\(/g], ['filter', /\.filter\s*\(/g], ['reduce', /\.reduce\s*\(/g], ['flatMap', /\.flatMap\s*\(/g],
  ['undefined', /\bundefined\b/g], ['nullish', /\?\?/g], ['strictEq', /===/g], ['strictNeq', /!==/g],
  ['asUnknown', /\bas\s+unknown\b/g], ['Set', /\b(?:new\s+)?Set\s*<?/g], ['Map', /\b(?:new\s+)?Map\s*<?/g],
  ['any', /\bany\b/g], ['new', /\bnew\b/g],
];
const files = [];
const walk = dir => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.isFile() && p.endsWith('.ts') && !p.includes('__tests__') && !p.includes('.test.')) files.push(p);
  }
};
for (const scope of scopes) walk(path.join(ROOT, scope));
const rows = files.map(file => {
  const text = fs.readFileSync(file, 'utf8');
  const counts = Object.fromEntries(rules.map(([name, rx]) => [name, (text.match(rx) || []).length]));
  return { file: path.relative(process.cwd(), file), counts };
}).filter(row => Object.values(row.counts).some(Boolean));
const aggregate = Object.fromEntries(rules.map(([name]) => [name, rows.reduce((n, row) => n + row.counts[name], 0)]));
const astContract = fs.readFileSync(path.join(ROOT, '../src/types/upstream/ast.ts'), 'utf8');
const interfaceChecks = {
  semanticAstNode: /export type SemanticAstNode/.test(astContract),
  canonicalAlias: /export type CanonicalAstNode/.test(astContract),
  identity: /readonly identity: AstNodeIdentity/.test(astContract),
  evidence: /readonly evidence: AstEvidence/.test(astContract),
  provenance: /readonly provenance: AstProvenance/.test(astContract),
  derivation: /readonly derivation: AstDerivation/.test(astContract),
  derivationTrace: /export type AstDerivationTrace/.test(astContract),
};
const emptyProductionFiles = [];
for (const scope of scopes) {
  const dir = path.join(ROOT, scope);
  const collect = d => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) collect(p);
      else if (entry.isFile() && p.endsWith('.ts') && fs.statSync(p).size === 0) emptyProductionFiles.push(path.relative(process.cwd(), p));
    }
  };
  collect(dir);
}
console.log(JSON.stringify({
  phase: 652,
  model: 'semantic-attributed-proof-carrying-ast',
  scope: scopes,
  interfaceChecks,
  aggregate,
  highestRisk: rows.sort((a,b) => Object.values(b.counts).reduce((x,y)=>x+y,0) - Object.values(a.counts).reduce((x,y)=>x+y,0)).slice(0, 20),
  emptyProductionFiles,
  note: 'Lexical counts are frontier evidence. PHP source vocabulary remains valid evidence; host-language constructs are candidates for semantic-relational replacement only when they control meaning.'
}, null, 2));
