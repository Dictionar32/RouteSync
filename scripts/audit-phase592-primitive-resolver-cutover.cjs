const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const roots = [
  'packages/core/src/compiler/types/SemanticType.ts',
  'packages/core/src/compiler/compatibility/boundary/legacyResolver.ts',
  'packages/core/src/semantic/plugins/PrimitiveResolver.ts',
  'packages/core/src/semantic/plugins/ResourceGraphResolver.ts',
  'packages/core/src/semantic/kernel/defaultPlugins.ts',
];
const productionFiles = [];
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name);
    const stat = fs.statSync(file);
    if (stat.isDirectory()) walk(file);
    else if (name.endsWith('.ts') && !name.includes('.test.') && !name.includes('.spec.')) productionFiles.push(file);
  }
}
walk('packages/core/src');

const banned = {
  if: n => ts.isIfStatement(n),
  for: n => ts.isForStatement(n) || ts.isForInStatement(n) || ts.isForOfStatement(n),
  while: n => ts.isWhileStatement(n) || ts.isDoStatement(n),
  switch: n => ts.isSwitchStatement(n),
  map: n => ts.isPropertyAccessExpression(n) && n.name.text === 'map',
  filter: n => ts.isPropertyAccessExpression(n) && n.name.text === 'filter',
  reduce: n => ts.isPropertyAccessExpression(n) && n.name.text === 'reduce',
  flatMap: n => ts.isPropertyAccessExpression(n) && n.name.text === 'flatMap',
  undefined: n => ts.isIdentifier(n) && n.text === 'undefined',
  null: n => n.kind === ts.SyntaxKind.NullKeyword,
  nullish: n => ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken,
  strictEqual: n => ts.isBinaryExpression(n) && (n.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken || n.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken),
  asUnknown: n => ts.isAsExpression(n) && n.type.kind === ts.SyntaxKind.UnknownKeyword,
  set: n => ts.isIdentifier(n) && n.text === 'Set',
  mapType: n => ts.isIdentifier(n) && n.text === 'Map',
  any: n => ts.isKeyword(n) && n.kind === ts.SyntaxKind.AnyKeyword,
  new: n => ts.isNewExpression(n),
};
function scan(file) {
  const source = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const counts = Object.fromEntries(Object.keys(banned).map(k => [k, 0]));
  function visit(node) {
    for (const [key, predicate] of Object.entries(banned)) if (predicate(node)) counts[key]++;
    ts.forEachChild(node, visit);
  }
  visit(sf);
  return counts;
}
const selected = Object.fromEntries(roots.map(file => [file, scan(file)]));
const globalPrimitiveConstructors = productionFiles.filter(file => /new\s+PrimitiveType\s*\(/.test(fs.readFileSync(file, 'utf8')));
const globalPrimitiveInstanceChecks = productionFiles.filter(file => /instanceof\s+PrimitiveType/.test(fs.readFileSync(file, 'utf8')));
const globalPrimitiveClassDecl = productionFiles.filter(file => /\bclass\s+PrimitiveType\b/.test(fs.readFileSync(file, 'utf8')));
const result = {
  phase: 592,
  title: 'primitive semantic witness + resolver relation cutover',
  selected,
  global: {
    productionFileCount: productionFiles.length,
    primitiveConstructorFiles: globalPrimitiveConstructors,
    primitiveInstanceCheckFiles: globalPrimitiveInstanceChecks,
    primitiveClassDeclarationFiles: globalPrimitiveClassDecl,
  },
};
fs.writeFileSync('docs/PHASE592_PRIMITIVE_RESOLVER_CUTOVER_AUDIT.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
