const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const contract = fs.readFileSync(contractPath, 'utf8');
const baseline = '/mnt/data/routesync-phase1577-work/RouteSync';
const untouched = [
  'packages/core/src/compiler/scanner/operations/RequestTypeDeriver.ts',
  'packages/core/src/compiler/scanner/operations/request-deriver/groupAggregator.ts',
  'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationAuthority.ts',
  'packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationRuntimeExecutor.ts',
];
const ruleMatch = contract.match(/export const REQUEST_TYPE_AUTHORITY_DECISION_RULE_IDS\s*=\s*\[([\s\S]*?)\] as const;/);
const ruleIds = ruleMatch ? [...ruleMatch[1].matchAll(/'([^']+)'/g)].map((match) => match[1]) : [];
const checks = [
  ['semantic authority rule registry declares 11 distinct decision rules', ruleIds.length === 11 && new Set(ruleIds).size === 11],
  ['decision rule coverage is exhaustive by mapped type', /Record<RequestTypeAuthorityDecisionRuleId, 'required'>/.test(contract)],
  ['closed derivation has its own verified conclusion', /ruleId: 'closed_derivation_with_complete_verification'[\s\S]*?judgmentKind: 'derived'[\s\S]*?closureKind: 'closed'[\s\S]*?conclusion: 'derivation_verified'/.test(contract)],
  ['incomplete judgment cannot be represented as a complete derivation outcome', /kind: 'incompleteness_verified'[\s\S]*?Extract<RequestTypeDerivationJudgment, \{ readonly kind: 'incomplete' \}>/.test(contract) && /conclusion: 'incompleteness_verified'/.test(contract)],
  ['conflicted judgment cannot be represented as a complete derivation outcome', /kind: 'conflict_verified'[\s\S]*?Extract<RequestTypeDerivationJudgment, \{ readonly kind: 'conflict' \}>/.test(contract) && /conclusion: 'conflict_verified'/.test(contract)],
  ['verification counterexample remains distinct from verified incomplete/conflicted judgment', /ruleId: 'non_invalid_judgment_with_counterexample'[\s\S]*?verificationKind: 'invalid'[\s\S]*?conclusion: 'verification_failed'/.test(contract)],
  ['typed rejection requires structurally equivalent rejection witness', /ruleId: 'invalid_input_with_matching_rejection_witness'[\s\S]*?rejectionWitness: 'structurally_equivalent'[\s\S]*?conclusion: 'input_rejected'/.test(contract)],
  ['all inconsistency modes retain named rule proofs', ['judgment_verification_kind_conflict','rejection_reason_conflict','rejection_evidence_conflict','contract_law_coverage_incomplete','verified_law_coverage_incomplete'].every((id) => ruleIds.includes(id))],
  ['new authority interface returns one closed semantic assessment', /export interface RequestTypeDerivationSemanticAuthorityInterface\s*\{[\s\S]*?evaluate:\s*\(\s*input: RequestTypeDerivationInput,?\s*\)\s*=> RequestTypeDerivationSemanticAuthorityAssessment/.test(contract)],
  ['scanner, legacy authority implementation, and executor remain untouched', untouched.every((relative) => {
    const before = fs.readFileSync(path.join(baseline, relative));
    const after = fs.readFileSync(path.join(root, relative));
    return crypto.createHash('sha256').update(before).digest('hex') === crypto.createHash('sha256').update(after).digest('hex');
  })],
];
const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);
const report = {
  phase: 1578,
  audit: 'semantic-authority-interface-closure',
  passed: checks.length - failures.length,
  total: checks.length,
  checks: checks.map(([name, passed]) => ({ name, passed })),
  failures,
  scope: 'interface-only structural audit; scanner wiring, legacy authority implementation, and runtime executor are unchanged',
};
fs.writeFileSync(path.join(root, 'PHASE1578_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
