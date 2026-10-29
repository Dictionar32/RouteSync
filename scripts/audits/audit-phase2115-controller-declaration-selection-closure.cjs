const { readFileSync } = require('node:fs');

const read = (path) => readFileSync(`${process.cwd()}/${path}`, 'utf8');
const contract = read('packages/core/src/types/upstream/controllerDeclarationSelectionInventoryClosureInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerDeclarationSelectionInventoryClosureAuthority.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const scannerContract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const publicIndex = read('packages/core/src/index.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');

const checks = [
  ['closure is an explicit closed ADT', contract.includes("kind: 'controller_declaration_selection_inventory_closed'") && contract.includes("kind: 'controller_declaration_selection_inventory_blocked'")],
  ['blocked outcome requires a non-empty blocker tuple', contract.includes('readonly [ControllerDeclarationSelectionInventoryBlocker, ...ControllerDeclarationSelectionInventoryBlocker[]]')],
  ['closure authority is expressed as an interface', contract.includes('interface ControllerDeclarationSelectionInventoryClosureAuthorityInterface') && contract.includes('close<TSource, TMethod, TAttribute>')],
  ['authority owns correspondence and ancestry blocker aggregation', authority.includes('const blockers = correspondences.flatMap') && authority.includes('controller_declaration_selection_blocked')],
  ['scanner injects the closure authority', scanner.includes('selectionInventoryClosureAuthority: ControllerDeclarationSelectionInventoryClosureAuthorityInterface')],
  ['scanner public interface exposes the closure authority', scannerContract.includes('readonly selectionInventoryClosureAuthority: ControllerDeclarationSelectionInventoryClosureAuthorityInterface')],
  ['scanner gates action execution on the closed ADT', scanner.includes("selectionInventory.kind === 'controller_declaration_selection_inventory_blocked'") && scanner.includes('selectionInventory.correspondences.map')],
  ['scanner no longer throws for impossible selection states', !scanner.includes('Declaration authority violated its one-output-per-input') && !scanner.includes('Closed declaration inventory invariant violated')],
  ['public blocker type delegates to upstream-owned blocker ADT', scannerContract.includes('ControllerDeclarationSelectionBlocker = ControllerDeclarationSelectionInventoryBlocker')],
  ['closure interface and authority are exported', publicIndex.includes('controllerDeclarationSelectionInventoryClosureAuthority') && upstreamIndex.includes('controllerDeclarationSelectionInventoryClosureInterface')],
  ['new closure interface and authority have no relation/foundation/subscanner dependencies', !/semantic\/relations|foundation|operations/.test(contract) && !/semantic\/relations|foundation|operations/.test(authority)],
];

for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
}
const failures = checks.filter(([, passed]) => !passed);
process.stdout.write(`\n${checks.length - failures.length}/${checks.length} checks passed\n`);
if (failures.length > 0) process.exitCode = 1;
