const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const contract = read('packages/core/src/types/upstream/controllerVariableSemanticInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerVariableSemanticAuthority.ts');
const executor = read('packages/core/src/types/upstream/controllerVariableSemanticRuntimeExecutor.ts');
const semanticModel = read('packages/core/src/types/upstream/controllerDataflowInvocationSemanticModelInterface.ts');
const scannerBoundary = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const projection = read('packages/core/src/compiler/scanner/lexer/routeAst/phpControllerDataflowDefinitionProjectionAuthority.ts');
const test = read('packages/core/src/types/upstream/__test__/controllerVariableSemanticAuthority.phase1547.test.ts');
const packageJson = JSON.parse(read('package.json'));

check('existing semantic authority interface owns a closed declarative reasoning contract',
  contract.includes('readonly reasoning: ControllerVariableSemanticReasoningContract') &&
  contract.includes("readonly kind: 'controller_variable_semantic_reasoning_contract'") &&
  contract.includes('readonly closed: true'));
check('reasoning rules are data-only ADT variants and expose no executable applies/derive callbacks',
  contract.includes("readonly kind: 'parameter_binding_rule'") &&
  contract.includes("readonly kind: 'database_table_call_rule'") &&
  contract.includes("readonly kind: 'external_fallback_rule'") &&
  !authority.includes('SemanticDecisionContract<') &&
  !authority.includes('semanticDecisionAlgebra') &&
  !authority.includes('relationFirst') &&
  !authority.includes('semanticDecisionAlgebra') &&
  !authority.includes('if (') &&
  !authority.includes(' as '));
check('precedence and duplicate-binding cardinality are explicit in the contract',
  authority.includes('reasoningPrecedence') &&
  contract.includes('zero-continues;one-resolves;many-ambiguous') &&
  contract.includes('never-select-first'));
check('duplicate matching parameter bindings produce an explicit ambiguous semantic judgment',
  contract.includes("readonly kind: 'ambiguous'") &&
  contract.includes("readonly reason: 'parameter_binding'") &&
  authority.includes("kind: 'ambiguous'") &&
  authority.includes('candidates: parameter.candidates'));
check('parameter resolution collects all canonical-name matches rather than choosing the first',
  authority.includes('request.parameterBindings.filter(binding => variableNameEquals(binding.variable, evidence.variable))') &&
  !authority.includes('relationFirst') &&
  !authority.includes('semanticDecisionAlgebra') &&
  !authority.includes('if (') &&
  !authority.includes(' as '));
check('closed judgments retain the exact sourceExpression reference and integrated expression value',
  contract.includes('sourceExpression: Expression') &&
  contract.includes('expressionValue:') &&
  authority.includes('sourceExpression, evidence, closed: true'));
check('runtime executor forwards to the existing authority and identifies the declarative reasoning contract',
  executor.includes('authority.resolve(request)') &&
  executor.includes("reasoningContract: 'executes-the-existing-upstream-declarative-reasoning-contract'") &&
  contract.includes('readonly reasoningContract:'));
check('invocation semantic model contract includes the variable reasoning closure and current version 18',
  semanticModel.includes('readonly version: 18;') &&
  semanticModel.includes('  version: 18,') &&
  semanticModel.includes('variableSemanticReasoningClosure'));
check('Laravel scanner boundary version 109 preserves ambiguous outcomes without scanner-side reclassification',
  scannerBoundary.includes('readonly version: 109;') &&
  scannerBoundary.includes('  version: 109,') &&
  scannerBoundary.includes('duplicate-matching-parameter-bindings-remain-an-explicit-ambiguous-ADT-outcome'));
check('PHP definition projection remains a wiring adapter and delegates semantic resolution to the existing executor',
  projection.includes('dependencies.executor.execute') &&
  !projection.includes('parameterBindingOutcome') &&
  !projection.includes('databaseTableName'));
check('regression test covers declarative contract and duplicate-binding ambiguity',
  test.includes('publishes reasoning rules as declarative interface data') &&
  test.includes('explicit ambiguous judgment instead of choosing the first duplicate parameter binding'));
check('Phase 1947 audit is registered in package scripts',
  packageJson.scripts['audit:phase1947-controller-semantic-reasoning-interface-first'] === 'node scripts/audits/audit-phase1947-controller-semantic-reasoning-interface-first.cjs');

for (const result of checks) process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}\n`);
const passed = checks.filter((item) => item.passed).length;
const summary = { phase: 1947, audit: 'controller-semantic-reasoning-interface-first', passed, total: checks.length, checks };
fs.writeFileSync(path.join(root, 'PHASE1947_AUDIT.json'), `${JSON.stringify(summary, null, 2)}\n`);
process.stdout.write(`RESULT ${passed}/${checks.length}\n`);
if (passed !== checks.length) process.exitCode = 1;
