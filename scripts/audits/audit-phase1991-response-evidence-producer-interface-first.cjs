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
  ['response-reference evidence is explicit', /kind: 'controller_action_response_reference_candidate'/.test(response)],
  ['evidence preserves canonical ResponseReference', /readonly response: ResponseReference/.test(response)],
  ['evidence preserves method SourceSpan', /readonly source: SourceSpan/.test(response)],
  ['producer input uses existing ControllerDeclarationEvidence', /readonly declarationEvidence: ControllerDeclarationEvidence/.test(response)],
  ['producer output has explicit empty inventory', /kind: 'response_evidence_inventory_empty'[\s\S]*?readonly evidence: readonly \[\]/.test(response)],
  ['producer output has non-empty response-reference-candidate tuple', /kind: 'response_evidence_inventory_present'[\s\S]*?LaravelControllerResponseReferenceCandidateEvidence,[\s\S]*?LaravelControllerResponseReferenceCandidateEvidence\[\]/.test(response)],
  ['producer interface returns narrow inventory ADT', /readonly produce:[\s\S]*?LaravelControllerResponseEvidenceProductionInventory<InvocationJudgment>/.test(response)],
  ['contract forbids semantic promotion', /noSemanticPromotion: 'response-reference-is-evidence-only-and-must-not-be-promoted-to-a-closed-response-product-by-the-producer'/.test(response)],
  ['contract covers absent responses explicitly', /absentResponseRule: 'response-absent-actions-produce-an-explicit-absence-observation-and-do-not-produce-response-reference-evidence'/.test(response)],
  ['existing controller method evidence carries source span', /readonly source: SourceSpan/.test(controllerEvidence)],
  ['existing controller response ADT is response_present/response_absent', /kind: 'response_present'[\s\S]*?kind: 'response_absent'/.test(controller)],
  ['new contract types are publicly exported', /LaravelControllerResponseEvidenceProductionContract[\s\S]*?LaravelControllerResponseEvidenceProductionInterface[\s\S]*?LaravelControllerResponseEvidenceProductionInventory/.test(publicExports)],
  ['runtime scanner implementation remains untouched by this contract-only phase', /controllerProducer\.produce\(\{ declaration: declarationEvidence, invocationJudgment \}\)/.test(scanner) && !/responseEvidenceProductionInterface/.test(scanner)],
];
const failures = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.length - failures.length}/${checks.length}\n`);
if (failures.length) process.exitCode = 1;
