const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const sourceRoot = path.join(root, 'packages/core/src');
const banned = Object.freeze(['if','while','for','switch','map','filter','reduce','flatMap','undefined','null','??','===','!==','as unknown','Set','Map','any','new','ternary']);
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => { const file = path.join(directory, entry.name); return entry.isDirectory() ? walk(file) : file.endsWith('.ts') && !file.includes('__tests__') && !file.endsWith('.test.ts') ? [file] : []; });
const count = source => { const sf = ts.createSourceFile('audit.ts', source, ts.ScriptTarget.Latest, true); const result = Object.fromEntries(banned.map(key => [key, 0])); const visit = node => { if (node.kind === ts.SyntaxKind.IfStatement) result.if += 1; if (node.kind === ts.SyntaxKind.WhileStatement) result.while += 1; if ([ts.SyntaxKind.ForStatement, ts.SyntaxKind.ForOfStatement, ts.SyntaxKind.ForInStatement].includes(node.kind)) result.for += 1; if (node.kind === ts.SyntaxKind.SwitchStatement) result.switch += 1; if (node.kind === ts.SyntaxKind.ConditionalExpression) result.ternary += 1; if (node.kind === ts.SyntaxKind.NewExpression) result.new += 1; if (node.kind === ts.SyntaxKind.NullKeyword) result.null += 1; if (node.kind === ts.SyntaxKind.QuestionQuestionToken) result['??'] += 1; if (node.kind === ts.SyntaxKind.EqualsEqualsEqualsToken) result['==='] += 1; if (node.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken) result['!=='] += 1; if (node.kind === ts.SyntaxKind.AsExpression && node.type.kind === ts.SyntaxKind.UnknownKeyword) result['as unknown'] += 1; if (node.kind === ts.SyntaxKind.Identifier) { if (node.text === 'undefined') result.undefined += 1; if (node.text === 'any') result.any += 1; } if (node.kind === ts.SyntaxKind.AnyKeyword) result.any += 1; if (node.kind === ts.SyntaxKind.TypeReference && ts.isIdentifier(node.typeName) && ['Set','Map'].includes(node.typeName.text)) result[node.typeName.text] += 1; if (node.kind === ts.SyntaxKind.CallExpression && ts.isPropertyAccessExpression(node.expression) && ['map','filter','reduce','flatMap'].includes(node.expression.name.text)) result[node.expression.name.text] += 1; ts.forEachChild(node, visit); }; visit(sf); return result; };
const files = walk(sourceRoot);
const reports = files.map(file => ({ file: path.relative(root, file), ...count(fs.readFileSync(file, 'utf8')) }));
const selectedFiles = [
  'packages/core/src/compiler/query/TypedCache.ts',
  'packages/core/src/compiler/query/cache/storage.ts',
  'packages/core/src/compiler/query/cache/queryKey.ts',
  'packages/core/src/compiler/query/salsa/queryGraphManager.ts',
  'packages/core/src/compiler/query/salsa/queryExecutor.ts',
  'packages/core/src/compiler/query/salsa/cycleDetector.ts',
  'packages/core/src/compiler/query/salsa/salsaTypes.ts',
  'packages/core/src/compiler/query/SalsaCompiler.ts',
  'packages/core/src/compiler/analysis/SymbolAnalysis.ts',
  'packages/core/src/compiler/analysis/symbol/symbolGraph.ts',
  'packages/core/src/compiler/analysis/symbol/symbolHierarchy.ts',
  'packages/core/src/compiler/analysis/ssa/ssaBuilder.ts',
  'packages/core/src/compiler/analysis/ssa/ssaRenamer.ts',
  'packages/core/src/compiler/analysis/ssa/renamer/blockInstructionRenamer.ts',
  'packages/core/src/compiler/analysis/ssa/renamer/variableVersionScope.ts',
  'packages/core/src/compiler/analysis/loop/loopDetector.ts',
  'packages/core/src/compiler/analysis/loop/loopNormalizer.ts',
  'packages/core/src/compiler/domain/common/ManifestArtifactLowerer.ts',
  'packages/core/src/compiler/domain/common/ResourceFieldFlattener.ts',
  'packages/core/src/compiler/domain/common/ResponseFieldFlattener.ts',
  'packages/core/src/compiler/domain/common/ConversionResult.ts',
  'packages/core/src/compiler/domain/common/response-lowering/loweringContracts.ts',
  'packages/core/src/compiler/domain/common/response-lowering/mapper/fieldConverter.ts',
  'packages/core/src/types/ir/resolvedSemanticFactory.ts',
  'packages/core/src/semantic/SymbolTable.ts',
  'packages/core/src/semantic/CycleDetector.ts',
  'packages/core/src/semantic/modelNodes.ts',
  'packages/core/src/semantic/SemanticResolutionKernel.ts',
];
const selected = selectedFiles.map(file => reports.find(report => report.file === file)).filter(Boolean);
const frontierRoots = ['packages/core/src/compiler/scanner', 'packages/core/src/semantic', 'packages/core/src/types/upstream', 'packages/core/src/compiler/analysis', 'packages/core/src/compiler/domain/common', 'packages/core/src/compiler/query'];
const frontier = reports.filter(report => frontierRoots.some(rootName => report.file.startsWith(rootName + '/')));
const aggregate = rows => Object.fromEntries(banned.map(key => [key, rows.reduce((sum, row) => sum + row[key], 0)]));
const emptyProductionFiles = files.filter(file => fs.statSync(file).size === 0).map(file => path.relative(root, file));
const audit = { phase: 596, scope: 'packages/core/src', productionFileCount: files.length, selected, selectedZeroLeak: selected.filter(report => Object.values(report).slice(1).every(value => value === 0)).map(report => report.file), emptyProductionFiles, frontierAggregate: aggregate(frontier), globalAggregate: aggregate(reports), frontierTopLeaks: frontier.filter(report => Object.values(report).slice(1).some(Boolean)).sort((a,b) => Object.values(b).slice(1).reduce((x,y)=>x+y,0) - Object.values(a).slice(1).reduce((x,y)=>x+y,0)).slice(0,60) };
fs.writeFileSync(path.join(root, 'docs/PHASE596_DECLARATIVE_FRONTIER_AUDIT.json'), JSON.stringify(audit, null, 2) + '\n');
console.log(JSON.stringify({ productionFileCount: audit.productionFileCount, selectedZeroLeak: audit.selectedZeroLeak, emptyProductionFiles: audit.emptyProductionFiles.length, frontierAggregate: audit.frontierAggregate, globalAggregate: audit.globalAggregate }, null, 2));
