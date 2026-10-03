const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const roots = [
  'packages/core/src/compiler/scanner/lexer',
  'packages/core/src/compiler/scanner/resolvers',
  'packages/core/src/compiler/scanner/semantic',
  'packages/core/src/compiler/scanner/upstream',
  'packages/core/src/compiler/scanner/orchestrator',
  'packages/core/src/graph',
  'packages/core/src/types/upstream',
  'packages/core/src/compiler/verification',
  'packages/core/src/compiler/passes',
  'packages/core/src/compiler/domain/common',
  'packages/core/src/compiler/ir/semanticIRLoweringRelations.ts',
];

const files = [];
const excluded = /(__tests__|__test__|__archive__|\.test\.ts$|\.spec\.ts$|\.phase\d+\.test\.ts$)/;
const collect = entry => {
  if (!fs.existsSync(entry)) return;
  const stat = fs.statSync(entry);
  if (stat.isFile()) {
    if (entry.endsWith('.ts') && !entry.endsWith('.d.ts') && !excluded.test(entry)) files.push(entry);
    return;
  }
  for (const child of fs.readdirSync(entry, { withFileTypes: true })) collect(path.join(entry, child.name));
};
roots.forEach(collect);

const statementKinds = new Map([
  ['if', ts.SyntaxKind.IfStatement], ['for', ts.SyntaxKind.ForStatement],
  ['while', ts.SyntaxKind.WhileStatement], ['switch', ts.SyntaxKind.SwitchStatement],
  ['ternary', ts.SyntaxKind.ConditionalExpression],
]);
const binary = new Set(['??', '===', '!==', '&&', '||']);
const properties = new Set(['map', 'filter', 'reduce', 'flatMap', 'trim', 'slice']);
const countsFor = source => {
  const sf = ts.createSourceFile('frontier.ts', source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  const keys = [...statementKinds.keys(), ...binary, ...properties, 'undefined', 'as unknown', 'new', 'any', 'Set', 'Map'];
  const counts = Object.fromEntries(keys.map(k => [k, 0]));
  const visit = node => {
    for (const [key, kind] of statementKinds) if (node.kind === kind) counts[key]++;
    if (ts.isBinaryExpression(node)) {
      const op = node.operatorToken.getText(sf);
      if (binary.has(op)) counts[op]++;
    }
    if (ts.isAsExpression(node) && node.type.kind === ts.SyntaxKind.UnknownKeyword) counts['as unknown']++;
    if (ts.isIdentifier(node) && node.text === 'undefined') counts.undefined++;
    if (ts.isNewExpression(node)) counts.new++;
    if (ts.isIdentifier(node) && (node.text === 'Set' || node.text === 'Map' || node.text === 'any')) counts[node.text]++;
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && properties.has(node.expression.name.text)) counts[node.expression.name.text]++;
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return counts;
};

const results = files.map(file => {
  const source = fs.readFileSync(file, 'utf8');
  const counts = countsFor(source);
  const t = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }, reportDiagnostics: true, fileName: file });
  return { file, counts, diagnostics: (t.diagnostics || []).map(d => ts.flattenDiagnosticMessageText(d.messageText, ' ')) };
});

const activeKeys = ['if','for','while','switch','ternary','map','filter','reduce','flatMap','undefined','??','===','!==','&&','||','as unknown','new','any','Set','Map'];
const leaks = results.filter(r => activeKeys.some(k => r.counts[k] > 0));
const diagnostics = results.filter(r => r.diagnostics.length > 0);
const aggregate = Object.fromEntries(activeKeys.map(k => [k, results.reduce((n, r) => n + r.counts[k], 0)]));
const bySurface = roots.map(root => {
  const scoped = results.filter(r => r.file === root || r.file.startsWith(root + path.sep));
  return { root, files: scoped.length, counts: Object.fromEntries(activeKeys.map(k => [k, scoped.reduce((n, r) => n + r.counts[k], 0)])) };
});

console.log(JSON.stringify({
  phase: 584,
  frontier: ['scanner/lexer', 'resolver graph', 'AST/upstream mapping', 'analysis', 'semantic type lowering'],
  scannedFiles: files.length,
  aggregate,
  bySurface,
  leakingFiles: leaks.map(r => ({ file: r.file, counts: Object.fromEntries(activeKeys.filter(k => r.counts[k] > 0).map(k => [k, r.counts[k]])) })),
  transpileDiagnosticsClean: diagnostics.length === 0,
  transpileDiagnostics: diagnostics,
  closedSurfaceClean: leaks.length === 0 && diagnostics.length === 0,
}, null, 2));
