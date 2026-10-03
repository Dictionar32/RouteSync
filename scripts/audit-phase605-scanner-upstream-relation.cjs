const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const root = __dirname.replace(/\/scripts$/, '');
const targets = [
  'packages/core/src/compiler/scanner/subscanners/serviceSourceStatements.ts',
  'packages/core/src/compiler/scanner/subscanners/serviceAstCanonical.ts',
];
const patterns = {
  if: /\bif\b/g, while: /\bwhile\b/g, for: /\bfor\b/g, switch: /\bswitch\b/g,
  map: /\.map\b/g, filter: /\.filter\b/g, reduce: /\.reduce\b/g, flatMap: /\.flatMap\b/g,
  undefined: /\bundefined\b/g, null: /\bnull\b/g, nullish: /\?\?/g,
  eq: /===/g, neq: /!==/g, asUnknown: /as\s+unknown/g, Set: /\bSet\b/g, Map: /\bMap\b/g,
  any: /\bany\b/g, new: /\bnew\b/g, ternary: /\?[^\n:]+:/g,
};
const count = text => Object.fromEntries(Object.entries(patterns).map(([k, p]) => [k, (text.match(p) || []).length]));
const frontier = {};
let diagnostics = 0;
for (const rel of targets) {
  const file = path.join(root, rel);
  const text = fs.readFileSync(file, 'utf8');
  const result = ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }, reportDiagnostics: true });
  diagnostics += (result.diagnostics || []).length;
  frontier[rel] = count(text);
}
let production = [];
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
  const file = path.join(dir, entry.name);
  if (entry.isDirectory()) walk(file); else if (entry.name.endsWith('.ts')) production.push(file);
});
walk(path.join(root, 'packages/core/src'));
const global = Object.fromEntries(Object.entries(patterns).map(([k, p]) => [k, production.reduce((n, file) => n + ((fs.readFileSync(file, 'utf8').match(p) || []).length), 0)]));
const zeroByte = production.filter(file => fs.statSync(file).size === 0).map(file => path.relative(root, file));
const audit = { phase: 605, frontier, productionTypeScriptFiles: production.length, modifiedFileTranspileDiagnostics: diagnostics, zeroByteProductionFiles: zeroByte, global };
fs.writeFileSync(path.join(root, 'docs/PHASE605_SCANNER_UPSTREAM_RELATION_AUDIT.json'), JSON.stringify(audit, null, 2));
console.log(JSON.stringify(audit, null, 2));
