const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const barrelPath = path.join(root, 'packages/core/src/types/upstream/index.ts');
const contract = fs.readFileSync(contractPath, 'utf8');
const barrel = fs.readFileSync(barrelPath, 'utf8');
const checks = [
  ['evidence key is domain tagged', /type RequestTypeEvidenceKey\s*=/.test(contract) && /`route:\$\{string\}`/.test(contract) && /`resource:\$\{string\}`/.test(contract) && /`request:\$\{string\}`/.test(contract)],
  ['evidence reference correlates key and source domain', /source: Extract<RequestTypeSourceEvidenceIdentity, \{ readonly kind: 'route' \}>;\s*readonly semanticKey: `route:\$\{string\}`/.test(contract) && /source: Extract<RequestTypeSourceEvidenceIdentity, \{ readonly kind: 'resource' \}>;\s*readonly semanticKey: `resource:\$\{string\}`/.test(contract) && /source: Extract<RequestTypeSourceEvidenceIdentity, \{ readonly kind: 'request' \}>;\s*readonly semanticKey: `request:\$\{string\}`/.test(contract)],
  ['route resource and request references are specialized', /type RequestTypeRouteEvidenceReference = Extract/.test(contract) && /type RequestTypeResourceEvidenceReference = Extract/.test(contract) && /type RequestTypeRequestEvidenceReference = Extract/.test(contract)],
  ['source ADT preserves framework request binding', /requestBindingKind: RouteSemanticFlow\['binding'\]\['request'\]\['kind'\]/.test(contract) && /framework_request_binding/.test(contract)],
  ['explicit no-request and framework-request exclusions are distinct', /reason: 'no_request_binding' \| 'framework_request_binding'/.test(contract) && /frameworkRequestBinding: 'accounted_exclusion'/.test(contract)],
  ['group action contribution is represented in proof model', /RequestTypeActionContributionReceipt/.test(contract) && /appended' \| 'replaced_existing' \| 'retained_existing'/.test(contract)],
  ['group response contribution is represented in proof model', /RequestTypeResponseContributionReceipt/.test(contract) && /accepted_incoming/.test(contract) && /retained_existing/.test(contract)],
  ['group membership cannot substitute for contribution receipts', /contributions: readonly RequestTypeGroupContributionReceipt\[\]/.test(contract)],
  ['verification distinguishes source key and binding errors', /source_key_domain_mismatch/.test(contract) && /request_binding_disposition_mismatch/.test(contract)],
  ['verification distinguishes missing contribution ledger', /contribution_ledger_mismatch/.test(contract)],
  ['new laws are included in canonical law list', /evidence_key_matches_source_domain/.test(contract.slice(contract.indexOf('REQUEST_TYPE_DERIVATION_LAWS'))) && /every_group_contribution_has_receipt/.test(contract.slice(contract.indexOf('REQUEST_TYPE_DERIVATION_LAWS')))],
  ['upstream barrel exports the canonical interface', /export \* from '\.\/requestTypeDerivationInterface'/.test(barrel)],
];
const failures = checks.filter(([, ok]) => !ok).map(([name]) => name);
const report = {
  phase: 1561,
  audit: 'request-type-interface-closure',
  passed: checks.length - failures.length,
  total: checks.length,
  checks: checks.map(([name, ok]) => ({ name, passed: ok })),
  failures,
  scope: 'static interface-model audit only; does not claim authority/runtime implementation or full build verification',
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (failures.length) process.exitCode = 1;
