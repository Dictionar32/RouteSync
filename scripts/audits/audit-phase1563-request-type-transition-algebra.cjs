const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const barrelPath = path.join(root, 'packages/core/src/types/upstream/index.ts');
const contract = fs.readFileSync(contractPath, 'utf8');
const barrel = fs.readFileSync(barrelPath, 'utf8');
const checks = [
  ['source evidence keys are domain tagged', /type RequestTypeEvidenceKey\s*=/.test(contract) && /`route:\$\{string\}`/.test(contract) && /`resource:\$\{string\}`/.test(contract) && /`request:\$\{string\}`/.test(contract)],
  ['group identity is a domain-separated resource key', /type RequestTypeGroupKey = `resource:\$\{string\}`/.test(contract)],
  ['route contribution cannot claim an unresolved resource', /readonly resource: RequestTypeResourceEvidenceReference;/.test(contract) && !/readonly resource: RequestTypeResourceEvidenceReference \| Readonly<\{ readonly kind: 'unresolved_resource'/.test(contract)],
  ['unresolved resource remains an explicit route disposition', /kind: 'unresolved'; readonly reason: 'request_missing' \| 'resource_missing'/.test(contract)],
  ['route request binding preserves framework versus absent binding', /requestBindingKind: RouteSemanticFlow\['binding'\]\['request'\]\['kind'\]/.test(contract) && /framework_request_binding/.test(contract)],
  ['evidence reference correlates source kind and key prefix', /source: Extract<RequestTypeSourceEvidenceIdentity, \{ readonly kind: 'route' \}>;\s*readonly semanticKey: `route:\$\{string\}`/.test(contract) && /source: Extract<RequestTypeSourceEvidenceIdentity, \{ readonly kind: 'resource' \}>;\s*readonly semanticKey: `resource:\$\{string\}`/.test(contract) && /source: Extract<RequestTypeSourceEvidenceIdentity, \{ readonly kind: 'request' \}>;\s*readonly semanticKey: `request:\$\{string\}`/.test(contract)],
  ['action contribution receipts are modeled', /RequestTypeActionContributionReceipt/.test(contract) && /replaced_existing/.test(contract)],
  ['response contribution receipts are modeled', /RequestTypeResponseContributionReceipt/.test(contract) && /accepted_incoming/.test(contract)],
  ['group contribution records initial versus merge transition', /transition: 'initial_group' \| 'merge_existing_group'/.test(contract)],
  ['group contribution records complete before state', /readonly before: RequestType \| Readonly<\{ readonly kind: 'group_absent' \}>/.test(contract)],
  ['group contribution records incoming actions and response', /readonly incoming: Readonly<\{\s*readonly actions: RequestType\['actions'\];\s*readonly response: RequestType\['response'\];\s*\}>/.test(contract)],
  ['group contribution records complete after state', /readonly after: RequestType;/.test(contract)],
  ['policy defines initial and merge transition semantics', /initialGroup: 'before_absent_after_equals_initial_result'/.test(contract) && /mergeGroup: 'before_present_after_equals_policy_merge'/.test(contract)],
  ['policy defines contribution-chain continuity', /chain: 'each_before_equals_previous_after'/.test(contract)],
  ['policy binds group output to final transition', /finalOutput: 'equals_last_after'/.test(contract)],
  ['group receipt carries complete semantic result', /readonly result: RequestType;\s*readonly resultIdentity: RequestType\['identity'\]/.test(contract)],
  ['group keys are typed consistently in route and resource relations', /readonly groupKey: RequestTypeGroupKey/.test(contract) && /readonly canonicalKey: RequestTypeGroupKey/.test(contract)],
  ['transition laws are represented in the law algebra', /contribution_transition_is_contiguous/.test(contract) && /contribution_transition_matches_policy/.test(contract) && /group_result_matches_final_transition/.test(contract)],
  ['resolved-resource and canonical-key laws are represented', /contributed_route_has_resolved_resource/.test(contract) && /group_key_matches_resource_identity/.test(contract)],
  ['verification can distinguish transition and group-key failures', /contribution_transition_mismatch/.test(contract) && /contribution_policy_mismatch/.test(contract) && /invalid_group_key/.test(contract)],
  ['transition obligations belong to the type-level law algebra', /type RequestTypeDerivationLawId[\s\S]*contribution_transition_is_contiguous[\s\S]*contribution_transition_matches_policy[\s\S]*group_result_matches_final_transition/.test(contract)],
  ['upstream interface contains no runtime policy objects or executor values', !/export const |Object\.freeze|=>\s*\{/.test(contract)],
  ['upstream barrel exports the interface', /export \* from '\.\/requestTypeDerivationInterface'/.test(barrel)],
];
const failures = checks.filter(([, ok]) => !ok).map(([name]) => name);
const report = {
  phase: 1563,
  audit: 'request-type-transition-algebra',
  passed: checks.length - failures.length,
  total: checks.length,
  checks: checks.map(([name, ok]) => ({ name, passed: ok })),
  failures,
  scope: 'static interface-model audit only; scanner, authority implementation, runtime executor, tests, and full build are not claimed as migrated or verified',
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (failures.length) process.exitCode = 1;
