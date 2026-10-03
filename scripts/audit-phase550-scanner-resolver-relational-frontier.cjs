const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const root = path.resolve('packages/core/src/compiler/scanner');
const forbiddenKinds = new Map([
  ['if', ts.SyntaxKind.IfStatement],
  ['for', ts.SyntaxKind.ForStatement],
  ['while', ts.SyntaxKind.WhileStatement],
  ['switch', ts.SyntaxKind.SwitchStatement],
  ['ternary', ts.SyntaxKind.ConditionalExpression],
]);
const forbiddenProperties = new Set(['map', 'filter', 'reduce', 'reduceRight', 'flatMap', 'trim', 'slice']);
const forbiddenOperators = new Set(['??', '===', '!==', '&&', '||']);

const files = [];
const visitDir = dir => fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
  const file = path.join(dir, entry.name);
  if (entry.isDirectory()) return visitDir(file);
  if (entry.name.endsWith('.ts') && !entry.name.includes('.test.') && !entry.name.includes('.spec.')) files.push(file);
});
visitDir(root);

const inspect = file => {
  const source = fs.readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  const counts = Object.fromEntries([...forbiddenKinds.keys(), ...forbiddenOperators, 'as unknown', 'undefined', 'never', ...forbiddenProperties, 'void 0'].map(key => [key, 0]));
  const modelNull = [];
  const visit = node => {
    for (const [key, kind] of forbiddenKinds) if (node.kind === kind) counts[key] += 1;
    if (ts.isBinaryExpression(node) && forbiddenOperators.has(node.operatorToken.getText(sourceFile))) counts[node.operatorToken.getText(sourceFile)] += 1;
    if (ts.isAsExpression(node) && node.type.kind === ts.SyntaxKind.UnknownKeyword) counts['as unknown'] += 1;
    if (ts.isIdentifier(node) && node.text === 'undefined') counts.undefined += 1;
    if (ts.isTypeReferenceNode(node) && node.typeName.getText(sourceFile) === 'never') counts.never += 1;
    if (ts.isPropertyAccessExpression(node) && forbiddenProperties.has(node.name.text)) counts[node.name.text] += 1;
    if (ts.isVoidExpression(node) && node.expression.kind === ts.SyntaxKind.NumericLiteral && node.expression.text === '0') counts['void 0'] += 1;
    if (node.kind === ts.SyntaxKind.NullKeyword) modelNull.push(sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1);
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  const transpiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }, reportDiagnostics: true, fileName: file });
  const diagnostics = (transpiled.diagnostics || []).map(d => ts.flattenDiagnosticMessageText(d.messageText, ' '));
  return { counts, modelNull, transpileDiagnostics: diagnostics };
};

const targets = {};
let hostLeakCount = 0;
let transpileClean = true;
for (const file of files) {
  const rel = path.relative(process.cwd(), file);
  const result = inspect(file);
  targets[rel] = result;
  hostLeakCount += Object.values(result.counts).reduce((a, b) => a + b, 0);
  transpileClean = transpileClean && result.transpileDiagnostics.length === 0;
}

const leakingFiles = Object.entries(targets)
  .filter(([, value]) => Object.values(value.counts).some(count => count > 0))
  .map(([file, value]) => ({ file, counts: Object.fromEntries(Object.entries(value.counts).filter(([, count]) => count > 0)) }));

const payload = {
  phase: 550,
  frontier: 'scanner-resolver-relational-frontier',
  scannedFiles: files.length,
  hostLeakCount,
  leakingFiles,
  modelNullEvidence: Object.fromEntries(Object.entries(targets).filter(([, value]) => value.modelNull.length > 0).map(([file, value]) => [file, value.modelNull])),
  transpileDiagnosticsClean: transpileClean,
  closedSurfaceClean: hostLeakCount === 0 && transpileClean,
  note: 'NullKeyword occurrences are reported separately because PHP null is legitimate semantic/source evidence in scanner AST models; host-control leakage is audited independently.'
};
console.log(JSON.stringify(payload, null, 2));
process.exit(transpileClean ? 0 : 1);
