const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const checks = [];
const assert = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const dependencies = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const coreIndex = read('packages/core/src/index.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
const constraintFacade = read('packages/core/src/compiler/scanner/lexer/routeAst/semanticConstraintCalculus.ts');
const packageJson = JSON.parse(read('package.json'));

assert('Laravel controller scanner consumes the exact judgment published upstream', /const semanticJudgment = actionPublication\.judgment/.test(scanner) && /contract: actionPublication\.projection, semanticJudgment \}/.test(scanner));
assert('scanner no longer dispatches through identity-only actionExecution', !/actionExecution\.execute/.test(scanner));
assert('controller dependency contract no longer injects actionExecution', !/readonly actionExecution:/.test(dependencies));
assert('identity-only action executor implementation is absent', !/controller_action_judgment_forwarded|target-runtime-operation-not-executed-by-this-boundary/.test(dependencies));
assert('redundant action execution interface file is removed', !exists('packages/core/src/types/upstream/laravelControllerActionExecutionInterface.ts'));
assert('removed interface is not exported from the public core entry', !/LaravelControllerActionExecution(Input|Result|Interface)/.test(coreIndex));
assert('removed interface is not exported from upstream barrel', !/laravelControllerActionExecutionInterface/.test(upstreamIndex));
assert('semantic constraint facade calls the upstream authority export directly', /export \{ solveSemanticConstraintProgram \} from .*semanticConstraintAuthority/.test(constraintFacade));
assert('redundant constraint runtime forwarding module is removed', !exists('packages/core/src/types/upstream/semanticConstraintRuntimeExecutor.ts') && !/semanticConstraintRuntimeExecutor/.test(upstreamIndex));
assert('phase audit is registered', packageJson.scripts['audit:phase2442-laravel-action-judgment-no-runtime-forwarder'] === 'node scripts/audits/audit-phase2442-laravel-action-judgment-no-runtime-forwarder.cjs');

for (const check of checks) console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}`);
console.log(`RESULT ${checks.filter(check => check.passed).length}/${checks.length}`);
if (checks.some(check => !check.passed)) process.exitCode = 1;
