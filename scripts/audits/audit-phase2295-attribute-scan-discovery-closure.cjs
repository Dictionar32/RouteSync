const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelAttributeScannerInterface.ts');
const producer = read('packages/core/src/compiler/scanner/operations/attributeAstCanonical.ts');
const utils = read('packages/core/src/compiler/scanner/operations/scannerUtils.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const builder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const cliScan = read('packages/cli/src/commands/scan.ts');
const cliComposition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const docs = read('packages/core/src/types/upstream/docs/PHASE2295-ATTRIBUTE-SCAN-DISCOVERY-CLOSURE.md');
const trace = read('reports/phase2295/TRACE.md');
const complete = contract.match(/export interface LaravelAttributeScanCompleteJudgment\s*\{[^}]*\}/s)?.[0] ?? '';
const blocked = contract.split('export interface LaravelAttributeScanBlockedJudgment')[1]?.split('/** Closed outcome algebra')[0] ?? '';
const inventory = contract.match(/export interface LaravelContextualAttributeInventory\s*\{[^}]*\}/s)?.[0] ?? '';
const checks = [
  ['existing LaravelAttributeScannerInterface evolved in place to v15', /interface LaravelAttributeScannerInterface\s*\{[^}]*contractVersion: 15/s.test(contract) && !/LaravelAttributeScannerInterfaceV2|LegacyLaravelAttributeScannerInterface/.test(contract)],
  ['scan scope explicitly names app/Attributes', /interface LaravelAttributeScanScope\s*\{[^}]*relativeDirectory: 'app\/Attributes'/s.test(contract)],
  ['complete result carries discovery receipt and no parallel loose AST array', /discoveryReceipt: LaravelAttributeScanDiscoveryReceipt/.test(complete) && !/attributes:\s*readonly\s+AttributeAst\[\]/.test(complete)],
  ['discovery receipt records ordered per-file AST and contextuality evidence', /interface LaravelAttributeScanDiscoveryReceipt\s*\{[\s\S]*files: LaravelAttributeScannedFileSequence/.test(contract) && /interface LaravelAttributeScannedFileEvidence\s*\{[^}]*attribute: AttributeAst;[^}]*contextuality: LaravelAttributeContextualityJudgment/s.test(contract)],
  ['directory enumeration evidence distinguishes absent/unreadable scope from empty scope', /interface LaravelAttributeDirectoryEnumerationEvidence/.test(contract) && /interface LaravelAttributeScanDiscoveryReceipt\s*\{[\s\S]*files: LaravelAttributeScannedFileSequence/.test(contract)],
  ['discovery failures are typed separately from PHP name-resolution failures', /export type LaravelAttributeDiscoveryBlocker\s*=/.test(contract) && /laravel_attribute_discovery_root_missing/.test(contract) && /laravel_attribute_discovery_directory_unreadable/.test(contract) && /laravel_attribute_source_file_unreadable/.test(contract) && /laravel_attribute_declaration_parse_failed/.test(contract)],
  ['blocked judgment requires a non-empty typed failure ADT', /blockers: LaravelAttributeScanFailureSequence/.test(blocked)],
  ['blocked result retains partial file discovery but no complete receipt/inventory', /partialDiscovery: Readonly/.test(blocked) && !/discoveryReceipt:/.test(blocked) && !/contextualAttributeInventory:/.test(blocked)],
  ['contextual inventory is explicitly scoped', /interface LaravelContextualAttributeInventory\s*\{[^}]*scope: LaravelAttributeScanScope/s.test(inventory)],
  ['upstream contract imports neither semantic/foundation nor semantic/relations', !/semantic\/(?:foundation|relations)/.test(contract)],
  ['producer missing-directory behavior is recorded as outstanding migration debt', /collectPhpFiles\(directory\)/.test(producer) && /fs\.existsSync\(dir\)/.test(utils) && /returns an empty list when the directory does not exist/.test(trace)],
  ['pipeline still uses prior contract and is marked for follow-up migration', !/contractVersion: 13/.test(pipeline) && /Migrate `laravelSourceAstPipeline\.ts`/.test(trace)],
  ['actual CLI-to-pipeline source path is checked', /buildManifestWithInvocationPipeline/.test(cliScan) && /manifestBuilder\.build/.test(cliComposition) && /constructRouteSyncManifest/.test(builder) && /laravelSourceAstPipeline\.execute/.test(builder) && /dependencies\.attributeScanner\.scan/.test(pipeline)],
  ['phase remains interface-first and makes no build claim', /does not modify the producer, pipeline, CLI, or runtime/.test(docs) && /No TypeScript typecheck or build was run/.test(trace)],
];
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
process.exitCode = checks.every(([, passed]) => passed) ? 0 : 1;
