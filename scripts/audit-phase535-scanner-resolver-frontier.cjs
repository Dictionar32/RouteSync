const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const targets = [
  'packages/core/src/compiler/scanner/subscanners/model/columnInferrer.ts',
  'packages/core/src/compiler/scanner/subscanners/controller/actionValidationExtractor.ts',
];
const forbidden = {
  if: /\bif\b/g, for: /\bfor\b/g, while: /\bwhile\b/g, switch: /\bswitch\b/g,
  map: /\bmap\b/g, filter: /\bfilter\b/g, reduce: /\breduce\b/g, flatMap: /\bflatMap\b/g,
  undefined: /\bundefined\b/g, nullish: /\?\?/g, null: /\bnull\b/g, strictEquality: /===/g,
  asUnknown: /as\s+unknown/g, or: /\|\|/g, and: /&&/g, trim: /\btrim\b/g, slice: /\bslice\b/g,
  never: /\bnever\b/g, indexPlus123: /index\s*\+\s*123/g,
  ternary: /\?\s*[^:\n]+\s*:/g,
};
const root = path.resolve(__dirname, '..');
const results = targets.map(rel => {
  const file = path.join(root, rel);
  const source = fs.readFileSync(file, 'utf8');
  const counts = Object.fromEntries(Object.entries(forbidden).map(([k,re]) => [k,(source.match(re)||[]).length]));
  const transpileDiagnostics = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }, reportDiagnostics: true }).diagnostics || [];
  return { target: rel, counts, transpileDiagnostics: transpileDiagnostics.map(d => ts.flattenDiagnosticMessageText(d.messageText, ' ')) };
});
const ok = results.every(r => Object.values(r.counts).every(n => n === 0) && r.transpileDiagnostics.length === 0);
console.log(JSON.stringify({ phase: 535, results, ok, architecture: 'scanner evidence -> semantic relation catalog -> candidate witnesses -> recursive closure -> canonical authority' }, null, 2));
if (!ok) process.exit(1);
