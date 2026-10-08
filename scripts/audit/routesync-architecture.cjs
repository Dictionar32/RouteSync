#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');
const failures = [];
const passes = [];

const read = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(ROOT, relative));
const filesUnder = relative => {
  const base = path.join(ROOT, relative);
  if (!fs.existsSync(base)) return [];
  const output = [];
  const visit = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (/\.(ts|tsx|cjs|mjs)$/.test(entry.name)) output.push(full);
    }
  };
  visit(base);
  return output;
};

const relative = file => path.relative(ROOT, file).split(path.sep).join('/');
const source = file => fs.readFileSync(file, 'utf8');
const production = [...filesUnder('packages/core/src/compiler'), ...filesUnder('packages/cli/src')]
  .filter(file => !/(^|\/)__tests__(\/|$)/.test(relative(file)));

const check = (name, condition, detail) => {
  if (condition) passes.push({ name, detail });
  else failures.push({ name, detail });
};

check('upstream semantic capability contract exists',
  exists('packages/core/src/types/upstream/semanticCapability.ts'),
  'types/upstream/semanticCapability.ts');
check('upstream route capability authority exists',
  exists('packages/core/src/types/upstream/routeCapabilityAuthority.ts'),
  'types/upstream/routeCapabilityAuthority.ts');
check('upstream route capability semantic authority exists',
  exists('packages/core/src/types/upstream/routeCapabilitySemanticAuthority.ts')
    && /routeCapabilitySemanticAuthority/.test(read('packages/core/src/types/upstream/routeCapabilitySemanticAuthority.ts'))
    && /RouteCapabilitySemanticInput/.test(read('packages/core/src/types/upstream/routeCapabilitySemanticAuthority.ts'))
    && /RouteCapabilitySemanticResolution/.test(read('packages/core/src/types/upstream/routeCapabilitySemanticAuthority.ts')),
  'non-CRUD route capability semantics must have one upstream typed authority.');

