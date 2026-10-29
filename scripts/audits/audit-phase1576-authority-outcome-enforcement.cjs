const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contract = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/requestTypeDerivationInterface.ts'), 'utf8');
const authority = fs.readFileSync(path.join(root, 'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationAuthority.ts'), 'utf8');
const scanner = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/operations/RequestTypeDeriver.ts'), 'utf8');
const executor = fs.readFileSync(path.join(root, 'packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationRuntimeExecutor.ts'), 'utf8');
const lawRegistry = contract.match(/export const REQUEST_TYPE_DERIVATION_LAW_IDS\s*=\s*\[([\s\S]*?)\] as const;/);
const lawIds = lawRegistry ? [...lawRegistry[1].matchAll(/'([^']+)'/g)].map((match) => match[1]) : [];
const checks = [
  ['canonical law registry contains all 32 laws', lawIds.length === 32],
  ['canonical law registry contains no duplicate identifiers', new Set(lawIds).size === lawIds.length],
  ['law identifiers have one canonical runtime registry', /export const REQUEST_TYPE_DERIVATION_LAW_IDS = \[/.test(contract) && /export type RequestTypeDerivationLawId = typeof REQUEST_TYPE_DERIVATION_LAW_IDS\[number\]/.test(contract)],
  ['runtime gate validates exact required and verified law coverage', /hasCompleteLawCoverage\(contract\.laws, 'required'\)/.test(authority) && /hasCompleteLawCoverage\(verification\.verifiedLaws, 'verified'\)/.test(authority)],
  ['kernel separates semantic derivation from authority boundary', /interface RequestTypeDerivationSemanticKernel\s*\{[\s\S]*?deriveJudgment:[\s\S]*?verify:/.test(authority)],
  ['authority derives a judgment and always invokes verification before classification', /const judgment = kernel\.deriveJudgment\(input\);\s*const verification = verify\(input, judgment\);\s*if \(!hasCompleteLawCoverage\(contract\.laws, 'required'\)\)/.test(authority) && /return classifyAuthorityResult\(judgment, verification\);/.test(authority)],
  ['verified result requires non-invalid judgment and valid verification', /if \(verification\.kind === 'valid'\)\s*\{\s*return Object\.freeze\(\{ kind: 'verified', judgment, verification \}\);/.test(authority)],
  ['input rejection requires rejection-confirmed verification', /verification\.kind === 'rejection_confirmed'[\s\S]*?return Object\.freeze\(\{ kind: 'input_rejected', judgment, verification \}\)/.test(authority)],
  ['failed rejection verification has its own outcome', /kind: 'rejection_verification_failed';[\s\S]*?judgment: Extract<RequestTypeDerivationJudgment, \{ readonly kind: 'invalid_input' \}>;[\s\S]*?verification: RequestTypeDerivationVerificationFailure;/.test(contract) && /kind: 'rejection_verification_failed', judgment, verification/.test(authority)],
  ['contradictory judgment and verification kinds are explicit', /kind: 'authority_inconsistent';[\s\S]*?judgment: RequestTypeDerivationJudgment;[\s\S]*?verification: RequestTypeDerivationVerification;/.test(contract) && authority.includes("kind: 'authority_inconsistent'")],
  ['rejection reason and evidence mismatch cannot be promoted to trusted rejection', authority.includes("reason: 'rejection_reason_mismatch'") && authority.includes("verification.reason !== judgment.reason") && authority.includes('areEquivalentEvidenceValues(verification.evidence, judgment.evidence)')],
  ['authority returns the contract and freezes its public surface', /return Object\.freeze\(\{\s*contract,\s*derive,\s*verify,\s*\}\)/.test(authority)],
  ['scanner has not yet been falsely claimed as migrated', /aggregateRequestTypeGroups\(routes, resources, ctx\)/.test(scanner) && !scanner.includes('createRequestTypeDerivationAuthority')],
  ['runtime executor remains unchanged and last in migration sequence', executor.includes('authority.resolve(request)') && !executor.includes('RequestTypeDerivationAuthorityInterface')],
];
const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);
const report = {
  phase: 1576,
  audit: 'authority-outcome-enforcement',
  passed: checks.length - failures.length,
  total: checks.length,
  checks: checks.map(([name, passed]) => ({ name, passed })),
  failures,
  scope: 'static structural audit; behavioral matrix was separately exercised against the transpiled authority boundary; semantic law verification remains delegated to the injected kernel',
};
fs.writeFileSync(path.join(root, 'PHASE1576_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
