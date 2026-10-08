#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(root, rel));
const failures = [];
const check = (name, ok, detail) => { if (!ok) failures.push({ name, detail }); };

const reasoning = read('packages/core/src/types/upstream/semanticReasoning.ts');
const capability = read('packages/core/src/types/upstream/semanticCapability.ts');
const dataflow = read('packages/core/src/types/upstream/semanticDataflow.ts');
const boundary = read('packages/core/src/types/interfaces/interfaceDependencyBoundary.ts');
const route = read('packages/core/src/types/upstream/route.ts');
const routeAuthority = read('packages/core/src/types/upstream/routeCapabilityAuthority.ts');
const genericDataflow = read('packages/core/src/types/dataflow/dataFlowInterface.ts');
const routeProjection = read('packages/cli/src/generators/classifier/routeCapabilityProjectionInterface.ts');
const routeGrouper = read('packages/cli/src/generators/classifier/routeGrouper.ts');
const routePartitioner = read('packages/cli/src/generators/classifier/builders/subRoutePartitioner.ts');
const singletonBuilder = read('packages/cli/src/generators/classifier/builders/singletonGroupBuilder.ts');
const irBoundary = read('packages/core/src/compiler/ir/SemanticDataflowIRProjectionInterface.ts');
const graphBoundary = read('packages/core/src/graph/RouteSyncManifestGraphProjectionInterface.ts');
const manifestBoundary = read('packages/core/src/compiler/scanner/orchestrator/RouteSyncManifestFlowProjectionInterface.ts');

check('reasoning algebra has interface facets',
  /SemanticReasoningExecutionInterface/.test(reasoning) &&
  /SemanticReasoningRelationInterface/.test(reasoning) &&
  /SemanticReasoningRewriteInterface/.test(reasoning) &&
  /SemanticReasoningFixedPointInterface/.test(reasoning) &&
  /SemanticReasoningJudgmentInterface/.test(reasoning) &&
  /interface SemanticReasoningAlgebraInterface/.test(reasoning),
  'execution/relation/rewrite/fixed-point/judgment must remain explicit facets.');

check('reasoning contract refines proof algebra',
  /interface SemanticReasoningProofInterface/.test(reasoning) &&
  /interface SemanticReasoningContractInterface<[\s\S]*extends SemanticReasoningProofInterface<Strategy, Evidence>/.test(reasoning) &&
  /interface SemanticReasoningContract<[\s\S]*extends SemanticReasoningContractInterface<Strategy, Evidence>/.test(reasoning),
  'reasoning must follow interface algebra -> proof algebra -> contract specialization.');

check('reasoning authority is read-only and upstream',
  /interface SemanticReasoningAuthorityInterface/.test(reasoning) &&
  /readonly reasoning: Contract/.test(reasoning) &&
  /SemanticReasoningAuthority = 'upstream'/.test(reasoning),
  'downstream receives a closed reasoning witness, not the reasoning executor.');

check('capability contract composes capability algebra',
  /interface SemanticCapabilityAlgebraInterface/.test(capability) &&
  /interface SemanticCapabilityContractInterface<[\s\S]*extends[\s\S]*SemanticCapabilityAlgebraInterface/.test(capability) &&
  /interface SemanticCapabilityContract<[\s\S]*extends SemanticCapabilityContractInterface/.test(capability),
  'capability meaning must be closed upstream before wiring.');

check('capability carries reasoning authority',
  /SemanticReasoningAuthorityInterface<Reasoning\['strategy'\], ReasoningEvidence, Reasoning>/.test(capability) &&
  /interface SemanticCapabilityAlgebraInterface[\s\S]*SemanticReasoningAuthorityInterface/.test(capability),
  'capability must carry the proof-bearing reasoning contract.');

check('dataflow contract composes dataflow algebra',
  /interface SemanticDataflowAlgebraInterface/.test(dataflow) &&
  /interface SemanticDataflowContractInterface<[\s\S]*extends SemanticDataflowAlgebraInterface/.test(dataflow) &&
  /interface SemanticDataflowInterface extends SemanticDataflowContractInterface/.test(dataflow),
  'semantic dataflow must follow algebra -> contract -> closed interface.');

check('generic DataFlowInterface remains execution/query infrastructure',
  /DataFlowExecutionAlgebraInterface/.test(genericDataflow) &&
  /DataFlowAuthorityAlgebraInterface/.test(genericDataflow) &&
  /DataFlowAuthorityInterface/.test(genericDataflow) &&
  /DataFlowCapabilityAuthorityInterface/.test(genericDataflow),
  'generic dataflow must not become the semantic domain authority.');

check('wiring is a distinct directional lane',
  /interface InterfaceDependencyBoundary<Upstream, Downstream>/.test(boundary) &&
  /interface UpstreamWiringInterface<Upstream, Downstream>/.test(boundary) &&
  /direction: 'upstream_to_downstream'/.test(boundary) &&
  /upstreamAuthority: 'upstream'/.test(boundary),
  'wiring must encode direction and ownership without becoming semantic authority.');

