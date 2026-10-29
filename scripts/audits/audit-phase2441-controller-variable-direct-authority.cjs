const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const checks = [];
const assert = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const projection = read('packages/core/src/compiler/frontend/php/routeAst/phpControllerDataflowDefinitionProjectionAuthority.ts');
const binding = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');
const contract = read('packages/core/src/types/upstream/controllerVariableSemanticInterface.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
const packageJson = JSON.parse(read('package.json'));
const authority = read('packages/core/src/types/upstream/controllerVariableSemanticAuthority.ts');
const typeDeriver = read('packages/core/src/compiler/scanner/operations/SemanticTypeDeriver.ts');
const typeAuthority = read('packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationAuthority.ts');
const typeIndex = read('packages/core/src/compiler/semantic/type-derivation/index.ts');
const typeContract = read('packages/core/src/types/upstream/semanticTypeDerivationInterface.ts');

assert('controller definition projection consumes the upstream semantic authority contract', /semanticAuthority: ControllerVariableSemanticAuthorityInterface/.test(projection));
assert('controller definition projection invokes authority.resolve directly', /dependencies\.semanticAuthority\.resolve\(/.test(projection) && !/dependencies\.executor\.execute\(/.test(projection));
assert('scanner wiring injects the authority rather than a runtime executor', /semanticAuthority: controllerVariableSemanticAuthority/.test(binding) && !/controllerVariableSemanticRuntimeExecutor|createControllerVariableSemanticRuntimeExecutor/.test(binding));
assert('runtime executor interface is removed from the upstream controller-variable contract', !/ControllerVariableSemanticRuntimeExecutorInterface/.test(contract));
assert('runtime executor implementation is removed', !exists('packages/core/src/types/upstream/controllerVariableSemanticRuntimeExecutor.ts'));
assert('removed executor is not exported from the upstream barrel', !/controllerVariableSemanticRuntimeExecutor/.test(upstreamIndex));
assert('authority remains the sole semantic resolver', /resolve,/.test(authority) && /controller_variable_semantic_authority/.test(authority));
assert('type derivation facade consumes the authority directly', /semanticTypeDerivationAuthority\.resolve\(/.test(typeDeriver) && !/runtimeExecutor|\.run\s*:/.test(typeDeriver));
assert('type derivation facade exposes a completed judgment instead of a no-argument run closure', /readonly judgment: SemanticTypeDerivationJudgment/.test(typeDeriver) && /judgment: semanticTypeDerivationAuthority\.resolve/.test(typeDeriver));
assert('type derivation proof admission belongs to upstream authority', /assertSemanticTypeDerivationJudgment\(request, deriveJudgment\(request\)\)/.test(typeAuthority));
assert('type derivation runtime wrapper, interface, and exports are removed', !exists('packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationRuntimeExecutor.ts') && !exists('packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationRuntime.ts') && !/SemanticTypeDerivationRuntimeExecutorInterface/.test(typeContract) && !/RuntimeExecutor/.test(typeIndex));
assert('audit command is registered', packageJson.scripts['audit:phase2441-controller-variable-direct-authority'] === 'node scripts/audits/audit-phase2441-controller-variable-direct-authority.cjs');

for (const check of checks) console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}`);
console.log(`RESULT ${checks.filter(check => check.passed).length}/${checks.length}`);
if (checks.some(check => !check.passed)) process.exitCode = 1;
