const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const interfaceFile = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const composition = read('packages/core/src/types/upstream/invocationSemanticPipeline.ts');
const authority = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthority.ts');
const model = read('packages/core/src/types/upstream/controllerDataflowInvocationSemanticModelInterface.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['composition input consumes the complete source-correlated projection', /interface InvocationSemanticIntegratedResponseCompositionInput\s*\{[^}]*readonly semanticKnowledgeProjection: SemanticKnowledgeEvidenceProjection;[^}]*\}/s.test(interfaceFile) && !/interface InvocationSemanticIntegratedResponseCompositionInput\s*\{[^}]*readonly knowledge: SemanticKnowledgeDataFlow/s.test(interfaceFile)],
  ['composition derives one canonical graph from the supplied projection', /const knowledge = input\.semanticKnowledgeProjection\.knowledge/.test(composition)],
  ['inventory and invocation analysis consume the exact same graph object', /inspectKnowledge\(knowledge\)/.test(composition) && /analyzeKnowledge\(knowledge\)/.test(composition)],
  ['controller authority forwards the projection without unbinding provenance', /integrate\(\{\s*semanticKnowledgeProjection: sourceCorrelation\.semanticKnowledgeProjection,\s*phpSourceInvocationPipeline: sourceCorrelation\.invocationJudgment\.response/s.test(authority)],
  ['controller model retains canonical knowledge projection and separate invocation judgment', /readonly semanticKnowledgeProjection: SemanticKnowledgeEvidenceProjection;/.test(model) && /readonly invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface;/.test(model)],
  ['composition result remains response-only and does not duplicate knowledge', /interface InvocationSemanticIntegratedResponseCompositionResult\s*\{[^}]*readonly response: InvocationSemanticIntegratedResponse;[^}]*\}/s.test(interfaceFile) && !/interface InvocationSemanticIntegratedResponseCompositionResult\s*\{[^}]*readonly knowledge:/.test(interfaceFile)],
  ['controller judgment authority version 10 declares projection-level provenance and payload source identity ownership', /readonly version: 13;/.test(read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthorityInterface.ts')) && /contractVersion: 13,/.test(authority)],
  ['Laravel scanner boundary version 98 declares complete projection consumption and payload identity closure', /readonly version: 101;/.test(read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts')) && /composition-consumes-the-complete-projection-and-returns-response-only/.test(read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts'))],
  ['composition contract version 20 records provenance binding', /readonly version: 20;/.test(interfaceFile) && /version: 20,/.test(interfaceFile) && /readonly provenanceBinding: 'the-composition-input-retains-source-file-and-evidence-provider/.test(interfaceFile)],
  ['pipeline contract version 59 records source-correlated composition input', /readonly version: 59;/.test(interfaceFile) && /version: 59,/.test(interfaceFile) && /composition-consumes-the-exact-source-correlated-knowledge-projection/.test(interfaceFile)],
  ['composition still forwards the exact PHP invocation pipeline outcome', /phpFunctionInvocations: input\.phpSourceInvocationPipeline/.test(composition)],
  ['touched composition and authority do not introduce type assertions', !/\sas\s/.test([composition, authority].join('\n'))],
  ['audit command is registered in package scripts', Boolean(packageJson.scripts['audit:phase1931-invocation-composition-provenance-closure-interface-first'])],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
