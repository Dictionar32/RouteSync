const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (label, condition) => checks.push({ label, passed: Boolean(condition) });

const astRuntime = read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
const invocationJudgment = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const invocationExecutor = read('packages/core/src/types/upstream/invocationSemanticRuntimeExecutor.ts');
const scannerContract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const responsePipeline = read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts');
const astRuleAlgebra = read('packages/core/src/types/upstream/astClassifierRuleAlgebra.ts');

check('AST expression policy is a stable module-level ordered rule set', /const AST_CLASSIFICATION_RULES\s*:\s*readonly AstClassificationRule/.test(astRuntime));
check('AST policy is not reconstructed for every token input', !/createAstClassificationContract/.test(astRuntime));
check('AST policy verifies canonical upstream precedence', /verifyPrecedence\(AST_CLASSIFICATION_RULES, SCANNER_AST_EXPRESSION_PRECEDENCE\)/.test(astRuntime));
check('AST rule applicability reads current typed candidate evidence', /applies:\s*\(input\).*input\.candidates\.some/.test(astRuntime));
check('AST closed judgment proof is verified by the existing rule algebra', /verifyJudgment\(AST_CLASSIFICATION_RULES, judgment\)/.test(astRuntime) && astRuleAlgebra.includes('ordered_rule_selection_proof'));
check('AST rule algebra does not depend on relation helpers', !astRuleAlgebra.includes('semantic/relations') && !astRuleAlgebra.includes('RelationOption'));
check('AST semantic-decision callback contract was removed from expression policy', !astRuntime.includes('SemanticDecisionContract') && !astRuntime.includes('semanticDecisionAlgebra.resolve'));
check('Legacy parser results are isolated behind a documented adapter', /resolveFromRelation/.test(astRuntime) && /legacy RelationOption adapter/.test(astRuntime));
check('Invocation remains one canonical outcome-indexed judgment ADT', /export type LaravelControllerInvocationSemanticJudgmentInterface\s*=/.test(invocationJudgment) && invocationJudgment.includes('php_source_invocation_integration_complete') && invocationJudgment.includes('php_source_invocation_integration_blocked'));
check('Invocation runtime executor delegates to the existing authority', /execute:\s*\(input: InvocationSemanticInput\): InvocationSemanticJudgment => authority\.analyze\(input\)/.test(invocationExecutor));
check('Laravel scanner consumes closed invocation inventory receipt', /readonly invocationInventory: LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt/.test(scannerContract));
check('Response pipeline consumes the canonical invocation judgment', /LaravelControllerInvocationSemanticJudgmentInterface/.test(responsePipeline));
check('No relation/foundation subscanner was introduced', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/relation')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/foundation')));

for (const item of checks) console.log(`${item.passed ? 'PASS' : 'FAIL'} ${item.label}`);
console.log(`\nPhase 2021 audit: ${checks.filter(item => item.passed).length}/${checks.length} passed`);
if (checks.some(item => !item.passed)) process.exitCode = 1;
