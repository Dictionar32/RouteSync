const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const scannerPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const contractPath = path.join(root, 'packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const producerPath = path.join(root, 'packages/core/src/compiler/scanner/attributeProducerInterface.ts');
const authorityPath = path.join(root, 'packages/core/src/types/upstream/phpClassConstructorSelectionAuthority.ts');
const scanner = fs.readFileSync(scannerPath, 'utf8');
const contract = fs.readFileSync(contractPath, 'utf8');
const producer = fs.readFileSync(producerPath, 'utf8');
const authority = fs.readFileSync(authorityPath, 'utf8');
const checks = [
  ['controller scanner injects the existing upstream constructor authority', scanner.includes('constructorSelectionAuthority: PhpClassConstructorSelectionAuthorityInterface = phpClassConstructorSelectionAuthority')],
  ['controller scanner no longer selects __construct with local find', !/declaration\.methods\.find\(method => method\.name === '__construct'\)/.test(scanner)],
  ['controller scanner consumes selected constructor parameters from the authority judgment', scanner.includes("constructorSelection.kind === 'php_class_constructor_selected' ? constructorSelection.method.value.parameters : []")],
  ['ambiguous constructor selection blocks controller scan publication', scanner.includes("kind: 'controller_constructor_selection_ambiguous'") && scanner.includes('if (ambiguousConstructors.length > 0)')],
  ['scanner contract publishes the shared authority dependency', contract.includes('readonly constructorSelectionAuthority: PhpClassConstructorSelectionAuthorityInterface')],
  ['attribute producer and controller scanner use the same authority contract', producer.includes('PhpClassConstructorSelectionAuthorityInterface') && scanner.includes('PhpClassConstructorSelectionAuthorityInterface')],
  ['constructor authority retains explicit missing and ambiguous judgments', authority.includes('php_class_constructor_missing') && authority.includes('php_class_constructor_ambiguous')],
  ['controller scanner contract version is advanced to 41', scanner.includes('readonly contractVersion = 41 as const') && contract.includes('readonly contractVersion: 41;')],
];
let failures = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failures += 1;
}
process.stdout.write(`RESULT ${checks.length - failures}/${checks.length}\n`);
process.exitCode = failures === 0 ? 0 : 1;
