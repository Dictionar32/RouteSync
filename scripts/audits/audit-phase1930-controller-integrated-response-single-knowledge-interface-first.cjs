const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const compositionInterface = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const compositionRuntime = read('packages/core/src/types/upstream/invocationSemanticPipeline.ts');
const model = read('packages/core/src/types/upstream/controllerDataflowInvocationSemanticModelInterface.ts');
const authorityInterface = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthorityInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthority.ts');
const scannerContract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const pipelineContract = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const checks = [
  ['composition contract version 20 is consistent', /readonly version: 20/.test(compositionInterface) && /version: 20,/.test(compositionInterface)],
  ['invocation pipeline source-binding contract evolves to version 59', /readonly version: 59;/.test(pipelineContract) && /version: 59,/.test(pipelineContract) && /composition-consumes-the-exact-source-correlated-knowledge-projection/.test(pipelineContract)],
  ['composition result publishes response without a second knowledge field', /interface InvocationSemanticIntegratedResponseCompositionResult\s*\{[^}]*readonly response: InvocationSemanticIntegratedResponse;[^}]*\}/s.test(compositionInterface) && !/interface InvocationSemanticIntegratedResponseCompositionResult\s*\{[^}]*readonly knowledge:/.test(compositionInterface)],
  ['composition runtime does not republish input knowledge in its result', /kind: 'invocation_semantic_integrated_response_composition_result',[\s\S]*?response,/s.test(compositionRuntime) && !/kind: 'invocation_semantic_integrated_response_composition_result',[\s\S]*?knowledge: input\.knowledge/s.test(compositionRuntime)],
  ['inventory and invocation analysis still receive the same canonical knowledge input', /const knowledge = input\.semanticKnowledgeProjection\.knowledge/.test(compositionRuntime) && /inspectKnowledge\(knowledge\)/.test(compositionRuntime) && /analyzeKnowledge\(knowledge\)/.test(compositionRuntime)],
  ['controller model contract advances to version 8', /readonly version: 11/.test(model) && /version: 11,/.test(model)],
  ['model retains source-correlated knowledge projection as sole published knowledge field', /readonly semanticKnowledgeProjection: SemanticKnowledgeEvidenceProjection;/.test(model) && !/readonly semanticKnowledgeDataFlow:/.test(model)],
  ['model retains invocation judgment and integrated response as distinct values', /readonly invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface;/.test(model) && /readonly invocationSemanticIntegratedResponse: InvocationSemanticIntegratedResponseCompositionResult;/.test(model)],
  ['controller authority contract remains coherent at version 10', /readonly version: 13/.test(authorityInterface) && /version: 13,/.test(authorityInterface) && /contractVersion: 13,/.test(authority)],
  ['controller authority passes canonical projection knowledge and exact invocation response', /const knowledge = sourceCorrelation\.semanticKnowledgeProjection\.knowledge/.test(authority) && /integrate\(\{\s*semanticKnowledgeProjection: sourceCorrelation\.semanticKnowledgeProjection,\s*phpSourceInvocationPipeline: sourceCorrelation\.invocationJudgment\.response/s.test(authority)],
  ['scanner boundary advances to version 98 and documents payload source identity closure', /readonly version: 101;/.test(scannerContract) && /version: 101,/.test(scannerContract) && /composition-consumes-the-complete-projection-and-returns-response-only/.test(scannerContract)],
  ['composition contract no longer claims to retain a second knowledge value', /composition-consumes-the-complete-source-correlated-knowledge-projection/.test(compositionInterface) && !/composition-result-retains-the-exact-knowledge-input/.test(compositionInterface) && /composition-consumes-the-complete-source-correlated-knowledge-projection/.test(compositionInterface)],
  ['no type assertion was added to the touched authority or composition runtime', !/\sas\s/.test([compositionRuntime, authority].join('\n'))],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
