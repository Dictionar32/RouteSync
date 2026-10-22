const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const values = read('src/types/upstream/valueObjects.ts');
const names = read('src/types/upstream/names.ts');
const authority = read('src/types/upstream/controllerResourceBindingAuthority.ts');
const wiring = read('src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const checks = [
  ['duplicate StringValueEqualityInterface removed', !/StringValueEqualityInterface|stringValueEquality/.test(values)],
  ['existing class-name equality owner retained', /classNameEquals = .*Object\.is/.test(names)],
  ['existing variable-name equality owner retained', /variableNameEquals = .*Object\.is/.test(names)],
  ['existing model/class identity owner retained', /modelNameMatchesClassName = .*Object\.is/.test(names)],
  ['method-name equality is a typed operation on existing Name owner', /methodNameEquals = .*Object\.is/.test(names) && /methodNameEquals\(rule\.methodName, candidate\.methodName\)/.test(authority)],
  ['names owner has no relation/foundation dependency', !/semantic\/(relations|foundation)\//.test(names)],
  ['resource binding authority has no relation/foundation dependency', !/semantic\/(relations|foundation)\//.test(authority)],
  ['canonical resource publication still belongs to existing authority', /publishResolved/.test(authority)],
  ['integrated response remains owned by existing response pipeline', /LaravelControllerResponseSemanticPipelineInterface/.test(read('src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts'))],
  ['CLI wiring still exposes remaining action/body subscanner debt', /scanControllerAction/.test(wiring) && /controllerBodySemanticJudgmentAuthority/.test(wiring) && /subscanners\/controller/.test(wiring)],
  ['regression test exercises typed method-name equality', fs.existsSync(path.join(root, 'src/types/upstream/__tests__/controller-resource-binding-no-relation-authority.phase2235.test.ts'))],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`${checks.filter(([, passed]) => passed).length}/${checks.length} structural checks passed\n`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
