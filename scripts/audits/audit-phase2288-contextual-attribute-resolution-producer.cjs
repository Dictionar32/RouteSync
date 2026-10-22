const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelAttributeScannerInterface.ts');
const producer = read('packages/core/src/compiler/scanner/subscanners/attributeAstCanonical.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const pipelineContract = read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts');
const builder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const controller = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const checks = [
  ['existing Laravel attribute scanner contract is version 7', /interface LaravelAttributeScannerInterface[\s\S]*?readonly contractVersion: 7;/.test(contract)],
  ['complete and blocked outcomes are version 7', /interface LaravelAttributeScanCompleteJudgment[\s\S]*?contractVersion: 7;/.test(contract) && /interface LaravelAttributeScanBlockedJudgment[\s\S]*?contractVersion: 7;/.test(contract)],
  ['canonical identity proof preserves resolution and source span', /interface LaravelContextualAttributeImplementationProof[\s\S]*?resolution: LaravelContextualAttributeContractResolution;[\s\S]*?interfaceSource: SourceSpan;/.test(contract)],
  ['producer uses existing lexical context and PHP name-resolution authority', /phpClassNameResolutionContextAt/.test(producer) && /phpClassNameResolutionAuthority\.judge/.test(producer)],
  ['producer verifies the fully qualified Laravel contract identity', /Illuminate\\\\Contracts\\\\Container\\\\ContextualAttribute/.test(producer) && /qualifiedName\.value\.value\.toLowerCase\(\)/.test(producer)],
  ['short-name contextual regex is removed', !/implements\[\^\\\{\]\*\\bContextualAttribute\\b/.test(producer)],
  ['attribute producer has no direct relations or foundation imports', !/semantic\/(?:relations|foundation)/.test(producer)],
  ['composition root delegates to proof-producing scanner without inventory reconstruction', /contractVersion: 7,[\s\S]*?scan: scanAttributeAsts,[\s\S]*?satisfies LaravelAttributeScannerInterface/.test(pipeline) && !/attributes\s*\.filter\(attribute => attribute\.definition\.contextual\)/.test(pipeline)],
  ['pipeline contract preserves a typed attribute-blocked outcome and receipt', /laravel_source_ast_projection_attribute_scan_blocked/.test(pipelineContract) && /invocationInventoryReceipt: Receipt/.test(pipelineContract) && /scan: LaravelAttributeScanBlockedJudgment/.test(pipelineContract)],
  ['pipeline returns before downstream stages when attribute scan is blocked', /const attributeScan = await dependencies\.attributeScanner\.scan\(sourceProject\);[\s\S]*?if \(attributeScan\.kind === 'laravel_attribute_scan_blocked'\)[\s\S]*?return Object\.freeze\(\{[\s\S]*?laravel_source_ast_projection_attribute_scan_blocked/.test(pipeline)],
  ['manifest builder handles attribute blocker explicitly', /projection\.kind === 'laravel_source_ast_projection_attribute_scan_blocked'[\s\S]*?projection\.scan\.blockers/.test(builder)],
  ['controller scanner still requires the complete inventory contract', /readonly contextualAttributeInventory: LaravelContextualAttributeInventory;/.test(controller)],
];
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
process.exitCode = checks.every(([, passed]) => passed) ? 0 : 1;
