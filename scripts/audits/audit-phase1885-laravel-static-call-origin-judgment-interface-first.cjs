const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const contract = read('packages/core/src/types/upstream/controllerStaticCallOriginInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerStaticCallOriginAuthority.ts');
const consumer = read('packages/core/src/compiler/scanner/subscanners/controller/controllerDataflowContract.ts');
const resourceAuthority = read('packages/core/src/types/upstream/controllerResourceBindingAuthority.ts');
const barrel = read('packages/core/src/types/upstream/index.ts');
const scannerBoundary = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const scannerImplementation = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const packageJson = JSON.parse(read('package.json'));
const controllerDir = 'packages/core/src/compiler/scanner/subscanners/controller';
const checks = [
  ['static-call origin has a dedicated upstream authority interface', /ControllerStaticCallOriginAuthorityInterface/.test(contract) && /judge: \(input: ControllerStaticCallOriginInput\) => ControllerStaticCallOriginJudgment/.test(contract)],
  ['input is a typed source-evidence contract rather than a scanner AST dependency', /ControllerStaticCallOriginInput/.test(contract) && /ClassName/.test(contract) && /MethodName/.test(contract) && !/PhpAstValue/.test(contract)],
  ['judgment correlates database-table and model-class origins with exact rules', /database_facade_table_literal/.test(contract) && /static_class_model_origin/.test(contract) && /kind: 'unresolved'/.test(contract)],
  ['upstream authority owns DB::table recognition', /databaseFacadeTableCall/.test(authority) && /database_facade_table_literal/.test(authority) && /controllerStaticCallOriginAuthority/.test(authority)],
  ['non-static or missing DB table argument is unresolved rather than mislabeled as DB model', /database_table_argument_absent/.test(authority) && /database_table_argument_not_static_string/.test(authority)],
  ['scanner projects static-call origin input while resource authority composes the existing origin authority upstream', /static_call_origin_input' as const, input: staticCallOriginInput\(candidate, modelClasses\)/.test(consumer) && /controllerStaticCallOriginAuthority\.judge\(evidence\.input\)/.test(resourceAuthority) && !/controllerStaticCallOriginAuthority/.test(consumer)],
  ['unresolved static-call origin remains closed inside the resource model-origin judgment', /static_call_origin_input/.test(consumer) && /case 'unresolved':[\s\S]*?kind: 'unresolved', closed: true/.test(resourceAuthority)],
  ['AST adapter preserves positional string-literal evidence without type assertions', /positional_string_literal/.test(consumer) && /staticCallPositionalValueEvidence/.test(consumer) && !/ as Extract<PhpAstValue/.test(consumer)],
  ['upstream barrel exports the authority contract and implementation', /export \* from '\.\/controllerStaticCallOriginInterface'/.test(barrel) && /export \{ controllerStaticCallOriginAuthority \}/.test(barrel)],
  ['Laravel controller scanner contract versions are advanced consistently', (scannerBoundary.match(/readonly contractVersion: 26;/g) || []).length === 2 && (scannerImplementation.match(/contractVersion: 26,/g) || []).length === 2 && /readonly version: 109/.test(scannerBoundary) && /version: 109,/.test(scannerBoundary)],
  ['previously emptied controller files remain empty', fs.statSync(path.join(root, controllerDir, 'actionVariableTracker.ts')).size === 0 && fs.statSync(path.join(root, controllerDir, 'controllerErrorDetector.ts')).size === 0],
  ['no semantic/foundation dependency was introduced', !/semantic\/foundation/.test(contract + authority + consumer)],
  ['audit is registered in package.json', packageJson.scripts['audit:phase1885-laravel-static-call-origin-judgment-interface-first'] === 'node scripts/audits/audit-phase1885-laravel-static-call-origin-judgment-interface-first.cjs'],
  ['no local DB::table origin classifier remains in the controller dataflow contract', !/const tableCandidate = relationGate/.test(consumer) && !/Object\.is\(value\.className, 'DB'\)/.test(consumer)],
];
const failed = checks.filter(([, pass]) => !pass);
for (const [name, pass] of checks) process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.length - failed.length}/${checks.length}\n`);
if (failed.length) process.exitCode = 1;
