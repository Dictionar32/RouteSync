const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const contract = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const authority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts');
const integrationContract = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegrationInterface.ts');
const integrationAuthority = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegration.ts');
const scanner = read('packages/core/src/compiler/scanner/subscanners/responseScanner.ts');
const parser = read('packages/core/src/compiler/scanner/lexer/controllerBodyParser.ts');
const packageJson = JSON.parse(read('package.json'));

check('existing invocation judgment interface owns a declarative reasoning ADT',
  contract.includes('export type LaravelControllerInvocationSemanticReasoningRule =') &&
  contract.includes('export interface LaravelControllerInvocationSemanticReasoningContract') &&
  contract.includes('readonly reasoning: LaravelControllerInvocationSemanticReasoningContract'));
check('input absence is explicitly not-connected and cannot be promoted to an empty successful batch',
  contract.includes("readonly kind: 'pipeline_absent_rule'") &&
  contract.includes("readonly permittedOutcome: 'php_source_invocation_integration_not_connected'") &&
  contract.includes('readonly mayInferSuccessfulEmptyBatch: false'));
check('provided pipeline rule requires exact source binding before integration projection',
  contract.includes("readonly kind: 'pipeline_present_rule'") &&
  contract.includes('bind-controller-source-to-exact-whole-file-pipeline-result') &&
  contract.includes('derive-only-from-the-source-binding-judgment'));
check('response provenance and exact discriminated outcome are preserved by the contract',
  contract.includes("readonly kind: 'response_outcome_preservation_rule'") &&
  contract.includes('readonly outcomeKinds: readonly [') &&
  contract.includes('readonly reconstructProvenance: false') &&
  contract.includes('readonly widenResponseUnion: false'));
check('canonical contract version 10 embeds the exact reasoning contract executed by the authority instead of creating a parallel authority',
  contract.includes('readonly version: 11;') &&
  authority.includes('version: 11,') &&
  authority.includes('reasoning: LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_REASONING_CONTRACT') &&
  authority.includes('judge: createJudge(dependencies, contract.reasoning)') &&
  !authority.includes('createLaravelControllerInvocationSemanticReasoningAuthority'));
check('existing authority remains the sole interpreter and delegates source binding/integration to their owners',
  authority.includes('reasoning.rules.pipelineAbsent.integrationEvidenceKind') &&
  contract.includes('permittedOutcomes: PIPELINE_PRESENT_PERMITTED_OUTCOMES') &&
  contract.includes('outcomeKinds: INTEGRATED_RESPONSE_OUTCOME_KINDS') &&
  contract.includes('bind-controller-source-to-exact-whole-file-pipeline-result') &&
  authority.includes('dependencies.sourceBinding.bind') &&
  authority.includes('dependencies.integration.project') &&
  authority.includes('phpSourceInvocationPipelineEvidenceFromSourceBinding'));
check('judgment response remains outcome-indexed rather than widened to the full integration union',
  contract.includes("{ readonly kind: 'php_source_invocation_integration_not_connected' }") &&
  contract.includes("{ readonly kind: 'php_source_invocation_integration_source_binding_rejected' }") &&
  contract.includes("{ readonly kind: 'php_source_invocation_integration_complete' }") &&
  contract.includes("{ readonly kind: 'php_source_invocation_integration_blocked' }"));
check('integration interface already owns lossless evidence projection and distinct blocked/rejected outcomes',
  integrationContract.includes('readonly ruleOrder: readonly [') &&
  integrationContract.includes('rejectedEvidencePreservation') &&
  integrationContract.includes('sourceBindingPreservation') &&
  integrationAuthority.includes('php_source_invocation_integration_source_binding_rejected') &&
  integrationAuthority.includes('php_source_invocation_integration_blocked'));
check('scanner projection consumes a closed invocation judgment rather than declaring invocation semantics locally',
  scanner.includes("kind: 'invocation_semantic_judgment'") &&
  scanner.includes('invocationJudgment') &&
  parser.includes('LaravelControllerInvocationSemanticJudgmentInterface'));
check('contract rules account for every input variant and every integration outcome',
  contract.includes('all-input-variants-and-all-integrated-response-outcomes-are-accounted-for') &&
  contract.includes('readonly pipelineAbsent: Extract<LaravelControllerInvocationSemanticReasoningRule') && contract.includes('readonly pipelinePresent: Extract<LaravelControllerInvocationSemanticReasoningRule') && contract.includes('readonly responseOutcomePreservation: Extract<LaravelControllerInvocationSemanticReasoningRule'));
check('phase 1948 audit is registered',
  packageJson.scripts['audit:phase1948-invocation-semantic-reasoning-interface-first'] === 'node scripts/audits/audit-phase1948-invocation-semantic-reasoning-interface-first.cjs');

for (const result of checks) process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}\n`);
const passed = checks.filter((item) => item.passed).length;
const summary = { phase: 1948, audit: 'invocation-semantic-reasoning-interface-first', passed, total: checks.length, checks };
fs.writeFileSync(path.join(root, 'PHASE1948_AUDIT.json'), `${JSON.stringify(summary, null, 2)}\n`);
process.stdout.write(`RESULT ${passed}/${checks.length}\n`);
if (passed !== checks.length) process.exitCode = 1;
