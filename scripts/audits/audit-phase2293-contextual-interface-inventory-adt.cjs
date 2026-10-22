const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelAttributeScannerInterface.ts');
const producer = read('packages/core/src/compiler/scanner/subscanners/attributeAstCanonical.ts');
const producerBuilder = read('packages/core/src/compiler/scanner/subscanners/attributeProducer.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const docs = read('packages/core/src/types/upstream/docs/PHASE2293-CONTEXTUAL-INTERFACE-INVENTORY-ADT.md');
const checks = [
  ['existing LaravelAttributeScannerInterface evolved in place', /interface LaravelAttributeScannerInterface/.test(contract) && !/LaravelAttributeScannerInterfaceV2|LegacyLaravelAttributeScannerInterface/.test(contract)],
  ['resolved interface inventory sequence is an empty/entry recursive ADT', /export type LaravelAttributeResolvedInterfaceSequence\s*=\s*[\s\S]*?laravel_attribute_resolved_interface_sequence_empty[\s\S]*?laravel_attribute_resolved_interface_sequence_entry[\s\S]*?rest: LaravelAttributeResolvedInterfaceSequence/.test(contract)],
  ['closed general inventory owns source-clause provenance and sequence', /interface LaravelAttributeResolvedInterfaceInventory\s*\{[\s\S]*?closed: true;[\s\S]*?declarationSource: SourceSpan;[\s\S]*?entries: LaravelAttributeResolvedInterfaceSequence/.test(contract)],
  ['contextual inventory embeds one implementation proof between ordered sequences', /interface LaravelContextualAttributeResolvedInterfaceInventory\s*\{[\s\S]*?before: LaravelAttributeResolvedInterfaceSequence;[\s\S]*?implementation: LaravelContextualAttributeImplementationProof;[\s\S]*?after: LaravelAttributeResolvedInterfaceSequence/.test(contract)],
  ['contextual declaration carries contextual inventory without detached implementation sibling', /interface LaravelContextualAttributeDeclarationEvidence\s*\{[^}]*interfaceInventory: LaravelContextualAttributeResolvedInterfaceInventory;[^}]*\}/.test(contract) && !/interface LaravelContextualAttributeDeclarationEvidence\s*\{[^}]*readonly implementation:/.test(contract)],
  ['proof still contains one linked canonical interface evidence member', /interface LaravelContextualAttributeImplementationProof\s*\{[^}]*interfaceEvidence: LaravelContextualAttributeResolvedInterfaceEvidence;[^}]*\}/.test(contract)],
  ['complete, blocked, and scanner contract versions synchronized to 11', (contract.match(/contractVersion: 11;/g) || []).length >= 3 && !/contractVersion: 10;/.test(contract)],
  ['upstream contract does not import semantic foundation or relations', !/semantic\/(?:foundation|relations)/.test(contract)],
  ['producer migration debt remains explicit rather than falsely claimed fixed', /resolvedInterfaces: resolvedInterfaceEvidence/.test(producer) && /contractVersion: 7/.test(producer) && /contractVersion: 7/.test(pipeline)],
  ['remaining semantic relations dependency remains visible', /semantic\/relations/.test(producerBuilder)],
  ['documentation explicitly limits what structural typing proves', /TypeScript structural types cannot independently prove parser completeness or semantic uniqueness/.test(docs)],
  ['phase trace records interface-first scope and remaining integration work', /No producer or wiring files are changed/.test(docs) && /Next migration sequence/.test(read('reports/phase2293/TRACE.md'))],
];
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
process.exitCode = checks.every(([, passed]) => passed) ? 0 : 1;
