const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const interfaceSource = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const runtimeSource = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const checks = [
  ['scanner contract version advances with the closed outcome ADT', /readonly contractVersion: 31;/.test(interfaceSource) && /readonly contractVersion = 31 as const;/.test(runtimeSource)],
  ['scan judgment is a closed discriminated union', /export type LaravelControllerScanJudgment\s*=\s*\|/.test(interfaceSource)],
  ['complete outcome has its own top-level discriminant', /kind: 'laravel_controller_scan_complete'/.test(interfaceSource)],
  ['blocked outcome has its own top-level discriminant', /kind: 'laravel_controller_scan_blocked'/.test(interfaceSource)],
  ['complete outcome is correlated with complete declaration closure', /Extract<\s*ControllerDeclarationSelectionInventoryOutcome,\s*\{ readonly kind: 'controller_declaration_selection_inventory_complete' \}/s.test(interfaceSource)],
  ['blocked outcome is correlated with blocked declaration closure', /Extract<\s*ControllerDeclarationSelectionInventoryOutcome,\s*\{ readonly kind: 'controller_declaration_selection_inventory_blocked' \}/s.test(interfaceSource)],
  ['blocked scan contract forbids publishing controller artifacts', /readonly controllers: readonly \[\];/.test(interfaceSource)],
  ['runtime blocked branch publishes an empty artifact list', /kind: 'laravel_controller_scan_blocked'[\s\S]*?controllers: Object\.freeze\(\[\]\)/.test(runtimeSource)],
  ['runtime gates action/response/AST work before iteration when declarations are blocked', /if \(declarationBlockers\.length > 0\)[\s\S]*?kind: 'laravel_controller_scan_blocked'[\s\S]*?for \(const item of declarationsWithSelections\)/.test(runtimeSource)],
  ['upstream scanner interface introduces no relation/foundation/subscanner imports', !/from ['"][^'"]*(?:semantic\/relations|semantic\/foundation|scanner\/operations)[^'"]*['"]/.test(interfaceSource)],
];
let failures = 0;
for (const [label, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${label}\n`);
  failures += Number(!pass);
}
process.stdout.write(`RESULT ${checks.length - failures}/${checks.length}\n`);
process.exitCode = failures === 0 ? 0 : 1;
