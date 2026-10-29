const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const model = read('packages/core/src/types/upstream/controllerDataflowInvocationSemanticModelInterface.ts');
const ast = read('packages/core/src/compiler/frontend/php/controllerBodyAstTypes.ts');
const analyzer = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const producer = read('packages/core/src/compiler/frontend/php/routeAst/semanticKnowledgeDataFlowProducer.ts');
const adapter = read('packages/core/src/types/upstream/semanticKnowledgeEvidenceAdapterInterface.ts');
const scanner = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const checks = [
  ['existing upstream semantic model owns the semantic knowledge projection value', /readonly semanticKnowledgeProjection: SemanticKnowledgeEvidenceProjection/.test(model)],
  ['model keeps canonical invocation judgment as its original closed type', /readonly invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface/.test(model)],
  ['model keeps integrated response distinct from canonical judgment', /readonly invocationSemanticIntegratedResponse: InvocationSemanticIntegratedResponseCompositionResult/.test(model) && /readonly invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface/.test(model)],
  ['model contract documents provenance ownership without adding a callable authority', /evidenceProjectionOwnership/.test(model) && /noParallelAuthority/.test(model)],
  ['AST inherits projection from the existing upstream model instead of redeclaring it', /extends ControllerDataflowInvocationSemanticModelInterface<SemanticKnowledgeDataFlow>/.test(ast) && !/readonly semanticKnowledgeProjection:/.test(ast)],
  ['analyzer returns projection and its exact knowledge alongside separate judgment and response', /return Object\.freeze\(\{ semanticKnowledgeProjection, semanticKnowledgeDataFlow, semanticVariables,[\s\S]*invocationSemanticIntegratedResponse, invocationJudgment: judgment \}\)/.test(analyzer)],
  ['PHP projector owns parser provenance', /const evidenceProvider: SemanticEvidenceProvider = Object\.freeze\(\{ code: 'parser' \}\)/.test(producer) && !/evidenceProvider/.test(analyzer)],
  ['projection contract remains an evidence transformation boundary rather than a duplicate value model', /interface SemanticKnowledgeEvidenceAdapter<TEvidence>[\s\S]*readonly project:/.test(adapter)],
  ['scanner contract version declaration and runtime value both equal 88', /readonly version: 88/.test(scanner) && /version: 88,/.test(scanner)],
  ['scanner contract names the existing model as owner of projection provenance and invocation values', /controllerDataflowSemanticModelOwnership/.test(scanner)],
];
let failed = 0;
for (const [label, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!ok) failed += 1;
}
process.stdout.write(`${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed ? 1 : 0;
