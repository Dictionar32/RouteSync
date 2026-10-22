'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const operation = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationRequestResolution.ts');
const inventory = read('packages/core/src/types/upstream/requestTypeDerivationSourceEvidenceInventory.ts');
const publicEntry = read('packages/core/src/index.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['candidate cardinality is modeled as a closed upstream ADT', /type RequestTypeRequestCandidateSelection\s*=/.test(contract) && /interface RequestTypeRequestCandidateSelectionInterface/.test(contract)],
  ['resolver delegates candidate cardinality to an explicit operation', /requestTypeRequestCandidateSelection\.select/.test(operation)],
  ['resolver does not index candidate arrays or invent undefined fallback', !/exactCandidates\[0\]|normalizedCandidates\[0\]|undefined/.test(operation)],
  ['request resolution has an upstream-owned operation interface', /interface RequestTypeDerivationRequestResolutionInterface/.test(contract)],
  ['operation is exported as a typed immutable interface value', /export const requestTypeDerivationRequestResolution:\s*RequestTypeDerivationRequestResolutionInterface\s*= Object\.freeze/.test(operation)],
  ['operation consumes canonical request evidence references', /readonly requests: readonly RequestTypeRequestEvidenceReference\[\]/.test(contract) && /canonicalIdentity\.requestName/.test(operation)],
  ['exact match is resolved before normalized match', operation.indexOf('exactSelection') < operation.indexOf('query.toLowerCase()')],
  ['exact ambiguity remains a closed conflict-like result', /kind: 'ambiguous_exact'/.test(contract)],
  ['normalized ambiguity remains a closed conflict-like result', /kind: 'ambiguous_normalized'/.test(contract)],
  ['missing and ambiguity remain explicit ADT outcomes', /kind: 'missing', query/.test(operation) && /kind: 'ambiguous_exact'/.test(contract) && /kind: 'ambiguous_normalized'/.test(contract)],
  ['operation does not depend on semantic foundation or relations', !/semantic\/(foundation|relations)/.test(operation)],
  ['canonical identity is sourced from the existing inventory operation', /canonicalRequestIdentity/.test(inventory)],
  ['resolution operation and its closed result are reachable through the package entry', /requestTypeDerivationRequestResolution, requestTypeRequestCandidateSelection } from '.\/compiler\/semantic\/request-type-derivation\/requestTypeDerivationRequestResolution'/.test(publicEntry) && /RequestTypeRequestResolution/.test(publicEntry)],
  ['audit is registered in package scripts', packageJson.scripts['audit:phase2535-upstream-request-resolution-operation'] === 'node scripts/audits/audit-phase2535-upstream-request-resolution-operation.cjs'],
];
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
const failed = checks.filter(([, passed]) => !passed);
process.stdout.write(`\n${checks.length - failed.length}/${checks.length} assertions passed\n`);
process.exitCode = Number(failed.length > 0);
