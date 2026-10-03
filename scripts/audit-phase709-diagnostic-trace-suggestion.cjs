const fs = require('fs');
const path = require('path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const root = path.resolve(__dirname, '..');
const file = path.join(root, 'packages/core/src/compiler/diagnostics/Diagnostic.ts');
const index = path.join(root, 'packages/core/src/compiler/diagnostics/index.ts');
const read = p => fs.readFileSync(p, 'utf8');
const source = read(file);
const indexSource = read(index);
const diagnostics = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS).parseDiagnostics;
const forbidden = {
  if: (source.match(/\bif\s*\(/g) || []).length,
  for: (source.match(/\bfor\s*\(/g) || []).length,
  while: (source.match(/\bwhile\s*\(/g) || []).length,
  switch: (source.match(/\bswitch\s*\(/g) || []).length,
  map: (source.match(/\.map\s*\(/g) || []).length,
  filter: (source.match(/\.filter\s*\(/g) || []).length,
  reduce: (source.match(/\.reduce\s*\(/g) || []).length,
  flatMap: (source.match(/\.flatMap\s*\(/g) || []).length,
  undefined: (source.match(/\bundefined\b/g) || []).length,
  null: (source.match(/\bnull\b/g) || []).length,
  strictEquality: (source.match(/===/g) || []).length,
  asUnknown: (source.match(/\bas\s+unknown\b/g) || []).length,
  any: (source.match(/\bany\b/g) || []).length,
  new: (source.match(/\bnew\s+/g) || []).length,
};
const checks = {
  syntaxValid: diagnostics.length === 0,
  traceClosed: source.includes("export type DiagnosticTraceNode") && source.includes("kind: 'stage'") && source.includes("kind: 'relation'") && source.includes("kind: 'rewrite'"),
  traceEmptyStateClosed: source.includes("kind: 'empty'") && source.includes("kind: 'path'"),
  suggestionsClosed: source.includes("export type DiagnosticSuggestion") && source.includes("kind: 'none'") && source.includes("kind: 'available'"),
  suggestionsCollectionClosed: source.includes("export type DiagnosticSuggestions") && source.includes("kind: 'many'"),
  diagnosticCarriesTrace: source.includes('readonly trace: DiagnosticTrace;'),
  diagnosticCarriesSuggestions: source.includes('readonly suggestions: DiagnosticSuggestions;'),
  inputCarriesTrace: source.includes('readonly trace: DiagnosticTrace;'),
  inputCarriesSuggestions: source.includes('readonly suggestions: DiagnosticSuggestions;'),
  factoryCarriesTrace: source.includes('trace: input.trace'),
  factoryCarriesSuggestions: source.includes('suggestions: input.suggestions'),
  publicExports: indexSource.includes('DiagnosticTrace') && indexSource.includes('DiagnosticSuggestions'),
};
const report = { phase: 709, kind: 'diagnostic-trace-suggestion-adt', checks, forbiddenConstructs: forbidden, status: Object.values(checks).every(Boolean) && Object.values(forbidden).every(v => v === 0) ? 'PASS' : 'FAIL' };
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.status === 'PASS' ? 0 : 1;
