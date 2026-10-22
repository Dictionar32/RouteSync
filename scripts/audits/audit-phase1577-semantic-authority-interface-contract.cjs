const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const contract = fs.readFileSync(contractPath, 'utf8');
const baseline = '/mnt/data/routesync-phase1576-work/RouteSync';
const untouched = [
  'packages/core/src/compiler/scanner/subscanners/RequestTypeDeriver.ts',
  'packages/core/src/compiler/scanner/subscanners/request-deriver/groupAggregator.ts',
  'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationAuthority.ts',
  'packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationRuntimeExecutor.ts',
];
const ruleMatch = contract.match(/export const REQUEST_TYPE_AUTHORITY_DECISION_RULE_IDS\s*=\s*\[([\s\S]*?)\] as const;/);
const ruleIds = ruleMatch ? [...ruleMatch[1].matchAll(/'([^']+)'/g)].map((match) => match[1]) : [];
const checks = [
  ['semantic authority decision rules are declared as one canonical tuple', ruleIds.length === 9],
  ['decision rule IDs are unique', new Set(ruleIds).size === ruleIds.length],
  ['rule coverage is exhaustive by mapped type', /Record<RequestTypeAuthorityDecisionRuleId, 'required'>/.test(contract)],
  ['decision proofs explicitly encode premises and conclusions', /export type RequestTypeAuthorityDecisionProof\s*=/.test(contract) && /readonly premises: Readonly</.test(contract) && /readonly conclusion: 'verified'/.test(contract)],
  ['verified outcome requires a non-invalid judgment and valid verification', /kind: 'verified';[\s\S]*?judgment: Exclude<RequestTypeDerivationJudgment, \{ readonly kind: 'invalid_input' \}>;[\s\S]*?verification: Extract<RequestTypeDerivationVerification, \{ readonly kind: 'valid' \}>;[\s\S]*?decision: Extract<RequestTypeAuthorityDecisionProof, \{ readonly conclusion: 'verified' \}>/.test(contract)],
  ['rejection outcome requires a typed rejection judgment and matching-witness decision', /kind: 'input_rejected';[\s\S]*?judgment: Extract<RequestTypeDerivationJudgment, \{ readonly kind: 'invalid_input' \}>;[\s\S]*?decision: Extract<RequestTypeAuthorityDecisionProof, \{ readonly conclusion: 'input_rejected' \}>/.test(contract) && /rejectionWitness: 'structurally_equivalent'/.test(contract)],
  ['inconsistency causes have explicit rule proofs', ['judgment_verification_kind_conflict','rejection_reason_conflict','rejection_evidence_conflict','contract_law_coverage_incomplete','verified_law_coverage_incomplete'].every((id) => ruleIds.includes(id))],
  ['new semantic authority interface accepts one input and returns one closed assessment', /export interface RequestTypeDerivationSemanticAuthorityInterface\s*\{[\s\S]*?evaluate:\s*\(\s*input: RequestTypeDerivationInput,?\s*\)\s*=> RequestTypeDerivationSemanticAuthorityAssessment/.test(contract)],
  ['legacy runtime-facing interface is explicitly transitional', /@deprecated Transitional contract retained until the authority executor is migrated in a later phase\./.test(contract)],
  ['scanner, old authority implementation and runtime executor remain untouched', untouched.every((relative) => {
    const before = fs.readFileSync(path.join(baseline, relative));
    const after = fs.readFileSync(path.join(root, relative));
    return crypto.createHash('sha256').update(before).digest('hex') === crypto.createHash('sha256').update(after).digest('hex');
  })],
];
const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);
const report = {
  phase: 1577,
  audit: 'semantic-authority-interface-contract',
  passed: checks.length - failures.length,
  total: checks.length,
  checks: checks.map(([name, passed]) => ({ name, passed })),
  failures,
  scope: 'interface-only structural audit; no scanner wiring, authority runtime, or executor implementation changed',
};
fs.writeFileSync(path.join(root, 'PHASE1577_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
