const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/semanticKnowledgeEvidenceAdapterInterface.ts');
const producer = read('packages/core/src/compiler/frontend/php/routeAst/semanticKnowledgeDataFlowProducer.ts');
const analyzer = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const binding = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');
const ast = read('packages/core/src/compiler/frontend/php/controllerBodyAstTypes.ts');
const model = read('packages/core/src/types/upstream/controllerDataflowInvocationSemanticModelInterface.ts');
const scannerContract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const checks = [
  ['upstream projection input carries typed PHP evidence and canonical source identity only', /interface SemanticKnowledgeEvidenceProjectionInput<TEvidence>[\s\S]*readonly evidence: TEvidence;[\s\S]*readonly sourceFile: SourceFile;[\s\S]*?\n}/.test(contract) && !/interface SemanticKnowledgeEvidenceProjectionInput<TEvidence>[\s\S]*?\n}/.exec(contract)?.[0].includes('evidenceProvider')],
  ['PHP projector owns parser provenance rather than analyzer synthesizing it', /const evidenceProvider: SemanticEvidenceProvider = Object\.freeze\(\{ code: 'parser' \}\)/.test(producer) && !/evidenceProvider/.test(analyzer)],
  ['PHP projector directly implements the upstream interface without a redundant factory layer', /SemanticKnowledgeEvidenceAdapter<PhpBlock> = Object\.freeze\(\{[\s\S]*project:/.test(producer) && ! /export const semanticKnowledgeEvidenceAdapter/.test(read('packages/core/src/compiler/frontend/php/routeAst/semanticKnowledgeEvidenceAdapter.ts'))],
  ['composition root injects the PHP-specific projector through the contract', /phpAstSemanticKnowledgeEvidenceAdapter/.test(binding) && /SemanticKnowledgeEvidenceAdapter<PhpBlock>/.test(analyzer)],
  ['canonical invocation judgment remains distinct from integrated response', /readonly invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface/.test(model) && /readonly invocationSemanticIntegratedResponse: InvocationSemanticIntegratedResponseCompositionResult/.test(model)],
  ['integrated response is composed from exact knowledge and canonical judgment response', /responseComposition\.integrate\(\{ knowledge: semanticKnowledgeDataFlow, phpSourceInvocationPipeline: judgment\.response \}\)/.test(analyzer)],
  ['existing upstream model owns the projection; AST does not redeclare it; canonical graph and judgment remain distinct', /readonly semanticKnowledgeProjection: SemanticKnowledgeEvidenceProjection/.test(model) && !/readonly semanticKnowledgeProjection:/.test(ast) && /readonly semanticKnowledgeDataFlow: TKnowledge/.test(model) && /invocationJudgment: judgment/.test(analyzer)],
  ['scanner boundary contract version is coherently advanced', /readonly version: 88/.test(scannerContract) && /version: 88,/.test(scannerContract)],
  ['projection contract has no raw provider classification input', !/readonly evidenceProvider: SemanticEvidenceProvider/.test(contract.split('export interface SemanticKnowledgeEvidenceProjection {')[0])],
];
let failed = 0;
for (const [label, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!ok) failed += 1;
}
process.stdout.write(`${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed ? 1 : 0;
