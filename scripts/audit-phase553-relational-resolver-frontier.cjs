const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const roots = [
  'packages/core/src/compiler/scanner',
  'packages/core/src/compiler/constraints',
  'packages/core/src/compiler/domain/common/SemanticTypeResolver.ts',
  'packages/core/src/compiler/domain/common/semantic-resolver',
];

const forbidden = new Map([
  ['if', ts.SyntaxKind.IfStatement],
  ['for', ts.SyntaxKind.ForStatement],
  ['while', ts.SyntaxKind.WhileStatement],
  ['switch', ts.SyntaxKind.SwitchStatement],
  ['ternary', ts.SyntaxKind.ConditionalExpression],
]);
const propertyForbidden = new Set(['map', 'filter', 'reduce', 'flatMap', 'trim', 'slice']);
const binaryForbidden = new Set(['??', '===', '!==', '&&', '||']);
const files = [];

const collect = entry => {
  if (!fs.existsSync(entry)) return;
  const stat = fs.statSync(entry);
  if (stat.isFile()) {
    if (entry.endsWith('.ts') && !entry.endsWith('.d.ts') && !entry.includes('__tests__') && !entry.endsWith('.test.ts') && !entry.endsWith('.spec.ts')) files.push(entry);
    return;
  }
  for (const child of fs.readdirSync(entry, { withFileTypes: true })) collect(path.join(entry, child.name));
};
roots.forEach(collect);

const inspect = file => {
  const source = fs.readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  const counts = Object.fromEntries([...forbidden.keys(), '??', '===', '!==', '&&', '||', 'as unknown', 'undefined', 'never', ...propertyForbidden, 'null'].map(key => [key, 0]));
  const visit = node => {
    for (const [key, kind] of forbidden) if (node.kind === kind) counts[key] += 1;
    if (ts.isBinaryExpression(node)) {
      const operator = node.operatorToken.getText(sourceFile);
      if (binaryForbidden.has(operator)) counts[operator] += 1;
    }
    if (ts.isAsExpression(node) && node.type.kind === ts.SyntaxKind.UnknownKeyword) counts['as unknown'] += 1;
    if (ts.isIdentifier(node) && node.text === 'undefined') counts.undefined += 1;
    if (node.kind === ts.SyntaxKind.NeverKeyword) counts.never += 1;
    if (ts.isPropertyAccessExpression(node) && propertyForbidden.has(node.name.text)) counts[node.name.text] += 1;
    if (node.kind === ts.SyntaxKind.NullKeyword) counts.null += 1;
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    reportDiagnostics: true,
    fileName: file,
  });
  return {
    counts,
    transpileDiagnostics: (transpiled.diagnostics || []).map(d => ts.flattenDiagnosticMessageText(d.messageText, ' ')),
  };
};

const results = Object.fromEntries(files.map(file => [file, inspect(file)]));
const leaks = Object.entries(results).filter(([, result]) => Object.entries(result.counts).some(([key, value]) => key !== 'null' && value > 0));
const diagnostics = Object.entries(results).filter(([, result]) => result.transpileDiagnostics.length > 0);
const modelNullEvidence = Object.entries(results)
  .filter(([, result]) => result.counts.null > 0)
  .map(([file, result]) => ({ file, count: result.counts.null }));
const payload = {
  phase: 553,
  frontier: 'scanner-lexer-parser-adapter-syntax-error-ternary-generic-solver-resolver',
  scannedFiles: files.length,
  hostLeakCount: leaks.reduce((total, [, result]) => total + Object.entries(result.counts).filter(([key]) => key !== 'null').reduce((sum, [, value]) => sum + value, 0), 0),
  leakingFiles: leaks.map(([file, result]) => ({ file, counts: Object.fromEntries(Object.entries(result.counts).filter(([key, value]) => key !== 'null' && value > 0)) })),
  modelNullEvidence,
  transpileDiagnosticsClean: diagnostics.length === 0,
  transpileDiagnostics: diagnostics,
  closedSurfaceClean: leaks.length === 0 && diagnostics.length === 0,
  basis: {
    scopeGraphs: 'Statix-style declarative scopes/edges/declarations',
    rewrite: 'MLIR PDL/PDLL-style declarative match/rewrite separation',
    fixedPoint: 'relational/lattice closure as the semantic execution substrate',
  },
};
console.log(JSON.stringify(payload, null, 2));
if (!payload.closedSurfaceClean) process.exit(1);
