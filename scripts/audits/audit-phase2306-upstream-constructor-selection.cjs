const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/phpClassConstructorSelectionInterface.ts');
const authority = read('packages/core/src/types/upstream/phpClassConstructorSelectionAuthority.ts');
const producer = read('packages/core/src/compiler/scanner/attributeProducer.ts');
const producerContract = read('packages/core/src/compiler/scanner/attributeProducerInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/laravelAttributeScanner.ts');
const scannerContract = read('packages/core/src/types/upstream/laravelAttributeScannerInterface.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const manifest = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const checks = [
  ['upstream contract publishes selected/missing/ambiguous ADT', /php_class_constructor_selected/.test(contract) && /php_class_constructor_missing/.test(contract) && /php_class_constructor_ambiguous/.test(contract)],
  ['upstream authority handles PHP case-insensitive constructor names', /toLowerCase\(\) === '__construct'/.test(authority)],
  ['attribute producer delegates selection to injected authority', /input\.constructorSelectionAuthority\.select/.test(producer) && !/declaration\.methods\.find/.test(producer)],
  ['duplicate constructors become typed producer blockers', /attribute_producer_constructor_ambiguous/.test(producerContract) && /candidates: constructorSelection\.candidates/.test(producer)],
  ['scanner exposes ambiguous constructor as a typed scan failure', /laravel_attribute_constructor_ambiguous/.test(scannerContract) && /laravel_attribute_constructor_ambiguous/.test(scanner)],
  ['manifest boundary renders ambiguous constructor failure', /attribute-constructor-ambiguous/.test(manifest)],
  ['scanner and composition root are aligned on contract v19', /contractVersion: 19/.test(scanner) && /contractVersion: 19/.test(scannerContract) && /contractVersion: 19/.test(pipeline)],
  ['new upstream contract avoids forbidden foundation/relation imports', !/semantic\/(foundation|relations)/.test(contract + authority)],
];
let failures = 0;
for (const [label, pass] of checks) { console.log(`${pass ? 'PASS' : 'FAIL'} ${label}`); if (!pass) failures += 1; }
if (failures > 0) process.exitCode = 1;
