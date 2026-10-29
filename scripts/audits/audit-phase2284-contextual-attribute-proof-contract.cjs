const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const attributeContract = read('packages/core/src/types/upstream/laravelAttributeScannerInterface.ts');
const controllerContract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const producer = read('packages/core/src/compiler/scanner/operations/attributeAstCanonical.ts');
const checks = [
  ['existing attribute scanner contract has advanced to version 7', /interface LaravelAttributeScannerInterface[\s\S]*?contractVersion: 7/.test(attributeContract)],
  ['canonical Laravel contextual contract identity is explicit', /Illuminate\\\\Contracts\\\\Container\\\\ContextualAttribute/.test(attributeContract)],
  ['implementation proof carries resolved identity and resolution provenance', /resolution: LaravelContextualAttributeContractResolution/.test(attributeContract) && /interfaceSource: SourceSpan/.test(attributeContract)],
  ['inventory declaration requires implementation proof and qualified identity', /interface LaravelContextualAttributeDeclarationEvidence[\s\S]*?qualifiedIdentity: PhpQualifiedClassName;[\s\S]*?implementation: LaravelContextualAttributeImplementationProof/.test(attributeContract)],
  ['controller scanner consumes the same upstream inventory contract', /contextualAttributeInventory: LaravelContextualAttributeInventory/.test(controllerContract)],
  ['short-name regex classification has been removed', !/implements\[\^\\\{\]\*\\bContextualAttribute\\b/.test(producer)],
  ['producer uses existing PHP name-resolution authority', /phpClassNameResolutionAuthority\.judge/.test(producer)],
  ['upstream contract adds no semantic foundation or relation imports', !/semantic\/(?:foundation|relations)/.test(attributeContract + controllerContract)],
];
for (const [name, pass] of checks) process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
process.exitCode = checks.every(([, pass]) => pass) ? 0 : 1;
