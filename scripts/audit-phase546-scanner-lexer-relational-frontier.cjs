const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const root = process.cwd();
const targets = [
  'packages/core/src/compiler/scanner/subscanners/route-scanner/routePathParser.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxRange.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxScan.ts',
];

const patterns = {
  if: /\bif\b/g,
  for: /\bfor\b/g,
  while: /\bwhile\b/g,
  switch: /\bswitch\b/g,
  map: /\.map\s*\(/g,
  filter: /\.filter\s*\(/g,
  reduce: /\.reduce\s*\(/g,
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
  index123: /index\s*\+\s*123/g,
  ternary: /\?[^?\n:]+:/g,
};

const diagnostics = file => {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const result = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    reportDiagnostics: true,
    fileName: file,
  });
  return result.diagnostics || [];
};

const results = targets.map(file => {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const counts = Object.fromEntries(Object.entries(patterns).map(([key, pattern]) => [key, [...source.matchAll(pattern)].length]));
  const transpileDiagnostics = diagnostics(file).map(d => ts.flattenDiagnosticMessageText(d.messageText, ' '));
  return { file, counts, transpileDiagnostics };
});

const clean = results.every(result => Object.values(result.counts).every(value => value === 0));
const transpileClean = results.every(result => result.transpileDiagnostics.length === 0);
console.log(JSON.stringify({ phase: 546, results, closedSurfaceClean: clean, transpileDiagnosticsClean: transpileClean, ok: clean && transpileClean }, null, 2));
process.exitCode = clean && transpileClean ? 0 : 1;
