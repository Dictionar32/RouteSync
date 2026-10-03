const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const targets = [
  'packages/core/src/semantic/kernel/relationalSequence.ts',
  'packages/core/src/compiler/scanner/lexer/tokenize/compoundScanners.ts',
  'packages/core/src/compiler/scanner/resolvers/RouteSecurityResolver.ts',
  'packages/core/src/compiler/scanner/resolvers/RouteDomainResolver.ts',
  'packages/core/src/compiler/scanner/subscanners/route-scanner/routePathParser.ts',
];
const result = {};
let ok = true;
const forbidden = new Map([
  ['if', ts.SyntaxKind.IfStatement],
  ['for', ts.SyntaxKind.ForStatement],
  ['while', ts.SyntaxKind.WhileStatement],
  ['switch', ts.SyntaxKind.SwitchStatement],
  ['ternary', ts.SyntaxKind.ConditionalExpression],
]);
const inspect = (sourceFile) => {
  const names = [...forbidden.keys(), '??', '===', '!==', '&&', '||', 'as unknown', 'undefined', 'never', 'map', 'filter', 'reduce', 'flatMap', 'trim', 'slice'];
  const counts = Object.fromEntries(names.map(key => [key, 0]));
  for (const [key, kind] of forbidden) {
    const visit = node => { if (node.kind === kind) counts[key] += 1; ts.forEachChild(node, visit); };
    visit(sourceFile);
  }
  const visitOperators = node => {
    if (ts.isBinaryExpression(node)) {
      const text = node.operatorToken.getText(sourceFile);
      const operatorMap = { '??':'??', '===':'===', '!==':'!==', '&&':'&&', '||':'||' };
      if (operatorMap[text]) counts[operatorMap[text]] += 1;
    }
    if (ts.isAsExpression(node) && node.type.kind === ts.SyntaxKind.UnknownKeyword) counts['as unknown'] += 1;
    if (ts.isIdentifier(node) && node.text === 'undefined') counts.undefined += 1;
    if (node.kind === ts.SyntaxKind.NeverKeyword) counts.never += 1;
    if (ts.isPropertyAccessExpression(node)) {
      const name = node.name.text;
      if (['map','filter','reduce','flatMap','trim','slice'].includes(name)) counts[name] += 1;
    }
    ts.forEachChild(node, visitOperators);
  };
  visitOperators(sourceFile);
  return counts;
};
for (const rel of targets) {
  const file = path.resolve(rel);
  const source = fs.readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  const counts = inspect(sourceFile);
  const transpiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }, reportDiagnostics: true, fileName: file });
  const diagnostics = (transpiled.diagnostics || []).map(d => ts.flattenDiagnosticMessageText(d.messageText, ' '));
  result[rel] = { ...counts, transpileDiagnostics: diagnostics };
  ok = ok && diagnostics.length === 0 && Object.values(counts).every(value => value === 0);
}
const payload = { phase: 549, frontier: 'scanner-lexer-resolver', targets: result, closedSurfaceClean: ok, transpileDiagnosticsClean: Object.values(result).every(v => v.transpileDiagnostics.length === 0), ok };
console.log(JSON.stringify(payload, null, 2));
if (!ok) process.exit(1);
