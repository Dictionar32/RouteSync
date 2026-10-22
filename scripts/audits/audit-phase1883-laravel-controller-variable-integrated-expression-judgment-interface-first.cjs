const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const contract = read('packages/core/src/types/upstream/controllerVariableSemanticInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerVariableSemanticAuthority.ts');
const canonical = read('packages/core/src/compiler/scanner/subscanners/controller/controllerAstCanonical.ts');
const expressionTypes = read('packages/core/src/types/upstream/expression.ts');
const upstreamBarrel = read('packages/core/src/types/upstream/index.ts');
const test = read('packages/core/src/types/upstream/__test__/controllerVariableSemanticAuthority.phase1547.test.ts');
const packageJson = JSON.parse(read('package.json'));
const controllerDir = 'packages/core/src/compiler/scanner/subscanners/controller';
const checks = [
  ['source judgment is the owner of the integrated expression value', /ControllerVariableResolvedSemanticJudgment/.test(contract) && /readonly expressionValue: Extract<SemanticValue, \{ readonly kind: 'reference' \}>/.test(contract)],
  ['authority and runtime executor expose the integrated judgment contract', /judgmentContract: 'semantic_and_expression_value_are_integrated'/.test(contract) && /judgmentContract: 'semantic_and_expression_value_are_integrated'/.test(authority) && /judgmentContract: 'semantic_and_expression_value_are_integrated'/.test(read('packages/core/src/types/upstream/controllerVariableSemanticRuntimeExecutor.ts'))],
  ['all judgment outcomes retain a closed expression value', /kind: 'resolved'[\s\S]*expressionValue/.test(contract) && /kind: 'not_resolved'[\s\S]*expressionValue/.test(contract) && /kind: 'contract_violation'[\s\S]*expressionValue/.test(contract)],
  ['resolved judgment is a correlated union keyed by semantic kind', /ControllerVariableResolvedSemanticJudgment/.test(contract) && /semantic: Extract<ControllerVariableSemantic, \{ readonly kind: 'model_origin' \}>[\s\S]*expressionValue: Extract<SemanticValue, \{ readonly kind: 'reference' \}>/.test(contract) && /semantic: Extract<ControllerVariableSemantic, \{ readonly kind: 'expression' \}>[\s\S]*reason: 'unsupported'/.test(contract)],
  ['upstream authority derives expression value before publishing the judgment', /resolvedJudgment\(rule, judgment\.value, request\.evidence\)/.test(authority) && /expressionValue: unresolvedUnsupported/.test(authority)],
  ['model origin maps to a typed reference value', /case 'model_origin':[\s\S]*kind: 'reference'[\s\S]*kind: 'domain_type_name'/.test(authority)],
  ['request origin maps to a typed reference value', /case 'request_origin':[\s\S]*kind: 'reference'[\s\S]*kind: 'domain_type_name'/.test(authority)],
  ['expression and external outcomes remain explicit unresolved values', /case 'expression':[\s\S]*unresolvedUnsupported/.test(authority) && /case 'external':[\s\S]*unresolvedExternal/.test(authority)],
  ['canonicalizer projects directly from the existing judgment', /definition => definition\.semanticResolution/.test(canonical) && /judgment => judgment\.expressionValue/.test(canonical)],
  ['canonicalizer no longer builds a parallel projection judgment', !/semanticProjection/.test(canonical) && !/controllerVariableSemanticValueProjectionAuthority/.test(canonical)],
  ['resolved expression has no generic sidecar projection slot', /export type ResolvedExpression = \{ readonly kind: 'resolved_expression'; readonly expression: Expression; readonly result: SemanticValue \}/.test(expressionTypes) && !/semanticProjection: Projection/.test(expressionTypes)],
  ['parallel projection authority files are removed', !exists('packages/core/src/types/upstream/controllerVariableSemanticValueProjectionInterface.ts') && !exists('packages/core/src/types/upstream/controllerVariableSemanticValueProjectionAuthority.ts')],
  ['upstream barrel does not re-export the retired parallel projection', !/controllerVariableSemanticValueProjection/.test(upstreamBarrel)],
  ['focused authority test asserts integrated expression value', /returns expression vocabulary as part of the same closed model judgment/.test(test)],
  ['previously emptied controller files remain empty', fs.statSync(path.join(root, controllerDir, 'actionVariableTracker.ts')).size === 0 && fs.statSync(path.join(root, controllerDir, 'controllerErrorDetector.ts')).size === 0],
  ['no semantic/foundation dependency was introduced', !/semantic\/foundation/.test(contract + authority + canonical)],
  ['phase 1883 audit is registered in package.json', packageJson.scripts['audit:phase1883-laravel-controller-variable-integrated-expression-judgment-interface-first'] === 'node scripts/audits/audit-phase1883-laravel-controller-variable-integrated-expression-judgment-interface-first.cjs'],
];
const failed = checks.filter(([, pass]) => !pass);
for (const [name, pass] of checks) process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.length - failed.length}/${checks.length}\n`);
if (failed.length) process.exitCode = 1;
