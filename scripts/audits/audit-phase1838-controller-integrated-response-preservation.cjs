const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const collections = read('packages/core/src/types/upstream/collections.ts');
const pipelineInterface = read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const judgment = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const integrated = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegrationInterface.ts');
const packageJson = JSON.parse(read('package.json'));

check('SourceAsts requires the authority-closed invocation inventory', /controllerInvocationSemanticInventory: import\('\.\/laravelControllerInvocationSemanticJudgmentInventoryInterface'\)\.LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt/.test(collections));
check('pipeline preserves the exact receipt without reconstruction', /controllerInvocationSemanticInventory: invocationInventoryReceipt/.test(pipeline));
check('pipeline contract documents integrated-response preservation', /authority-closed controller invocation inventory[\s\S]*integrated response after AST projection/.test(pipelineInterface));
check('source-correlated judgment keeps identity and response together', /readonly sourceFile: SourceFile/.test(judgment) && /readonly response: Extract<PhpSourceInvocationSemanticPipelineIntegrationResult/.test(judgment) && /php_source_invocation_integration_blocked/.test(judgment));
check('integrated response remains a closed discriminated union', /php_source_invocation_integration_not_connected/.test(integrated) && /php_source_invocation_integration_source_binding_rejected/.test(integrated) && /php_source_invocation_integration_complete/.test(integrated) && /php_source_invocation_integration_blocked/.test(integrated));
check('pipeline does not reconstruct integrated responses from ASTs', !/controllerInvocationSemanticInventory:\s*.*map\(|controllerInvocationSemanticInventory:\s*.*reduce\(/.test(pipeline));
check('new contract does not depend on semantic foundation', !/semantic\/foundation/.test(collections + pipelineInterface + pipeline));
check('audit command registered', packageJson.scripts?.['audit:phase1838-controller-integrated-response-preservation'] === 'node scripts/audits/audit-phase1838-controller-integrated-response-preservation.cjs');

for (const result of checks) console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}`);
console.log(`${checks.filter(result => result.passed).length}/${checks.length} checks passed`);
if (checks.some(result => !result.passed)) process.exitCode = 1;
