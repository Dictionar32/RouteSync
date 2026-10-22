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
const packageJson = JSON.parse(read('package.json'));
const controllerDir = 'packages/core/src/compiler/scanner/subscanners/controller';
const checks = [
  ['source judgment owns expression-vocabulary value in the same closed union', /ControllerVariableResolvedSemanticJudgment/.test(contract) && /readonly expressionValue: Extract<SemanticValue, \{ readonly kind: 'reference' \}>/.test(contract) && /readonly expressionValue: Extract<SemanticValue, \{ readonly kind: 'unresolved' \}>/.test(contract)],
  ['resolved source judgment retains rule, semantic, evidence and expression value', /kind: 'resolved'[\s\S]*readonly rule: ControllerVariableSemanticRuleId[\s\S]*readonly semantic: Extract<ControllerVariableSemantic, \{ readonly kind: 'model_origin' \}>[\s\S]*readonly expressionValue: Extract<SemanticValue, \{ readonly kind: 'reference' \}>[\s\S]*readonly evidence: ControllerVariableSemanticEvidence[\s\S]*readonly closed: true/.test(contract)],
  ['unresolved and contract-violation outcomes retain closed expression values', /kind: 'not_resolved'[\s\S]*expressionValue/.test(contract) && /kind: 'contract_violation'[\s\S]*expressionValue/.test(contract)],
  ['upstream semantic authority derives the integrated expression value', /resolvedJudgment\(rule, judgment\.value, request\.evidence\)/.test(authority) && /expressionValue: unresolvedUnsupported/.test(authority)],
  ['canonicalizer reads semanticResolution and forwards its integrated expression value', /definition => definition\.semanticResolution/.test(canonical) && /judgment => judgment\.expressionValue/.test(canonical)],
  ['canonicalizer no longer owns or invokes a parallel projection authority', !/controllerVariableSemanticValueProjectionAuthority/.test(canonical) && !/semanticProjection/.test(canonical)],
  ['generic sidecar projection property removed from resolved expression contract', /export type ResolvedExpression = \{ readonly kind: 'resolved_expression'; readonly expression: Expression; readonly result: SemanticValue \}/.test(expressionTypes) && !/semanticProjection: Projection/.test(expressionTypes)],
  ['parallel projection authority files are retired', !exists('packages/core/src/types/upstream/controllerVariableSemanticValueProjectionInterface.ts') && !exists('packages/core/src/types/upstream/controllerVariableSemanticValueProjectionAuthority.ts')],
  ['parallel projection authority is not re-exported', !/controllerVariableSemanticValueProjection/.test(upstreamBarrel)],
  ['previously emptied controller modules remain empty', fs.statSync(path.join(root, controllerDir, 'actionVariableTracker.ts')).size === 0 && fs.statSync(path.join(root, controllerDir, 'controllerErrorDetector.ts')).size === 0],
  ['no semantic/foundation dependency was introduced', !/semantic\/foundation/.test(contract + authority + canonical)],
  ['historical phase audit remains registered', packageJson.scripts['audit:phase1882-laravel-controller-variable-semantic-projection-interface-first'] === 'node scripts/audits/audit-phase1882-laravel-controller-variable-semantic-projection-interface-first.cjs'],
];
const failed = checks.filter(([, pass]) => !pass);
for (const [name, pass] of checks) process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.length - failed.length}/${checks.length}\n`);
if (failed.length) process.exitCode = 1;
