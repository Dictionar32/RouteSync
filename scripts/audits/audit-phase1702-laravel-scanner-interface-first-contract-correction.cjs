const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const judgment = read('packages/core/src/types/upstream/laravelScannerSemanticJudgment.ts');
const routeInterface = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const resourceInterface = read('packages/core/src/types/upstream/laravelResourceScannerInterface.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const resourceScanner = read('packages/core/src/compiler/scanner/wiring/laravelResourceScanner.ts');
const resourceResolverPath = 'packages/core/src/compiler/scanner/operations/resource/twoPassRelationResolver.ts';
const resourceFlowPath = 'packages/core/src/compiler/scanner/operations/resource/resourceModelKnowledgeDataFlow.ts';
const resourceModelResolver = read('packages/core/src/compiler/scanner/resolvers/resource/ResourceModelResolver.ts');
const invocation = read('packages/core/src/types/upstream/invocationSemanticPipeline.ts');
const controllerDataflow = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const upstreamBarrel = read('packages/core/src/types/upstream/index.ts');
const coreBarrel = read('packages/core/src/index.ts');
const report = read('PHASE1702_LARAVEL_SCANNER_INTERFACE_FIRST_CONTRACT_CORRECTION.md');
const checks = [
  ['resource judgment subject is source-level and carries no pre-resolved model', () => judgment.includes('interface ResourceModelBindingSubject') && judgment.includes('readonly resource: ResourceReference') && judgment.includes('readonly source: SourceSpan') && !/interface ResourceModelBindingSubject\s*\{[^}]*readonly model\s*:/.test(judgment)],
  ['resource judgment input no longer accepts ResourceDefinition as the subject', () => /interface ResourceModelBindingJudgmentInput\s*\{[\s\S]*?readonly subject: ResourceModelBindingSubject;/.test(judgment) && !/interface ResourceModelBindingJudgmentInput\s*\{[\s\S]*?readonly resource: ResourceDefinition;/.test(judgment)],
  ['resolved resource-model judgment binds one candidate to non-empty candidate-specific evidence', () => /kind: 'resolved';[\s\S]*?readonly candidate: ResourceModelBindingCandidate;/.test(judgment) && /interface ResourceModelBindingCandidate\s*\{[\s\S]*?readonly evidence: readonly \[ResourceModelBindingEvidence, \.\.\.ResourceModelBindingEvidence\[\]\];/.test(judgment)],
  ['ambiguous resource-model judgment requires at least two candidates with candidate-specific evidence', () => /kind: 'ambiguous';[\s\S]*?readonly candidates: readonly \[ResourceModelBindingCandidate, ResourceModelBindingCandidate, \.\.\.ResourceModelBindingCandidate\[\]\];/.test(judgment) && /interface ResourceModelBindingCandidate\s*\{[\s\S]*?readonly evidence: readonly \[ResourceModelBindingEvidence, \.\.\.ResourceModelBindingEvidence\[\]\];/.test(judgment)],
  ['unresolved resource-model judgment preserves explicit reason variants', () => judgment.includes("'no_model_candidate' | 'controller_binding_unresolved' | 'relation_binding_unresolved'")],
  ['resource model outcome does not conflate resolved model with controller action collection', () => !judgment.slice(judgment.indexOf('export type ResourceModelBindingOutcome'), judgment.indexOf('export interface ResourceModelBindingJudgment')).includes('readonly controllerActions:')],
  ['route-controller judgment remains explicit and discriminated', () => judgment.includes('RouteControllerBindingJudgmentAuthority') && judgment.includes("readonly kind: 'resolved'") && judgment.includes("readonly kind: 'unresolved'") && judgment.includes("readonly kind: 'ambiguous'")],
  ['route interface consumes the whole correlated controller scan judgment rather than a detached action array', () => routeInterface.includes('controllerScan: LaravelControllerScanJudgment') && !routeInterface.includes('controllerActions: readonly ControllerActionFlowContract[]')],
  ['orphaned relation resolver and subscanner-owned knowledge implementation are retired; active resolver consumes upstream reasoning', () => !require('node:fs').existsSync(require('node:path').join(__dirname, '../..', resourceResolverPath)) && !require('node:fs').existsSync(require('node:path').join(__dirname, '../..', resourceFlowPath)) && resourceModelResolver.includes('reasonResourceModel(reasoningInput)')],
  ['source AST pipeline consumes its injected Resource scanner operation rather than importing a legacy ResourceScanner implementation', () => pipeline.includes('const { controllerScanner, resourceScanner, responseScanner, routeScanner } = dependencies;') && pipeline.includes('await resourceScanner.scan({') && !pipeline.includes('operations/ResourceScanner') && resourceScanner.includes('export const laravelResourceScanner: LaravelResourceScannerInterface')],
  ['existing upstream invocation semantic pipeline binds the existing batch authority rather than duplicating semantic judgment', () => invocation.includes('export const invocationSemanticPipeline: InvocationSemanticPipelineInterface') && invocation.includes('batchAuthority.analyze(knowledge)') && invocation.includes('semanticInterproceduralDataFlowAuthority')],
  ['contract is exported from both upstream and public core barrels', () => upstreamBarrel.includes("export * from './laravelScannerSemanticJudgment'") && coreBarrel.includes("export * from './types/upstream/laravelScannerSemanticJudgment'")],
  ['no semantic/foundation dependency was introduced', () => !judgment.includes('semantic/foundation') && !resourceInterface.includes('semantic/foundation')],
  ['report explicitly distinguishes contract correction from migration completion', () => report.includes('does not claim migration completion') && report.includes('This is a contract correction, not a claim that the authority exists')],
];
let failed = 0;
for (const [name, check] of checks) {
  let ok = false;
  try { ok = Boolean(check()); } catch { ok = false; }
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!ok) failed += 1;
}
process.stdout.write(`RESULT ${checks.length - failed}/${checks.length} PASS\n`);
process.exitCode = failed ? 1 : 0;
