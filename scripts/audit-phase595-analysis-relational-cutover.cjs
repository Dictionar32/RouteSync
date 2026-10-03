const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const sourceRoot = path.join(root, 'packages/core/src');
const banned = Object.freeze(['if', 'while', 'for', 'switch', 'map', 'filter', 'reduce', 'flatMap', 'undefined', 'null', '??', '===', '!==', 'as unknown', 'Set', 'Map', 'any', 'new', 'ternary']);

const walkFiles = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const full = path.join(directory, entry.name);
  return entry.isDirectory() ? walkFiles(full) : [full];
}).filter(file => file.endsWith('.ts'));

const count = source => {
  const sf = ts.createSourceFile('audit.ts', source, ts.ScriptTarget.Latest, true);
  const result = Object.fromEntries(banned.map(key => [key, 0]));
  const visit = node => {
    if (node.kind === ts.SyntaxKind.IfStatement) result.if += 1;
    if (node.kind === ts.SyntaxKind.WhileStatement) result.while += 1;
    if ([ts.SyntaxKind.ForStatement, ts.SyntaxKind.ForOfStatement, ts.SyntaxKind.ForInStatement].includes(node.kind)) result.for += 1;
    if (node.kind === ts.SyntaxKind.SwitchStatement) result.switch += 1;
    if (node.kind === ts.SyntaxKind.ConditionalExpression) result.ternary += 1;
    if (node.kind === ts.SyntaxKind.NewExpression) result.new += 1;
    if (node.kind === ts.SyntaxKind.NullKeyword) result.null += 1;
    if (node.kind === ts.SyntaxKind.QuestionQuestionToken) result['??'] += 1;
    if (node.kind === ts.SyntaxKind.EqualsEqualsEqualsToken) result['==='] += 1;
    if (node.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken) result['!=='] += 1;
    if (node.kind === ts.SyntaxKind.AsExpression && node.type.kind === ts.SyntaxKind.UnknownKeyword) result['as unknown'] += 1;
    if (node.kind === ts.SyntaxKind.Identifier) {
      if (node.text === 'undefined') result.undefined += 1;
      if (node.text === 'any') result.any += 1;
    }
    if (node.kind === ts.SyntaxKind.AnyKeyword) result.any += 1;
    if (node.kind === ts.SyntaxKind.TypeReference && ts.isIdentifier(node.typeName) && ['Set', 'Map'].includes(node.typeName.text)) result[node.typeName.text] += 1;
    if (node.kind === ts.SyntaxKind.CallExpression && ts.isPropertyAccessExpression(node.expression) && ['map', 'filter', 'reduce', 'flatMap'].includes(node.expression.name.text)) result[node.expression.name.text] += 1;
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return result;
};

const files = walkFiles(sourceRoot);
const reports = files.map(file => ({ file: path.relative(root, file), ...count(fs.readFileSync(file, 'utf8')) }));
const selected = [
  'packages/core/src/compiler/passes/CompilationState.ts',
  'packages/core/src/compiler/passes/TypedPassAdapter.ts',
  'packages/core/src/compiler/passes/mapper/resourceRegistry.ts',
  'packages/core/src/compiler/passes/mapper/mapperAssembler.ts',
  'packages/core/src/compiler/passes/contract-domain/contractArtifactBuilder.ts',
  'packages/core/src/compiler/passes/contract-domain/contractExtraction.ts',
  'packages/core/src/compiler/generators/mapper-generation/MapperCodeBuilder.ts',
  'packages/core/src/compiler/fingerprint/Fingerprint.ts',
  'packages/core/src/compiler/domain/common/ZodSchemaLowerer.ts',
].map(file => reports.find(report => report.file === file));

const emptyProduction = files.filter(file => fs.statSync(file).size === 0).map(file => path.relative(root, file));
const audit = {
  phase: 595,
  scope: 'packages/core/src',
  productionFileCount: files.length,
  selected,
  emptyProductionFiles: emptyProduction,
  selectedZeroLeak: selected.filter(report => report && Object.values(report).slice(1).every(value => value === 0)).map(report => report.file),
  globalNonEmpty: Object.fromEntries(banned.map(key => [key, reports.reduce((sum, report) => sum + report[key], 0)])),
};

const output = path.join(root, 'docs/PHASE595_ANALYSIS_RELATIONAL_CUTOVER_AUDIT.json');
fs.writeFileSync(output, JSON.stringify(audit, null, 2) + '\n');
console.log(JSON.stringify({ productionFileCount: audit.productionFileCount, selectedZeroLeak: audit.selectedZeroLeak, emptyProductionFiles: audit.emptyProductionFiles.length, globalNonEmpty: audit.globalNonEmpty }, null, 2));
