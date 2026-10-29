const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelAttributeScannerInterface.ts');
const producer = read('packages/core/src/compiler/scanner/operations/attributeAstCanonical.ts');
const producerBuilder = read('packages/core/src/compiler/scanner/operations/attributeProducer.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const proof = contract.match(/export interface LaravelContextualAttributeImplementationProof\s*\{[^}]*\}/)?.[0] ?? '';
const checks = [
  ['existing LaravelAttributeScannerInterface evolved in place', /interface LaravelAttributeScannerInterface/.test(contract) && !/LaravelAttributeScannerInterfaceV2|LegacyLaravelAttributeScannerInterface/.test(contract)],
  ['implementation proof references one linked resolved-interface evidence object', /interfaceEvidence: LaravelContextualAttributeResolvedInterfaceEvidence/.test(proof) && !/readonly (declaration|resolution):/.test(proof)],
  ['contextual resolved evidence specializes the existing linked evidence', /type LaravelContextualAttributeResolvedInterfaceEvidence = Omit<[\s\S]*?LaravelAttributeResolvedInterfaceEvidence,[\s\S]*?'resolution'[\s\S]*?resolution: LaravelContextualAttributeContractResolution/.test(contract)],
  ['canonical contract resolution remains narrowed to the exact Laravel identity', /qualifiedName: Readonly<[\s\S]*?value: 'Illuminate\\\\Contracts\\\\Container\\\\ContextualAttribute'/.test(contract)],
  ['source declaration and resolution remain bundled in the parent evidence', /interface LaravelAttributeResolvedInterfaceEvidence[\s\S]*?declaration: LaravelAttributeDeclaredInterfaceEvidence;[\s\S]*?resolution: Extract<PhpClassNameResolution/.test(contract)],
  ['closed inventory remains one source-linked collection', /interface LaravelAttributeResolvedInterfaceInventory[\s\S]*?closed: true;[\s\S]*?interfaces: readonly LaravelAttributeResolvedInterfaceEvidence\[\]/.test(contract)],
  ['positive and negative judgments require complete inventory', /interface LaravelContextualAttributeDeclarationEvidence[\s\S]*?interfaceInventory: LaravelAttributeResolvedInterfaceInventory/.test(contract) && /interface LaravelAttributeNonContextualDeclarationJudgment[\s\S]*?interfaceInventory: LaravelAttributeResolvedInterfaceInventory/.test(contract)],
  ['complete, blocked, and scanner contracts synchronized at version 10', (contract.match(/contractVersion: 10;/g) || []).length >= 3 && !/contractVersion: 9;/.test(contract)],
  ['upstream contract imports neither semantic/foundation nor semantic/relations', !/semantic\/(?:foundation|relations)/.test(contract)],
  ['interface-first boundary keeps producer and pipeline migration explicit', /resolvedInterfaces: resolvedInterfaceEvidence/.test(producer) && /contractVersion: 7/.test(producer) && /contractVersion: 7/.test(pipeline)],
  ['remaining producer relations dependency is explicitly visible', /semantic\/relations/.test(producerBuilder)],
  ['phase documentation states collection membership is still a producer obligation', /cannot prove collection membership/.test(read('packages/core/src/types/upstream/docs/PHASE2292-CONTEXTUAL-IMPLEMENTATION-PROOF-INVENTORY-MEMBER.md'))],
];
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
process.exitCode = checks.every(([, passed]) => passed) ? 0 : 1;
