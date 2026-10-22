const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const inventory = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory.ts');
const preparation = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticInputPreparation.ts');
const preflight = read('packages/core/src/compiler/scanner/wiring/routeManifestRequestResolutionPreflight.ts');
const preflightContract = read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionInterface.ts');
const coreExports = read('packages/core/src/index.ts');
const upstreamExports = read('packages/core/src/upstream.ts');
const checks = [
  ['existing upstream inventory contract owns the collision ADT operation', /identityCollisionInventory: \(input: RequestTypeDerivationInput\) => RequestTypeDerivationIdentityCollisionInventory/.test(contract)],
  ['collision candidates are deduplicated by source occurrence key', (inventory.match(/all\.findIndex\(other => other\.occurrenceKey === candidate\.occurrenceKey\) === index/g) || []).length === 3],
  ['collision witnesses require two distinct source occurrences', /const second = uniqueOccurrences\.find\(candidate => candidate\.occurrenceKey !== first\.occurrenceKey\)/.test(inventory)],
  ['route/resource/request collision domains remain separately typed', ["domain: 'routes'", "domain: 'resources'", "domain: 'requests'"].every(value => inventory.includes(value))],
  ['additional witnesses preserve only unique occurrence identities', /additional: Object\.freeze\(occurrences\.slice\(2\)\)/.test(inventory) && (inventory.match(/const uniqueOccurrences = candidates\.filter/g) || []).length === 3],
  ['closed collision ADT is assembled by its upstream owner', /export const requestTypeDerivationIdentityCollisionInventory: RequestTypeDerivationSourceEvidenceInventoryInterface\['identityCollisionInventory'\]/.test(inventory) && /kind: 'identity_inventory_collisions', witnesses/.test(inventory) && /kind: 'identity_inventory_collision_free'/.test(inventory)],
  ['semantic preparation delegates to the upstream ADT operation instead of reconstructing it', /requestTypeDerivationSourceEvidenceInventory\.identityCollisionInventory\(input\)/.test(preparation) && !/identityWitnesses\[0\]/.test(preparation) && !/as const/.test(preparation)],
  ['CLI manifest preflight preserves the same ADT without reclassification', /identityCollisionInventory: RequestTypeDerivationIdentityCollisionInventory/.test(preflightContract) && /identityCollisionInventory: prepared\.identityCollisionInventory/.test(preflight)],
  ['operation is exported through core and upstream surfaces', /requestTypeDerivationIdentityCollisionInventory/.test(coreExports) && /requestTypeDerivationIdentityCollisionInventory/.test(upstreamExports)],
  ['no forbidden semantic foundation/relation dependency introduced', !/semantic\/(foundation|relations|relation)/.test(contract + inventory + preparation + preflight)],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
console.log(`Phase 2641 distinct occurrence identity collision audit: ${checks.filter(([, passed]) => passed).length}/${checks.length} passed`);
process.exitCode = checks.some(([, passed]) => !passed) ? 1 : 0;
