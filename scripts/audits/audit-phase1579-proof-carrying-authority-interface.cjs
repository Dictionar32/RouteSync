const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const contract = fs.readFileSync(contractPath, 'utf8');
const baseline = '/mnt/data/routesync-phase1578-work/RouteSync';
const untouched = [
  'packages/core/src/compiler/scanner/subscanners/RequestTypeDeriver.ts',
  'packages/core/src/compiler/scanner/subscanners/request-deriver/groupAggregator.ts',
  'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationAuthority.ts',
  'packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationRuntimeExecutor.ts',
];
const ruleMatch = contract.match(/export const REQUEST_TYPE_AUTHORITY_DECISION_RULE_IDS\s*=\s*\[([\s\S]*?)\] as const;/);
const ruleIds = ruleMatch ? [...ruleMatch[1].matchAll(/'([^']+)'/g)].map((match) => match[1]) : [];
const checks = [
  ['all 11 authority decision rules remain uniquely registered', ruleIds.length === 11 && new Set(ruleIds).size === 11],
  ['rule coverage is exhaustive through a mapped type', /Record<RequestTypeAuthorityDecisionRuleId, 'required'>/.test(contract)],
  ['coverage evidence carries the contract and verified law ledger', /kind: 'complete'[\s\S]*?contract: RequestTypeDerivationContract[\s\S]*?verifiedLaws: RequestTypeDerivationVerifiedLawCoverage/.test(contract)],
  ['coverage failure cases carry typed missing-law evidence', /kind: 'contract_incomplete'[\s\S]*?missingLaws: RequestTypeNonEmptyLedger<RequestTypeDerivationLawId>/.test(contract) && /kind: 'verification_incomplete'[\s\S]*?missingLaws: RequestTypeNonEmptyLedger<RequestTypeDerivationLawId>/.test(contract)],
  ['successful derivation proof carries actual derived judgment, valid verification, and complete coverage', /ruleId: 'closed_derivation_with_complete_verification'[\s\S]*?judgment: Extract<RequestTypeDerivationJudgment, \{ readonly kind: 'derived' \}>[\s\S]*?verification: Extract<RequestTypeDerivationVerification, \{ readonly kind: 'valid' \}>[\s\S]*?coverage: Extract<RequestTypeAuthorityCoverageEvidence, \{ readonly kind: 'complete' \}>[\s\S]*?conclusion: 'derivation_verified'/.test(contract)],
  ['incomplete and conflict judgments are carried as distinct proof premises', /ruleId: 'incomplete_derivation_with_complete_verification'[\s\S]*?judgment: Extract<RequestTypeDerivationJudgment, \{ readonly kind: 'incomplete' \}>/.test(contract) && /ruleId: 'conflicted_derivation_with_complete_verification'[\s\S]*?judgment: Extract<RequestTypeDerivationJudgment, \{ readonly kind: 'conflict' \}>/.test(contract)],
  ['failure and rejection proofs retain actual verification evidence', /ruleId: 'non_invalid_judgment_with_counterexample'[\s\S]*?verification: RequestTypeDerivationVerificationFailure/.test(contract) && /ruleId: 'invalid_input_with_matching_rejection_witness'[\s\S]*?verification: Extract<RequestTypeDerivationVerification, \{ readonly kind: 'rejection_confirmed' \}>/.test(contract)],
  ['assessment no longer duplicates judgment and verification outside its proof', /Closed semantic authority assessment\.[\s\S]*?single source of its[\s\S]*?readonly decision: Extract<RequestTypeAuthorityDecisionProof/.test(contract) && !/readonly kind: 'derivation_verified';\s*readonly judgment:/.test(contract)],
  ['interface evaluate returns the closed proof-carrying assessment', /export interface RequestTypeDerivationSemanticAuthorityInterface\s*\{[\s\S]*?evaluate:\s*\(\s*input: RequestTypeDerivationInput,?\s*\)\s*=> RequestTypeDerivationSemanticAuthorityAssessment/.test(contract)],
  ['scanner, authority implementation, and runtime executor remain byte-for-byte unchanged', untouched.every((relative) => {
    const before = fs.readFileSync(path.join(baseline, relative));
    const after = fs.readFileSync(path.join(root, relative));
    return crypto.createHash('sha256').update(before).digest('hex') === crypto.createHash('sha256').update(after).digest('hex');
  })],
];
const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);
const report = {
  phase: 1579,
  audit: 'proof-carrying-semantic-authority-interface',
  passed: checks.length - failures.length,
  total: checks.length,
  checks: checks.map(([name, passed]) => ({ name, passed })),
  failures,
  scope: 'upstream interface contract only; scanner wiring, authority implementation, and runtime executor remain unchanged',
};
fs.writeFileSync(path.join(root, 'PHASE1579_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
