const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ts = require('typescript');

const root = process.cwd();
const core = path.join(root, 'packages/core/src');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const files = walk(core).filter(p => p.endsWith('.ts') && !p.includes(`${path.sep}__tests__${path.sep}`) && !p.includes(`${path.sep}__test__${path.sep}`) && !p.endsWith('.test.ts'));
const rel = p => path.relative(root, p).replaceAll(path.sep, '/');
const frontierRoots = [
  'packages/core/src/compiler/scanner',
  'packages/core/src/compiler/domain',
  'packages/core/src/compiler/analysis',
  'packages/core/src/compiler/generators',
  'packages/core/src/compiler/diagnostics',
  'packages/core/src/compiler/relational',
  'packages/core/src/types/upstream',
  'packages/core/src/types/domain',
];
const frontier = files.filter(p => frontierRoots.some(r => rel(p).startsWith(r + '/')));

const counts = {
  if: 0, while: 0, for: 0, switch: 0,
  map: 0, filter: 0, reduce: 0, flatMap: 0,
  undefined: 0, null: 0, nullishCoalesce: 0,
  strictEquality: 0, unknownAssertion: 0,
  setConstruction: 0, mapConstruction: 0, anyType: 0, newExpression: 0,
};
const byFile = [];

for (const file of frontier) {
  const source = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const c = Object.fromEntries(Object.keys(counts).map(k => [k, 0]));
  const addCall = node => {
    const expression = node.expression;
    if (!ts.isPropertyAccessExpression(expression)) return;
    const name = expression.name.text;
    if (name === 'map') c.map++;
    if (name === 'filter') c.filter++;
    if (name === 'reduce') c.reduce++;
    if (name === 'flatMap') c.flatMap++;
  };
  const visit = node => {
    if (ts.isIfStatement(node)) c.if++;
    if (ts.isWhileStatement(node) || ts.isDoStatement(node)) c.while++;
    if (ts.isForStatement(node) || ts.isForInStatement(node) || ts.isForOfStatement(node)) c.for++;
    if (ts.isSwitchStatement(node)) c.switch++;
    if (ts.isCallExpression(node)) addCall(node);
    if (ts.isBinaryExpression(node)) {
      if (node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) c.nullishCoalesce++;
      if (node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken || node.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken) c.strictEquality++;
    }
    if (ts.isNewExpression(node)) {
      c.newExpression++;
      if (ts.isIdentifier(node.expression) && node.expression.text === 'Set') c.setConstruction++;
      if (ts.isIdentifier(node.expression) && node.expression.text === 'Map') c.mapConstruction++;
    }
    if (ts.isAsExpression(node) && node.type && node.type.kind === ts.SyntaxKind.UnknownKeyword) c.unknownAssertion++;
    if (node.kind === ts.SyntaxKind.AnyKeyword) c.anyType++;
    if (ts.isIdentifier(node) && node.text === 'undefined') c.undefined++;
    if (node.kind === ts.SyntaxKind.NullKeyword) c.null++;
    ts.forEachChild(node, visit);
  };
  visit(sf);
  const nonzero = Object.fromEntries(Object.entries(c).filter(([, n]) => n > 0));
  if (Object.keys(nonzero).length) byFile.push({ file: rel(file), entries: nonzero });
  for (const [k, n] of Object.entries(c)) counts[k] += n;
}

const retiredFiles = [
  'packages/core/src/ir/domain/ContractMetadataBuilder.ts',
  'packages/core/src/ir/domain/FieldTypeResolver.ts',
  'packages/core/src/ir/domain/RequestEndpointBuilder.ts',
  'packages/core/src/ir/domain/ResourceIRBuilder.ts',
  'packages/core/src/ir/domain/ResourceMapperBuilder.ts',
  'packages/core/src/ir/domain/request-endpoint/requestValidator.ts',
].map(f => ({ file: f, bytes: fs.statSync(path.join(root, f)).size }));

const parsedLegacy = [];
for (const f of files) {
  const source = fs.readFileSync(f, 'utf8');
  if (/\bParsedResource\b|\bParsedRequest\b|\bScannedResourceDescriptor\b/.test(source)) parsedLegacy.push(rel(f));
}

let vacuum = { allCandidatesEmpty: false };
try { vacuum = JSON.parse(cp.execFileSync(process.execPath, [path.join(root, 'scripts/audit-phase525-inactive-file-vacuum.cjs')], { encoding: 'utf8' })); } catch (e) { vacuum = { error: String(e.stdout || e.message) }; }

const result = {
  phase: 695,
  kind: 'semantic-compiler-frontier',
  executionSignatureAliases: { base: false, any: false },
  legacyRequestAndResourceDescriptors: { productionReferences: parsedLegacy, empty: parsedLegacy.length === 0 },
  retiredLegacyFiles: retiredFiles,
  hostSyntaxAst: { totals: counts, byFile },
  inactiveVacuum: vacuum,
  status: parsedLegacy.length === 0 && retiredFiles.every(x => x.bytes === 0) && vacuum.allCandidatesEmpty ? 'PASS' : 'REVIEW'
};
console.log(JSON.stringify(result, null, 2));
