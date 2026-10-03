const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const targets = [
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationProgram.ts',
  'packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts',
];
const forbidden = {
  if: /\bif\b/g, for: /\bfor\b/g, while: /\bwhile\b/g, switch: /\bswitch\b/g,
  map: /\bmap\b/g, filter: /\bfilter\b/g, reduce: /\breduce\b/g, flatMap: /\bflatMap\b/g,
  undefined: /\bundefined\b/g, '??': /\?\?/g, null: /\bnull\b/g, '===': /===/g,
  'as unknown': /as\s+unknown/g, '||': /\|\|/g, '&&': /&&/g, trim: /\btrim\b/g,
  slice: /\bslice\b/g, never: /\bnever\b/g, 'index+123': /index\s*\+\s*123/g,
  ternary: /\?[^\n:]+:/g,
};
const result = {};
for (const rel of targets) {
  const file = path.resolve(rel);
  const source = fs.readFileSync(file, 'utf8');
  result[rel] = Object.fromEntries(Object.entries(forbidden).map(([name, regex]) => [name, (source.match(regex) || []).length]));
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    reportDiagnostics: true,
    fileName: file,
  });
  result[rel].transpileDiagnostics = (transpiled.diagnostics || []).map(d => ts.flattenDiagnosticMessageText(d.messageText, ' '));
}
const closed = Object.values(result).every(entry => Object.entries(entry).every(([key, value]) => key === 'transpileDiagnostics' ? value.length === 0 : value === 0));
console.log(JSON.stringify({ phase: 538, targets: result, closedSurfaceClean: closed, transpileDiagnosticsClean: closed, ok: closed }, null, 2));
if (!closed) process.exit(1);
