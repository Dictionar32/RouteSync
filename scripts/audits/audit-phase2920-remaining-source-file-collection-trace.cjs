const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['route source selection preserves explicit selection variant', /kind: 'explicit_route_files'[\s\S]*?inventory: SourceFileInventory/.test(read('packages/core/src/types/upstream/laravelRouteSourceSelection.ts'))],
  ['route source selection runtime remains interface-first', /export const laravelRouteSourceSelectionAuthority: LaravelRouteSourceSelectionInterface = Object\.freeze/.test(read('packages/core/src/types/upstream/laravelRouteSourceSelection.ts'))],
  ['route scan carries selected and missing source evidence', /selectedFiles: SourceFileInventory/.test(read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts')) && /missingFiles: SourceFileInventory/.test(read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts'))],
  ['route runtime correlates selected files with missing files', /selectedFiles\.filter\(file => !fs\.existsSync/.test(read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts'))],
  ['explicit missing route file remains a blocked judgment', /readonly kind: 'laravel_route_scan_blocked'[\s\S]*?readonly missingFiles: SourceFileInventory/.test(read('packages/core/src/types/upstream/laravelRouteSourceSelection.ts'))],
  ['controller ambiguity retains candidate witnesses', /kind: 'parent_ambiguous_in_inventory'[\s\S]*?candidates: readonly SourceFile\[\]/.test(read('packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentInterface.ts'))],
  ['controller authority emits ambiguity judgment', /kind: 'parent_ambiguous_in_inventory'/.test(read('packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentAuthority.ts'))],
  ['DTO receipt retains discovered source evidence', /discoveredSourceFiles: readonly SourceFile\[\]/.test(read('packages/core/src/types/upstream/laravelControllerResponseDtoDeclarationInterface.ts'))],
  ['DTO discovery retains incomplete state and blockers', /kind: 'laravel_project_dto_declaration_inventory_incomplete'[\s\S]*?blockers: readonly \[LaravelDtoDeclarationDiscoveryBlocker/.test(read('packages/core/src/types/upstream/laravelControllerResponseDtoDeclarationInterface.ts'))],
  ['DTO runtime producer retains partial source evidence', /partialEvidence[\s\S]*?discoveredSourceFiles: Object\.freeze/.test(read('packages/core/src/compiler/scanner/operations/dtoAstCanonical.ts'))],
  ['Phase2920 generic continuation debt is resolved by Phase2921 visitor', /Generic continuation debt — resolved in Phase2921/.test(read('packages/core/src/types/upstream/PHASE2920_REMAINING_SOURCE_FILE_COLLECTION_TRACE.md')) && /visitSources/.test(read('packages/core/src/types/upstream/names.ts'))],
  ['collections.ts remains empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failed += Number(!passed);
}
process.stdout.write(`\nPhase2920 structural audit: ${checks.length - failed}/${checks.length} passed\n`);
process.exitCode = failed ? 1 : 0;
