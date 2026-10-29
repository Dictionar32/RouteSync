const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const contract = fs.readFileSync(contractPath, 'utf8');
const baseline = '/mnt/data/routesync-phase1580-baseline/RouteSync';
const untouched = [
  'packages/core/src/compiler/scanner/operations/RequestTypeDeriver.ts',
  'packages/core/src/compiler/scanner/operations/request-deriver/groupAggregator.ts',
  'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationAuthority.ts',
  'packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationRuntimeExecutor.ts',
];
const rules = contract.match(/export const REQUEST_TYPE_AUTHORITY_DECISION_RULE_IDS\s*=\s*\[([\s\S]*?)\] as const;/);
const ruleIds = rules ? [...rules[1].matchAll(/'([^']+)'/g)].map((m) => m[1]) : [];
const completeCoverage = contract.match(/readonly kind: 'complete';([\s\S]*?)\n    }>\n  \| Readonly<\{/);
const successfulRules = [
  ['closed_derivation_with_complete_verification', 'derived', 'derivation_verified'],
  ['incomplete_derivation_with_complete_verification', 'incomplete', 'incompleteness_verified'],
  ['conflicted_derivation_with_complete_verification', 'conflict', 'conflict_verified'],
];
const checks = [
  ['all 11 authority decision rules remain uniquely registered', ruleIds.length === 11 && new Set(ruleIds).size === 11],
  ['rule coverage is exhaustive through a mapped type', /Record<RequestTypeAuthorityDecisionRuleId, 'required'>/.test(contract)],
  ['complete coverage binds the contract to the valid verification witness', Boolean(completeCoverage && /contract: RequestTypeDerivationContract/.test(completeCoverage[1]) && /verification: Extract<RequestTypeDerivationVerification, \{ readonly kind: 'valid' \}>/.test(completeCoverage[1]))],
  ['complete coverage no longer duplicates the verified-law ledger', Boolean(completeCoverage && !/verifiedLaws:/.test(completeCoverage[1]))],
  ['each successful outcome carries a correctly narrowed judgment and bound coverage', successfulRules.every(([rule, judgment, conclusion]) => {
    const start = contract.indexOf(`readonly ruleId: '${rule}'`);
    const end = contract.indexOf(`readonly conclusion: '${conclusion}'`, start);
    if (start < 0 || end < 0) return false;
    const branch = contract.slice(start, end);
    return branch.includes(`readonly kind: '${judgment}'`) && /coverage: Extract<RequestTypeAuthorityCoverageEvidence, \{ readonly kind: 'complete' \}>/.test(branch) && !/readonly verification:/.test(branch);
  })],
  ['failure and rejection proofs retain typed verification counterevidence', /ruleId: 'non_invalid_judgment_with_counterexample'[\s\S]*?verification: RequestTypeDerivationVerificationFailure/.test(contract) && /ruleId: 'invalid_input_with_matching_rejection_witness'[\s\S]*?verification: Extract<RequestTypeDerivationVerification, \{ readonly kind: 'rejection_confirmed' \}>/.test(contract)],
  ['contract and verification coverage failures carry non-empty missing-law ledgers', /kind: 'contract_incomplete'[\s\S]*?missingLaws: RequestTypeNonEmptyLedger<RequestTypeDerivationLawId>/.test(contract) && /kind: 'verification_incomplete'[\s\S]*?missingLaws: RequestTypeNonEmptyLedger<RequestTypeDerivationLawId>/.test(contract)],
  ['assessment variants reference the proof as their sole decision evidence', /export type RequestTypeDerivationSemanticAuthorityAssessment =[\s\S]*?readonly decision: Extract<RequestTypeAuthorityDecisionProof/.test(contract) && !/readonly kind: 'derivation_verified';\s*readonly judgment:/.test(contract)],
  ['semantic authority interface returns the closed proof-carrying assessment', /export interface RequestTypeDerivationSemanticAuthorityInterface\s*\{[\s\S]*?evaluate:\s*\(\s*input: RequestTypeDerivationInput,?\s*\)\s*=> RequestTypeDerivationSemanticAuthorityAssessment/.test(contract)],
  ['scanner, authority implementation, and executor remain byte-for-byte unchanged', untouched.every((relative) => crypto.createHash('sha256').update(fs.readFileSync(path.join(baseline, relative))).digest('hex') === crypto.createHash('sha256').update(fs.readFileSync(path.join(root, relative))).digest('hex'))],
  ['contract documents that the successful verification witness has a single owner', /verified-law ledger has exactly one owner/.test(contract)],
];
const failures = checks.filter(([, pass]) => !pass).map(([name]) => name);
const report = {
  phase: 1580,
  audit: 'single-owner-verification-coverage-contract',
  passed: checks.length - failures.length,
  total: checks.length,
  checks: checks.map(([name, pass]) => ({ name, passed: pass })),
  failures,
  scope: 'upstream interface contract only; scanner wiring, authority implementation, and runtime executor remain unchanged',
};
fs.writeFileSync(path.join(root, 'PHASE1580_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
