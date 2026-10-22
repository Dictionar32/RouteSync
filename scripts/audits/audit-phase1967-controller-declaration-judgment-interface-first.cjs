const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const scannerPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const contractPath = path.join(root, 'packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentInterface.ts');
const authorityPath = path.join(root, 'packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentAuthority.ts');
const scannerInterfacePath = path.join(root, 'packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const scanner = fs.readFileSync(scannerPath, 'utf8');
const contract = fs.readFileSync(contractPath, 'utf8');
const authority = fs.readFileSync(authorityPath, 'utf8');
const scannerInterface = fs.readFileSync(scannerInterfacePath, 'utf8');
const checks = [
  ['upstream judgment interface exists', fs.existsSync(contractPath)],
  ['upstream judgment authority exists', fs.existsSync(authorityPath)],
  ['judgment contract is closed', /readonly closed:\s*true/.test(contract)],
  ['action selection is represented in judgment', /readonly actionMethods: readonly TMethod\[\]/.test(contract)],
  ['ancestry termination is a discriminated union', /parent_outside_inventory/.test(contract) && /inheritance_cycle/.test(contract) && /root_reached/.test(contract)],
  ['middleware attribute inheritance is represented in judgment', /inheritedMiddlewareAttributes/.test(contract)],
  ['authority owns constructor and HasMiddleware action selection', /__construct/.test(authority) && /HasMiddleware/.test(authority)],
  ['authority owns ancestry traversal', /ancestryFor/.test(authority) && /parent_outside_inventory/.test(authority)],
  ['scanner interface exposes injected authority', /declarationSemanticJudgmentAuthority:\s*ControllerDeclarationSemanticJudgment/.test(scannerInterface)],
  ['scanner factory wires the authority', /createLaravelControllerScanner/.test(scanner) && /scan: input => scanLaravelControllers\(input, declarationSemanticJudgmentAuthority\)/.test(scanner)],
  ['scanner no longer owns action selection predicate', !/const actionMethods = relationSelect/.test(scanner) && !/hasMiddlewareInterface/.test(scanner)],
  ['scanner no longer owns recursive inheritance traversal', !/const inheritedAttributes =/.test(scanner) && !/const inheritedControllerNames = \(\(\)/.test(scanner)],
  ['exact invocation judgment still reaches producer', /controllerProducer\.produce\(\{ declaration: declarationEvidence, invocationJudgment \}\)/.test(scanner)],
  ['no relation/foundation subscanner added', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/relation')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/foundation'))],
];
let failures = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failures += 1;
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