check('route capability boundary is wiring-only',
  (() => {
    const text = read('packages/core/src/compiler/scanner/resolvers/boundary/capabilityResolution.ts');
    return /routeCapabilitySemanticAuthority\.resolve\(semanticInput, semanticOverrides\)/.test(text)
      && !/function hasRules\s*\(/.test(text)
      && !/function detectContentType\s*\(/.test(text)
      && !/function defaultErrors\s*\(/.test(text)
      && !/RouteSemanticFlowExecutionSignature\.create/.test(text)
      && !/relationAny\(|relationGate\(|relationProject\(|relationVariantFold\(/.test(text);
  })(),
  'compiler boundary translates typed evidence into the upstream semantic authority and does not re-derive capability meaning.');

const routeSemanticAuthority = read('packages/core/src/types/upstream/routeCapabilitySemanticAuthority.ts');
const routeSemanticEvidenceBlock = routeSemanticAuthority.split('export interface RouteCapabilitySemanticOverrides')[0];
check('route semantic authority separates evidence from resolution',
  /interface RouteCapabilitySemanticEvidence[\s\S]*readonly method: HttpMethod[\s\S]*readonly path: RoutePath[\s\S]*readonly crudEvidence: RouteCapabilityCrudEvidence/.test(routeSemanticAuthority)
    && /interface RouteCapabilitySemanticOverrides/.test(routeSemanticAuthority)
    && /interface RouteCapabilitySemanticResolution/.test(routeSemanticAuthority)
    && /interface RouteCapabilitySemanticAuthorityAlgebraInterface/.test(routeSemanticAuthority)
    && /interface RouteCapabilitySemanticAuthorityContractInterface[\s\S]*extends RouteCapabilitySemanticAuthorityAlgebraInterface/.test(routeSemanticAuthority)
    && /interface RouteCapabilitySemanticAuthorityInterface[\s\S]*extends RouteCapabilitySemanticAuthorityContractInterface/.test(routeSemanticAuthority),
  'route semantic reasoning must cross evidence -> authority algebra -> contract -> interface -> closed resolution.');

check('route semantic evidence does not carry closed semantic judgments',
  !/readonly (hookKind|executionSignature|requestContentType|crudRole):/.test(routeSemanticEvidenceBlock),
  'raw route semantic evidence must not masquerade as a closed semantic judgment.');

const routeCapabilityAuthority = read('packages/core/src/types/upstream/routeCapabilityAuthority.ts');
check('route capability authority has algebra -> contract -> interface',
  /interface RouteCapabilityAuthorityAlgebraInterface/.test(routeCapabilityAuthority)
    && /interface RouteCapabilityAuthorityContractInterface[\s\S]*extends RouteCapabilityAuthorityAlgebraInterface/.test(routeCapabilityAuthority)
    && /interface RouteCapabilityAuthorityInterface[\s\S]*extends RouteCapabilityAuthorityContractInterface/.test(routeCapabilityAuthority),
  'CRUD semantic authority must expose the same compositional interface hierarchy as the capability it produces.');

const route = read('packages/core/src/types/upstream/route.ts');

check('Route capability carries canonical identity',
  /SemanticCapabilityContractInterface<'route_capability', RouteCapabilityEvidence, RouteIdentity>/.test(route)
    && /interface RouteCapabilityAlgebraInterface/.test(route)
    && /interface RouteCapabilityContract extends RouteCapabilityAlgebraInterface/.test(route)
    && /interface RouteCapabilityInterface extends RouteCapabilityContract/.test(route),
  'Route capability identity is part of the upstream semantic contract, not reconstructed downstream.');

check('RouteCapabilityContract is upstream-closed',
  /interface RouteCapabilityAlgebraInterface[\s\S]*SemanticCapabilityContractInterface<'route_capability', RouteCapabilityEvidence, RouteIdentity>/.test(route)
    && /interface RouteCapabilityContract extends RouteCapabilityAlgebraInterface/.test(route)
    && /interface RouteCapabilityEvidence extends SemanticCapabilityEvidence/.test(route)
    && /readonly crud: RouteCapabilityCrudEvidence/.test(route),
  'RouteCapabilityContract must extend the closed semantic capability contract and carry evidence.');

check('canonical audit lane is distinct from historical frontier audits',
  exists('scripts/audit/routesync-architecture.cjs')
    && exists('scripts/audits/audit-phase1237-upstream-semantic-interface-algebra.cjs')
    && fs.readdirSync(path.join(ROOT, 'scripts/audit')).some(name => name.endsWith('.cjs')),
  'scripts/audit is the canonical gate; scripts/audits contains specialized historical/frontier evidence.');

check('canonical gate covers the current semantic algebra frontier',
  exists('scripts/audits/audit-phase1237-upstream-semantic-interface-algebra.cjs'),
  'current semantic interface algebra must remain represented by a specialized audit.');

const wiringBoundary = read('packages/core/src/types/interfaces/interfaceDependencyBoundary.ts');
check('canonical upstream-to-downstream wiring algebra is explicit',
  /interface InterfaceDependencyBoundary<Upstream, Downstream>/.test(wiringBoundary)
    && /interface UpstreamWiringInterface<Upstream, Downstream>/.test(wiringBoundary)
    && /direction:\s*'upstream_to_downstream'/.test(wiringBoundary)
    && /upstreamAuthority:\s*'upstream'/.test(wiringBoundary),
  'downstream consumption must cross one explicit directional wiring contract.');

const projectionInterfaces = filesUnder('packages/core/src').filter(file => /ProjectionInterface\.ts$/.test(path.basename(file)));
const invalidProjectionInterfaces = projectionInterfaces.filter(file => {
  const text = source(file);
  return /interface .*ProjectionInterface/.test(text) && !/UpstreamWiringInterface/.test(text) && !/DataFlowProjectionInterface/.test(text);
});
check('projection interfaces use the upstream wiring algebra',
  invalidProjectionInterfaces.length === 0,
  invalidProjectionInterfaces.map(relative).join(', ') || 'all current projection interfaces are wired through the canonical boundary.');

const semanticMethodHelpers = production.filter(file => {
  const rel = relative(file);
  if (rel === 'packages/cli/src/generators/canonical/actionMap.ts') return false;
  return /getActionFromMethod\s*\(|isMutationAction\s*\(/.test(source(file));
});
check('downstream does not invoke method-to-action semantic helpers',
  semanticMethodHelpers.length === 0,
  semanticMethodHelpers.map(relative).join(', ') || 'no production method-to-action semantic helper calls.');

const capability = read('packages/core/src/types/upstream/semanticCapability.ts');
const reasoning = read('packages/core/src/types/upstream/semanticReasoning.ts');
check('reasoning contract is evidence-parameterized',
  /interface SemanticReasoningContractInterface<[\s\S]*Evidence extends SemanticReasoningEvidence/.test(reasoning)
    && /interface SemanticReasoningContract<[\s\S]*Evidence extends SemanticReasoningEvidence/.test(reasoning),
  'semantic reasoning contract keeps proof evidence typed at the contract boundary.');
check('semantic reasoning interface and contract exist upstream',
  exists('packages/core/src/types/upstream/semanticReasoning.ts')
    && /SemanticReasoningInterface/.test(reasoning)
    && /SemanticReasoningContract/.test(reasoning)
    && /SemanticReasoningExecutionInterface/.test(reasoning)
    && /SemanticReasoningJudgmentInterface/.test(reasoning),
  'reasoning is explicit as an upstream algebra plus closed contract, not an opaque resolver.');
check('semantic reasoning contract is upstream and closed',
  /authority:\s*SemanticReasoningAuthority/.test(reasoning)
    && /SemanticReasoningAuthority = 'upstream'/.test(reasoning)
    && /readonly closed: true/.test(reasoning),
  'reasoning ownership and closure are explicit.');
check('semantic reasoning contract has an explicit interface algebra',
  /interface SemanticReasoningContractInterface</u.test(reasoning)
    && /extends SemanticReasoningEvidenceInterface<Evidence>/.test(reasoning)
    && /SemanticReasoningDerivationInterface/.test(reasoning)
    && /SemanticReasoningProvenanceInterface/.test(reasoning)
    && /SemanticReasoningClosureInterface/.test(reasoning),
  'the concrete reasoning contract specializes an upstream interface algebra instead of being a standalone metadata object.');
check('semantic reasoning exposes relation algebra explicitly',
  /interface SemanticReasoningRelationInterface<State, Relation>/.test(reasoning)
    && /interface SemanticReasoningAlgebraInterface<Input, State, Relation, Judgment>/.test(reasoning)
    && /SemanticReasoningRelationInterface<State, Relation>/.test(reasoning),
  'semantic reasoning exposes relation derivation as an interface facet instead of hiding semantic inference inside control flow.');
check('semantic reasoning exposes rewrite and fixed-point algebra',
  /SemanticReasoningRewriteInterface<State, Relation>/.test(reasoning)
    && /SemanticReasoningFixedPointInterface<State>/.test(reasoning)
    && /interface SemanticReasoningAlgebraInterface<Input, State, Relation, Judgment>[\s\S]*extends SemanticReasoningExecutionAlgebraInterface<Input, State, Relation, Judgment>/.test(reasoning)
    && /SemanticReasoningExecutionAlgebraInterface<Input, State, Relation, Judgment>[\s\S]*SemanticReasoningRewriteInterface<State, Relation>[\s\S]*SemanticReasoningFixedPointInterface<State>/.test(reasoning),
  'semantic reasoning algebra must expose relation rewrite and least-fixed-point closure as explicit interface facets.');

check('semantic reasoning contract factory is relation-table driven',
  /semanticReasoningEvidenceKindByStrategy/.test(reasoning)
    && /Readonly<Record<\s*\n\s*SemanticReasoningStrategy,\s*\n\s*SemanticReasoningEvidenceKind/.test(reasoning)
    && !/strategy\s*===\s*'evidence_resolution'/.test(reasoning),
  'reasoning contract construction must use a closed declarative strategy-to-evidence relation instead of semantic branching.');

check('semantic reasoning authority is a reusable boundary facet',
  /interface SemanticReasoningAuthorityInterface</.test(reasoning)
    && /Strategy extends SemanticReasoningStrategy/.test(reasoning)
    && /Evidence extends SemanticReasoningEvidenceForStrategy<Strategy>/.test(reasoning)
    && /Contract extends SemanticReasoningContract<Strategy, Evidence>/.test(reasoning)
    && /readonly reasoning: Contract/.test(reasoning),
  'capability and dataflow authorities share one typed read-only reasoning boundary.');
check('semantic reasoning proof is an explicit compositional interface',
  /interface SemanticReasoningProofInterface</.test(reasoning)
    && /extends SemanticReasoningEvidenceInterface<Evidence>/.test(reasoning)
    && /SemanticReasoningDerivationInterface/.test(reasoning)
    && /SemanticReasoningProvenanceInterface/.test(reasoning)
    && /SemanticReasoningClosureInterface/.test(reasoning)
    && /interface SemanticReasoningContractInterface<[\s\S]*extends SemanticReasoningProofInterface<Strategy, Evidence>/.test(reasoning),
  'the contract must refine one reusable proof algebra instead of directly repeating proof facets.');

check('semantic reasoning contract is proof-carrying',
  /SemanticReasoningEvidenceInterface/.test(reasoning)
    && /SemanticReasoningDerivationInterface/.test(reasoning)
    && /SemanticReasoningProvenanceInterface/.test(reasoning)
    && /SemanticReasoningClosureInterface/.test(reasoning)
    && /readonly evidence: Evidence/.test(reasoning)
    && /readonly derivation:/.test(reasoning)
    && /readonly provenance:/.test(reasoning)
    && /readonly closure:/.test(reasoning),
  'reasoning contract carries explicit evidence, derivation, provenance, and closure facets.');
check('semantic capability records its reasoning contract',
  /SemanticReasoningAuthorityInterface<Reasoning\['strategy'\], ReasoningEvidence, Reasoning>/.test(capability)
    && /interface SemanticReasoningContract<[\s\S]*Strategy extends SemanticReasoningStrategy/.test(reasoning)
    && /Contract extends SemanticReasoningContract<Strategy, Evidence>/.test(reasoning)
    && /readonly reasoning: Contract/.test(reasoning),
  'closed capabilities carry provenance of the reasoning algebra that produced them.');

check('semantic capability boundary carries the reasoning contract type',
  /Reasoning extends SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence>/.test(capability)
    && /SemanticReasoningAuthorityInterface<Reasoning\['strategy'\], ReasoningEvidence, Reasoning>/.test(capability),
  'capability authority is parameterized by the closed reasoning contract, not only by its evidence facet.');

check('semantic capability authority is upstream',
  /readonly authority: SemanticCapabilityAuthority/.test(capability)
    && /export type SemanticCapabilityAuthority = 'upstream'/.test(capability),
  'authority must be the literal upstream vocabulary, not string.');
check('semantic capability contract is closed',
  /readonly closed: true/.test(capability),
  'closed=true prevents downstream reinterpretation.');

const authority = read('packages/core/src/types/upstream/routeCapabilityAuthority.ts');
check('route CRUD semantic derivation is relation-driven',
  /parameterSegments/.test(authority)
    && /relationFirstOption/.test(authority)
    && !/\bif\s*\(/.test(authority),
  'route CRUD resolution is represented as ordered semantic relations/candidates rather than semantic if-branch classification.');
check('route CRUD authority is upstream',
  /routeCapabilityAuthority/.test(authority)
    && /crudRoleFromAction/.test(authority)
    && /crudRoleFromRoute/.test(authority),
  'action and route-shape evidence resolve in one upstream authority.');

const classifierViolations = production.filter(file => {
  if (relative(file).endsWith('/RouteCrudClassifier.ts')) return false;
  return /RouteCrudClassifier\.classify\s*\(/.test(source(file));
});
check('no downstream CRUD reclassification', classifierViolations.length === 0,
  classifierViolations.map(relative).join(', ') || 'no production classifier calls');

const classifierImports = production.filter(file => {
  if (relative(file).endsWith('/RouteCrudClassifier.ts')) return false;
  return /import[\s\S]{0,180}RouteCrudClassifier/.test(source(file));
});
check('classifier type resolver consumes upstream route semantics',
  (() => {
    const file = 'packages/cli/src/generators/classifier/typeResolver.ts';
    if (!exists(file)) return false;
    const text = read(file);
    return /matchCrudRole\(route\.crudRole/.test(text)
      && !/CANONICAL_ACTION_MAP/.test(text)
      && !/getActionFromMethod/.test(text)
      && !/method\.toLowerCase\(\)/.test(text);
  })(),
  'type lowering derives standard action names from the closed upstream crudRole contract, not HTTP-method/action-map reconstruction.');

check('downstream route projections do not invoke method-to-action semantic helpers',
  production.filter(file => {
    const rel = relative(file);
    if (rel === 'packages/cli/src/generators/canonical/actionMap.ts') return false;
    const text = source(file);
    return /getActionFromMethod\s*\(/.test(text) || /isMutationAction\s*\(/.test(text);
  }).length === 0,
  'HTTP-method semantic helpers remain a compatibility vocabulary only; downstream consumers use closed capability fields.');

check('no downstream CRUD classifier dependency', classifierImports.length === 0,
  classifierImports.map(relative).join(', ') || 'no production classifier imports');

const authorityConsumers = production.filter(file => {
  const rel = relative(file);
  if (rel === 'packages/core/src/compiler/scanner/resolvers/RouteCrudClassifier.ts') return false;
  if (rel === 'packages/core/src/compiler/scanner/resolvers/boundary/boundaryInputResolution.ts') return false;
  return /routeCapabilityAuthority\./.test(source(file));
});
check('semantic authority has one explicit wiring entrypoint', authorityConsumers.length === 0,
  authorityConsumers.map(relative).join(', ') || 'authority calls are confined to the boundary wiring entrypoint and compatibility adapter');

const forbiddenBoundaryAuthority = [
  'packages/core/src/compiler/scanner/resolvers/boundary/capabilityResolution.ts',
  'packages/core/src/compiler/scanner/resolvers/boundary/capabilityBuilder.ts',
].filter(file => exists(file) && /routeCapabilityAuthority\./.test(read(file)));
check('capability resolver/builder cannot re-query semantic authority', forbiddenBoundaryAuthority.length === 0,
  forbiddenBoundaryAuthority.join(', ') || 'resolver and builder consume pre-resolved capability evidence');

const wiringAuthority = read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryInputResolution.ts');
check('boundary wiring resolves CRUD once upstream',
  /routeCapabilityAuthority\.crudRoleResolution\(/.test(wiringAuthority)
    && /crudEvidence: crudResolution\.evidence/.test(wiringAuthority),
  'the wiring boundary obtains the closed upstream CRUD resolution exactly once.');

const resolverGraph = read('packages/core/src/compiler/scanner/resolvers/resolverGraphSemanticInterface.ts');
check('resolver graph consumes closed capability contract',
  /readonly capability: RouteCapabilityContract/.test(resolverGraph)
    && /const crudRole = input\.capability\.crudRole/.test(resolverGraph)
    && !/routeCapabilityAuthority\./.test(resolverGraph),
  'resolver graph must consume upstream capability instead of deriving CRUD again.');

check('capability contract carries derivation and provenance',
  /readonly derivation: SemanticCapabilityDerivation/.test(capability)
    && /readonly provenance: SemanticCapabilityProvenance/.test(capability),
  'semantic capability must carry closed derivation and upstream provenance.');

const legacyCapabilityImports = production.filter(file => {
  const text = source(file);
  return /import\s+(?:type\s+)?\{[^}]*RouteCapabilityContract[^}]*\}\s+from\s+['"][^'"]*types\/route['"]/.test(text);
});
check('capability contract does not cross through legacy route barrel', legacyCapabilityImports.length === 0,
  legacyCapabilityImports.map(relative).join(', ') || 'all production capability imports are upstream/direct');

const securityAuthority = read('packages/core/src/types/upstream/routeSecurityAuthority.ts');
check('route security authority exists upstream',
  /export interface RouteSecurityAuthorityInterface/.test(securityAuthority)
    && /export const routeSecurityAuthority/.test(securityAuthority),
  'route security semantic authority is owned by upstream.');
const securityClassifierLeaks = production.filter(file => /RouteSecurityClassifier\.classify\(/.test(source(file)));
check('no downstream route security reclassification', securityClassifierLeaks.length === 0,
  securityClassifierLeaks.map(relative).join(', ') || 'no production security classifier calls');
check('route security resolver is compatibility-only',
  /deprecated Compatibility adapter/.test(read('packages/core/src/compiler/scanner/resolvers/RouteSecurityResolver.ts'))
    && /routeSecurityAuthority/.test(read('packages/core/src/compiler/scanner/resolvers/RouteSecurityResolver.ts')),
  'legacy resolver delegates to upstream security authority.');

const dataflow = read('packages/core/src/types/dataflow/dataFlowInterface.ts');
check('DataFlowAuthorityInterface exists',
  /export interface DataFlowAuthorityInterface/.test(dataflow),
  'read-only authority bridge is present.');
check('DataFlow authority is upstream and closed',
  /readonly authority: 'upstream'/.test(dataflow) && /readonly closed: true/.test(dataflow),
  'authority boundary carries explicit ownership and closure.');
check('upstream-to-downstream capability projection algebra exists',
  exists('packages/core/src/types/interfaces/semanticCapabilityProjectionInterface.ts')
    && /SemanticCapabilityProjectionInterface/.test(read('packages/core/src/types/interfaces/semanticCapabilityProjectionInterface.ts'))
    && /(?:InterfaceDependencyBoundary|UpstreamWiringInterface)<Capability, Output>/.test(read('packages/core/src/types/interfaces/semanticCapabilityProjectionInterface.ts')),
  'downstream owns the projection boundary while consuming a closed upstream capability.');

check('dataflow capability projection remains downstream-owned',
  exists('packages/core/src/types/dataflow/dataFlowCapabilityProjectionInterface.ts')
    && /DataFlowCapabilityAuthorityInterface<Input, State, Node, Capability, ReasoningEvidence, Reasoning>/.test(read('packages/core/src/types/dataflow/dataFlowCapabilityProjectionInterface.ts'))
    && /(?:InterfaceDependencyBoundary|UpstreamWiringInterface)</.test(read('packages/core/src/types/dataflow/dataFlowCapabilityProjectionInterface.ts')),
  'capability projection composes closed capability with read-only data-flow authority.');

check('DataFlow capability authority composes semantic capability',
  /DataFlowCapabilityAuthorityInterface/.test(dataflow)
    && /SemanticCapabilityAuthorityInterface/.test(dataflow),
  'generic data-flow can expose an upstream semantic capability without embedding Laravel vocabulary.');

const adapter = read('packages/core/src/compiler/analysis/semanticDataflowDataFlowAdapter.ts');
check('semantic dataflow adapter preserves upstream authority',
  /authority:\s*'upstream'/.test(adapter) && /closed:\s*true/.test(adapter),
  'adapter exposes the already-closed upstream judgment; it does not re-solve it.');

const projection = read('packages/core/src/types/dataflow/dataFlowProjectionInterface.ts');
check('DataFlow projection consumes authority, not execution',
  /(?:InterfaceDependencyBoundary|UpstreamWiringInterface)<\s*DataFlowAuthorityInterface/.test(projection),
  'IR/projection boundary receives the read-only authority contract.');

const irProjection = read('packages/core/src/compiler/ir/SemanticDataflowIRProjection.ts');
check('IR implementation consumes DataFlowAuthorityInterface',
  /DataFlowAuthorityInterface<SemanticDataflowInput, SemanticDataflowJudgment, SemanticDataflowIdentity>/.test(irProjection)
    && !/DataFlowInterface<SemanticDataflowInput, SemanticDataflowJudgment, SemanticDataflowIdentity>/.test(irProjection),
  'IR implementation must consume the read-only authority bridge, not the full execution interface.');

check('semantic capability derivation strategy is coupled to reasoning strategy',
  /interface SemanticCapabilityDerivationInterface<[\s\S]*Strategy extends SemanticReasoningStrategy/.test(capability)
    && /readonly derivation: SemanticCapabilityDerivation<Strategy>/.test(capability)
    && /interface SemanticCapabilityAlgebraInterface<[\s\S]*SemanticCapabilityDerivationInterface<Reasoning\['strategy'\]>/.test(capability)
    && /const reasoning = semanticReasoningContract\('evidence_resolution'\)/.test(read('packages/core/src/types/upstream/resourceModelKeyCapability.ts'))
    && /strategy: reasoning\.strategy/.test(read('packages/core/src/types/upstream/resourceModelKeyCapability.ts'))
    && /const reasoning = params\.reasoning/.test(read('packages/core/src/compiler/scanner/resolvers/boundary/capabilityBuilder.ts'))
    && !/semanticReasoningContract\(/.test(read('packages/core/src/compiler/scanner/resolvers/boundary/capabilityBuilder.ts'))
    && /strategy: reasoning\.strategy/.test(read('packages/core/src/compiler/scanner/resolvers/boundary/capabilityBuilder.ts')),
  'capability derivation cannot drift from the proof-carrying reasoning strategy.');

check('semantic capability contract has no unknown identity escape',
  !/Identity\s*=\s*unknown/.test(capability),
  'capability identity is explicit rather than widened to unknown.');

check('semantic capability has a closed consumer interface',
  /interface SemanticCapabilityConsumerInterface/.test(capability)
    && /interface SemanticCapabilityInterface/.test(capability)
    && /SemanticCapabilityConsumerInterface/.test(read('packages/core/src/index.ts')),
  'capability consumers receive a closed interface specialization rather than a concrete semantic resolver.');

check('semantic capability algebra composes identity/evidence/derivation/provenance',
  /SemanticCapabilityAlgebraInterface/.test(capability)
    && /SemanticCapabilityIdentityInterface/.test(capability)
    && /SemanticCapabilityEvidenceInterface/.test(capability)
    && /SemanticCapabilityDerivationInterface/.test(capability)
    && /SemanticCapabilityProvenanceInterface/.test(capability)
    && /SemanticCapabilityClosureInterface/.test(capability)
    && /SemanticCapabilityDerivationInterface/.test(capability)
    && /SemanticCapabilityProvenanceInterface/.test(capability)
    && /SemanticCapabilityClosureInterface/.test(capability)
    && /SemanticCapabilityContract[\s\S]*SemanticCapabilityAlgebraInterface/.test(capability),
  'capability contract is assembled from typed interface facets rather than a monolithic semantic record.');

const executionConsumerFiles = production.filter(file => {
  const rel = relative(file);
  if (rel.includes('/__tests__/')) return false;
  if (rel === 'packages/core/src/compiler/analysis/semanticDataflowPipeline.ts') return false;
  if (rel === 'packages/core/src/compiler/analysis/semanticDataflowRuntimeBoundary.ts') return false;
  if (rel === 'packages/core/src/compiler/analysis/semanticDataflowDataFlowAdapter.ts') return false;
  return /DataFlowInterface<SemanticDataflowInput/.test(source(file));
});
check('downstream projections do not require DataFlow execution surface', executionConsumerFiles.length === 0,
  executionConsumerFiles.map(relative).join(', ') || 'no downstream projection consumer depends on the full execution interface');

const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
check('semantic reasoning evidence is strategy-indexed',
  /SemanticReasoningEvidenceForStrategy<[\s\S]*?Strategy extends SemanticReasoningStrategy/.test(read('packages/core/src/types/upstream/semanticReasoning.ts'))
    && /semanticReasoningContract = <Strategy extends SemanticReasoningStrategy>/.test(read('packages/core/src/types/upstream/semanticReasoning.ts'))
    && /SemanticReasoningContract<Strategy, SemanticReasoningEvidenceForStrategy<Strategy>>/.test(read('packages/core/src/types/upstream/semanticReasoning.ts')),
  'the reasoning contract factory preserves the strategy-to-evidence relation at the type boundary.');

check('upstream-to-wiring boundary algebra exists',
  /export interface InterfaceDependencyAlgebraInterface<Upstream, Downstream>/.test(read('packages/core/src/types/interfaces/interfaceDependencyBoundary.ts'))
    && /export interface InterfaceDependencyContractInterface<Upstream, Downstream>[\s\S]*extends InterfaceDependencyAlgebraInterface/.test(read('packages/core/src/types/interfaces/interfaceDependencyBoundary.ts'))
    && /export interface InterfaceDependencyBoundary<Upstream, Downstream>[\s\S]*extends InterfaceDependencyContractInterface/.test(read('packages/core/src/types/interfaces/interfaceDependencyBoundary.ts'))
    && /export interface UpstreamWiringInterface<Upstream, Downstream>[\s\S]*direction: 'upstream_to_downstream'[\s\S]*upstreamAuthority: 'upstream'/.test(read('packages/core/src/types/interfaces/interfaceDependencyBoundary.ts'))
    && /UpstreamWiringInterface/.test(read('packages/core/src/types/dataflow/dataFlowProjectionInterface.ts'))
    && /UpstreamWiringInterface/.test(read('packages/core/src/types/interfaces/semanticCapabilityProjectionInterface.ts')),
  'wiring is an explicit algebra -> contract -> directional interface between upstream authority and downstream projection.');
check('interface composition algebra exists',
  exists('packages/core/src/types/interfaces/interfaceComposition.ts')
    && /interface InterfaceComposition<Upstream, Intermediate, Downstream>/.test(read('packages/core/src/types/interfaces/interfaceComposition.ts'))
    && /(?:InterfaceDependencyBoundary|UpstreamWiringInterface)<Upstream, Intermediate>/.test(read('packages/core/src/types/interfaces/interfaceComposition.ts'))
    && /(?:InterfaceDependencyBoundary|UpstreamWiringInterface)<Intermediate, Downstream>/.test(read('packages/core/src/types/interfaces/interfaceComposition.ts')),
  'upstream-to-downstream composition is explicit and remains directionally decoupled.');

check('dataflow execution composes the semantic reasoning execution algebra',
  /SemanticReasoningExecutionInterface<Input, State>/.test(dataflow)
    && /DataFlowExecutionAlgebraInterface<Input, State>/.test(dataflow),
  'DataFlow seed/derive/close is an explicit specialization of the upstream reasoning execution algebra.');
check('dataflow authority carries reasoning contract',
  /SemanticReasoningAuthorityInterface<Reasoning\['strategy'\], ReasoningEvidence, Reasoning>/.test(dataflow)
    && /Reasoning extends SemanticReasoningContract<SemanticReasoningStrategy, ReasoningEvidence>/.test(dataflow)
    && /DataFlowAuthorityInterface<Input, State, Node, ReasoningEvidence, Reasoning>/.test(dataflow)
    && /reasoning:\s*state\.reasoningContract/.test(read('packages/core/src/compiler/analysis/semanticDataflowDataFlowAdapter.ts'))
    && !/semanticReasoningContract\s*\(/.test(read('packages/core/src/compiler/analysis/semanticDataflowDataFlowAdapter.ts')),
  'the read-only dataflow authority records the upstream reasoning contract without exposing re-solving downstream.');

check('dataflow execution and authority algebras are explicit',
  /DataFlowExecutionAlgebraInterface/.test(dataflow)
    && /DataFlowAuthorityAlgebraInterface/.test(dataflow)
    && /DataFlowInterface[\s\S]*DataFlowExecutionInterface/.test(dataflow),
  'execution and read-only authority are typed as separate compositional facets.');

check('dataflow interface has an explicit contract algebra',
  /interface DataFlowContractInterface<\s*[\s\S]*extends\s*DataFlowProducerInterface<[^>]+>,\s*DataFlowAuthorityInterface/.test(dataflow)
    && /interface DataFlowInterface<[^]*extends DataFlowContractInterface/.test(dataflow),
  'DataFlowInterface must specialize a compositional contract algebra rather than directly merging execution and authority facets.');

check('route domain authority is upstream',
  exists('packages/core/src/types/upstream/routeDomainAuthority.ts')
    && /authority:\s*'upstream'/.test(read('packages/core/src/types/upstream/routeDomainAuthority.ts'))
    && /closed:\s*true/.test(read('packages/core/src/types/upstream/routeDomainAuthority.ts'))
    && /routeDomainAuthority/.test(read('packages/core/src/types/upstream/index.ts')),
  'route-domain semantic judgment is owned by the upstream authority surface.');

const domainResolverLeaks = production.filter(file => {
  const rel = relative(file);
  if (rel === 'packages/core/src/compiler/scanner/resolvers/RouteDomainResolver.ts') return false;
  return /RouteDomainResolver\.resolve(?:Judgment)?\s*\(/.test(source(file));
});
check('downstream does not call route domain resolver', domainResolverLeaks.length === 0,
  domainResolverLeaks.map(relative).join(', ') || 'no downstream RouteDomainResolver calls; consumers use routeDomainAuthority');

check('semantic dataflow judgment is facet-algebraic',
  /SemanticDataflowJudgmentInterface/.test(read('packages/core/src/types/upstream/semanticDataflow.ts'))
    && /SemanticDataflowJudgmentIdentityInterface/.test(read('packages/core/src/types/upstream/semanticDataflow.ts'))
    && /SemanticDataflowJudgmentEvidenceInterface/.test(read('packages/core/src/types/upstream/semanticDataflow.ts'))
    && /SemanticDataflowJudgmentFixpointInterface/.test(read('packages/core/src/types/upstream/semanticDataflow.ts'))
    && /SemanticDataflowJudgmentAuthorityInterface/.test(read('packages/core/src/types/upstream/semanticDataflow.ts'))
    && /SemanticDataflowJudgmentClosureInterface/.test(read('packages/core/src/types/upstream/semanticDataflow.ts')),
  'semantic dataflow judgment is composed from typed identity/evidence/fixpoint/authority/closure facets.');

const semanticResolverFrontier = production.filter(file => {
  const rel = relative(file);
  return rel.includes('/compiler/scanner/')
    && (/RouteDomainResolver\.resolve\(/.test(source(file)) || /ResourceModelResolver\.resolve\(/.test(source(file)));
});
check('resource model precedence is upstream relation-driven',
  read('packages/core/src/types/upstream/resourceModelReasoning.ts').includes('resourceModelCandidateOrder') &&
  /resourceModelCandidateOrder[\s\S]*relationFirst/.test(read('packages/core/src/types/upstream/resourceModelReasoning.ts')),
  'ResourceModel precedence must be owned by the upstream relation table, not by compiler candidate assembly order');

check('resource model semantic authority is upstream',
  /resourceModelReasoning/.test(upstreamIndex)
    && /reasonResourceModel/.test(read('packages/core/src/types/upstream/resourceModelReasoning.ts'))
    && /reasonResourceModel\(reasoningInput\)/.test(read('packages/core/src/compiler/scanner/resolvers/resource/ResourceModelResolver.ts'))
    && !/ResourceModelResolver\.resolve\([\s\S]*relationFirst\(/.test(read('packages/core/src/compiler/scanner/resolvers/resource/ResourceModelResolver.ts')),
  'ResourceModelResolver must only assemble compiler evidence and wire the upstream ResourceModel reasoning authority.');

check('semantic resolver migration frontier is explicit',
  semanticResolverFrontier.every(file => {
    const rel = relative(file);
    return rel.endsWith('/RouteDomainResolver.ts') || rel.endsWith('/ResourceModelResolver.ts') || rel.endsWith('/resource/resourceBinder.ts');
  }),
  semanticResolverFrontier.map(relative).join(', ') || 'no scanner-local semantic resolver frontier detected');

check('upstream capability authority is exported',
  /semanticCapability/.test(upstreamIndex) && /routeCapabilityAuthority/.test(upstreamIndex),
  'canonical upstream barrel exports both contract and authority.');

const publicIndex = read('packages/core/src/index.ts');
check('public core barrel exports capability algebra interfaces',
  /SemanticCapabilityIdentityInterface/.test(publicIndex)
    && /SemanticCapabilityAlgebraInterface/.test(publicIndex)
    && /SemanticCapabilityClosureInterface/.test(publicIndex),
  'public core API exposes the canonical upstream capability interface algebra.');

check('public core barrel exports compositional projection boundaries',
  /SemanticCapabilityProjectionInterface/.test(publicIndex)
    && /DataFlowCapabilityProjectionInterface/.test(publicIndex)
    && /DataFlowClosureInterface/.test(publicIndex),
  'public core API exposes downstream projection and data-flow closure facets without forcing consumers onto execution.');

check('Laravel example source exists',
  exists('examples/ecommerce-shop-source/routes/api.php')
    && fs.existsSync(path.join(ROOT, 'examples/ecommerce-shop-source/app/Http/Controllers'))
    && fs.readdirSync(path.join(ROOT, 'examples/ecommerce-shop-source/app/Http/Controllers')).length > 0,
  'routes/api.php + controller source');
check('example manifest exists',
  fs.readdirSync(path.join(ROOT, 'examples/ecommerce-shop-source')).some(name => /routesync\.manifest.*\.json$/.test(name)),
  'routesync manifest fixture');
check('example graph exists', exists('examples/ecommerce-shop-source/frontend/routesync.graph.json'), 'routesync.graph.json');
check('example IR exists', exists('examples/ecommerce-shop-source/frontend/routesync.ir.json'), 'routesync.ir.json');

const manifestContracts = filesUnder('packages/core/src/types/upstream').filter(file => /manifest/i.test(path.basename(file)));
const manifestContractText = manifestContracts.map(source).join('\n');
check('manifest contract carries data-flow input surface', /dataflowInputs/.test(manifestContractText),
  'upstream manifest contract must expose canonical dataflowInputs.');
const fixtureManifests = fs.readdirSync(path.join(ROOT, 'examples/ecommerce-shop-source')).filter(name => /^routesync\.manifest.*\.json$/.test(name));
const fixtureHasDataflow = fixtureManifests.some(name => {
  try {
    const value = JSON.parse(read(`examples/ecommerce-shop-source/${name}`));
    return Object.prototype.hasOwnProperty.call(value, 'dataflowInputs');
  } catch { return false; }
});
if (!fixtureHasDataflow) console.log('[WARN] example manifest fixture does not materialize dataflowInputs; source contract still owns the field.');

check('CLI audit command exists', exists('packages/cli/src/commands/audit.ts'), 'CLI audit surface');

const graphIrFiles = [
  ...filesUnder('packages/core/src/compiler/graph'),
  ...filesUnder('packages/core/src/compiler/ir'),
  ...filesUnder('packages/cli/src'),
];
const graphIrClassifierRefs = graphIrFiles.filter(file => /RouteCrudClassifier\.classify\s*\(/.test(source(file)));
check('graph/IR/CLI do not classify CRUD', graphIrClassifierRefs.length === 0,
  graphIrClassifierRefs.map(relative).join(', ') || 'no graph/IR/CLI classifier calls');

const cliProjectionFiles = filesUnder('packages/cli/src');
const legacyRouteClassifierImports = cliProjectionFiles.filter(file => {
  const rel = relative(file);
  if (rel === 'packages/cli/src/generators/route-classifier.ts') return false;
  return /from ['"][^'"]*route-classifier['"]/.test(source(file));
});
check('CLI consumes canonical route capability projection boundary', legacyRouteClassifierImports.length === 0,
  legacyRouteClassifierImports.map(relative).join(', ') || 'CLI consumers import route-capability-projection directly');

const routeCapabilityProjection = read('packages/cli/src/generators/route-capability-projection.ts');
const cliRouteProjectionProduction = filesUnder('packages/cli/src').filter(file => {
  const rel = relative(file);
  return !/(^|\/)__tests__(\/|$)/.test(rel) && rel !== 'packages/cli/src/generators/route-classifier.ts';
});
check('CLI canonical route projection is named as projection',
  /export function projectRoutes/.test(read('packages/cli/src/generators/classifier/routeGrouper.ts'))
    && /projectRoutes/.test(routeCapabilityProjection),
  'canonical CLI route surface is projection terminology; classifyRoutes remains compatibility-only.');
const legacyRouteProjectionCalls = cliRouteProjectionProduction.filter(file => /\bclassifyRoutes\s*\(/.test(source(file)));
check('CLI production does not call legacy classifyRoutes name', legacyRouteProjectionCalls.length === 0,
  legacyRouteProjectionCalls.map(relative).join(', ') || 'production CLI uses projectRoutes as the canonical downstream projection.');
const legacyDomainProjectionCalls = cliRouteProjectionProduction.filter(file => /\bclassifyDomainGraph\s*\(/.test(source(file)));
check('CLI production does not call legacy classifyDomainGraph name', legacyDomainProjectionCalls.length === 0,
  legacyDomainProjectionCalls.map(relative).join(', ') || 'production CLI uses projectDomainGraph as the canonical downstream projection.');
check('route projection reads upstream capability only',
  /route\.capability\.crudRole/.test(read('packages/cli/src/generators/classifier/routeGrouper.ts'))
    && !/route\.(?:identity\.coordinates\.method|identity\.coordinates\.runtimePath).*crudRole/.test(read('packages/cli/src/generators/classifier/routeGrouper.ts')),
  'projection consumes the closed capability and does not infer CRUD from method/path.');

const routeClassifierFacade = read('packages/cli/src/generators/route-classifier.ts');
const routeProjectionSurface = read('packages/cli/src/generators/classifier/routeGrouper.ts');
check('legacy CLI route classifier is compatibility-only',
  (/deprecated Compatibility facade/.test(routeClassifierFacade)
    || /@deprecated Compatibility alias/.test(routeProjectionSurface))
    && (/route-capability-projection|RouteCapabilityProjectionInterface|projectRoutes/.test(routeClassifierFacade + routeProjectionSurface))
    && !/function classifyRoutes|function classifyDomainGraph/.test(routeClassifierFacade + routeProjectionSurface),
  'legacy classifier vocabulary must remain a projection compatibility alias, with semantic ownership upstream');

const upstreamSemanticFiles = filesUnder('packages/core/src/types/upstream').filter(file => /\.(ts|tsx)$/.test(file));
const upstreamDownstreamLeaks = upstreamSemanticFiles.filter(file => !/(^|\/)__tests__(\/|$)/.test(relative(file)) && /from ['"][^'"]*(?:compiler|cli)\//.test(source(file)));
check('upstream semantic surface does not depend on downstream compiler/CLI', upstreamDownstreamLeaks.length === 0,
  upstreamDownstreamLeaks.map(relative).join(', ') || 'upstream types do not import compiler or CLI surfaces');

const composition = read('packages/core/src/types/interfaces/interfaceComposition.ts');
check('interface composition is directional and non-cyclic',
  /InterfaceComposition<Upstream, Intermediate, Downstream>/.test(composition)
    && /(?:InterfaceDependencyBoundary|UpstreamWiringInterface)<Upstream, Intermediate>/.test(composition)
    && /(?:InterfaceDependencyBoundary|UpstreamWiringInterface)<Intermediate, Downstream>/.test(composition)
    && !/Downstream, Upstream/.test(composition),
  'composition models A→B→C without an upstream dependency on downstream');

check('semantic capability consumer interface is layered',
   /interface SemanticCapabilityConsumerAlgebraInterface[\s\S]*extends SemanticCapabilityContract/.test(capability)
    && /interface SemanticCapabilityConsumerContractInterface[\s\S]*extends SemanticCapabilityConsumerAlgebraInterface/.test(capability)
    && /interface SemanticCapabilityConsumerInterface[\s\S]*extends SemanticCapabilityConsumerContractInterface/.test(capability)
    && /interface SemanticCapabilityInterface[\s\S]*extends SemanticCapabilityConsumerInterface/.test(capability),
  'semantic capability must expose contract -> consumer interface layering without reopening semantic execution.');

const dataFlowContractSurface = read('packages/core/src/types/dataflow/dataFlowInterface.ts');
check('data-flow consumer interface is authority-only',
   /interface DataFlowConsumerAlgebraInterface[\s\S]*extends DataFlowAuthorityContractInterface/.test(dataFlowContractSurface)
    && /interface DataFlowAuthorityContractInterface[\s\S]*extends DataFlowAuthorityAlgebraInterface/.test(dataFlowContractSurface)
    && /interface DataFlowAuthorityInterface[\s\S]*extends DataFlowAuthorityContractInterface/.test(dataFlowContractSurface)
    && /interface DataFlowConsumerContractInterface[\s\S]*extends DataFlowConsumerAlgebraInterface/.test(dataFlowContractSurface)
    && /interface DataFlowConsumerInterface[\s\S]*extends DataFlowConsumerContractInterface/.test(dataFlowContractSurface)
    && /interface DataFlowInterface[\s\S]*extends DataFlowContractInterface/.test(dataFlowContractSurface),
  'data-flow consumers must see the closed authority surface while producers retain the execution contract.');

const projectionSurfaces = [
  ['semantic capability', 'packages/core/src/types/interfaces/semanticCapabilityProjectionInterface.ts'],
  ['data-flow', 'packages/core/src/types/dataflow/dataFlowProjectionInterface.ts'],
  ['data-flow capability', 'packages/core/src/types/dataflow/dataFlowCapabilityProjectionInterface.ts'],
  ['route capability', 'packages/cli/src/generators/classifier/routeCapabilityProjectionInterface.ts'],
];
for (const [label, file] of projectionSurfaces) {
  const projection = read(file);
  check(`${label} projection has algebra -> contract -> interface`,
    /interface \w+ProjectionAlgebraInterface[\s\S]*extends UpstreamWiringInterface/.test(projection)
      && /interface \w+ProjectionContract[\s\S]*extends \w+ProjectionAlgebraInterface/.test(projection)
      && /interface \w+ProjectionInterface[\s\S]*extends \w+ProjectionContract/.test(projection),
    `${label} downstream projection must retain an explicit algebra -> contract -> interface chain.`);
}

check('interface composition is itself an algebra-contract boundary',
  /interface InterfaceCompositionAlgebra<[\s\S]*extends UpstreamWiringInterface<Upstream, Downstream>/.test(composition)
    && /interface InterfaceCompositionContract<[\s\S]*extends InterfaceCompositionAlgebra<Upstream, Intermediate, Downstream>/.test(composition)
    && /composeUpstreamWiring/.test(composition)
    && /second\.project\(first\.project\(upstream\)\)/.test(composition),
  'upstream -> wiring -> downstream composition must have an explicit algebra, contract, and compositional projection operation.');

const reasoningContractSurface = read('packages/core/src/types/upstream/semanticReasoning.ts');
check('semantic reasoning has explicit producer/consumer/wiring algebra',
  /interface SemanticReasoningProducerContractInterface/.test(reasoningContractSurface)
    && /interface SemanticReasoningProducerInterface/.test(reasoningContractSurface)
    && /interface SemanticReasoningConsumerContractInterface/.test(reasoningContractSurface)
    && /interface SemanticReasoningConsumerInterface/.test(reasoningContractSurface)
    && /interface SemanticReasoningWiringInterface/.test(reasoningContractSurface)
    && /SemanticReasoningWiringInterface[\s\S]*extends UpstreamWiringInterface/.test(reasoningContractSurface),
  'semantic reasoning must expose producer, closed consumer, and directional wiring surfaces.');

check('operation identity preserves upstream reasoning lineage',
  /OperationIdentityCapabilityAlgebraInterface[\s\S]*readonly reasoning: SemanticReasoningContract/.test(read('packages/core/src/types/upstream/operationIdentityCapability.ts'))
    && /operationIdentityCapabilityFromRoute[\s\S]*route: Pick<RouteCapabilityContract,[^;]*reasoning/.test(read('packages/core/src/types/upstream/operationIdentityCapabilityAuthority.ts'))
    && /const reasoning: SemanticReasoningContract = route\.reasoning/.test(read('packages/core/src/types/upstream/operationIdentityCapabilityAuthority.ts')),
  'operation identity must inherit the route capability proof instead of opening a second reasoning authority.');
check('semantic reasoning execution interface remains separate from closed contract',
  /interface SemanticReasoningInterface/.test(reasoningContractSurface)
    && /SemanticReasoningInterface[\s\S]*extends SemanticReasoningConsumerInterface/.test(reasoningContractSurface)
    && /interface SemanticReasoningContractInterface/.test(reasoningContractSurface)
    && /SemanticReasoningContractInterface[\s\S]*extends SemanticReasoningProofInterface/.test(reasoningContractSurface)
    && !/SemanticReasoningInterface[\s\S]*SemanticReasoningContractInterface/.test(reasoningContractSurface.slice(reasoningContractSurface.indexOf('interface SemanticReasoningInterface'), reasoningContractSurface.indexOf('interface SemanticReasoningEvidenceInterface'))),
  'operational semantic reasoning and proof-carrying closed contract must remain distinct surfaces.');


check('semantic capability algebra carries reasoning authority',
  /interface SemanticCapabilityAlgebraInterface[\s\S]*SemanticReasoningAuthorityInterface/.test(capability),
  'capability algebra owns the reasoning authority facet');

const dataFlowInterface = read('packages/core/src/types/dataflow/dataFlowInterface.ts');
check('data-flow authority algebra carries reasoning authority',
  /interface DataFlowAuthorityAlgebraInterface[\s\S]*SemanticReasoningAuthorityInterface/.test(dataFlowInterface),
  'data-flow authority algebra owns the reasoning authority facet');

check('semantic dataflow is an explicit algebra-to-contract-to-interface chain',
  exists('packages/core/src/types/upstream/semanticDataflow.ts')
    && /interface SemanticDataflowAlgebraInterface[\s\S]*extends SemanticReasoningAuthorityInterface/.test(read('packages/core/src/types/upstream/semanticDataflow.ts'))
    && /interface SemanticDataflowContractInterface[\s\S]*extends SemanticDataflowAlgebraInterface/.test(read('packages/core/src/types/upstream/semanticDataflow.ts'))
    && /interface SemanticDataflowInterface extends SemanticDataflowContractInterface/.test(read('packages/core/src/types/upstream/semanticDataflow.ts')),
  'semantic dataflow must expose algebra, named contract, and closed consumer interface as distinct upstream layers.');

check('semantic dataflow contract carries closed judgment and origin',
  /SemanticDataflowAlgebraInterface[\s\S]*readonly judgment: SemanticDataflowJudgment/.test(read('packages/core/src/types/upstream/semanticDataflow.ts'))
    && /SemanticDataflowAlgebraInterface[\s\S]*readonly origin: SemanticDataflowOrigin/.test(read('packages/core/src/types/upstream/semanticDataflow.ts'))
    && /readonly closed: true/.test(read('packages/core/src/types/upstream/semanticDataflow.ts')),
  'dataflow authority crosses the boundary as a closed semantic judgment with explicit origin.');

const graphProjectionFiles = [
  'packages/core/src/graph/ServiceGraphBuilderInterface.ts',
  'packages/core/src/graph/RouteSyncManifestGraphProjectionInterface.ts',
];
check('graph projection surfaces use upstream wiring',
  graphProjectionFiles.every(file => exists(file) && /UpstreamWiringInterface/.test(read(file))),
  'graph consumers must be downstream projections of upstream contracts, not semantic authorities.');

const irProjectionFiles = [
  'packages/core/src/compiler/ir/SemanticDataflowIRProjectionInterface.ts',
  'packages/core/src/compiler/ir/SemanticDataflowIRProjectionTypes.ts',
];
check('IR semantic dataflow surface is projection-only',
  exists(irProjectionFiles[0])
    && /DataFlowProjectionInterface/.test(read(irProjectionFiles[0]))
    && !/SemanticDataflowInterface[\s\S]*extends/.test(read(irProjectionFiles[0])),
  'IR must consume the semantic dataflow authority through a projection boundary rather than become another semantic authority.');

check('manifest graph IR remain downstream of upstream contracts',
  /RouteSyncManifestFlow/.test(read('packages/core/src/graph/RouteSyncManifestGraphProjectionInterface.ts'))
    && /UpstreamWiringInterface/.test(read('packages/core/src/graph/RouteSyncManifestGraphProjectionInterface.ts'))
    && /DataFlowProjectionInterface/.test(read('packages/core/src/compiler/ir/SemanticDataflowIRProjectionInterface.ts')),
  'manifest/graph/IR must preserve the upstream -> wiring -> downstream direction.');

const cliTypeResolver = read('packages/cli/src/generators/classifier/typeResolver.ts');
check('downstream type lowering consumes closed route contract',
  /matchCrudRole\(route\.crudRole/.test(cliTypeResolver)
    && /route\.contract\.response\.success/.test(cliTypeResolver)
    && /route\.contract\.request\.body/.test(cliTypeResolver)
    && !/getActionFromMethod\s*\(/.test(cliTypeResolver)
    && !/isMutationAction\s*\(/.test(cliTypeResolver),
  'type lowering may choose output types from already-closed route contracts, but must not reconstruct HTTP semantic action kind.');

const actionMap = read('packages/cli/src/generators/canonical/actionMap.ts');
const actionMapConsumers = filesUnder('packages/cli/src').filter(file => {
  const rel = relative(file);
  if (/(^|\/)(__tests__|canonical\/actionMap\.ts)(\/|$)/.test(rel)) return false;
  return /getActionFromMethod\s*\(|isMutationAction\s*\(/.test(source(file));
});
check('legacy HTTP action map remains retired and has no production consumers',
  actionMap.trim().startsWith('/** @deprecated')
    && !/function\s+(?:getActionFromMethod|isMutationAction)|export\s+(?:const|function)\s+(?:getActionFromMethod|isMutationAction)/.test(actionMap)
    && actionMapConsumers.length === 0,
  actionMapConsumers.map(relative).join(', ') || 'the historical action map remains a deprecation marker only; semantic action ownership stays upstream.');

const manifestFlow = read('packages/core/src/types/upstream/manifest.ts');
const manifestProjection = read('packages/core/src/compiler/analysis/routeSyncManifestDataflowProjectionInterface.ts');
check('manifest dataflow is seed transport, not a second reasoning authority',
  /interface RouteSyncManifestFlow extends ManifestDataflowSeedSurface/.test(manifestFlow)
    && /interface RouteSyncManifestDataflowProjectionInterface\s*\n?\s*extends UpstreamWiringInterface/.test(manifestProjection)
    && !/fixedPoint|reasoningAuthority|SemanticDataflowInterface/.test(manifestFlow),
  'manifest carries canonical semantic dataflow seeds and projects them downstream; closure remains in the semantic authority.');

const routeSourceBoundaryFiles = [
  'packages/core/src/compiler/scanner/resolvers/boundary/capabilityBuilder.ts',
  'packages/core/src/compiler/scanner/resolvers/boundary/boundaryInputResolution.ts',
];
check('Laravel route evidence is raised once into upstream capability',
  routeSourceBoundaryFiles.every(file => exists(file))
    && /routeCapabilityAuthority\.crudRoleResolution/.test(read(routeSourceBoundaryFiles[1]))
    && /RouteCapabilityContract/.test(read(routeSourceBoundaryFiles[0]))
    && /authority:\s*'upstream'/.test(read(routeSourceBoundaryFiles[0])),
  'Laravel route evidence resolves into a closed upstream capability before CLI projection.');

const resourceModelResolver = read('packages/core/src/compiler/scanner/resolvers/resource/ResourceModelResolver.ts');
check('resource-model reasoning is upstream and relation-driven',
  /ResourceModelResolutionInput/.test(resourceModelResolver)
    && /candidateFromLookup/.test(resourceModelResolver)
    && /relation_propagation/.test(resourceModelResolver)
    && /convention/.test(resourceModelResolver),
  'resource/model association is resolved in the upstream resolver boundary, with relation and convention evidence available before downstream projection.');

const resourceModelConsumers = filesUnder('packages/cli/src').filter(file => {
  const rel = relative(file);
  if (/(^|\/)(__tests__|test|tests)(\/|$)/.test(rel)) return false;
  return /ResourceModelResolver/.test(source(file));
});
check('CLI does not invoke resource-model semantic authority',
  resourceModelConsumers.length === 0,
  resourceModelConsumers.map(relative).join(', ') || 'resource-model reasoning is not reconstructed from the CLI consumer lane.');

const endpointRefs = read('packages/core/src/ir/domain/request-endpoint/endpointRefs.ts');
check('IR path-parameter projection consumes closed upstream parameter semantics',
  /extractPathParams\(route:\s*RouteSemanticFlow/.test(endpointRefs)
    && /route\.identity\.parameters\.path/.test(endpointRefs)
    && /primitiveKindFromRouteParameter/.test(endpointRefs)
    && !/inferParamType\(name\).*\n[\s\S]*extractPathParams/.test(endpointRefs),
  'IR projects canonical RouteParameter meaning; parameter names are not a semantic authority.');

const resourceDiscovery = read('packages/cli/src/commands/annotate/template/resourceDiscovery.ts');
check('CLI resource discovery consumes materialized upstream response semantics',
  /manifestPath/.test(resourceDiscovery)
    && /\$mr\['response'\]\['resolved'\]|\$mr\['response'\]\['semantic'\]/.test(resourceDiscovery)
    && /resolved\['resource'\]/.test(resourceDiscovery)
    && !/preg_match\(\$pattern, \$methodSource/.test(resourceDiscovery),
  'annotation projection reads the manifest response contract and does not reconstruct Resource meaning with PHP regex heuristics.');

const explainCommand = read('packages/cli/src/commands/explain.ts');
check('CLI explain projection is typed and evidence-only',
  /type ExplainGraph/.test(explainCommand)
    && /type ExplainField/.test(explainCommand)
    && /canonical upstream-derived graph metadata/.test(explainCommand)
    && !/\(r:\s*any\)|\(m:\s*any\)|let current:\s*any/.test(explainCommand),
  'explain queries the graph through a typed projection surface and does not introduce an untyped semantic resolver.');

const primaryKeyResolver = read('packages/cli/src/generators/classifier/typeResolver.ts');
check('primary-key lowering consumes closed upstream resource-model capability',
  /resolveItemPrimaryKeyType/.test(primaryKeyResolver)
    && /ResourceModelKeyCapabilityContract/.test(primaryKeyResolver)
    && /identity\.resource/.test(primaryKeyResolver)
    && !/matchedModel|semantic\.key\.semanticType/.test(primaryKeyResolver),
  'primary-key lowering consumes a closed Resource -> Model -> key capability and does not rediscover models by generated names.');

const resourceModelKeyCapability = read('packages/core/src/types/upstream/resourceModelKeyCapability.ts');
check('resource-model key capability is upstream semantic contract',
  /ResourceModelKeyCapabilityContract/.test(resourceModelKeyCapability)
    && /SemanticCapabilityInterface<\s*'resource_model_key_capability'/.test(resourceModelKeyCapability)
    && /ResourceModelKeyCapabilityProjectionInterface/.test(resourceModelKeyCapability)
    && /SemanticCapabilityContractInterface/.test(read('packages/core/src/types/upstream/semanticCapability.ts'))
    && /semanticReasoningContract\('evidence_resolution'\)/.test(resourceModelKeyCapability)
    && /resourceModelKeyCapabilitiesFromAsts/.test(resourceModelKeyCapability),
  'Resource -> Model -> primary-key meaning is closed upstream capability evidence.');

const resourceModelKeyManifest = read('packages/core/src/types/domain/base.ts');
check('manifest carries resource-model key capability through wiring',
  /resourceModelKeyCapabilities/.test(resourceModelKeyManifest)
    && /resourceModelKeyCapabilitiesFromAsts/.test(read('packages/core/src/compiler/scanner/wiring/routeManifestLowerer.ts'))
    && /manifest\.resourceModelKeyCapabilities/.test(read('packages/cli/src/generators/classifier/domainGraphBuilder.ts')),
  'the manifest is the transport surface and CLI receives the closed upstream capability through the wiring boundary.');

const manifestTypeFacade = read('packages/cli/src/generators/utils/manifest-to-types.ts');
check('manifest-to-types facade remains projection-only',
  /SemanticTypesPipeline\.execute\(manifest\)/.test(manifestTypeFacade)
    && /RequestTypesPipeline\.execute\(manifest\)/.test(manifestTypeFacade)
    && /ContractInputPipeline\.execute\(manifest\)/.test(manifestTypeFacade)
    && !/RouteCrudClassifier|routeCapabilityAuthority\./.test(manifestTypeFacade),
  'manifest type generation delegates to downstream pipelines and does not reopen semantic classification.');

const mswGenerator = read('packages/cli/src/generators/MswGenerator.ts');
check('MSW generator treats method as transport projection only',
  /contract\.method\.toLowerCase\(\)/.test(mswGenerator)
    && /getRouteContract\(route\)/.test(mswGenerator)
    && !/getActionFromMethod|isMutationAction|RouteCrudClassifier/.test(mswGenerator),
  'MSW may lower a closed HTTP method into the target API, but must not derive semantic action meaning from that method.');


const semanticDataflow = read('packages/core/src/types/upstream/semanticDataflow.ts');
const semanticDataflowAuthority = read('packages/core/src/types/upstream/semanticDataflowAuthority.ts');
check('semantic dataflow judgment carries its exact reasoning contract',
  /readonly reasoningContract: SemanticReasoningContract/.test(semanticDataflow)
    && /reasoningContract:\s*semanticReasoningContract\('declarative_relation_rewrite_fixed_point'\)/.test(semanticDataflowAuthority)
    && /reasoning:\s*judgment\.reasoningContract/.test(semanticDataflow),
  'the upstream judgment owns the closed reasoning proof; interface wiring must preserve it instead of reconstructing strategy metadata.');

const dataflowInterface = read('packages/core/src/types/upstream/semanticDataflowInterface.ts');
check('semantic dataflow interface does not synthesize reasoning',
  /semanticDataflowInterfaceFromJudgment/.test(dataflowInterface)
    && !/semanticReasoningContract\(/.test(dataflowInterface),
  'the compatibility facade may reconnect a closed judgment but cannot create a new reasoning contract.');

const duplicateDataflowAdapter = 'packages/core/src/compiler/scanner/upstream/semanticDataflowInputAdapter.ts';
const wiringDataflowAdapter = 'packages/core/src/compiler/scanner/wiring/semanticDataflowInputAdapter.ts';
const tsProduction = filesUnder('packages/core/src').filter(file => /\.(ts|tsx)$/.test(file));
const duplicateAdapterConsumers = tsProduction.filter(file => {
  const rel = relative(file);
  if (rel === duplicateDataflowAdapter) return false;
  return source(file).includes("scanner/upstream/semanticDataflowInputAdapter") || source(file).includes("../upstream/semanticDataflowInputAdapter");
});
check('scanner dataflow input has one canonical wiring adapter',
  exists(duplicateDataflowAdapter)
    && source(path.join(ROOT, duplicateDataflowAdapter)).trim().startsWith('/**')
    && source(path.join(ROOT, duplicateDataflowAdapter)).includes('intentionally empty')
    && exists(wiringDataflowAdapter)
    && duplicateAdapterConsumers.length === 0,
  'duplicate scanner/upstream adapter remains only as an empty historical path; semantic input wiring is owned by scanner/wiring.');

const upstreamMiddlewareResolver = read('packages/core/src/compiler/scanner/upstream/route/routeMiddlewareFlowResolver.ts');
const wiringMiddlewareResolver = read('packages/core/src/compiler/scanner/wiring/route/routeMiddlewareFlowResolver.ts');
check('route middleware has one semantic authority',
  /export const resolveRouteMiddlewareFlow/.test(upstreamMiddlewareResolver)
    && !/const scopeApplies/.test(wiringMiddlewareResolver)
    && /from '..\/..\/upstream\/route\/routeMiddlewareFlowResolver'/.test(wiringMiddlewareResolver),
  'wiring keeps only a compatibility re-export; middleware applicability/exclusion reasoning remains upstream.');

const routeCapabilityTypeSource = read('packages/core/src/types/upstream/route.ts');
check(
  /interface RouteCapabilityAlgebraInterface[\s\S]*extends SemanticCapabilityContractInterface/.test(routeCapabilityTypeSource) &&
    /interface RouteCapabilityContract extends RouteCapabilityAlgebraInterface/.test(routeCapabilityTypeSource) &&
    /interface RouteCapabilityInterface extends RouteCapabilityContract/.test(routeCapabilityTypeSource),
  'route capability has algebra -> contract -> consumer interface layering',
  'RouteCapability must expose a route-specific algebra, closed contract, and consumer interface in upstream.'
);

const semanticWiringPairs = [
  ['controllerMiddlewareProjection', ['projectControllerMiddlewareRelations']],
  ['effectiveControllerActionPolicyResolver', ['resolveEffectiveControllerActionPolicy', 'resolveEffectiveControllerActionPolicyFromEvidence']],
  ['resourceMiddlewareProjection', ['routeMiddlewareReference', 'projectRouteResourceMiddleware']],
  ['routeGroupSemanticResolver', ['resolveRouteGroupFactsJudgment', 'resolveRouteGroupFacts']],
  ['routeMiddlewareSemanticInputBuilder', ['buildRouteMiddlewareSemanticInput', 'middlewareNames']],
];
for (const [name, exports] of semanticWiringPairs) {
  const upstreamFile = `packages/core/src/compiler/scanner/upstream/route/${name}.ts`;
  const wiringFile = `packages/core/src/compiler/scanner/wiring/route/${name}.ts`;
  const wiring = read(wiringFile);
  check(`semantic route wiring has one upstream authority: ${name}`,
    exists(upstreamFile)
      && exists(wiringFile)
      && exports.every(symbol => new RegExp(`\\b${symbol}\\b`).test(wiring))
      && !/const |function |class |=>/.test(wiring.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')),
    'wiring exposes the upstream semantic implementation by compatibility re-export only; semantic implementation remains upstream.');
}

const criticalUpstreamFiles = filesUnder('packages/core/src/types/upstream')
  .filter(file => /\.(ts|tsx)$/.test(file));
const anyViolations = criticalUpstreamFiles.filter(file => /:\s*any\b|<any>|as\s+any\b/.test(source(file)));
check('upstream semantic surface remains any-free', anyViolations.length === 0,
  anyViolations.map(relative).slice(0, 20).join(', ') || 'no any in upstream semantic types');

console.log('RouteSync Architecture Audit');
console.log('────────────────────────────────────────');
for (const item of passes) console.log(`[PASS] ${item.name} — ${item.detail}`);
for (const item of failures) console.log(`[FAIL] ${item.name} — ${item.detail}`);
console.log('────────────────────────────────────────');
console.log(`PASS: ${passes.length}  FAIL: ${failures.length}`);
console.log(failures.length === 0 ? 'Architecture: PASS' : 'Architecture: FAIL');
process.exitCode = failures.length === 0 ? 0 : 1;check('semantic reasoning has a closed consumer interface',
   /interface SemanticReasoningConsumerAlgebraInterface[\s\S]*extends SemanticReasoningAuthorityInterface/.test(reasoningContractSurface)
    && /interface SemanticReasoningConsumerContractInterface[\s\S]*extends SemanticReasoningConsumerAlgebraInterface/.test(reasoningContractSurface)
    && /interface SemanticReasoningConsumerInterface[\s\S]*extends SemanticReasoningConsumerContractInterface/.test(reasoningContractSurface),
  'semantic reasoning consumers must receive only the closed upstream proof authority, never the execution algebra.');

check('route semantic resolution carries reasoning contract',
  /interface RouteCapabilitySemanticResolution[\s\S]*readonly reasoning: SemanticReasoningContract<'evidence_resolution'>/.test(read('packages/core/src/types/upstream/routeCapabilitySemanticAuthority.ts'))
    && /reasoning: semanticReasoningContract\('evidence_resolution'\)/.test(read('packages/core/src/types/upstream/routeCapabilitySemanticAuthority.ts')),
  'route semantic resolution must carry the closed upstream reasoning proof instead of forcing downstream reconstruction.');


