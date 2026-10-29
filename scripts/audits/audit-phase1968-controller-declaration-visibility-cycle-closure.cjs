const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentInterface.ts');
const authorityPath = path.join(root, 'packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentAuthority.ts');
const scannerPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const testPath = path.join(root, 'packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentAuthority.phase1968.test.ts');
const contract = fs.readFileSync(contractPath, 'utf8');
const authority = fs.readFileSync(authorityPath, 'utf8');
const scanner = fs.readFileSync(scannerPath, 'utf8');
const test = fs.readFileSync(testPath, 'utf8');
const checks = [
  ['visibility is part of the upstream method evidence contract', /ControllerDeclarationMethodVisibility/.test(contract) && /readonly visibility: ControllerDeclarationMethodVisibility/.test(contract)],
  ['scanner projects parsed method visibility into semantic evidence', /visibility: method\.visibility/.test(scanner)],
  ['authority selects only public or implicit methods', /method\.visibility === 'public' \|\| method\.visibility === 'implicit'/.test(authority)],
  ['constructor exclusion remains upstream-owned', /method\.name\.value\.value !== '__construct'/.test(authority)],
  ['HasMiddleware static middleware exclusion remains upstream-owned', /method\.name\.value\.value === 'middleware'/.test(authority) && /method\.storage === 'static'/.test(authority) && /isHasMiddleware\(candidate\)/.test(authority)],
  ['cycle termination does not append the repeated parent to ancestry', /kind: 'inheritance_cycle', repeated: parentName/.test(authority) && /names: Object\.freeze\(\[\]\), attributes: Object\.freeze\(\[\]\), termination: Object\.freeze\(\{ kind: 'inheritance_cycle'/.test(authority)],
  ['focused regression test covers private and protected methods', /method\('internal', 'private'\)/.test(test) && /method\('protectedHelper', 'protected'\)/.test(test)],
  ['focused regression test covers cyclic ancestry closure', /closes a cyclic ancestry/.test(test) && /toEqual\(\['SecondController'\]\)/.test(test)],
  ['integrated invocation judgment remains passed unchanged to producer', /controllerProducer\.produce\(\{ declaration: declarationEvidence, invocationJudgment \}\)/.test(scanner)],
  ['no relation/foundation subscanner introduced', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/relation')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/foundation'))],
];
let failures = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failures += 1;
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
