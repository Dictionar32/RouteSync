const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const targets = [
  'packages/core/src/compiler/scanner/subscanners/route-scanner/routeContextTracker.ts',
];
const forbidden = {
  if: /\bif\b/g,
  for: /\bfor\b/g,
  while: /\bwhile\b/g,
  switch: /\bswitch\b/g,
  map: /\bmap\b/g,
  filter: /\bfilter\b/g,
  reduce: /\breduce\b/g,
  flatMap: /\bflatMap\b/g,
  undefined: /\bundefined\b/g,
  '??': /\?\?/g,
  null: /\bnull\b/g,
  '===': /===/g,
  'as unknown': /as\s+unknown/g,
  '||': /\|\|/g,
  '&&': /&&/g,
  trim: /\.trim\s*\(/g,
  slice: /\.slice\s*\(/g,
  never: /\bnever\b/g,
  ternary: /\?.*:/g,
  'index+123': /index\s*\+\s*123/g,
};

const results = targets.map(relative => {
  const file = path.join(root, relative);
  const source = fs.readFileSync(file, 'utf8');
  const counts = Object.fromEntries(Object.entries(forbidden).map(([name, pattern]) => [name, (source.match(pattern) || []).length]));
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    reportDiagnostics: true,
    fileName: file,
  });
  return {
    file: relative,
    counts,
    transpileDiagnostics: transpiled.diagnostics?.map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n')) ?? [],
  };
});

const closedSurfaceClean = results.every(result => Object.values(result.counts).every(count => count === 0));
const diagnosticsClean = results.every(result => result.transpileDiagnostics.length === 0);
console.log(JSON.stringify({ phase: 524, targets: results, closedSurfaceClean, transpileDiagnosticsClean: diagnosticsClean }, null, 2));
process.exit(closedSurfaceClean && diagnosticsClean ? 0 : 1);
