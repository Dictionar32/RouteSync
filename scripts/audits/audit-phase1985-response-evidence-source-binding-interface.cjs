const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const responsePath = path.join(root, 'packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const retirementPath = path.join(root, 'packages/core/src/types/upstream/laravelSubscannerRetirementInterface.ts');
const barrelPath = path.join(root, 'packages/core/src/index.ts');
const response = fs.readFileSync(responsePath, 'utf8');
const retirement = fs.readFileSync(retirementPath, 'utf8');
const barrel = fs.readFileSync(barrelPath, 'utf8');
const checks = [
  ['source-binding result is a discriminated union', response.includes("kind: 'controller_response_evidence_source_binding_complete'") && response.includes("kind: 'controller_response_evidence_source_binding_rejected'")],
  ['complete binding carries same-source identity judgment', response.includes("Extract<SourceFileIdentityRelationJudgment, { readonly kind: 'same_source_file_identity' }>")],
  ['rejected binding carries different-source identity judgment', response.includes("Extract<SourceFileIdentityRelationJudgment, { readonly kind: 'different_source_file_identity' }>")],
  ['authority input receives one binding judgment rather than a second independent evidence list', /interface LaravelControllerResponseSemanticJudgmentInput[\s\S]*?readonly sourceBindingJudgment: LaravelControllerResponseEvidenceSourceBindingJudgment<InvocationJudgment>;/.test(response) && !/interface LaravelControllerResponseSemanticJudgmentInput[\s\S]*?readonly evidence: readonly LaravelControllerResponseSemanticEvidenceForSource/.test(response)],
  ['existing source identity semantics remains the owner', response.includes("readonly owner: 'LaravelSourceIdentitySemanticsInterface'") && response.includes('readonly sourceIdentitySemantics: LaravelSourceIdentitySemanticsInterface')],
  ['rejected source binding cannot be silently treated as complete by contract', response.includes('response_evidence_source_binding_rejected') && response.includes('sourceBindingOutcomeRule')],
  ['new contracts exported type-only from public barrel', barrel.includes('LaravelControllerResponseEvidenceSourceBindingContract') && barrel.includes('LaravelControllerResponseEvidenceSourceBindingJudgment')],
  ['retirement interface version advanced', retirement.includes('readonly version: 12;')],
  ['no relation/foundation subscanner introduced', !response.includes('operations/relation') && !response.includes('operations/foundation') && !retirement.includes('operations/relation') && !retirement.includes('operations/foundation')],
  ['response interface remains declaration-only', !/^\s*(?:export\s+)?const\s/m.test(response) && !/^\s*(?:export\s+)?function\s/m.test(response)],
];
const report = { phase: 1985, title: 'Response evidence source-binding interface first', scope: 'type/interface declarations only', checks: checks.map(([name, passed]) => ({ name, passed })), passed: checks.filter(([, passed]) => passed).length, total: checks.length };
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (report.passed !== report.total) process.exitCode = 1;
