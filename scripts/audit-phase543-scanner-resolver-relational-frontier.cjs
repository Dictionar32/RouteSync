const fs = require('fs');
const ts = require('typescript');

const targets = [
  'packages/core/src/compiler/scanner/binders/resource/composite/collectionArrayBinders.ts',
  'packages/core/src/compiler/scanner/subscanners/responseScanner.ts',
];

const forbidden = {
  if: /\bif\b/g,
  for: /\bfor\b/g,
  while: /\bwhile\b/g,
  switch: /\bswitch\b/g,
  map: /\.map\s*\(/g,
  filter: /\.filter\s*\(/g,
  reduce: /\.reduce(?:Right)?\s*\(/g,
  flatMap: /\.flatMap\s*\(/g,
  undefined: /\bundefined\b/g,
  null: /\bnull\b/g,
  never: /\bnever\b/g,
  strictEqual: /===/g,
  logicalOr: /\|\|/g,
  logicalAnd: /&&/g,
  asUnknown: /\bas\s+unknown\b/g,
  trim: /\.trim\s*\(/g,
  slice: /\.slice\s*\(/g,
  index123: /\[[^\]\n]*\+\s*123\s*\]/g,
  ternary: /\?[^?.]/g,
};

function auditFile(file) {
  const source = fs.readFileSync(file, 'utf8');
  const counts = Object.fromEntries(Object.entries(forbidden).map(([name, re]) => [name, (source.match(re) || []).length]));
  const diagnostics = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    reportDiagnostics: true,
  }).diagnostics || [];
  return { file, counts, transpileDiagnostics: diagnostics.map(d => ts.flattenDiagnosticMessageText(d.messageText, ' ')) };
}

const results = targets.map(auditFile);
const closedSurfaceClean = results.every(r => Object.values(r.counts).every(v => v === 0));
const transpileDiagnosticsClean = results.every(r => r.transpileDiagnostics.length === 0);
console.log(JSON.stringify({ results, closedSurfaceClean, transpileDiagnosticsClean, ok: closedSurfaceClean && transpileDiagnosticsClean }, null, 2));
process.exitCode = closedSurfaceClean && transpileDiagnosticsClean ? 0 : 1;
