const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelAttributeScannerInterface.ts');
const producer = read('packages/core/src/compiler/scanner/operations/attributeAstCanonical.ts');
const producerBuilder = read('packages/core/src/compiler/scanner/operations/attributeProducer.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const docs = read('packages/core/src/types/upstream/docs/PHASE2294-CONTEXTUAL-DECLARATION-INVENTORY-ADT.md');
const cliScan = read('packages/cli/src/commands/scan.ts');
const cliComposition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const pipelineSource = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const inventory = contract.match(/export interface LaravelContextualAttributeInventory\s*\{[^}]*\}/)?.[0] ?? '';
const checks = [
  ['existing LaravelAttributeScannerInterface evolved in place', /interface LaravelAttributeScannerInterface/.test(contract) && !/LaravelAttributeScannerInterfaceV2|LegacyLaravelAttributeScannerInterface/.test(contract)],
  ['project-level contextual declaration collection is a recursive empty/entry ADT', /export type LaravelContextualAttributeDeclarationSequence\s*=\s*[\s\S]*?laravel_contextual_attribute_declaration_sequence_empty[\s\S]*?laravel_contextual_attribute_declaration_sequence_entry[\s\S]*?rest: LaravelContextualAttributeDeclarationSequence/.test(contract)],
  ['closed project inventory consumes the declaration ADT, not a raw array', /declarations: LaravelContextualAttributeDeclarationSequence;/.test(inventory) && !/declarations:\s*readonly\s+LaravelContextualAttributeDeclarationEvidence\[\]/.test(inventory)],
  ['explicit empty sequence represents complete empty inventory within the declared scope', /laravel_contextual_attribute_declaration_sequence_empty/.test(contract) && /empty sequence means discovery completed within the declared/.test(contract)],
  ['per-class resolved interface inventory remains a recursive ADT', /export type LaravelAttributeResolvedInterfaceSequence\s*=\s*[\s\S]*?laravel_attribute_resolved_interface_sequence_empty[\s\S]*?laravel_attribute_resolved_interface_sequence_entry/.test(contract)],
  ['complete scan judgment is evolved beyond phase2294 version 12', /interface LaravelAttributeScanCompleteJudgment\s*\{[^}]*contractVersion: 15;/.test(contract)],
  ['blocked scan judgment is evolved beyond phase2294 version 12', /interface LaravelAttributeScanBlockedJudgment\s*\{[\s\S]*?contractVersion: 15;/.test(contract)],
  ['scanner contract is evolved beyond phase2294 version 12', /interface LaravelAttributeScannerInterface\s*\{[^}]*contractVersion: 15;/.test(contract)],
  ['upstream contract does not import semantic foundation or relations', !/semantic\/(?:foundation|relations)/.test(contract)],
  ['producer/pipeline migration debt is explicitly retained', /contractVersion: 7/.test(producer) && !/contractVersion: 12/.test(pipeline) && /older per-declaration evidence shape/.test(docs)],
  ['remaining semantic relations dependency is visible', /semantic\/relations/.test(producerBuilder) && /still imports `semantic\/relations`/.test(docs)],
  ['documentation makes discovery completeness a producer obligation', /does not prove the producer actually visited every file/.test(docs)],
  ['CLI-to-attribute-scanner trace follows actual source imports and calls', /buildManifestWithInvocationPipeline/.test(cliScan) && /manifestBuilder\.build/.test(cliComposition) && /constructRouteSyncManifest/.test(manifestBuilder) && /laravelSourceAstPipeline\.execute/.test(manifestBuilder) && /dependencies\.attributeScanner\.scan/.test(pipelineSource) && /attributeAstCanonical/.test(docs)],
  ['phase trace records interface-first scope and remaining migration', /No TypeScript typecheck or build was run/.test(read('reports/phase2294/TRACE.md')) && /does not change producer, pipeline, CLI, or runtime/.test(docs)],
];
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
process.exitCode = checks.every(([, passed]) => passed) ? 0 : 1;
