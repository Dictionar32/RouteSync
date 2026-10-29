const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (label, condition) => checks.push({ label, passed: Boolean(condition) });

const astRuntime = read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
const astPort = read('packages/core/src/types/upstream/astClassifierEvidenceContract.ts');
const expressionJudgment = read('packages/core/src/types/upstream/scannerExpressionJudgmentInterface.ts');
const invocationJudgment = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const scannerContract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const scannerWiring = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const trace = read('packages/core/src/types/upstream/docs/PHASE2022_INTERFACE_FIRST_NO_RELATION_AST_TRACE.md');

check('existing AST syntax port is identified as syntax-only', astPort.includes('AstClassifierEvidenceInterface') && astPort.includes('AstClassifierExpressionRequest'));
check('existing expression structure judgment is a closed ADT', expressionJudgment.includes('export type ExpressionStructureJudgment<') && expressionJudgment.includes("readonly kind: 'contract_violation'"));
check('AST legacy relation dependency is explicitly detected, not falsely marked migrated', astRuntime.includes('AST_CLASSIFICATION_RULES') && astRuntime.includes('RelationOption') && trace.includes('did **not** remove relation'));
check('invocation outcome ADT retains complete and blocked outcomes', invocationJudgment.includes('php_source_invocation_integration_complete') && invocationJudgment.includes('php_source_invocation_integration_blocked'));
check('Laravel scanner contract still requires the closed inventory receipt', /contractVersion: 26/.test(scannerContract) && scannerContract.includes('LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt'));
check('scanner wiring forwards exact invocation and response judgments to AST projection', scannerWiring.includes('judgment: invocationJudgment') && scannerWiring.includes('responseJudgment'));
check('no relation/foundation subscanner was added', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/relation')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/foundation')));
check('trace explicitly prohibits claiming relation-free AST prematurely', trace.includes('Do not describe AST as relation-free until'));

for (const item of checks) console.log(`${item.passed ? 'PASS' : 'FAIL'} ${item.label}`);
console.log(`\nPhase 2022 trace audit: ${checks.filter(item => item.passed).length}/${checks.length} passed`);
if (checks.some(item => !item.passed)) process.exitCode = 1;
