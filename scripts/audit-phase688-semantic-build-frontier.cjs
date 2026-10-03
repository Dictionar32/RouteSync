const fs = require('fs');
const path = require('path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const files = [
  'packages/core/src/semantic/SymbolTable.ts',
  'packages/core/src/compiler/types/SemanticType.ts',
  'packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts',
  'packages/core/src/compiler/domain/common/typeExpressionSemanticType.ts',
  'packages/core/src/compiler/constraints/TypeEnvironment.ts',
  'packages/core/src/compiler/domain/common/ts-lowerer/builder/objectTypeLowerer.ts',
  'packages/core/src/compiler/domain/common/resolved-types/catamorphism.ts',
  'packages/core/src/compiler/analysis/ssa/renamer/blockInstructionRenamer.ts',
  'packages/core/src/compiler/scanner/lexer/phpAstAlgebra.ts',
];
const forbidden = [
  ['host:new', /\bnew\s+[A-Za-z_$]/g], ['host:undefined', /\bundefined\b/g],
  ['host:??', /\?\?/g], ['host:as-unknown', /\bas\s+unknown\b/g],
  ['host:===', /===/g], ['host:map', /\.map\s*\(/g], ['host:filter', /\.filter\s*\(/g],
  ['host:reduce', /\.reduce\s*\(/g], ['host:flatMap', /\.flatMap\s*\(/g],
  ['host:for', /\bfor\s*\(/g], ['host:while', /\bwhile\s*\(/g], ['host:switch', /\bswitch\s*\(/g],
  ['host:set', /\bSet\s*\(/g], ['host:any', /:\s*any\b/g],
];
const strip = source => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/(['"`])(?:\\.|(?!\1)[\s\S])*?\1/g, '');
const diagnostics = [];
const leaks = [];
for (const rel of files) {
  const source = fs.readFileSync(path.join(root, rel), 'utf8');
  const result = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, strict: true }, reportDiagnostics: true });
  for (const diagnostic of result.diagnostics || []) diagnostics.push({ file: rel, message: ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ') });
  const clean = strip(source);
  for (const [construct, pattern] of forbidden) {
    const count = (clean.match(pattern) || []).length;
    if (count) leaks.push({ file: rel, construct, count });
  }
}
const symbol = fs.readFileSync(path.join(root, 'packages/core/src/semantic/SymbolTable.ts'), 'utf8');
for (const marker of ['sequenceToRelation', 'relationSequenceToArray', 'Lookup<ModelColumnFact>', 'Lookup<ModelSemanticAccessor>', 'Lookup<ModelSemanticRelation>', 'Lookup<ModelSymbol>']) {
  if (!symbol.includes(marker)) diagnostics.push({ file: 'packages/core/src/semantic/SymbolTable.ts', message: `missing semantic typed boundary: ${marker}` });
}
const semanticType = fs.readFileSync(path.join(root, 'packages/core/src/compiler/types/SemanticType.ts'), 'utf8');
for (const marker of ['let witness: PrimitiveType', 'let witness: UnionType', 'let witness: IntersectionType', 'export const of = (...members: readonly SemanticType[]): UnionType', 'export const of = (...members: readonly SemanticType[]): IntersectionType']) {
  if (!semanticType.includes(marker)) diagnostics.push({ file: 'packages/core/src/compiler/types/SemanticType.ts', message: `missing closed semantic witness boundary: ${marker}` });
}
const inactive = JSON.parse(execFileSync(process.execPath, [path.join(__dirname, 'audit-phase525-inactive-file-vacuum.cjs')], { encoding: 'utf8' }));
console.log(JSON.stringify({
  phase: 688,
  kind: 'semantic-build-frontier-and-interface-trace',
  files: files.length,
  transpileDiagnostics: diagnostics,
  forbiddenHostLeaks: leaks,
  inactive,
  localBuild: 'not executed: assistant workspace has no node_modules/tsup',
  status: diagnostics.length || leaks.length || !inactive.allCandidatesEmpty ? 'FAIL' : 'PASS'
}, null, 2));
process.exit(diagnostics.length || leaks.length || !inactive.allCandidatesEmpty ? 1 : 0);
