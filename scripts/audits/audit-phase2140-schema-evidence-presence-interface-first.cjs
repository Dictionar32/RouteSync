const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const authorityPath = path.join(root, 'packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentAuthority.ts');
const interfacePath = path.join(root, 'packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentInterface.ts');
const authority = fs.readFileSync(authorityPath, 'utf8');
const contract = fs.readFileSync(interfacePath, 'utf8');
const checks = [
  ['authority contract version advanced to 3', /contractVersion:\s*3/.test(authority)],
  ['interface contract version advanced to 3', /readonly contractVersion:\s*3/.test(contract)],
  ['request evidence discriminant owns derivation selection', /switch\s*\(input\.requestEvidence\.kind\)/.test(authority)],
  ['absence is an explicit ADT case', /case 'no_form_request_schema_evidence':\s*derivation = inlineValidationDerivation/.test(authority)],
  ['present form-request evidence stays present even with zero fields', /case 'form_request_schema_evidence':\s*derivation = formRequestDerivation\(input\.requestEvidence\.source\.fields, input\.inlineSchema\)/.test(authority)],
  ['field cardinality no longer decides form-request presence', !/relationEqual\(formFields\.length,\s*0\)/.test(authority) && !/formRequestFields\(input\.requestEvidence\)/.test(authority)],
  ['interface records evidence-discriminant ownership', /form-request-presence-is-decided-by-the-evidence-discriminant-not-by-field-cardinality/.test(contract)],
  ['schema merge still preserves inline validation provenance', /inlineSchema\.validationEntries/.test(authority)],
];
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
}
process.stdout.write(`${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed\n`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
