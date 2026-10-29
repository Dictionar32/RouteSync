const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const files = {
  upstream: read('packages/core/src/types/upstream/semanticKnowledgeEvidenceAdapterInterface.ts'),
  producer: read('packages/core/src/compiler/frontend/php/routeAst/semanticKnowledgeDataFlowProducer.ts'),
  analyzer: read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts'),
  model: read('packages/core/src/types/upstream/controllerDataflowInvocationSemanticModelInterface.ts'),
  outcome: read('packages/core/src/types/upstream/controllerDataflowAnalysisOutcomeInterface.ts'),
  parser: read('packages/core/src/compiler/frontend/php/controllerBodyParser.ts'),
  runtime: read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts'),
  manifest: read('packages/core/src/types/upstream/index.ts'),
};
const packageJson = JSON.parse(read('package.json'));
const relationDir = path.join(root, 'packages/core/src/semantic/relations');
const forbidden = ['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts'];
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const checks = [
  ['upstream owns the language-neutral produced/blocked outcome ADT', /export type SemanticKnowledgeEvidenceProductionOutcome\s*=/.test(files.upstream) && /kind: 'produced'/.test(files.upstream) && /kind: 'blocked'/.test(files.upstream)],
  ['blocked outcome preserves validation violations', /kind: 'blocked'[\s\S]*?violations: readonly SemanticKnowledgeDataFlowValidationViolation\[\]/.test(files.upstream)],
  ['producer uses the outcome-aware operation on the runtime adapter path', /produceWithOutcome\(/.test(files.producer) && /productionOutcome,/.test(files.producer)],
  ['projection retains canonical source identity and evidence provenance', /readonly sourceFile: SourceFile/.test(files.upstream) && /readonly evidenceProvider: SemanticEvidenceProvider/.test(files.upstream)],
  ['controller analyzer sends the complete projection into one authority correlation', /semanticKnowledgeProjection,/.test(files.analyzer) && /sourceCorrelation:/.test(files.analyzer) && /semanticJudgmentAuthority\.derive\(/.test(files.analyzer)],
  ['published controller semantic model retains the exact evidence projection', /readonly semanticKnowledgeProjection: SemanticKnowledgeEvidenceProjection/.test(files.model)],
  ['runtime binding is an interface-backed exported object', /export interface ControllerVariableSemanticRuntimeBindingInterface/.test(files.runtime) && /export const controllerVariableSemanticRuntimeBinding: ControllerVariableSemanticRuntimeBindingInterface\s*=\s*Object\.freeze/.test(files.runtime)],
  ['controller body parser consumes the real runtime binding', /controllerVariableSemanticRuntimeBinding\.analyze\(/.test(files.parser)],
  ['upstream owns completed/blocked controller analysis outcome operations', /ControllerDataflowAnalysisOutcomeOperationsInterface/.test(files.outcome) && /controllerDataflowAnalysisOutcomeOperations/.test(files.outcome)],
  ['producer blocked outcome gates semantic judgment derivation', /productionOutcome\.kind === 'blocked'/.test(files.analyzer) && /return controllerDataflowAnalysisOutcomeOperations\.blocked/.test(files.analyzer)],
  ['controller body ADT preserves blocked evidence and violations', /controller_body_semantic_blocked/.test(files.parser) && /controllerDataflowAnalysisOutcomeOperations\.isPublishable/.test(files.parser)],
  ['Phase 3062 connects blocked controller bodies to the existing manifest blocker gate', /laravel_controller_scan_semantic_body_blocked/.test(read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts')) && /controllerScan.continueToSourceAstProjection/.test(read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts')) && /laravelControllerScanJudgmentOperations/.test(read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts')) && /onBlocked: blockedProjection/.test(read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts'))],
  ['deleted relation foundation modules remain absent', forbidden.every(name => !fs.existsSync(path.join(relationDir, name)))],
  ['protected upstream collections file remains exactly one newline byte', collections.equals(Buffer.from('\n'))],
  ['phase audit command is registered', packageJson.scripts['audit:phase3060-runtime-outcome-to-controller-cli-trace'] === 'node scripts/audits/audit-phase3060-runtime-outcome-to-controller-cli-trace.cjs'],
];
const results = checks.map(([name, pass]) => ({ name, pass }));
const report = { phase: 3060, title: 'Runtime outcome to controller and CLI trace', passed: results.filter(result => result.pass).length, total: results.length, status: results.every(result => result.pass) ? 'PASS' : 'FAIL', results, blockers: [
  'Phase 3061 gates blocked producer outcomes before semantic judgment derivation and preserves them in ControllerBodyAst.',
  'Phase 3062 now connects blocked controller-body outcomes to manifest_builder_blocked and CLI scan/sync terminal handlers; end-to-end runtime execution remains open.',
  'Strict TypeScript closure and end-to-end CLI-to-manifest execution are not claimed by this structural audit.'
]};
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'PASS') process.exitCode = 1;
