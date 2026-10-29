const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const responsePath = path.join(root, 'packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const indexPath = path.join(root, 'packages/core/src/index.ts');
const response = fs.readFileSync(responsePath, 'utf8');
const index = fs.readFileSync(indexPath, 'utf8');
const checks = [
  ['correlation judgment ADT exists', response.includes('export type LaravelControllerResponseEvidenceProductionSourceCorrelationJudgment<')],
  ['success correlation outcome exists', response.includes("kind: 'controller_response_evidence_declaration_source_correlated'")],
  ['rejected correlation outcome exists', response.includes("kind: 'controller_response_evidence_declaration_source_correlation_rejected'")],
  ['success carries same-source judgment', response.includes("Extract<SourceFileIdentityRelationJudgment, { readonly kind: 'same_source_file_identity' }>")],
  ['rejection carries different-source judgment', response.includes("Extract<SourceFileIdentityRelationJudgment, { readonly kind: 'different_source_file_identity' }>")],
  ['production alias is success-only', response.includes("{ readonly kind: 'controller_response_evidence_declaration_source_correlated' }\n>")],
  ['producer input retains successful correlation receipt', response.includes('readonly sourceCorrelation: LaravelControllerResponseEvidenceProductionSourceCorrelation<InvocationJudgment>;')],
  ['rejection rule is explicit', response.includes('declarationSourceCorrelationRejectionRule') && response.includes('rejected-before-evidence-production')],
  ['producer contract version is 4', response.includes("readonly contractVersion: 4;\n  readonly contract: LaravelControllerResponseEvidenceProductionContract;")],
  ['new ADT is publicly exported', index.includes('LaravelControllerResponseEvidenceProductionSourceCorrelationJudgment')],
  ['no new relation/foundation subscanner path in controller subscanner', !fs.readdirSync(path.join(root, 'packages/core/src/compiler/scanner/operations/controller'), { withFileTypes: true }).some(entry => entry.isDirectory() && ['relation', 'foundation'].includes(entry.name))],
];
const failed = checks.filter(([, ok]) => !ok);
const report = { phase: 1995, audit: 'response-declaration-correlation-adt-interface-first', passed: checks.length - failed.length, total: checks.length, checks: checks.map(([name, ok]) => ({ name, status: ok ? 'pass' : 'fail' })) };
fs.writeFileSync(path.join(root, 'PHASE1995_AUDIT.json'), JSON.stringify(report, null, 2) + '\n');
for (const [name, ok] of checks) process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
process.exitCode = failed.length ? 1 : 0;
