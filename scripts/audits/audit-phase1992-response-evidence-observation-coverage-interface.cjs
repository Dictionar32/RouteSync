const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const responsePath = path.join(root, 'packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const exportPath = path.join(root, 'packages/core/src/index.ts');
const controllerEvidencePath = path.join(root, 'packages/core/src/types/upstream/controllerEvidence.ts');
const controllerPath = path.join(root, 'packages/core/src/types/upstream/controller.ts');
const scannerPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const response = fs.readFileSync(responsePath, 'utf8');
const publicExports = fs.readFileSync(exportPath, 'utf8');
const controllerEvidence = fs.readFileSync(controllerEvidencePath, 'utf8');
const controller = fs.readFileSync(controllerPath, 'utf8');
const scanner = fs.readFileSync(scannerPath, 'utf8');
const checks = [
  ['response reference remains explicit evidence, not a resolved product', /kind: 'controller_action_response_reference_candidate'/.test(response) && /readonly response: ResponseReference/.test(response)],
  ['method source span is retained on response evidence', /kind: 'controller_action_response_reference_candidate'[\s\S]*?readonly source: SourceSpan/.test(response)],
  ['producer input consumes existing declaration evidence', /readonly declarationEvidence: ControllerDeclarationEvidence/.test(response)],
  ['observation ADT explicitly represents response-present actions', /kind: 'controller_method_response_reference_candidate'[\s\S]*?readonly action: ControllerActionFlowContract[\s\S]*?readonly response: Extract<ControllerActionFlowContract\['response'\], \{ readonly kind: 'response_present' \}>/.test(response)],
  ['observation ADT explicitly represents response-absent actions', /kind: 'controller_method_response_absent'[\s\S]*?readonly response: Extract<ControllerActionFlowContract\['response'\], \{ readonly kind: 'response_absent' \}>/.test(response)],
  ['each observation retains originating ControllerMethodEvidence', /LaravelControllerResponseEvidenceProductionObservation[\s\S]*?readonly methodEvidence: ControllerMethodEvidence/.test(response)],
  ['empty inventory retains observations while response evidence is empty', /kind: 'response_evidence_inventory_empty'[\s\S]*?readonly observations: readonly LaravelControllerResponseEvidenceProductionObservation\[\][\s\S]*?readonly evidence: readonly \[\]/.test(response)],
  ['present inventory requires non-empty response evidence and observations', /kind: 'response_evidence_inventory_present'[\s\S]*?readonly observations: readonly \[[\s\S]*?LaravelControllerResponseEvidenceProductionObservation,[\s\S]*?readonly evidence: readonly \[[\s\S]*?LaravelControllerResponseReferenceCandidateEvidence,/.test(response)],
  ['contract requires per-method exact coverage', /methodCoverageRule: 'each-declaration-evidence-method-is-represented-exactly-once-by-an-observation-preserving-the-same-method-evidence-and-action'/.test(response)],
  ['contract prevents absence observations from becoming response-reference evidence', /absentResponseRule: 'response-absent-actions-produce-an-explicit-absence-observation-and-do-not-produce-response-reference-evidence'/.test(response)],
  ['producer cannot promote evidence into closed response meaning', /noSemanticPromotion: 'response-reference-is-evidence-only-and-must-not-be-promoted-to-a-closed-response-product-by-the-producer'/.test(response)],
  ['existing ControllerMethodEvidence owns action and source', /readonly action: ControllerActionFlowContract/.test(controllerEvidence) && /readonly source: SourceSpan/.test(controllerEvidence)],
  ['existing ControllerResponse remains a discriminated union', /kind: 'response_present'[\s\S]*?kind: 'response_absent'/.test(controller)],
  ['observation type is publicly exported', /LaravelControllerResponseEvidenceProductionObservation/.test(publicExports)],
  ['no producer runtime was smuggled into scanner wiring', /controllerProducer\.produce\(\{ declaration: declarationEvidence, invocationJudgment \}\)/.test(scanner) && !/responseEvidenceProductionInterface/.test(scanner)],
  ['no relation/foundation subscanner introduced by this phase', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/response/foundation')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/response/relations'))],
];
const failures = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.length - failures.length}/${checks.length}\n`);
if (failures.length) process.exitCode = 1;
