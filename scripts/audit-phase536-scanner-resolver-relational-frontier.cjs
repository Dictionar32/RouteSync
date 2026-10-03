const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const targets = [
  'packages/core/src/compiler/scanner/lexer/controllerReturnParser.ts',
  'packages/core/src/compiler/scanner/subscanners/model/memberCastsParser.ts',
  'packages/core/src/compiler/scanner/descriptors/route/routeSecurity.ts',
  'packages/core/src/compiler/scanner/descriptors/model/modelCastDescriptor.ts',
  'packages/core/src/compiler/scanner/subscanners/ChannelScanner.ts',
];
const forbidden = [
  ['if', /\bif\b/g], ['for', /\bfor\b/g], ['while', /\bwhile\b/g], ['switch', /\bswitch\b/g],
  ['map', /\bmap\b/g], ['filter', /\bfilter\b/g], ['reduce', /\breduce\b/g], ['flatMap', /\bflatMap\b/g],
  ['undefined', /\bundefined\b/g], ['??', /\?\?/g], ['null', /\bnull\b/g], ['===', /===/g],
  ['as unknown', /\bas\s+unknown\b/g], ['||', /\|\|/g], ['&&', /&&/g], ['trim', /\btrim\b/g],
  ['slice', /\bslice\b/g], ['never', /\bnever\b/g], ['index+123', /index\s*\+\s*123/g],
];
const rows = targets.map(file => {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const counts = Object.fromEntries(forbidden.map(([name, re]) => [name, (source.match(re) || []).length]));
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    reportDiagnostics: true,
    fileName: file,
  });
  const diagnostics = (transpiled.diagnostics || []).map(d => ts.flattenDiagnosticMessageText(d.messageText, ' '));
  return { file, ...counts, transpileDiagnostics: diagnostics, closedSurfaceClean: Object.values(counts).every(value => value === 0), transpileDiagnosticsClean: diagnostics.length === 0 };
});
const ok = rows.every(row => row.closedSurfaceClean && row.transpileDiagnosticsClean);
console.log(JSON.stringify({ phase: 536, targets: rows, ok }, null, 2));
if (!ok) process.exitCode = 1;
