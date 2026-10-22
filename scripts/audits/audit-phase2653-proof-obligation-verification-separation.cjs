const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, passed, detail) => checks.push({ name, passed: Boolean(passed), detail });

const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const coverage = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationCoverage.ts');
const production = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProductionComposition.ts');
const lawInventory = contract.slice(contract.indexOf('export const REQUEST_TYPE_DERIVATION_LAW_IDS = ['), contract.indexOf('] as const;', contract.indexOf('export const REQUEST_TYPE_DERIVATION_LAW_IDS = [')));
const lawIds = [...lawInventory.matchAll(/^  '([a-z_]+)',$/gm)].map(match => match[1]);
const proofDeclaration = contract.slice(contract.indexOf('export interface RequestTypeDerivationProof {'), contract.indexOf('export type RequestTypeDerivationConflict ='));
const verificationDeclaration = contract.slice(contract.indexOf('export type RequestTypeDerivationVerification ='), contract.indexOf('export interface RequestTypeDerivationContract {'));

check(
  'canonical-law-set-remains-closed-at-34-laws',
  lawIds.length === 34 && contract.includes('RequestTypeDerivationRequiredLawCoverage = Readonly<') && contract.includes('Record<RequestTypeDerivationLawId, \'required\'>'),
  `law IDs found=${lawIds.length}; required coverage is a closed mapped type`,
);
check(
  'producer-proof-records-required-obligations-not-verified-laws',
  /readonly requiredLaws: RequestTypeDerivationRequiredLawCoverage/.test(proofDeclaration)
    && !/readonly laws: RequestTypeDerivationVerifiedLawCoverage/.test(proofDeclaration),
  'RequestTypeDerivationProof cannot self-assert verified-law coverage',
);
check(
  'only-verification-valid-variant-carries-verified-law-coverage',
  /kind: 'valid'[\s\S]*?verifiedLaws: RequestTypeDerivationVerifiedLawCoverage/.test(verificationDeclaration),
  'verified-law coverage remains on the verifier result ADT',
);
check(
  'coverage-operation-still-requires-all-verifier-laws',
  coverage.includes("verification.verifiedLaws[law] !== 'verified'")
    && coverage.includes("contract.laws[law] !== 'required'"),
  'coverage checks contract obligations and independently returned verifier coverage',
);
check(
  'production-composition-does-not-fabricate-missing-capabilities',
  /does not ship concrete production reasoning\/verifier\//.test(production)
    && /Legacy RequestType\[\] fallback is disabled/.test(production),
  'the change does not disguise the remaining producer/verifier/composition gap',
);

for (const result of checks) process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}: ${result.detail}\n`);
const failed = checks.filter(result => !result.passed);
process.stdout.write(`\n${checks.length - failed.length}/${checks.length} assertions passed.\n`);
if (failed.length) process.exitCode = 1;
