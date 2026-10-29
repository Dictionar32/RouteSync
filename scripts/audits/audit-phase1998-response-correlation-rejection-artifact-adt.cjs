const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const response = read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const invocation = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const scanner = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const publicIndex = read('packages/core/src/index.ts');
const report = read('packages/core/src/types/upstream/PHASE1998_RESPONSE_CORRELATION_REJECTION_ARTIFACT_ADT.md');

check('source-correlation rejection judgment is a closed ADT retaining invocation and rejected receipt', /kind: 'controller_response_declaration_source_correlation_rejected'[\s\S]*?invocationJudgment: InvocationJudgment[\s\S]*?sourceCorrelation:[\s\S]*?controller_response_evidence_declaration_source_correlation_rejected/.test(response));
check('evidence producer accepts successful correlation only', /sourceCorrelation: LaravelControllerResponseEvidenceProductionSourceCorrelation<InvocationJudgment>/.test(response));
check('AST projection response ADT preserves declaration-correlation rejection', /LaravelControllerResponseSemanticJudgmentFor<InvocationJudgment>[\s\S]*?LaravelControllerResponseEvidenceSourceBindingRejectedJudgment<InvocationJudgment>[\s\S]*?LaravelControllerResponseEvidenceProductionSourceCorrelationRejectedJudgment<InvocationJudgment>/.test(invocation));
check('scanner artifact not-connected outcome accepts correlation rejection', /php_source_invocation_integration_not_connected'[\s\S]*?LaravelControllerResponseEvidenceProductionSourceCorrelationRejectedJudgment/.test(scanner));
check('scanner artifact source-binding-rejected outcome accepts correlation rejection', /php_source_invocation_integration_source_binding_rejected'[\s\S]*?LaravelControllerResponseEvidenceProductionSourceCorrelationRejectedJudgment/.test(scanner));
check('scanner artifact blocked outcome accepts correlation rejection', /php_source_invocation_integration_blocked'[\s\S]*?LaravelControllerResponseEvidenceProductionSourceCorrelationRejectedJudgment/.test(scanner));
check('scanner artifact complete invocation outcome accepts correlation rejection', /php_source_invocation_integration_complete'[\s\S]*?LaravelControllerResponseEvidenceProductionSourceCorrelationRejectedJudgment/.test(scanner));
check('scanner contract version advanced to 23', /interface LaravelControllerScannerInterface[\s\S]*?contractVersion: 23/.test(scanner));
check('scan judgment contract version advanced to 23', /interface LaravelControllerScanJudgment[\s\S]*?contractVersion: 23/.test(scanner));
check('pipeline contract version 3 records rejection preservation', /LaravelControllerResponseSemanticPipelineInterface[\s\S]*?contractVersion: 3/.test(response) && /rejectedCorrelationArtifactRule:[^\n]*first-class-response-judgment-ADT-member-for-AST-projection/.test(response));
check('public index exports the new rejection judgment', /LaravelControllerResponseEvidenceProductionSourceCorrelationRejectedJudgment/.test(publicIndex));
check('documentation states runtime integration remains unresolved', /Runtime trace remains unresolved[\s\S]*?does not consume `responseSemanticPipeline`/.test(report));
check('no new relation/foundation subscanner added by this phase', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/responseSemanticPipeline')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/responseSemanticFoundation')));

const failed = checks.filter((entry) => !entry.passed);
const output = { phase: 1998, audit: 'response-correlation-rejection-artifact-adt', passed: checks.length - failed.length, total: checks.length, checks };
fs.writeFileSync(path.join(root, 'PHASE1998_AUDIT.json'), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(output, null, 2));
if (failed.length) process.exitCode = 1;
