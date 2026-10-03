const fs = require('fs');
const path = require('path');
const { transpileModule, ModuleKind, ScriptTarget } = require('typescript');

const root = path.resolve(__dirname, '..');
const compilerRoot = path.join(root, 'packages/core/src/compiler');
const layers = [
  ['scanner_lexer', 'packages/core/src/compiler/scanner/lexer'],
  ['resolver_graph', 'packages/core/src/compiler/scanner/upstream'],
  ['ast_mapping', 'packages/core/src/types/upstream'],
  ['analysis', 'packages/core/src/compiler/analysis'],
  ['semantic_type_lowering', 'packages/core/src/compiler/domain/common/ts-lowerer'],
  ['diagnostics', 'packages/core/src/compiler/diagnostics'],
  ['resolver_graph', 'packages/core/src/compiler/scanner/resolvers'],
];
const forbidden = /\b(?:if|while|for|switch|map|filter|reduce|flatMap|undefined|null|any|new)\b|\?\?|===|as\s+unknown/g;
const layerFiles = new Map();
function walk(dir, output) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, output);
    else if (/\.tsx?$/.test(entry.name) && !p.includes('__tests__') && !p.includes('__test__') && !p.includes('.test.')) output.push(p);
  }
}
for (const [name, rel] of layers) { const list=[]; walk(path.join(root, rel), list); layerFiles.set(name, list); }
const files = [...new Set([...layerFiles.values()].flat())];
function codeOnly(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g, '');
}
const hits = [];
for (const [layer, paths] of layerFiles) {
  for (const file of paths) {
    const source = fs.readFileSync(file, 'utf8');
    const clean = codeOnly(source);
    const match = clean.match(forbidden);
    if (match) hits.push({ layer, file: path.relative(root, file), constructs: [...new Set(match)].sort() });
  }
}
const modified = [
  'packages/core/src/compiler/analysis/AnalysisManager.ts',
  'packages/core/src/compiler/analysis/index.ts',
  'packages/core/src/compiler/analysis/dominator/dominatorTree.ts',
  'packages/core/src/compiler/analysis/ssa/renamer/blockInstructionRenamer.ts',
  'packages/core/src/compiler/analysis/ssa/ssaBuilder.ts',
  'packages/core/src/compiler/analysis/ssa/ssaRenamer.ts',
  'packages/core/src/compiler/scanner/binders/resource/resourceBinder.ts',
  'packages/core/src/compiler/diagnostics/DiagnosticBag.ts',
  'packages/core/src/compiler/domain/common/ts-lowerer/typeScriptTargetSurfaceRelations.ts',
];
const diagnostics = modified.map(rel => {
  const source = fs.readFileSync(path.join(root, rel), 'utf8');
  const result = transpileModule(source, { compilerOptions: { target: ScriptTarget.ES2022, module: ModuleKind.ESNext, strict: true }, reportDiagnostics: true });
  return { file: rel, diagnostics: result.diagnostics?.length ?? 0 };
});
console.log(JSON.stringify({
  phase: 682,
  modifiedFiles: modified.length,
  transpileDiagnostics: diagnostics,
  forbiddenLeakCount: hits.length,
  forbiddenLeaks: hits.slice(0, 80),
  status: diagnostics.every(x => x.diagnostics === 0) ? 'PASS' : 'FAIL',
}, null, 2));
