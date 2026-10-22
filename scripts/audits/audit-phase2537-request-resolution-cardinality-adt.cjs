'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const operation = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationRequestResolution.ts');
const entry = read('packages/core/src/index.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['candidate cardinality has none/one/many closed variants', /kind: 'none'/.test(contract) && /kind: 'one'/.test(contract) && /kind: 'many'/.test(contract)],
  ['many-candidate variant structurally requires first and second candidates', /readonly first: RequestTypeRequestEvidenceReference;\s*readonly second: RequestTypeRequestEvidenceReference;/.test(contract)],
  ['candidate cardinality is an explicit interface operation', /interface RequestTypeRequestCandidateSelectionInterface/.test(contract) && /select: \(\s*candidates: readonly RequestTypeRequestEvidenceReference\[\]/.test(contract)],
  ['candidate selection operation is exported as immutable typed value', /export const requestTypeRequestCandidateSelection: RequestTypeRequestCandidateSelectionInterface = Object\.freeze/.test(operation)],
  ['resolution delegates selection rather than indexing candidate arrays', /requestTypeRequestCandidateSelection\.select/.test(operation) && !/\w+Candidates\[0\]/.test(operation)],
  ['exact identity is considered before normalized identity', operation.indexOf('exactSelection') < operation.indexOf('query.toLowerCase()')],
  ['ambiguity is preserved instead of first-candidate selection', /kind: exact \? 'ambiguous_exact' : 'ambiguous_normalized'/.test(operation)],
  ['missing stays an explicit resolution result', /kind: 'missing', query/.test(operation)],
  ['operation has no foundation or relation dependencies', !/semantic\/(foundation|relations)/.test(operation)],
  ['candidate selection and resolution are publicly exported', /requestTypeRequestCandidateSelection/.test(entry) && /RequestTypeRequestCandidateSelectionInterface/.test(entry)],
  ['audit is registered in package scripts', packageJson.scripts['audit:phase2537-request-resolution-cardinality-adt'] === 'node scripts/audits/audit-phase2537-request-resolution-cardinality-adt.cjs'],
];
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
const failed = checks.filter(([, passed]) => !passed);
process.stdout.write(`\n${checks.length - failed.length}/${checks.length} assertions passed\n`);
process.exitCode = Number(failed.length > 0);
