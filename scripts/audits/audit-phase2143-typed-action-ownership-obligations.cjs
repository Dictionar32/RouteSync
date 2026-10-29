const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const invocation = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const execution = read('packages/core/src/types/upstream/laravelControllerActionExecutionInterface.ts');
const response = read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts');
const index = read('packages/core/src/index.ts');
const checks = [
  ['coverage is a closed partial ADT, not a completeness claim', /kind: 'action_semantic_knowledge_partial'/.test(contract)],
  ['projection remainder has a typed current owner and target owner', /LaravelControllerActionProjectionRemainder[\s\S]*kind: 'body_source_ast'[\s\S]*currentOwner: 'compiler_projection'[\s\S]*targetOwner: 'upstream_body_semantic_knowledge'/.test(contract)],
  ['body AST derivation ownership has explicit upstream target', /kind: 'body_source_ast'[\s\S]*currentOwner: 'legacy_controller_action_contract'[\s\S]*targetOwner: 'upstream_body_semantic_authority'/.test(contract)],
  ['resource binding is correctly classified as publication debt, not derivation debt', /kind: 'resource_binding_domain_publication'[\s\S]*currentOwner: 'legacy_action_judgment_adapter'[\s\S]*targetOwner: 'canonical_controller_resource_binding_knowledge'[\s\S]*sourceAuthority: 'existing_controller_resource_binding_authority'/.test(contract)],
  ['request adapter obligation names canonical request semantic binding', /kind: 'request_binding_compatibility_adapter'[\s\S]*currentOwner: 'legacy_controller_action_contract'[\s\S]*targetOwner: 'canonical_request_semantic_binding'/.test(contract)],
  ['coverage separates two open derivations from one publication remainder', /derivationOwnershipRemainder: Object\.freeze\(\[[\s\S]*kind: 'body_source_ast'[\s\S]*kind: 'request_binding_compatibility_adapter'[\s\S]*\] as const\)/.test(contract) && /publicationRemainder: Object\.freeze\(\[Object\.freeze\([\s\S]*kind: 'resource_binding_domain_publication'/.test(contract)],
  ['public package entry exports the typed ownership contract', /LaravelControllerActionProjectionRemainder/.test(index) && /LaravelControllerActionDerivationOwnershipObligation/.test(index) && /LaravelControllerActionSemanticPublicationRemainder/.test(index)],
  ['action contract version is synchronized with production composition', /readonly version: 14;/.test(contract) && /version: 14 as const/.test(wiring)],
  ['legacy action scanner remains explicitly marked as unfinished derivation ownership', /scanControllerAction\(/.test(wiring) && /upstream-action-derivation-is-not-yet-closed/.test(wiring)],
  ['exact invocation judgment remains a closed four-outcome ADT', /LaravelControllerInvocationNotConnectedJudgment/.test(invocation) && /LaravelControllerInvocationSourceBindingRejectedJudgment/.test(invocation) && /LaravelControllerInvocationCompleteJudgment/.test(invocation) && /LaravelControllerInvocationBlockedJudgment/.test(invocation)],
  ['scanner passes the same invocation judgment into action and integrated response paths', /actionJudgment\.judge\(\{[\s\S]*invocationJudgment,[\s\S]*judgeIntegratedResponse\(Object\.freeze\(\{[\s\S]*invocationJudgment,/.test(scanner)],
  ['runtime executor forwards the exact judgment without semantic reclassification', /semanticJudgment: input\.semanticJudgment/.test(wiring) && /forwards-canonical-action-semantic-knowledge/.test(execution)],
  ['integrated response remains owned by the existing response pipeline', /judgeIntegratedResponse\(/.test(scanner) && /integratedJudgmentOwner: 'LaravelControllerResponseSemanticPipelineInterface\.judgeIntegratedResponse'/.test(response)],
  ['no relation/foundation or new subscanner layer is introduced', !/types\/upstream\/(relation|foundation)|semantic\/(relation|foundation)|operations\/(relation|foundation)/.test(contract + wiring)],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
