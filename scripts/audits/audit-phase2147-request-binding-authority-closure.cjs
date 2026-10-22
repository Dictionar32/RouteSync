const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const binding = read('packages/core/src/types/upstream/laravelControllerRequestSemanticBinding.ts');
const interfaceFile = read('packages/core/src/types/upstream/laravelControllerRequestSemanticBindingInterface.ts');
const authority = read('packages/core/src/types/upstream/laravelControllerRequestSemanticBindingAuthority.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const contract = read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const executor = read('packages/core/src/types/upstream/laravelControllerActionExecutionInterface.ts');
const index = read('packages/core/src/index.ts');
const checks = [
  ['request evidence carries a complete source parameter inventory', interfaceFile.includes("kind: 'controller_method_parameters'") && interfaceFile.includes('LaravelControllerRequestParameterEvidence[]') && interfaceFile.includes('LaravelControllerFormRequestBindingEvidence[]')],
  ['authority interface publishes the canonical request-binding judgment', /interface LaravelControllerRequestSemanticBindingAuthorityInterface[\s\S]*readonly judge: \(evidence: LaravelControllerRequestBindingEvidence\) => LaravelControllerRequestSemanticBinding/.test(interfaceFile)],
  ['existing phpParameterTypeAlgebra remains the only parameter type resolver', /phpParameterTypeAlgebra\.resolve\(parameter\.declaredType\)/.test(authority) && !/phpParameterTypeAlgebra/.test(wiring)],
  ['resolved outcome maps to typed request binding', /case 'resolved':[\s\S]*kind: 'typed', type: judgment\.expression/.test(authority)],
  ['unsupported and malformed outcomes remain typed_unresolved', /case 'unsupported':[\s\S]*case 'malformed':[\s\S]*kind: 'typed_unresolved', judgment/.test(authority) && /kind: 'typed_unresolved';\s*readonly judgment: UnresolvedPhpParameterTypeJudgment/.test(binding)],
  ['production composition adapts evidence and delegates semantic mapping', /LaravelControllerRequestBindingEvidence/.test(wiring) && /laravelControllerRequestSemanticBindingAuthority\.judge\(evidence\)/.test(wiring) && !/phpParameterTypeAlgebra\.resolve/.test(wiring)],
  ['remaining request-kind derivation debt is not falsely marked closed', /kind: 'legacy_schema_request_binding_compatibility'[\s\S]*currentOwner: 'legacy_controller_action_contract'[\s\S]*targetOwner: 'upstream_action_schema_evidence_authority'/.test(contract) && /legacy-schema-request-binding-compatibility-remains-open/.test(contract)],
  ['action semantic judgment contract version 18 matches composition', /readonly version: 18;/.test(contract) && /version: 18 as const/.test(wiring)],
  ['invocation judgment remains correlated across action and integrated response', /actionJudgment\.judge\(\{[\s\S]*invocationJudgment,[\s\S]*judgeIntegratedResponse\(Object\.freeze\(\{[\s\S]*invocationJudgment,/.test(scanner)],
  ['runtime executor forwards the same judgment without semantic reclassification', /readonly semanticJudgment: LaravelControllerActionSemanticJudgmentInterface/.test(executor) && /semanticJudgment: input\.semanticJudgment/.test(wiring)],
  ['new request-binding authority and evidence are publicly exported', /LaravelControllerRequestBindingEvidence/.test(index) && /LaravelControllerRequestSemanticBindingAuthorityInterface/.test(index) && /laravelControllerRequestSemanticBindingAuthority/.test(index)],
  ['legacy action derivation remains explicitly open', /scanControllerAction-and-resolveControllerActionContract/.test(wiring)],
  ['no relation/foundation or new subscanner layer was added', !/types\/upstream\/(relation|foundation)|semantic\/(relation|foundation)|subscanners\/(relation|foundation)/.test(interfaceFile + authority + wiring)],
];
let failed = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  failed += Number(!passed);
}
process.stdout.write(`Phase 2147: ${checks.length - failed}/${checks.length} passed\n`);
process.exitCode = failed ? 1 : 0;
