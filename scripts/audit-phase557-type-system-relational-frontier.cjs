const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const roots = [
  'packages/core/src/compiler/scanner',
  'packages/core/src/compiler/constraints',
  'packages/core/src/compiler/domain/common/ts-lowerer',
  'packages/core/src/semantic',
  'packages/core/src/compiler/relational',
  'packages/core/src/compiler/types/system',
  'packages/core/src/compiler/types/TypeHierarchy.ts',
];
const forbiddenKinds = new Map([
  ['if', ts.SyntaxKind.IfStatement], ['for', ts.SyntaxKind.ForStatement],
  ['while', ts.SyntaxKind.WhileStatement], ['switch', ts.SyntaxKind.SwitchStatement],
  ['ternary', ts.SyntaxKind.ConditionalExpression],
]);
const properties = new Set(['map', 'filter', 'reduce', 'flatMap', 'trim', 'slice']);
const binary = new Set(['??', '===', '!==', '&&', '||']);
const files = [];
const collect = entry => {
  if (!fs.existsSync(entry)) return;
  const stat = fs.statSync(entry);
  if (stat.isFile()) {
    if (entry.endsWith('.ts') && !entry.endsWith('.d.ts') && !entry.includes('__tests__') && !entry.endsWith('.test.ts') && !entry.endsWith('.spec.ts')) files.push(entry);
    return;
  }
  fs.readdirSync(entry, { withFileTypes: true }).forEach(child => collect(path.join(entry, child.name)));
};
roots.forEach(collect);
const inspect = file => {
  const source = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  const counts = Object.fromEntries([...forbiddenKinds.keys(), '??', '===', '!==', '&&', '||', 'as unknown', 'undefined', 'never', 'map', 'filter', 'reduce', 'flatMap', 'trim', 'slice', 'null'].map(key => [key, 0]));
  const visit = node => {
    for (const [key, kind] of forbiddenKinds) if (node.kind === kind) counts[key]++;
    if (ts.isBinaryExpression(node) && binary.has(node.operatorToken.getText(sf))) counts[node.operatorToken.getText(sf)]++;
    if (ts.isAsExpression(node) && node.type.kind === ts.SyntaxKind.UnknownKeyword) counts['as unknown']++;
    if (ts.isIdentifier(node) && node.text === 'undefined') counts.undefined++;
    if (node.kind === ts.SyntaxKind.NeverKeyword) counts.never++;
    if (ts.isPropertyAccessExpression(node) && properties.has(node.name.text)) counts[node.name.text]++;
    if (node.kind === ts.SyntaxKind.NullKeyword) counts.null++;
    ts.forEachChild(node, visit);
  };
  visit(sf);
  const transpiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }, reportDiagnostics: true, fileName: file });
  return { counts, transpileDiagnostics: (transpiled.diagnostics || []).map(d => ts.flattenDiagnosticMessageText(d.messageText, ' ')) };
};
const results = Object.fromEntries(files.map(file => [file, inspect(file)]));
const leaks = Object.entries(results).filter(([, r]) => Object.entries(r.counts).some(([k, v]) => k !== 'null' && v > 0));
const diagnostics = Object.entries(results).filter(([, r]) => r.transpileDiagnostics.length > 0);
const modelEvidence = Object.entries(results).filter(([, r]) => r.counts.null > 0 || r.counts.never > 0).map(([file, r]) => ({ file, null: r.counts.null, never: r.counts.never }));
const payload = {
  phase: 557,
  frontier: 'scanner-lexer-resolver-parser-adapter-generic-solver-relational-substrate-type-system',
  scannedFiles: files.length,
  hostLeakCount: leaks.reduce((sum, [, r]) => sum + Object.entries(r.counts).filter(([k]) => k !== 'null').reduce((a, [, v]) => a + v, 0), 0),
  leakingFiles: leaks.map(([file, r]) => ({ file, counts: Object.fromEntries(Object.entries(r.counts).filter(([k, v]) => k !== 'null' && v > 0)) })),
  modelEvidence,
  transpileDiagnosticsClean: diagnostics.length === 0,
  transpileDiagnostics: diagnostics,
  closedSurfaceClean: leaks.length === 0 && diagnostics.length === 0,
  architecture: {
    typeHierarchy: 'explicit Presence relation instead of host optional sentinel',
    subtype: 'declarative ordered relation catalog + recursive hierarchy closure',
    assignability: 'relation-based subtype/union witness search',
    lattice: 'relation-driven join/meet rules',
    rewrite: 'semantic relations are the decision authority; host control flow is absent from frontier',
  },
};
console.log(JSON.stringify(payload, null, 2));
if (!payload.closedSurfaceClean) process.exit(1);
