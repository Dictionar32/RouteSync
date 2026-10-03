const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const fs = require('fs');
const path = require('path');

const roots = process.argv.slice(2).filter(Boolean);
const files = roots.flatMap(root => {
  const stat = fs.statSync(root);
  if (stat.isFile()) return [root];
  const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const next = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(next) : (/\.tsx?$/.test(entry.name) ? [next] : []);
  });
  return walk(root);
});

const counts = { if: 0, for: 0, while: 0, switch: 0, map: 0, filter: 0, reduce: 0, flatMap: 0, undefined: 0, null: 0, nullish: 0, optionalChain: 0, strict: 0, as: 0 };
const hits = [];
const perFile = new Map();
let parseDiagnostics = 0;

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  parseDiagnostics += sf.parseDiagnostics.length;
  const fileCounts = Object.fromEntries(Object.keys(counts).map(key => [key, 0]));
  function visit(node) {
    const kinds = [];
    if (ts.isIfStatement(node)) { counts.if++; kinds.push('if'); }
    if (ts.isForStatement(node) || ts.isForInStatement(node) || ts.isForOfStatement(node)) { counts.for++; kinds.push('for'); }
    if (ts.isWhileStatement(node) || ts.isDoStatement(node)) { counts.while++; kinds.push('while'); }
    if (ts.isSwitchStatement(node)) { counts.switch++; kinds.push('switch'); }
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && ['map','filter','reduce','flatMap'].includes(node.expression.name.text)) {
      counts[node.expression.name.text]++; kinds.push(node.expression.name.text);
    }
    if (ts.isIdentifier(node) && node.text === 'undefined') { counts.undefined++; kinds.push('undefined'); }
    if (node.kind === ts.SyntaxKind.NullKeyword) { counts.null++; kinds.push('null'); }
    if (ts.isBinaryExpression(node) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken].includes(node.operatorToken.kind)) { counts.strict++; kinds.push('strict'); }
    if (ts.isAsExpression(node)) { counts.as++; kinds.push('as'); }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) { counts.nullish++; kinds.push('nullish'); }
    if (ts.isPropertyAccessExpression(node) && node.questionDotToken) { counts.optionalChain++; kinds.push('optionalChain'); }
    for (const kind of kinds) if (Object.prototype.hasOwnProperty.call(fileCounts, kind)) fileCounts[kind]++;
    if (kinds.length) {
      const pos = sf.getLineAndCharacterOfPosition(node.getStart(sf));
      hits.push(`${file}:${pos.line + 1}:${kinds.join(',')}`);
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  perFile.set(file, fileCounts);
}

const hotspots = [...perFile.entries()]
  .map(([file, values]) => ({ file, total: Object.values(values).reduce((sum, value) => sum + value, 0), values }))
  .filter(entry => entry.total > 0)
  .sort((left, right) => right.total - left.total);
console.log(JSON.stringify({ counts, parseDiagnostics, files: files.length, hotspots: hotspots.slice(0, 40) }, null, 2));
if (process.env.ROUTESYNC_AUDIT_STRICT === '1' && Object.values(counts).some(value => value !== 0)) {
  console.error(hits.slice(0, 200).join('\n'));
  process.exitCode = 1;
}
