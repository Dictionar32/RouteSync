const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const verifierPath = path.join(root, 'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceOccurrenceVerification.ts');
const preparationPath = path.join(root, 'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticInputPreparation.ts');
const verifier = fs.readFileSync(verifierPath, 'utf8');
const preparation = fs.readFileSync(preparationPath, 'utf8');
const body = verifier.slice(verifier.indexOf('const sourceOccurrenceViolations ='), verifier.indexOf('const toCanonicalFailure ='));
const assertions = [
  ['source occurrence guard accepts the complete prepared packet', /preparation: RequestTypeDerivationSemanticInputPreparation/.test(body)],
  ['raw source input is read from the exact packet being verified', /const input = preparation\.input/.test(body)],
  ['prepared inventory keys are independently compared to source input keys', /preparedInventoryKeys/.test(body) && /sameKeyMultiset\(expected, prepared\)/.test(body)],
  ['prepared source evidence is checked against the prepared inventory', /preparedSourceEvidenceKeys/.test(body) && /sameKeyMultiset\(prepared, sourceEvidence\)/.test(body)],
  ['proof evidence is checked against source input, not trusted packet metadata', /sameKeyMultiset\(expected, proof\)/.test(body)],
  ['the verifier keeps canonical source-coordinate membership checks', /sourceOccurrenceInputMembership\(source, input\)/.test(body)],
  ['preparation constructs inventory and source evidence from the same input', /const inventory = requestTypeDerivationSourceEvidenceInventory\.inventory\(input\)/.test(preparation) && /sourceEvidence: Object\.freeze\(\[\.\.\.inventory\.routes, \.\.\.inventory\.resources, \.\.\.inventory\.requests\]\)/.test(preparation)],
  ['no semantic foundation dependency is introduced', !/semantic\/foundation/.test(verifier + preparation)],
  ['guard delegates remaining laws and never upgrades a partial check to valid', /inference packet is passed to the complete verifier/.test(verifier) && /failure \?\? delegate\.verify\(inference\)\.result/.test(verifier)],
];
let failed = 0;
for (const [name, passed] of assertions) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`\n${assertions.length - failed}/${assertions.length} assertions passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
