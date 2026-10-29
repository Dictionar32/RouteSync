const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionContract.ts');
const scannerPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const wiringPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const judgmentPath = path.join(root, 'packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const classNameJudgmentPath = path.join(root, 'packages/core/src/types/upstream/controllerParameterClassNameJudgmentInterface.ts');
const classNameExecutorPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/controllerParameterClassNameJudgmentExecutor.ts');
const contract = fs.readFileSync(contractPath, 'utf8');
const scanner = fs.readFileSync(scannerPath, 'utf8');
const wiring = fs.readFileSync(wiringPath, 'utf8');
const judgment = fs.readFileSync(judgmentPath, 'utf8');
const classNameJudgment = fs.readFileSync(classNameJudgmentPath, 'utf8');
const classNameExecutor = fs.readFileSync(classNameExecutorPath, 'utf8');

const checks = [
  ['canonical action resolver has no direct semantic/relations import', !/from\s+['"][^'"]*semantic\/relations\//u.test(contract)],
  ['canonical action resolver has no relation-algebra calls', !/\brelation(?:Any|Equal|Gate|Project|Select|OptionFold|FirstOption|Some|None|Contains|VariantValue|IndexLookup)\s*\(/u.test(contract)],
  ['request index is expressed as immutable typed source tuples', /formRequestIndex:\s*readonly\s*\(readonly\s*\[string,\s*FormRequestSource\]\)\[\]/u.test(contract)],
  ['contextual attribute evidence is a typed source collection', /customContextualAttributeNames\?:\s*readonly\s*string\[\]/u.test(contract)],
  ['parameter class interpretation is an upstream discriminated judgment carrying ClassName', /export type ControllerParameterClassNameJudgment\s*=/.test(classNameJudgment) && /readonly name: ClassName/u.test(classNameJudgment) && /controller_parameter_class_name_unresolved/u.test(classNameJudgment)],
  ['resolved class-name judgment preserves the existing nominal type through dependency construction', /name: createClassName\(semantic\.origin\.name\.value\.value\)/u.test(classNameExecutor) && /type: typeJudgment\.name/u.test(contract) && !/type: createClassName\(typeJudgment\.name\)/u.test(contract)],
  ['contextual attribute interpretation has a discriminated judgment', /type ControllerContextualAttributeJudgment\s*=\s*\n\s*\|\s*\{ readonly kind: 'controller_contextual_attribute_resolved'/u.test(contract) && /controller_contextual_attribute_unresolved/u.test(contract)],
  ['parameter semantic variants are handled by the injected judgment authority', /classNameJudgment\.judge\(parameter\.semantic\)/u.test(contract) && /switch\s*\(semantic\.kind\)/u.test(classNameExecutor) && /case 'model_origin'/u.test(classNameExecutor) && /case 'request_origin'/u.test(classNameExecutor)],
  ['PHP attribute arguments preserve positional, unpacked, and named variants', /case 'positional'/u.test(contract) && /case 'unpacked'/u.test(contract) && /case 'named'/u.test(contract)],
  ['request lookup consumes typed tuples without RelationIndex helpers', /formRequestIndex\.find\(entry => Object\.is\(entry\[0\], name\)\)/u.test(contract) && !/relationIndexLookup/u.test(contract)],
  ['canonical contract no longer emits compatibility action descriptor', !/ScannedControllerActionDescriptor/u.test(contract)],
  ['scanner still receives judgment and execution through interfaces', /executionDependencies\.actionJudgment\.judge\(/u.test(scanner) && /executionDependencies\.actionExecution\.execute\(/u.test(scanner)],
  ['legacy composition seam is documented rather than falsely declared retired', /scanControllerAction/u.test(wiring) && /migration seam/u.test(wiring) && /ControllerActionSemanticJudgment/u.test(judgment) && /compatibilityDescriptor/u.test(wiring) === false],
];

let passed = 0;
for (const [label, result] of checks) {
  process.stdout.write(`${result ? 'PASS' : 'FAIL'} ${label}\n`);
  passed += Number(result);
}
process.stdout.write(`\nPhase 2110 audit: ${passed}/${checks.length} checks passed.\n`);
if (passed !== checks.length) process.exitCode = 1;
