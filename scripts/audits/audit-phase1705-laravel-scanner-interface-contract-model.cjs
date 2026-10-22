const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const files = {
  route: read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts'),
  controller: read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts'),
  model: read('packages/core/src/types/upstream/laravelModelScannerInterface.ts'),
  request: read('packages/core/src/types/upstream/laravelFormRequestScannerInterface.ts'),
  resource: read('packages/core/src/types/upstream/laravelResourceScannerInterface.ts'),
  channel: read('packages/core/src/types/upstream/laravelChannelScannerInterface.ts'),
  judgment: read('packages/core/src/types/upstream/laravelScannerSemanticJudgment.ts'),
  invocation: read('packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts'),
  pipeline: read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts'),
  controllerDataflow: read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts'),
  sourcePipeline: read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts'),
  public: read('packages/core/src/index.ts'),
  upstream: read('packages/core/src/types/upstream/index.ts'),
};

let passed = 0;
const check = (name, predicate) => {
  assert.ok(predicate, name);
  passed += 1;
  process.stdout.write(`PASS ${name}\n`);
};

const scannerInterfaces = [files.route, files.controller, files.model, files.request, files.resource, files.channel];
check('all six Laravel scanner interfaces declare closed versioned contracts', scannerInterfaces.every(source => source.includes('readonly closed: true;') && source.includes('readonly contractVersion: 2;')));
check('route scan products are correlated as per-route artifacts', files.route.includes('interface LaravelRouteScanArtifact') && files.route.includes('readonly ast: RouteAst;') && files.route.includes('readonly flow: RouteSemanticFlow;') && files.route.includes('readonly binding: RouteControllerBindingJudgment;') && !files.route.includes('readonly asts:') && !files.route.includes('readonly flows:'));
check('controller actions are correlated with their owning controller AST', files.controller.includes('interface LaravelControllerScanArtifact') && files.controller.includes('readonly ast: ControllerAst;') && files.controller.includes('readonly actions: readonly ControllerActionFlowContract[];') && !files.controller.includes('readonly asts:'));
check('model AST and definition are paired in one artifact', files.model.includes('interface LaravelModelScanArtifact') && files.model.includes('readonly ast: ModelAst;') && files.model.includes('readonly definition: ModelDefinition;') && !files.model.includes('readonly asts:') && !files.model.includes('readonly definitions:'));
check('FormRequest source evidence AST and definition are paired', files.request.includes('interface LaravelFormRequestScanArtifact') && files.request.includes('readonly source: FormRequestSource;') && files.request.includes('readonly ast: RequestAst;') && files.request.includes('readonly definition: RequestDefinition;') && !files.request.includes('readonly sources:') && !files.request.includes('readonly asts:'));
check('resource AST definition and binding judgment are correlated', files.resource.includes('interface LaravelResourceScanArtifact') && files.resource.includes('readonly ast: ResourceAst;') && files.resource.includes('readonly definition: ResourceDefinition;') && files.resource.includes('readonly modelBinding: ResourceModelBindingJudgment;') && !files.resource.includes('readonly asts:') && !files.resource.includes('readonly definitions:'));
check('resource input has no duplicated model/controller AST arrays', !files.resource.includes('readonly models: readonly ModelAst[];') && !files.resource.includes('readonly controllers: readonly ControllerAst[];'));
check('channel scan returns a tagged judgment instead of a bare array', files.channel.includes('Promise<LaravelChannelScanJudgment>') && files.channel.includes('interface LaravelChannelScanJudgment') && files.channel.includes('readonly channels: readonly ChannelAst[];'));
check('resource subject has one canonical resource identity carrier', files.judgment.includes('interface ResourceModelBindingSubject') && files.judgment.includes('readonly resource: ResourceReference;') && !files.judgment.slice(files.judgment.indexOf('interface ResourceModelBindingSubject'), files.judgment.indexOf('export interface ResourceModelBindingSourceEvidence')).includes('readonly name:'));
check('unresolved resource outcome uses non-empty source evidence independent of model candidates', files.judgment.includes('type ResourceModelBindingSourceEvidenceSet = readonly [') && files.judgment.includes('readonly evidence: ResourceModelBindingSourceEvidenceSet;') && files.judgment.slice(files.judgment.indexOf('interface ResourceModelBindingSourceEvidence'), files.judgment.indexOf('export type ResourceModelBindingSourceEvidenceSet')).includes('readonly source: SourceSpan;') && !files.judgment.slice(files.judgment.indexOf('interface ResourceModelBindingSourceEvidence'), files.judgment.indexOf('export type ResourceModelBindingSourceEvidenceSet')).includes('readonly model:'));
check('resource candidate evidence is paired with its model and source', files.judgment.includes('interface ResourceModelBindingEvidence') && files.judgment.includes('readonly model: ModelReference;') && files.judgment.includes('readonly evidence: readonly [ResourceModelBindingEvidence, ...ResourceModelBindingEvidence[]];'));
check('route unresolved evidence is non-empty and candidate evidence is candidate-correlated', files.judgment.includes('type RouteControllerBindingSourceEvidenceSet = readonly [') && files.judgment.includes('interface RouteControllerBindingCandidate') && files.judgment.includes('readonly evidence: RouteControllerBindingCandidateEvidence;'));
check('semantic judgment contract version is bumped for changed invariants', /readonly version: 2;/.test(files.judgment) && /version: 2,/.test(files.judgment));
check('invocation semantic judgment preserves closed/incomplete target correlation', files.invocation.includes("readonly status: 'closed'") && files.invocation.includes("readonly status: 'incomplete'") && files.invocation.includes("readonly kind: 'ambiguous'") && files.invocation.includes("readonly kind: 'unresolved'"));
check('invocation pipeline exposes one canonical domain operation and whole-knowledge analysis', files.pipeline.includes('readonly analyzeInvocation:') && files.pipeline.includes('readonly analyzeBatch:') && files.pipeline.includes('readonly analyzeKnowledge:'));
check('controller scanner interface does not own or duplicate invocation reasoning', !files.controller.includes('InvocationSemanticPipelineInterface') && !files.controller.includes('InvocationSemanticAnalysis'));
check('existing controller dataflow continues to call the established invocation pipeline', files.controllerDataflow.includes('invocationSemanticPipeline.analyzeKnowledge('));
check('all new artifact and judgment contracts are publicly exported', files.public.includes('LaravelRouteScanArtifact') && files.public.includes('LaravelControllerScanArtifact') && files.public.includes('LaravelModelScanArtifact') && files.public.includes('LaravelFormRequestScanArtifact') && files.public.includes('LaravelResourceScanArtifact') && files.public.includes('LaravelChannelScanJudgment') && files.public.includes("export * from './types/upstream/laravelScannerSemanticJudgment'"));
check('upstream barrel exports scanner interfaces and judgment algebra', files.upstream.includes("export * from './laravelRouteScannerInterface'") && files.upstream.includes("export * from './laravelScannerSemanticJudgment'"));
check('no any or semantic/foundation dependency was added to Laravel contract surface', !scannerInterfaces.concat(files.judgment).some(source => /\bany\b/.test(source) || source.includes('semantic/foundation')));
check('production pipeline remains untouched in this interface-only phase', files.sourcePipeline.includes('ModelScanner.scanCanonicalBundle') && files.sourcePipeline.includes('RouteScanner.scanCanonicalBundle') && !files.sourcePipeline.includes('LaravelRouteScannerInterface'));

process.stdout.write(`\nPhase 1705 interface contract audit: ${passed}/${passed} PASS\n`);
