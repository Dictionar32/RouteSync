const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelAttributeScannerInterface.ts');
const producer = read('packages/core/src/compiler/scanner/subscanners/attributeAstCanonical.ts');
const producerBuilder = read('packages/core/src/compiler/scanner/subscanners/attributeProducer.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const checks = [
  ['existing LaravelAttributeScannerInterface evolved in place', /interface LaravelAttributeScannerInterface/.test(contract) && !/LaravelAttributeScannerInterfaceV2|LegacyLaravelAttributeScannerInterface/.test(contract)],
  ['each declared interface preserves source spelling and provenance', /interface LaravelAttributeDeclaredInterfaceEvidence[\s\S]*?sourceName: ClassName;[\s\S]*?source: SourceSpan/.test(contract)],
  ['resolved interface evidence links resolution to its source declaration', /interface LaravelAttributeResolvedInterfaceEvidence[\s\S]*?declaration: LaravelAttributeDeclaredInterfaceEvidence;[\s\S]*?resolution: Extract<PhpClassNameResolution, \{ readonly kind: 'php_class_name_resolved' \}>/.test(contract)],
  ['resolved inventory uses one source-linked collection rather than parallel arrays', /interface LaravelAttributeResolvedInterfaceInventory[\s\S]*?closed: true;[\s\S]*?declarationSource: SourceSpan;[\s\S]*?interfaces: readonly LaravelAttributeResolvedInterfaceEvidence\[\]/.test(contract) && !/declarations: LaravelAttributeDeclaredInterfaceInventory|resolutions: readonly LaravelAttributeResolvedInterfaceEvidence/.test(contract)],
  ['contract states exhaustive source-order coverage in a single paired inventory', /one collection rather than separate declaration\/resolution arrays[\s\S]*?Every source-level[\s\S]*?occur exactly once/.test(contract)],
  ['positive and negative contextuality judgments both require the linked resolved inventory', /interface LaravelContextualAttributeDeclarationEvidence[\s\S]*?interfaceInventory: LaravelAttributeResolvedInterfaceInventory/.test(contract) && /interface LaravelAttributeNonContextualDeclarationJudgment[\s\S]*?interfaceInventory: LaravelAttributeResolvedInterfaceInventory/.test(contract)],
  ['implementation proof references declared interface evidence rather than duplicating a source span', /interface LaravelContextualAttributeImplementationProof[\s\S]*?declaration: LaravelAttributeDeclaredInterfaceEvidence/.test(contract) && !/interface LaravelContextualAttributeImplementationProof[\s\S]*?interfaceSource: SourceSpan/.test(contract)],
  ['complete, blocked, and scanner contract versions advance together to 9', (contract.match(/contractVersion: 9;/g) || []).length >= 3 && !/contractVersion: 8;/.test(contract)],
  ['upstream contract imports neither semantic/foundation nor semantic/relations', !/semantic\/(?:foundation|relations)/.test(contract)],
  ['phase remains interface-first: producer and pipeline have not been migrated', /resolvedInterfaces: resolvedInterfaceEvidence/.test(producer) && /contractVersion: 7/.test(producer) && /attributeScanner: Object\.freeze\([\s\S]*?contractVersion: 7,[\s\S]*?scan: scanAttributeAsts/.test(pipeline)],
  ['known relations dependency remains visible rather than falsely declared removed', /semantic\/relations/.test(producerBuilder)],
];
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
process.exitCode = checks.every(([, passed]) => passed) ? 0 : 1;
