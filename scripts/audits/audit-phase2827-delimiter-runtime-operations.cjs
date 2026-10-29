const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const navigation = read('packages/core/src/compiler/frontend/php/routeAst/delimiterNavigation.ts');
const cursor = read('packages/core/src/compiler/frontend/php/routeAst/relationalSyntaxCursor.ts');
const scanContract = read('packages/cli/src/manifestScanOperationInterface.ts');
const composition = read('packages/cli/src/upstreamCompositionInterface.ts');
const authority = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const astPipeline = read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts');
const surface = read('packages/core/src/types/upstream/semanticDataflowManifestSurface.ts');
const builder = read('packages/core/src/types/upstream/manifestBuilderInterface.ts');
const cliIndex = read('packages/cli/src/index.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
const collectionPath = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const operations = [
  ['empty delimiter state factory', 'EmptyDelimiterStateFactoryInterface', 'emptyDelimiterStateFactory', 'create'],
  ['delimiter transition', 'DelimiterTransitionOperationInterface', 'delimiterTransitionOperation', 'advance'],
  ['top-level predicate', 'TopLevelDelimiterPredicateOperationInterface', 'isTopLevelDelimiterOperation', 'test'],
  ['opening predicate', 'OpeningDelimiterPredicateOperationInterface', 'isOpeningDelimiterOperation', 'test'],
  ['closing predicate', 'ClosingDelimiterPredicateOperationInterface', 'isClosingDelimiterOperation', 'test'],
  ['current delimiter closure', 'CurrentDelimiterClosureOperationInterface', 'closesCurrentDelimiterOperation', 'test'],
  ['delimiter depth', 'DelimiterDepthOperationInterface', 'delimiterDepthOperation', 'measure'],
  ['matching delimiter close', 'MatchingDelimiterCloseOperationInterface', 'matchingDelimiterCloseOperation', 'resolve'],
];
const checks = operations.map(([label, iface, operation, member]) => [
  `${label} is an interface-first frozen operation`,
  new RegExp(`interface ${iface}\\s*\\{[\\s\\S]*?readonly ${member}:`).test(navigation) && new RegExp(`export const ${operation}:\\s*${iface}\\s*=\\s*Object\\.freeze\\(`).test(navigation),
]);
checks.push(
  ['runtime cursor uses domain operations', ['closesCurrentDelimiterOperation.test(', 'delimiterTransitionOperation.advance(', 'isTopLevelDelimiterOperation.test(', 'emptyDelimiterStateFactory.create('].every(value => cursor.includes(value))],
  ['legacy free-function exports removed', !/^export const (emptyDelimiterState|delimiterTransition|isTopLevelDelimiter|isOpeningDelimiter|isClosingDelimiter|closesCurrentDelimiter|delimiterDepth|matchingClose)\s*=/m.test(navigation)],
  ['runtime cursor has no legacy calls', !/\b(emptyDelimiterState|delimiterTransition|isTopLevelDelimiter|isOpeningDelimiter|isClosingDelimiter|closesCurrentDelimiter|delimiterDepth|matchingClose)\s*\(/.test(cursor)],
  ['CLI scan path remains explicitly contracted', /RouteSyncCliManifestScanOperationInterface/.test(scanContract) && /authority\.compose\(input\)/.test(scanContract)],
  ['CLI composition delegates to existing authority', /RouteSyncCliUpstreamCompositionInterface/.test(composition) && /ControllerInvocationManifestCompositionAuthorityInterface/.test(authority)],
  ['AST and manifest judgments preserve complete/blocked', /LaravelSourceAstPipelineInterface/.test(astPipeline) && /SemanticDataflowManifestSurfaceInterface/.test(surface) && /ManifestBuilderJudgment/.test(builder) && /blocked/.test(builder) && /complete/.test(builder)],
  ['existing CLI/upstream barrels expose the manifest path', /manifestScanOperationInterface/.test(cliIndex) && /upstreamCompositionInterface/.test(cliIndex) && /laravelSourceAstPipelineInterface/.test(upstreamIndex) && /semanticDataflowManifestSurface/.test(upstreamIndex) && /manifestBuilderInterface/.test(upstreamIndex)],
  ['upstream collections remains empty', fs.statSync(collectionPath).size === 0],
);
const failed = checks.filter(([, pass]) => !pass);
for (const [label, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'} ${label}`);
console.log(`\n${checks.length - failed.length}/${checks.length} structural checks passed`);
if (failed.length) process.exitCode = 1;
