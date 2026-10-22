const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/types/upstream/laravelDtoResponseContractProjectionInterface.ts');
const contract = fs.readFileSync(contractPath, 'utf8');
const testPath = path.join(root, 'packages/core/src/types/upstream/__tests__/laravel-dto-response-contract-projection-interface.phase2184.test.ts');
const test = fs.readFileSync(testPath, 'utf8');
const docsPath = path.join(root, 'packages/core/src/types/upstream/docs/PHASE2184-DTO-RESPONSE-PROJECTION-FIELD-SSOT.md');
const docs = fs.readFileSync(docsPath, 'utf8');
const checks = [
  ['domain ResponseContractField is reused', /import type \{ ResponseContract, ResponseContractField \}/.test(contract) && /readonly field: ResponseContractField/.test(contract)],
  ['duplicated field name/value/nullability fields are absent', !/readonly name: ResponseContract\['fields'\]\[number\]\['name'\]/.test(contract) && !/readonly value: ResponseValueContract/.test(contract) && !/readonly nullability: ResponseContract\['fields'\]\[number\]\['nullability'\]/.test(contract)],
  ['source provenance remains on each field projection', /interface LaravelDtoResponseContractFieldProjection[\s\S]*readonly source: SourceSpan/.test(contract)],
  ['projection outcomes remain a closed resolved/unresolved judgment', /laravel_dto_response_contract_projection_resolved[\s\S]*laravel_dto_response_contract_projection_unresolved/.test(contract)],
  ['contract version is incremented', /contractVersion: 2/.test(contract)],
  ['executor remains interface-only and delegates exact project signature', /readonly execute: Projection\['project'\]/.test(contract) && !/const .*RuntimeExecutor/.test(contract)],
  ['type regression checks reuse canonical field type', /toEqualTypeOf<ResponseContractField>/.test(test)],
  ['no relation/foundation/subscanner additions', !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/laravelDtoResponseProjectionFoundation.ts')) && /No relation\/foundation layer, subscanner/.test(docs)],
];
let failed = 0;
for (const [name, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!ok) failed++;
}
process.stdout.write(`\n${checks.length - failed}/${checks.length} static checks passed\n`);
process.exitCode = failed ? 1 : 0;
