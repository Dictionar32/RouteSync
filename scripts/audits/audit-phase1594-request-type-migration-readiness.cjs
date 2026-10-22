const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contractPath = 'packages/core/src/types/upstream/requestTypeDerivationInterface.ts';
const runtimePath = 'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationRuntimeExecutor.ts';
const defaultLoweringPath = 'packages/core/src/compiler/scanner/wiring/routeManifestTypeLowering.ts';
const legacyPipelinePath = 'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProjectionPipeline.ts';
const authorityLoweringPath = 'packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts';
const contract = read(contractPath);
const runtime = read(runtimePath);
const defaultLowering = read(defaultLoweringPath);
const legacyPipeline = read(legacyPipelinePath);
const authorityLowering = read(authorityLoweringPath);
const sourceFiles = [];
const walk = directory => {
  for (const entry of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
    const relative = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(relative);
    else if (entry.name.endsWith('.ts')) sourceFiles.push(relative);
  }
};
walk('packages/core/src');
const sourceText = sourceFiles.map(read).join('\n');
const consumerPipelineBlock = contract.split('export interface RequestTypeDerivationSemanticPipelineInterface')[1]?.split('export interface RequestTypeDerivationSemanticPipelineCompositionInterface')[0] ?? ''; 
const concreteReasoning = /(?:implements|satisfies)\s+RequestTypeDerivationSemanticReasoningInterface/.test(sourceText);
const concreteVerifier = /(?:implements|satisfies)\s+RequestTypeDerivationProofVerificationInterface/.test(sourceText);
const concretePipeline = /(?:implements|satisfies)\s+RequestTypeDerivationSemanticPipelineCompositionInterface/.test(sourceText);
const checks = [
  { name: 'consumer pipeline exposes only contract and source-bound derive', passed: consumerPipelineBlock.includes('readonly contract: TContract;') && consumerPipelineBlock.includes('readonly derive:') && !consumerPipelineBlock.includes('readonly reasoning:') && !consumerPipelineBlock.includes('readonly verifier:') && !consumerPipelineBlock.includes('readonly authority:') },
  { name: 'semantic composition is separate from the assembled consumer pipeline', passed: /export interface RequestTypeDerivationSemanticPipelineCompositionInterface<[\s\S]*?\n>\s*\{/.test(contract) && !/export interface RequestTypeDerivationSemanticPipelineCompositionInterface<[\s\S]*?\n>\s*extends RequestTypeDerivationSemanticPipelineInterface/.test(contract) && contract.split('export interface RequestTypeDerivationSemanticPipelineCompositionInterface')[1]?.split('export type RequestTypeDerivationProjectableJudgment')[0]?.includes('readonly contract: TContract;') && contract.split('export interface RequestTypeDerivationSemanticPipelineCompositionInterface')[1]?.split('export type RequestTypeDerivationProjectableJudgment')[0]?.includes('readonly authority: RequestTypeDerivationSemanticAuthorityInterface<TContract>;') && !contract.split('export interface RequestTypeDerivationSemanticPipelineCompositionInterface')[1]?.split('export type RequestTypeDerivationProjectableJudgment')[0]?.includes('readonly derive:') },
  { name: 'runtime executor consumes only canonical pipeline operation', passed: runtime.includes('pipeline.derive(input)') && !/pipeline\.(reasoning|verifier|authority)\b/.test(runtime) },
  { name: 'scanner default is still the legacy projection path', passed: defaultLowering.includes('requestTypeDerivationProjectionPipeline.derive') && !defaultLowering.includes('createRequestTypeDerivationRuntimeExecutor') },
  { name: 'legacy projection still delegates to solver aggregation', passed: legacyPipeline.includes('createDerivationContext') && legacyPipeline.includes('aggregateRequestTypeGroups') },
  { name: 'authority-backed lowering exists only as an injected alternative', passed: authorityLowering.includes('createAuthorityBackedRouteManifestTypeLowering') && authorityLowering.includes('pipeline: RequestTypeDerivationSemanticPipelineInterface') },
  { name: 'concrete reasoning implementation is present', passed: concreteReasoning },
  { name: 'concrete proof verifier implementation is present', passed: concreteVerifier },
  { name: 'concrete pipeline composition implementation is present', passed: concretePipeline },
];
const blockers = checks.filter(item => !item.passed).map(item => item.name);
const report = {
  phase: 1594,
  title: 'RequestType semantic interface and migration-readiness audit',
  scope: 'static source audit; no runtime behavior or package build is claimed',
  checks,
  passed: checks.filter(item => item.passed).length,
  total: checks.length,
  migrationReady: blockers.length === 0,
  blockers,
  decision: blockers.length === 0 ? 'ready_for_cutover_review' : 'not_ready_for_migration',
};
fs.writeFileSync(path.join(root, 'PHASE1594_REQUEST_TYPE_MIGRATION_READINESS_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
// Exit success means the audit executed and reported readiness honestly, not that migration is ready.
