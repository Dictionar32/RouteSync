const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const dataflow = read('packages/core/src/compiler/scanner/operations/controller/controllerDataflowContract.ts');
const resourceAuthority = read('packages/core/src/types/upstream/controllerResourceBindingInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const executor = read('packages/core/src/types/upstream/laravelControllerActionExecutionInterface.ts');
const index = read('packages/core/src/index.ts');
const checks = [
  ['resource binding authority owns closed resolved/unresolved/not-applicable judgments', /ControllerResourceBindingJudgment[\s\S]*kind: 'resolved'[\s\S]*kind: 'unresolved'[\s\S]*kind: 'not_applicable'/.test(resourceAuthority) && /readonly judge:/.test(resourceAuthority)],
  ['dataflow contract receives bindings from the existing upstream resource authority', /controllerResourceBindingAuthority\.judge\(/.test(dataflow) && /readonly resourceBindings: readonly ControllerResourceBinding\[\]/.test(dataflow)],
  ['coverage no longer mislabels resource binding aggregation as legacy derivation ownership', !/kind: 'resource_binding_aggregation'/.test(contract) && !/resource-binding-aggregation/.test(contract)],
  ['resource domain publication is no longer listed as an open obligation', !/kind: 'resource_binding_domain_publication'/.test(contract) && /resource-binding-judgment-and-canonical-publication-are-already-owned-by-controllerResourceBindingAuthority/.test(contract)],
  ['canonical publication uses the existing resource authority contract', /readonly publishResolved:/.test(resourceAuthority) && /controllerResourceBindingAuthority\.publishResolved/.test(wiring)],
  ['derivation ownership records body, request adapter, and legacy resolver obligations without mislabeling resource ownership', /kind: 'body_source_ast'/.test(contract) && /kind: 'request_binding_compatibility_adapter'/.test(contract) && /kind: 'legacy_action_semantic_derivation'/.test(contract) && !/kind: 'resource_binding_aggregation'/.test(contract)],
  ['action judgment contract version 36 matches production composition', /readonly version: 36;/.test(contract) && /version: 36 as const/.test(wiring)],
  ['scanner preserves the exact invocation judgment through action and integrated response paths', /actionJudgment\.judge\(\{[\s\S]*invocationJudgment,[\s\S]*judgeIntegratedResponse\(Object\.freeze\(\{[\s\S]*invocationJudgment,/.test(scanner)],
  ['executor remains a judgment forwarder and does not upgrade coverage', /controller_action_judgment_forwarded/.test(executor) && /semanticJudgment: input\.semanticJudgment/.test(wiring) && /never upgrades partial coverage/.test(executor)],
  ['no duplicate publication-remainder contract is exported', !/LaravelControllerActionSemanticPublicationRemainder/.test(index)],
  ['no relation/foundation or subscanner layer was added', !/types\/upstream\/(relation|foundation)|semantic\/(relation|foundation)|operations\/(relation|foundation)/.test(contract + wiring)],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.stdout.write('TRACE: resource binding judgment and canonical publication are already upstream-owned; remaining action migration debt includes source-evidence projection and legacy action derivation, not resource publication.\n');
process.exitCode = failures === 0 ? 0 : 1;
