const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/types/upstream/phpClassConstructorSelectionInterface.ts');
const controllerPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const producerPath = path.join(root, 'packages/core/src/compiler/scanner/attributeProducer.ts');
const contract = fs.readFileSync(contractPath, 'utf8');
const controller = fs.readFileSync(controllerPath, 'utf8');
const producer = fs.readFileSync(producerPath, 'utf8');
const checks = [
  ['closed complete method inventory exists', contract.includes("kind: 'php_class_method_declaration_inventory_complete'")],
  ['blocked method inventory exists', contract.includes("kind: 'php_class_method_declaration_inventory_blocked'")],
  ['blocked inventory requires a non-empty blocker tuple', /blockers: readonly \[PhpClassMethodDeclarationInventoryBlocker, \.\.\.PhpClassMethodDeclarationInventoryBlocker\[\]\]/.test(contract)],
  ['inventory explicitly records enumeration completeness', contract.includes('fully enumerated') || contract.includes('every method declaration')],
  ['one existing constructor authority remains in controller wiring', controller.includes('PhpClassConstructorSelectionAuthorityInterface') && controller.includes('this.constructorSelectionAuthority.select(')],
  ['attribute producer uses the same authority contract', producer.includes('input.constructorSelectionAuthority.select(')],
  ['no semantic foundation import added to contract', !contract.includes('semantic/foundation')],
  ['no semantic relations import added to contract', !contract.includes('semantic/relations')],
];
let failed = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  failed += passed ? 0 : 1;
}
process.exitCode = failed === 0 ? 0 : 1;
