const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelAttributeScannerInterface.ts');
const producer = read('packages/core/src/compiler/scanner/subscanners/attributeProducer.ts');
const scanner = read('packages/core/src/compiler/scanner/subscanners/attributeAstCanonical.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const cli = read('packages/cli/src/commands/scan.ts');
const checks = [
  ['existing Laravel attribute scanner interface is evolved in place', /interface LaravelAttributeScannerInterface/.test(contract) && !/LaravelAttributeScannerInterfaceV2|LegacyLaravelAttributeScannerInterface/.test(contract)],
  ['closed interface inventory has a discriminant and closed marker', /interface LaravelAttributeResolvedInterfaceInventory[\s\S]*?kind: 'laravel_attribute_resolved_interface_inventory';[\s\S]*?closed: true;[\s\S]*?interfaces: readonly LaravelAttributeResolvedInterfaceEvidence\[\]/.test(contract)],
  ['each interface entry retains resolved name and source provenance', /interface LaravelAttributeResolvedInterfaceEvidence[\s\S]*?resolution: Extract<PhpClassNameResolution, \{ readonly kind: 'php_class_name_resolved' \}>;[\s\S]*?source: SourceSpan/.test(contract)],
  ['positive contextual declaration requires the closed interface inventory', /interface LaravelContextualAttributeDeclarationEvidence[\s\S]*?interfaceInventory: LaravelAttributeResolvedInterfaceInventory/.test(contract)],
  ['negative declaration judgment requires the same closed inventory', /interface LaravelAttributeNonContextualDeclarationJudgment[\s\S]*?closed: true;[\s\S]*?interfaceInventory: LaravelAttributeResolvedInterfaceInventory/.test(contract)],
  ['old unclosed resolvedInterfaces property is removed from negative judgment', !/interface LaravelAttributeNonContextualDeclarationJudgment[\s\S]*?resolvedInterfaces: readonly/.test(contract)],
  ['scan complete, blocked, and scanner contracts are all version 8', (contract.match(/contractVersion: 8;/g) || []).length >= 3 && !/contractVersion: 7;/.test(contract)],
  ['contract has no semantic/foundation or semantic/relations imports', !/semantic\/(?:foundation|relations)/.test(contract)],
  ['producer is deliberately not yet migrated to new inventory shape', /resolvedInterfaces: resolvedInterfaceEvidence/.test(scanner) && !/interfaceInventory:/.test(scanner) && /contextuality: LaravelAttributeContextualityJudgment/.test(producer)],
  ['pipeline and CLI remain untouched by this interface-only phase', /contractVersion: 7/.test(scanner) && /buildManifestWithInvocationPipeline/.test(cli) && /laravelAttributeScanner/.test(pipeline)],
  ['existing relations migration debt remains explicit', /semantic\/relations/.test(producer)],
];
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
process.exitCode = checks.every(([, passed]) => passed) ? 0 : 1;
