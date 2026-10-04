const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const targets = [
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticInterproceduralDataFlowRelations.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticVersionedStateDataFlowRelations.ts',
];
const forbidden = {
  if: /\bif\s*\(/g,
  for: /\bfor\s*\(/g,
  while: /\bwhile\s*\(/g,
  switch: /\bswitch\s*\(/g,
  collection: /\.(map|filter|reduce|flatMap)\s*\(/g,
  undefined: /\bundefined\b/g,
  nullish: /\?\?/g,
  strictEqual: /===/g,
  cast: /\bas\b/g,
};
const stripComments = source => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
const inspect = relative => {
  const file = path.join(root, relative);
  const source = fs.readFileSync(file, 'utf8');
  const clean = stripComments(source);
  const counts = Object.fromEntries(Object.entries(forbidden).map(([name, pattern]) => [name, [...clean.matchAll(pattern)].length]));
  const diagnostics = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    reportDiagnostics: true,
    fileName: relative,
  }).diagnostics || [];
  return { file: relative, counts, transpileDiagnostics: diagnostics.map(d => ts.flattenDiagnosticMessageText(d.messageText, ' ')) };
};
const results = targets.map(inspect);
const source = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const interprocedural = source(targets[0]);
const versioned = source(targets[1]);
const result = {
  phase: 744,
  diagnosticFrontier: {
    interproceduralFactNarrowing: /RelationVariant<SemanticFact, 'invocation'>/.test(interprocedural) && /RelationVariant<SemanticFact, 'callable'>/.test(interprocedural),
    optionIndexProjection: /relationOptionMap\(relationFirstOption/.test(interprocedural) && /relationOptionMap\(relationFirstOption/.test(versioned),
    callTargetPresenceFold: /typedExpand\([\s\S]*mapOption\(invocationKeys/.test(interprocedural),
  },
  results,
  failed: results.flatMap(result => Object.entries(result.counts).filter(([, count]) => count !== 0).map(([name]) => `${result.file}:${name}`)).concat(results.flatMap(result => result.transpileDiagnostics.map(message => `${result.file}:${message}`))),
};
result.pass = result.failed.length === 0 && Object.values(result.diagnosticFrontier).every(Boolean);
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.pass ? 0 : 1;
