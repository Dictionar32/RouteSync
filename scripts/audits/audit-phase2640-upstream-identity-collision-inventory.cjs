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
  ['existing source inventory interface owns duplicate identity operation', /interface RequestTypeDerivationSourceEvidenceInventoryInterface[\s\S]*duplicateIdentityWitnesses: \(input: RequestTypeDerivationInput\) => readonly RequestTypeDuplicateIdentityWitness\[\]/.test(contract)],
  ['collision witnesses retain canonical semantic key and source occurrence pair', /occurrences: Object\.freeze\(\{ first, second, additional: Object\.freeze\(occurrences\.slice\(2\)\) \}\)/.test(inventory) && /semanticKey: route\.semanticKey/.test(inventory)],
  ['route, resource, and request identity domains are separately witnessed', ["domain: 'routes'", "domain: 'resources'", "domain: 'requests'"].every(value => inventory.includes(value))],
  ['duplicate detection does not collapse occurrences or mint traversal-based keys', /canonicalRouteOccurrenceKey/.test(inventory) && /canonicalResourceOccurrenceKey/.test(inventory) && /canonicalRequestOccurrenceKey/.test(inventory) && /occurrenceKey/.test(inventory)],
  ['identity operation is exported as an interface-typed operation value', /export const requestTypeDerivationDuplicateIdentityWitnesses: RequestTypeDerivationSourceEvidenceInventoryInterface\['duplicateIdentityWitnesses'\]/.test(inventory) && /duplicateIdentityWitnesses: requestTypeDerivationDuplicateIdentityWitnesses/.test(inventory)],
  ['preparation carries collision-free versus collision-bearing ADT', /RequestTypeDerivationIdentityCollisionInventory/.test(contract) && /identity_inventory_collision_free/.test(contract) && /identity_inventory_collisions/.test(contract)],
  ['preparation delegates collision inventory to canonical upstream identity owner', /requestTypeDerivationSourceEvidenceInventory\.identityCollisionInventory\(input\)/.test(preparation) && /identityCollisionInventory,/.test(preparation)],
  ['collision inventory reports evidence but does not decide judgment disposition', /does not decide whether the final judgment is conflict[\s\S]*That disposition belongs to the semantic reasoning algebra/.test(inventory)],
  ['manifest preflight contract and operation preserve the identity collision ADT', /identityCollisionInventory: RequestTypeDerivationIdentityCollisionInventory/.test(preflightContract) && /identityCollisionInventory: prepared.identityCollisionInventory/.test(preflight)],
  ['core and upstream public surfaces export collision operation and ADT', /requestTypeDerivationDuplicateIdentityWitnesses/.test(coreExports) && /requestTypeDerivationDuplicateIdentityWitnesses/.test(upstreamExports) && /RequestTypeDerivationIdentityCollisionInventory/.test(coreExports + upstreamExports)],
  ['no forbidden semantic foundation or relation imports introduced', !/semantic\/(foundation|relations|relation)/.test(contract + inventory + preparation)],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
console.log(`Phase 2640 upstream identity collision inventory audit: ${checks.filter(([, passed]) => passed).length}/${checks.length} passed`);
process.exitCode = checks.some(([, passed]) => !passed) ? 1 : 0;
