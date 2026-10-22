const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const ifacePath = path.join(root, 'packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentInterface.ts');
const indexPath = path.join(root, 'packages/core/src/types/upstream/index.ts');
const authorityPath = path.join(root, 'packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentAuthority.ts');
const iface = fs.readFileSync(ifacePath, 'utf8');
const index = fs.readFileSync(indexPath, 'utf8');
const authority = fs.readFileSync(authorityPath, 'utf8');
const checks = [
  ['named lattice contract exists', /export interface ControllerDeclarationAncestryLatticeContract/.test(iface)],
  ['lattice order is canonical identity subset', /order: 'subset_by_canonical_class_identity'/.test(iface)],
  ['bottom is explicit', /bottom: 'empty_identity_set'/.test(iface)],
  ['join is explicit set union', /join: 'set_union'/.test(iface)],
  ['transfer semantics are explicit', /transfer: 'add-one-resolved-parent-identity-or-reach-boundary'/.test(iface)],
  ['monotonicity is explicit', /monotonicity: 'seen-identities-only-grow'/.test(iface)],
  ['complete fixed point remains distinct', /kind: 'controller_ancestry_closure_complete'[\s\S]*?fixedPoint: 'least_fixed_point'/.test(iface)],
  ['partial fixed point remains bounded to resolved inventory', /kind: 'controller_ancestry_closure_partial'[\s\S]*?fixedPoint: 'least_fixed_point_over_resolved_inventory'/.test(iface)],
  ['interface explicitly disclaims proof from numeric witnesses', /does not claim that numeric runtime[\s\S]*witnesses prove the laws/.test(iface)],
  ['lattice contract exported through upstream index', /export \* from '\.\/controllerDeclarationSemanticJudgmentInterface'/.test(index)],
  ['runtime authority unchanged and still consumes canonical interface', /controllerDeclarationSemanticJudgmentInterface/.test(authority) && /ancestryFor/.test(authority)],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
console.log(`RESULT ${checks.filter(([, passed]) => passed).length}/${checks.length}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
