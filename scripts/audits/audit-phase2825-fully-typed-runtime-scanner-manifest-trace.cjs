const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const relation = read('packages/core/src/compiler/frontend/php/routeAst/semanticRouteSyntaxRelations.ts');
const parser = read('packages/core/src/compiler/frontend/php/routeAst/routeDeclarationParser.ts');
const cliIndex = read('packages/cli/src/index.ts');
const scanContract = read('packages/cli/src/manifestScanOperationInterface.ts');
const compositionContract = read('packages/cli/src/upstreamCompositionInterface.ts');
const manifestAuthority = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const astPipeline = read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts');
const surface = read('packages/core/src/types/upstream/semanticDataflowManifestSurface.ts');
const builder = read('packages/core/src/types/upstream/manifestBuilderInterface.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
const collectionsPath = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const operationPairs = [
  ['route constraint fact', 'RouteConstraintFactOperationInterface', 'routeConstraintFactOperation', 'deriveRouteConstraintFact'],
  ['constraint AST projection', 'RouteConstraintArgumentAstOperationInterface', 'routeConstraintArgumentAstOperation', 'argument: RouteConstraintSyntaxArgument) => argument'],
  ['group-where syntax test', 'IsGroupWhereOperationInterface', 'isGroupWhereOperation', 'isGroupWhereImplementation'],
  ['empty group-state factory', 'EmptyRouteGroupStateFactoryInterface', 'emptyRouteGroupStateFactory', 'createEmptyRouteGroupState'],
  ['group binding-scope lookup', 'RouteGroupBindingScopeLookupOperationInterface', 'routeGroupBindingScopeLookupOperation', 'catalogValue(GROUP_BINDING_SCOPE'],
  ['group property lookup', 'RouteGroupPropertyLookupOperationInterface', 'routeGroupPropertyLookupOperation', 'catalogValue(GROUP_PROPERTIES'],
  ['group constraint fact', 'RouteGroupConstraintFactOperationInterface', 'routeGroupConstraintFactOperation', 'routeConstraintFactOperation.derive'],
  ['group transition', 'AdvanceRouteGroupStateOperationInterface', 'advanceRouteGroupStateOperation', 'ROUTE_GROUP_TRANSITIONS'],
  ['pending group-state transition', 'RouteGroupPendingStateOperationInterface', 'routeGroupPendingStateOperation', 'deriveRouteGroupPendingState'],
  ['route target description', 'RouteTargetDescriptionOperationInterface', 'routeTargetDescriptionOperation', 'describeRouteTarget'],
  ['route target AST projection', 'RouteTargetAstOperationInterface', 'routeTargetAstOperation', 'projectRouteTargetAst'],
  ['group-state merge', 'MergeRouteGroupStatesOperationInterface', 'mergeRouteGroupStatesOperation', 'mergeRouteGroupStatesImplementation'],
  ['route invocation fact', 'RouteInvocationFactOperationInterface', 'routeInvocationFactOperation', 'deriveRouteInvocationFact'],
  ['route invocation method', 'RouteInvocationMethodOperationInterface', 'routeInvocationMethodOperation', 'deriveRouteInvocationMethod'],
];
const checks = operationPairs.map(([label, iface, operation, impl]) => [
  `${label} has interface-first frozen runtime export`,
  new RegExp(`interface ${iface}\\s*\\{[\\s\\S]*?readonly`).test(relation) && new RegExp(`export const ${operation}:\\s*${iface}\\s*=\\s*Object\\.freeze\\(`).test(relation) && relation.includes(impl),
]);
checks.push(
  ['route declaration parser consumes typed operations, not legacy exports', ['routeConstraintFactOperation.derive(', 'routeConstraintArgumentAstOperation.project(', 'routeTargetAstOperation.project(', 'emptyRouteGroupStateFactory.create(', 'mergeRouteGroupStatesOperation.merge(', 'routeInvocationMethodOperation.resolve(', 'routeGroupPendingStateOperation.advance(', 'advanceRouteGroupStateOperation.advance('].every((value) => parser.includes(value)) && !/\b(routeConstraintFact|routeConstraintArgumentAst|routeTargetAst|emptyRouteGroupState|mergeRouteGroupStates|routeInvocationMethod|routeGroupPendingState|advanceRouteGroupState)\s*\(/.test(parser)],
  ['no legacy function-shaped runtime exports remain in route syntax relations', !/^export function\s+/m.test(relation) && !/^export const\s+[A-Za-z0-9_]+\s*=\s*\(/m.test(relation)],
  ['route syntax ADT retains domain-specific proof continuation', /continueForProofRelation/.test(relation) && /continuation\.routeInvocation\(value\)/.test(relation)],
  ['CLI scan contract is typed and delegates composition authority', /interface RouteSyncCliManifestScanOperationInterface/.test(scanContract) && /authority\.compose\(input\)/.test(scanContract)],
  ['CLI upstream composition contract is explicit and exported', /interface RouteSyncCliUpstreamCompositionInterface/.test(compositionContract) && /RouteSyncCliUpstreamCompositionInterface/.test(cliIndex)],
  ['manifest composition authority remains the existing contract', /interface ControllerInvocationManifestCompositionAuthorityInterface/.test(manifestAuthority) && /ControllerInvocationManifestCompositionAuthorityInterface/.test(cliIndex)],
  ['source AST pipeline interface remains upstream-owned', /interface LaravelSourceAstPipelineInterface/.test(astPipeline) && /export \* from '\.\/laravelSourceAstPipelineInterface'/.test(upstreamIndex)],
  ['manifest surface exposes operations for source model and judgments', /interface SemanticDataflowManifestSurfaceInterface/.test(surface) && /inputsFromSourceModel/.test(surface) && /judgmentsFromInputs/.test(surface) && /queryPolicyContractsFromJudgments/.test(surface)],
  ['manifest builder preserves complete versus blocked judgment ADT', /type ManifestBuilderJudgment\s*=\s*ManifestBuilderCompleteJudgment\s*\|\s*ManifestBuilderBlockedJudgment/.test(builder)],
  ['upstream barrel already exposes manifest and source contracts', /export \* from '\.\/manifestBuilderInterface'/.test(upstreamIndex) && /export \* from '\.\/semanticDataflowManifestSurface'/.test(upstreamIndex) && /export \* from '\.\/laravelSourceAstPipelineInterface'/.test(upstreamIndex)],
  ['upstream collections remains exactly empty', fs.statSync(collectionsPath).size === 0],
);
let failures = 0;
for (const [label, passed] of checks) { console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`); if (!passed) failures++; }
console.log(`Phase 2825 fully typed runtime scanner / manifest trace: ${checks.length - failures}/${checks.length} checks passed.`);
console.log('Structural audit only: it does not prove TypeScript typecheck, runtime behavior, full build, or E2E execution.');
if (failures) process.exitCode = 1;
