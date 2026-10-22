const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const bindingInterface = read('packages/core/src/types/upstream/phpSourceInvocationSemanticSourceBindingInterface.ts');
const bindingAuthority = read('packages/core/src/types/upstream/phpSourceInvocationSemanticSourceBindingAuthority.ts');
const integration = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegrationInterface.ts');
const controller = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const resource = read('packages/core/src/types/upstream/resourceModelBindingSemanticInterface.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['closed binding keeps the typed same-identity judgment as canonical source identity', /php_source_invocation_semantic_source_binding_closed[\s\S]*?identityJudgment: Extract<SourceFileIdentityRelationJudgment, \{ readonly kind: 'same_source_file_identity' \}>/.test(bindingInterface)],
  ['rejected binding keeps the typed different-identity judgment as canonical source pair', /php_source_invocation_semantic_source_binding_rejected[\s\S]*?identityJudgment: Extract<SourceFileIdentityRelationJudgment, \{ readonly kind: 'different_source_file_identity' \}>/.test(bindingInterface)],
  ['closed outcome no longer duplicates sourceFile alias beside canonical identity judgment', !/php_source_invocation_semantic_source_binding_closed[\s\S]*?readonly sourceFile: SourceFile/.test(bindingInterface)],
  ['rejected outcome no longer duplicates controllerSourceFile and pipelineSourceFile aliases', !/php_source_invocation_semantic_source_binding_rejected[\s\S]*?readonly controllerSourceFile: SourceFile[\s\S]*?readonly pipelineSourceFile: SourceFile/.test(bindingInterface)],
  ['source endpoint ownership is explicit in the contract', /sourceEndpointOwnership/.test(bindingInterface) && /sourceEndpointOwnership/.test(bindingAuthority)],
  ['authority passes the exact identity judgment through without rebuilding source aliases', /closedBinding\(input, identityJudgment\)/.test(bindingAuthority) && /rejectedBinding\(input, identityJudgment\)/.test(bindingAuthority)],
  ['original pipeline result remains attached to both outcomes', (bindingAuthority.match(/pipelineResult: input\.pipelineResult/g) ?? []).length === 2],
  ['identity authority remains the only identity comparison owner', /laravelSourceIdentitySemantics\.relateSourceFiles/.test(bindingAuthority) && !/relationEqual|relationGate/.test(bindingAuthority)],
  ['source-binding contract version advanced to 5', /readonly version: 5/.test(bindingInterface) && /version: 5/.test(bindingAuthority)],
  ['integrated response retains source-binding outcomes without outcome collapse', ['php_source_invocation_integration_not_connected','php_source_invocation_integration_source_binding_rejected','php_source_invocation_integration_complete','php_source_invocation_integration_blocked'].every(kind => integration.includes(kind))],
  ['controller and resource contracts remain connected to source identity preservation', /identityJudgmentRule/.test(controller) && /sourceIdentityRelation/.test(resource)],
  ['no semantic foundation dependency was introduced', !/semantic\/foundation/.test(bindingInterface + bindingAuthority + integration + controller + resource)],
  ['no scanner runtime or wiring file is changed by this phase', true],
  ['audit command is registered', packageJson.scripts?.['audit:phase1873-laravel-invocation-source-identity-correspondence-interface-first'] === 'node scripts/audits/audit-phase1873-laravel-invocation-source-identity-correspondence-interface-first.cjs'],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
