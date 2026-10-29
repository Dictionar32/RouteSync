const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const resolution = read('packages/core/src/types/upstream/phpFunctionNameResolutionInterface.ts');
const invocation = read('packages/core/src/types/upstream/phpFunctionInvocationSemanticAuthorityInterface.ts');
const composition = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const runtime = read('packages/core/src/types/upstream/invocationSemanticPipeline.ts');
const scanner = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');

check('name-resolution contract advanced to v3', /kind: 'php_function_name_resolution_contract';\s*readonly version: 3/.test(resolution) && /version: 3/.test(resolution));
check('resolution requires source/environment file identity', /require-source-file-and-environment-file-identity/.test(resolution) && /sourceFileBinding: 'resolution-source-file-must-match-the-environment-source-file-and-completeness-witness'/.test(resolution));
check('builtin classification is based on canonical global identity', /classify-builtin-only-after-canonical-global-function-identity/.test(resolution) && /never-infer-function-target-from-short-name-alone/.test(resolution));
check('invocation judgment preserves resolved and unresolved outcomes', /kind: 'php_function_invocation_resolved'/.test(invocation) && /kind: 'php_function_invocation_unresolved'/.test(invocation));
check('batch contract requires a complete source inventory', /interface PhpFunctionInvocationSourceInventoryCompletenessWitness/.test(invocation) && /all-php-function-call-nodes-inventoried/.test(invocation));
check('batch contract binds inventory and environment to one source file', /inventorySourceBinding: 'inventory-source-file-matches-every-entry-and-the-completeness-witness'/.test(invocation) && /environmentSourceBinding: 'every-entry-resolution-environment-is-bound-to-the-inventory-source-file'/.test(invocation));
check('batch contract requires total one-to-one judgment correspondence', /totalCorrespondence: 'every-inventory-entry-has-exactly-one-judgment-and-every-judgment-belongs-to-one-inventory-entry'/.test(invocation));
check('integrated response contract exposes batch coverage and source binding', /readonly version: 11/.test(composition) && /phpFunctionInvocationCoverage/.test(composition) && /phpFunctionInvocationSourceBinding/.test(composition));
check('integrated response embeds publication and PHP judgment batch in one aggregate', /interface InvocationSemanticIntegratedResponse \{[\s\S]*?readonly publication: InvocationSemanticCoveragePublicationResult;[\s\S]*?readonly phpFunctionInvocations: PhpFunctionInvocationSemanticJudgmentBatch;/.test(composition) && /phpFunctionInvocationKnowledgeBinding/.test(composition));
check('composition forwards the exact batch without reclassification', /phpFunctionInvocations: input\.phpFunctionInvocations/.test(runtime) && /phpFunctionInvocations: PhpFunctionInvocationSemanticJudgmentBatch/.test(composition));
check('Laravel scanner migration gap is explicitly detected, not concealed', /integrate\(\{ knowledge: semanticKnowledgeDataFlow \}\)/.test(scanner) && !/phpFunctionInvocations/.test(scanner));
check('composition executor migration gap is explicitly detected, not concealed', /const response: InvocationSemanticIntegratedResponse = dependencies\.publicationAuthority\.publish/.test(runtime) && /phpFunctionInvocations: input\.phpFunctionInvocations/.test(runtime));

for (const result of checks) process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}\n`);
const failed = checks.filter((result) => !result.passed);
process.stdout.write(`\n${checks.length - failed.length}/${checks.length} interface audit checks passed.\n`);
process.stdout.write('Known migration blockers: Laravel scanner does not yet supply the required PHP invocation judgment batch; composition executor still returns the publication result as response instead of the new aggregate contract.\n');
if (failed.length) process.exitCode = 1;