check('route capability is closed upstream',
  /interface RouteCapabilityAlgebraInterface[\s\S]*extends SemanticCapabilityContractInterface<'route_capability', RouteCapabilityEvidence, RouteIdentity>/.test(route) &&
  /interface RouteCapabilityContract extends RouteCapabilityAlgebraInterface/.test(route) &&
  /readonly crudRole: CrudRole/.test(route) &&
  /readonly actionKind: RouteActionKind/.test(route),
  'route CRUD/action meaning must cross the boundary as capability values.');

check('route semantic authority is relation-driven',
  /relationFirstOption/.test(routeAuthority) &&
  /relationResolve/.test(routeAuthority) &&
  /crudRoleResolution/.test(routeAuthority) &&
  !/\bif\s*\(/.test(routeAuthority),
  'route semantic derivation belongs to upstream relation algebra, not downstream control flow.');

check('route projection is explicit upstream wiring',
  /extends UpstreamWiringInterface<RouteSemanticFlow, ClassifiedRoute>/.test(routeProjection) &&
  /direction: 'upstream_to_downstream'/.test(routeGrouper) &&
  /upstreamAuthority: 'upstream'/.test(routeGrouper),
  'CLI receives a materialized projection from RouteSemanticFlow.');

check('known route consumers use upstream action semantics',
  /route\.capability\.crudRole/.test(routeGrouper) &&
  /route\.capability\.actionKind/.test(routePartitioner) &&
  /r\.capability\.actionKind/.test(singletonBuilder),
  'grouping/partitioning must consume capability, not reconstruct method semantics.');

check('downstream boundaries are directional',
  /extends UpstreamWiringInterface<RouteSyncManifestFlow, RouteSyncManifestGraphSurface>/.test(graphBoundary) &&
  /extends UpstreamWiringInterface<RouteSyncManifest, RouteSyncManifestFlow>/.test(manifestBoundary),
  'manifest and graph lanes must preserve upstream -> wiring -> downstream.');

check('IR consumes a projection boundary',
  /extends DataFlowProjectionInterface</.test(irBoundary) &&
  /SemanticDataflowInput/.test(irBoundary) &&
  /SemanticDataflowJudgment/.test(irBoundary),
  'IR may project closed semantic dataflow but must not solve it again.');

const cliRoot = path.join(root, 'packages/cli/src');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const p = path.join(dir, entry.name);
  if (entry.isDirectory()) return walk(p);
  return entry.name.endsWith('.ts') && !p.includes(`${path.sep}__tests__${path.sep}`) ? [p] : [];
});
const semanticMethodComparisons = [];
for (const file of walk(cliRoot)) {
  const text = fs.readFileSync(file, 'utf8');
  if (/\b(?:route|r|freshRoute)\.(?:identity\.coordinates\.)?(?:method|path)\s*(?:===|!==|==|!=)/.test(text)) {
    const rel = path.relative(root, file).split(path.sep).join('/');
    if (!rel.endsWith('generators/names.ts') && !rel.endsWith('commands/audit/driftAuditor.ts') && !rel.endsWith('generators/classifier/routeGrouper.ts')) semanticMethodComparisons.push(rel);
  }
}
check('no downstream route method/path semantic reconstruction',
  semanticMethodComparisons.length === 0,
  semanticMethodComparisons.join(', ') || 'none');

const result = {
  phase: 1237,
  topology: 'upstream semantic algebra -> closed contract/authority -> UpstreamWiringInterface -> downstream projection',
  checks: Object.fromEntries([
    ['reasoning', !failures.some(f => f.name.startsWith('reasoning'))],
    ['capability', !failures.some(f => f.name.startsWith('capability'))],
    ['dataflow', !failures.some(f => f.name.startsWith('dataflow'))],
    ['wiring', !failures.some(f => f.name.startsWith('wiring'))],
    ['route', !failures.some(f => f.name.startsWith('route'))],
    ['downstream', !failures.some(f => f.name.startsWith('known route') || f.name.startsWith('no downstream'))],
    ['boundaries', !failures.some(f => f.name.startsWith('downstream boundaries') || f.name.startsWith('IR'))],
  ]),
  failures,
  staleHistoricalAudits: [
    'packages/core/scripts/audits/audit-phase1010-dataflow-interface.cjs',
    'packages/core/scripts/audits/audit-phase1011-dataflow-interface.cjs',
    'packages/core/scripts/audits/audit-phase1012-dataflow-projection-boundaries.cjs',
    'packages/core/scripts/audits/audit-phase1037-dataflow-interface-downstream.cjs',
    'packages/core/scripts/audits/audit-phase1042-interface-dependency-boundary.cjs',
    'packages/core/scripts/audits/audit-phase1057-upstream-wiring-interface-downstream.cjs',
    'packages/core/scripts/audits/audit-phase1063-upstream-wiring-downstream-trace.cjs',
    'packages/core/scripts/audits/audit-phase1094-upstream-wiring-interface-downstream.cjs',
    'packages/core/scripts/audits/audit-phase1127-end-to-end-semantic-surface.cjs',
    'packages/core/scripts/audits/audit-phase1131-full-scanner-upstream-wiring-interface-downstream.cjs',
  ],
  passed: failures.length === 0,
};
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.passed ? 0 : 1;
