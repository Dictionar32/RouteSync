const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const attributeContract = read('packages/core/src/types/upstream/laravelAttributeScannerInterface.ts');
const controllerContract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const producer = read('packages/core/src/compiler/scanner/subscanners/attributeAstCanonical.ts');
const checks = [
  ['existing attribute scanner contract has advanced to version 7', /interface LaravelAttributeScannerInterface[\s\S]*?contractVersion: 7/.test(attributeContract)],
  ['proof retains successful PHP class-name resolution specialized to canonical identity', /resolution: LaravelContextualAttributeContractResolution/.test(attributeContract) && /readonly value: 'Illuminate\\\\Contracts\\\\Container\\\\ContextualAttribute';/.test(attributeContract)],
  ['proof does not duplicate the class declaration identity', !/readonly declarationIdentity:/.test(attributeContract)],
  ['inventory declaration retains canonical identity and short consumer key', /identity: ClassName;[\s\S]*?qualifiedIdentity: PhpQualifiedClassName/.test(attributeContract)],
  ['canonical Laravel contract identity remains explicit', /Illuminate\\\\Contracts\\\\Container\\\\ContextualAttribute/.test(attributeContract)],
  ['interface provenance remains explicit', /interfaceSource: SourceSpan/.test(attributeContract)],
  ['controller scanner consumes the same inventory contract', /contextualAttributeInventory: LaravelContextualAttributeInventory/.test(controllerContract)],
  ['legacy regex is removed and proof is produced from resolved names', !/implements\[\^\\\{\]\*\\bContextualAttribute\\b/.test(producer) && /phpClassNameResolutionAuthority\.judge/.test(producer)],
  ['upstream interfaces add no foundation or relation imports', !/semantic\/(?:foundation|relations)/.test(attributeContract + controllerContract)],
];
for (const [name, pass] of checks) process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
process.exitCode = checks.every(([, pass]) => pass) ? 0 : 1;
