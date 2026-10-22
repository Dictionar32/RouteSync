const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const invocation = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const responseWiring = read('packages/core/src/types/upstream/laravelControllerInvocationResponseWiringInterface.ts');
const checks = [
  ['action semantic contract advances coherently to v14 in interface and production composition', /readonly version: 14;/.test(contract) && /version: 14 as const/.test(wiring)],
  ['projection, derivation, and publication remainders have typed current and target owners', /export type LaravelControllerActionProjectionRemainder[\s\S]*kind: 'body_source_ast'[\s\S]*currentOwner: 'compiler_projection'[\s\S]*targetOwner: 'upstream_body_semantic_knowledge'/.test(contract) && /export type LaravelControllerActionDerivationOwnershipObligation[\s\S]*kind: 'body_source_ast'[\s\S]*kind: 'request_binding_compatibility_adapter'[\s\S]*targetOwner: 'canonical_request_semantic_binding'/.test(contract) && /LaravelControllerActionSemanticPublicationRemainder[\s\S]*kind: 'resource_binding_domain_publication'[\s\S]*sourceAuthority: 'existing_controller_resource_binding_authority'/.test(contract) && /derivationOwnershipRemainder: Object\.freeze\(\[[\s\S]*kind: 'body_source_ast'[\s\S]*kind: 'request_binding_compatibility_adapter'/.test(contract)],
  ['resource binding judgment is upstream-owned while only canonical publication remains open', /publishedKnowledge: readonly \['actionName', 'response', 'dependencies', 'returns', 'resourceBindings'/.test(contract) && /kind: 'resource_binding_domain_publication'[\s\S]*currentOwner: 'legacy_action_judgment_adapter'[\s\S]*targetOwner: 'canonical_controller_resource_binding_knowledge'/.test(contract)],
  ['production wiring openly retains the legacy action scanner as an unfinished migration boundary', /scanControllerAction\(/.test(wiring) && /upstream-action-derivation-is-not-yet-closed/.test(wiring)],
  ['completed action judgment preserves exact invocation judgment subtype', /readonly invocationJudgment: TInvocationJudgment/.test(contract) && /invocationJudgment: input\.invocationJudgment/.test(wiring)],
  ['invocation judgment models connected, rejected, blocked, and complete outcomes as a closed union', /LaravelControllerInvocationNotConnectedJudgment/.test(invocation) && /LaravelControllerInvocationSourceBindingRejectedJudgment/.test(invocation) && /LaravelControllerInvocationBlockedJudgment/.test(invocation) && /LaravelControllerInvocationCompleteJudgment/.test(invocation)],
  ['integrated response wiring forwards artifact-owned judgments rather than reclassifying them', /forward: <Candidate extends Artifact>/.test(responseWiring) && /without-reconstruction-or-independent-source-file-selection/.test(responseWiring)],
  ['scanner executes the completed action judgment through the runtime executor', /this\.executionDependencies\.actionJudgment\.judge\(/.test(scanner) && /this\.executionDependencies\.actionExecution\.execute\(/.test(scanner)],
  ['no relation/foundation/subscanner layer was added to model this ownership distinction', !/types\/upstream\/(relation|foundation)|semantic\/(relation|foundation)|subscanners\/(relation|foundation)/.test(contract + wiring)],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.stdout.write('TRACE: resource binding derivation is upstream-owned; legacy canonical publication remains open, as do body AST and request-binding derivation.\n');
process.exitCode = failures === 0 ? 0 : 1;
