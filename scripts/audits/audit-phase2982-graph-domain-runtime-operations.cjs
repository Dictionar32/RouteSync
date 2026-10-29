const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const absent = file => !fs.existsSync(path.join(root, file));
const nodeFactories = read('packages/core/src/graph/service/nodeFactories.ts');
const edgeRelation = read('packages/core/src/graph/service/graphEdgeRelation.ts');
const projection = read('packages/core/src/graph/service/structuralSemanticRelationProjection.ts');
const compiler = read('packages/core/src/graph/service/manifestGraphCompiler.ts');
const builder = read('packages/core/src/graph/ServiceGraphBuilder.ts');
const controllerRegistry = read('packages/core/src/graph/service/controllerRegistry.ts');
const coreIndex = read('packages/core/src/index.ts');
const serviceIndex = read('packages/core/src/graph/service/index.ts');
const upstreamControllerProjection = read('packages/core/src/types/upstream/semanticDataflowControllerProjection.ts');
const upstreamDataflowFactory = read('packages/core/src/types/upstream/semanticDataflowInputFactory.ts');
const audit = {
  phase: 2982,
  title: 'Fully Explicit Simplicity — Graph Domain Runtime Operations',
  checks: [
    { name: 'graph node factory has an explicit interface and frozen runtime object', passed: /export interface GraphNodeFactoryOperationsInterface/.test(nodeFactories) && /export const graphNodeFactoryOperations:\s*GraphNodeFactoryOperationsInterface\s*=\s*Object\.freeze\(/.test(nodeFactories) },
    { name: 'graph builder delegates node construction through the operations object', passed: /graphNodeFactoryOperations\.detectExecutionLayer/.test(builder) && /graphNodeFactoryOperations\.buildServiceNode/.test(builder) && /graphNodeFactoryOperations\.buildControllerNode/.test(builder) && /graphNodeFactoryOperations\.buildModelNode/.test(builder) },
    { name: 'controller registry consumes the graph node factory contract', passed: /graphNodeFactoryOperations\.buildControllerNode/.test(controllerRegistry) },
    { name: 'graph edge creation is an interface-typed runtime operation', passed: /export interface GraphEdgeRelationOperationsInterface/.test(edgeRelation) && /export const graphEdgeRelationOperations:\s*GraphEdgeRelationOperationsInterface\s*=\s*Object\.freeze\(/.test(edgeRelation) },
    { name: 'semantic relation projection exposes a typed domain operation object', passed: /export interface StructuralSemanticRelationProjectionOperationsInterface/.test(projection) && /export const structuralSemanticRelationProjectionOperations:\s*StructuralSemanticRelationProjectionOperationsInterface\s*=\s*Object\.freeze\(/.test(projection) },
    { name: 'manifest compiler consumes graph domain operations', passed: /graphEdgeRelationOperations\.create\(/.test(compiler) && /structuralSemanticRelationProjectionOperations\.project\(/.test(compiler) && /graphNodeFactoryOperations\.build/.test(compiler) },
    { name: 'manifest compiler no longer imports deleted generic relation sequence helpers', passed: !/semantic\/relations\/(?:relationMembership|relationalSequence|semanticRelations)/.test(compiler) },
    { name: 'graph sequence traversal is private to graph compilation and preserves sequence order', passed: /graphSurfaceSequenceOperations/.test(compiler) && /graphSurfaceSequenceToArray/.test(compiler) && !/relationVariantFold|relationProject|relationOptionFold/.test(compiler) },
    { name: 'graph operation files no longer export standalone parameterized functions or inferred arrows', passed: [nodeFactories, edgeRelation, projection].every(source => !/export\s+function\s+\w+\s*\(/.test(source) && !/export\s+const\s+\w+\s*=\s*\(/.test(source)) },
    { name: 'public core surface exports graph runtime operation objects and interfaces', passed: /export \{ graphNodeFactoryOperations \}/.test(coreIndex) && /export type \{ GraphNodeFactoryOperationsInterface \}/.test(coreIndex) && /export \{ structuralSemanticRelationProjectionOperations \}/.test(coreIndex) && /export type \{ StructuralSemanticRelationProjectionOperationsInterface \}/.test(coreIndex) && /graphEdgeRelationOperations/.test(serviceIndex) },
    { name: 'deleted relation foundation files remain absent', passed: ['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts'].every(name => absent(`packages/core/src/semantic/relations/${name}`)) },
    { name: 'upstream controller projection no longer imports deleted relation sequence helpers', passed: !/semantic\/relations\/(?:relationMembership|relationalSequence|semanticRelations)/.test(upstreamControllerProjection) },
    { name: 'upstream controller match results are continuation-bearing ADTs', passed: /ControllerResourceModelJudgment/.test(upstreamControllerProjection) && /ControllerModelParameterJudgment/.test(upstreamControllerProjection) && /continueWith/.test(upstreamControllerProjection) },
    { name: 'upstream input producer is a direct interface-typed runtime object, not an exported factory arrow', passed: /export const semanticDataflowInputProducer:\s*SemanticDataflowSeedProducerInterface\s*=\s*Object\.freeze\(/.test(upstreamDataflowFactory) && !/export\s+const\s+createSemanticDataflowInputProducer\s*=/.test(upstreamDataflowFactory) },
    { name: 'upstream input factory consumes the controller projection authority object', passed: /semanticDataflowControllerProjectionAuthority/.test(upstreamDataflowFactory) && /controller:\s*semanticDataflowControllerProjectionAuthority/.test(upstreamDataflowFactory) },
    { name: 'upstream controller facts are no longer exposed as a standalone function export', passed: !/export\s+(?:const|function)\s+semanticDataflowControllerFacts\b/.test(upstreamControllerProjection) && /export const semanticDataflowControllerProjectionAuthority:\s*SemanticDataflowControllerProjectionAuthorityInterface\s*=\s*Object\.freeze\(/.test(upstreamControllerProjection) },
    { name: 'upstream collections stays empty and is not used as a repair location', passed: read('packages/core/src/types/upstream/collections.ts').trim().length === 0 },
  ],
  verificationBoundary: {
    fullWorkspaceBuild: 'not run: project dependencies are not installed and build.log records unresolved imports across the wider workspace',
    fullTestSuite: 'not run: vitest and project dependencies are unavailable in this workspace',
    changedFileSyntax: 'checked separately with TypeScript transpileModule',
  },
  remainingWork: [
    'The upstream, CLI, manifest and IR workspace still contains consumers importing deleted relation foundation modules; this phase only cuts the graph runtime path over.',
    'Sequence remains typed through the intentionally empty upstream collections module in pre-existing contracts; do not fill that file or recreate a generic relation foundation.',
    'The current graph compiler uses a graph-private sequence projection because the graph owns this consumption boundary; the canonical upstream Sequence owner still needs a separate domain-level migration.',
  ],
};
audit.passed = audit.checks.filter(check => check.passed).length;
audit.total = audit.checks.length;
fs.writeFileSync(path.join(root, 'PHASE2982_GRAPH_DOMAIN_RUNTIME_OPERATIONS_AUDIT.json'), JSON.stringify(audit, null, 2) + '\n');
console.log(`Phase2982 audit: ${audit.passed}/${audit.total} checks passed`);
for (const check of audit.checks) console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}`);
if (audit.passed !== audit.total) process.exitCode = 1;
