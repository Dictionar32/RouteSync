const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const target = path.join(process.cwd(), 'packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationalExecutionPlan.ts');
const source = fs.readFileSync(target, 'utf8');
const checks = {
  if: /\bif\b/g,
  for: /\bfor\b/g,
  while: /\bwhile\b/g,
  switch: /\bswitch\b/g,
  map: /\bmap\b/g,
  filter: /\bfilter\b/g,
  reduce: /\breduce\b/g,
  flatMap: /\bflatMap\b/g,
  undefined: /\bundefined\b/g,
  nullish: /\?\?/g,
  null: /\bnull\b/g,
  strictEquality: /===/g,
  asUnknown: /as\s+unknown/g,
  or: /\|\|/g,
  and: /&&/g,
  trim: /\.trim\s*\(/g,
  slice: /\.slice\s*\(/g,
  never: /\bnever\b/g,
  indexPlus123: /index\s*\+\s*123/g,
  ternary: /(?<!\?)\?(?!\.)[^\n:;{}]+:/g,
};
const counts = Object.fromEntries(Object.entries(checks).map(([name, regex]) => [name, (source.match(regex) || []).length]));
const transpiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }, fileName: target, reportDiagnostics: true });
const diagnostics = transpiled.diagnostics || [];
const closedSurfaceClean = Object.values(counts).every(count => count === 0);
const transpileDiagnosticsClean = diagnostics.length === 0;
const result = {
  phase: 530,
  target: path.relative(process.cwd(), target),
  counts,
  transpileDiagnostics: diagnostics.map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\\n')),
  closedSurfaceClean,
  transpileDiagnosticsClean,
  architecture: 'relation evidence -> anchor witness -> relational execution plan -> solver/rewrite authority',
};
console.log(JSON.stringify(result, null, 2));
process.exitCode = closedSurfaceClean && transpileDiagnosticsClean ? 0 : 1;
