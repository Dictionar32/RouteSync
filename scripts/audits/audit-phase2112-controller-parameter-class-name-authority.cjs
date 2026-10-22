const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const interfacePath = path.join(root, 'packages/core/src/types/upstream/controllerParameterClassNameJudgmentInterface.ts');
const contractPath = path.join(root, 'packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts');
const actionScannerPath = path.join(root, 'packages/core/src/compiler/scanner/subscanners/controller/actionScanner.ts');
const wiringPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const executorPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/controllerParameterClassNameJudgmentExecutor.ts');
const upstreamBarrelPath = path.join(root, 'packages/core/src/types/upstream/index.ts');
const packageBarrelPath = path.join(root, 'packages/core/src/index.ts');
const interfaceSource = fs.readFileSync(interfacePath, 'utf8');
const contract = fs.readFileSync(contractPath, 'utf8');
const actionScanner = fs.readFileSync(actionScannerPath, 'utf8');
const wiring = fs.readFileSync(wiringPath, 'utf8');
const executor = fs.readFileSync(executorPath, 'utf8');
const upstreamBarrel = fs.readFileSync(upstreamBarrelPath, 'utf8');
const packageBarrel = fs.readFileSync(packageBarrelPath, 'utf8');

const checks = [
  ['upstream contract defines a closed reasoning contract', /ControllerParameterClassNameReasoningContract/u.test(interfaceSource) && /readonly authority: 'upstream'/u.test(interfaceSource) && /readonly closed: true/u.test(interfaceSource)],
  ['rule vocabulary distinguishes model class, request, table, and non-class origins', /model_class_name_rule/u.test(interfaceSource) && /request_class_name_rule/u.test(interfaceSource) && /table_origin_non_class_rule/u.test(interfaceSource) && /non_class_expression_rule/u.test(interfaceSource)],
  ['resolved judgment carries the existing ClassName domain type', /readonly name: ClassName/u.test(interfaceSource) && !/readonly name: string/u.test(interfaceSource)],
  ['unresolved judgment preserves distinct semantic reasons', /readonly reason: 'table_origin' \| 'expression_origin' \| 'external_origin'/u.test(interfaceSource)],
  ['resolver context requires the judgment interface', /parameterClassNameJudgment: ControllerParameterClassNameJudgmentInterface/u.test(contract)],
  ['resolver no longer owns a duplicate class-name classifier', !/function controllerParameterClassName\(/u.test(contract)],
  ['constructor dependency resolution consumes the injected authority', /classNameJudgment\.judge\(parameter\.semantic\)/u.test(contract)],
  ['method dependency resolution consumes the injected authority', (contract.match(/classNameJudgment\.judge\(parameter\.semantic\)/gu) || []).length === 2],
  ['action scanner forwards the authority into the canonical resolver', /parameterClassNameJudgment,/u.test(actionScanner) && /parameterClassNameJudgment:\s*ControllerParameterClassNameJudgmentInterface/u.test(contract)],
  ['production wiring owns the executable implementation', /controllerParameterClassNameJudgmentAuthority/u.test(wiring) && /controller_parameter_class_name_judgment_authority/u.test(executor)],
  ['production authority covers every semantic origin through discriminants', /case 'model_origin'/u.test(executor) && /case 'request_origin'/u.test(executor) && /case 'expression'/u.test(executor) && /case 'external'/u.test(executor)],
  ['upstream barrel exports the interface contract', /export \* from '\.\/controllerParameterClassNameJudgmentInterface'/u.test(upstreamBarrel)],
  ['package barrel exports the public judgment contract', /ControllerParameterClassNameJudgmentInterface/u.test(packageBarrel)],
  ['resolver keeps semantic/relations and foundation out of direct imports', !/from\s+['"][^'"]*semantic\/(?:relations|foundation)\//u.test(contract)],
];

let passed = 0;
for (const [label, result] of checks) {
  process.stdout.write(`${result ? 'PASS' : 'FAIL'} ${label}\n`);
  passed += Number(result);
}
process.stdout.write(`\nPhase 2112 audit: ${passed}/${checks.length} checks passed.\n`);
if (passed !== checks.length) process.exitCode = 1;
