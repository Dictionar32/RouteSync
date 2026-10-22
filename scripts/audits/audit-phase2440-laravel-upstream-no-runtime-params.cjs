const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const checks = [];
const assert = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const requestContract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const requestPreparation = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationOperationPreparation.ts');
const authorityLowering = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts');
const routeScannerContract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const routeScanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const policyContract = read('packages/core/src/types/upstream/effectiveControllerActionPolicy.ts');
const policyResolver = read('packages/core/src/types/upstream/effectiveControllerActionPolicyResolver.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
const publicIndex = read('packages/core/src/index.ts');
const packageJson = JSON.parse(read('package.json'));

assert('RequestType derivation has no fake prepared-operation wrapper', !/RequestTypeDerivationPreparedOperation|prepared_request_type_derivation_operation/.test(requestContract + requestPreparation));
assert('RequestType preparation returns the closed semantic outcome directly', /readonly prepare: \(input: RequestTypeDerivationInput\) => RequestTypeDerivationRuntimeExecutionResult/.test(requestContract) && /prepare: \(input: RequestTypeDerivationInput\): RequestTypeDerivationRuntimeExecutionResult/.test(requestPreparation));
assert('RequestType runtime executor factory is removed instead of accepting operation/result', !exists('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationRuntimeExecutor.ts'));
assert('authority-backed lowering consumes upstream outcome directly', /const derivation = operationPreparation\.prepare\(input\)/.test(authorityLowering) && !/createRequestTypeDerivationRuntimeExecutor/.test(authorityLowering));
assert('Laravel route scanner depends on semantic authority, not parameterized runtime executor', /effectiveControllerActionPolicyAuthority: EffectiveControllerActionPolicySemanticAuthorityInterface/.test(routeScannerContract) && /effectiveControllerActionPolicyAuthority\.judge\(/.test(routeScanner));
assert('Laravel policy runtime executor contract is removed', !/EffectiveControllerActionPolicyRuntimeExecutorInterface|effective_controller_action_policy_runtime_executor/.test(policyContract + policyResolver + upstreamIndex));
assert('Laravel scanner contract version is synchronized', /readonly contractVersion: 33;/.test(routeScannerContract) && /contractVersion: 33,/.test(routeScanner));
assert('removed RequestType runtime executor is not publicly exported', !/RequestTypeDerivationRuntimeExecutorInterface|RequestTypeDerivationPreparedOperation/.test(publicIndex));
assert('audit command is registered', packageJson.scripts['audit:phase2440-laravel-upstream-no-runtime-params'] === 'node scripts/audits/audit-phase2440-laravel-upstream-no-runtime-params.cjs');

for (const check of checks) console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}`);
console.log(`RESULT ${checks.filter(check => check.passed).length}/${checks.length}`);
if (checks.some(check => !check.passed)) process.exitCode = 1;
