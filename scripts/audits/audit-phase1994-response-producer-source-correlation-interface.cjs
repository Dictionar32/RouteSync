const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const responsePath = path.join(root, 'packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const exportPath = path.join(root, 'packages/core/src/index.ts');
const scannerPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const response = fs.readFileSync(responsePath, 'utf8');
const publicExports = fs.readFileSync(exportPath, 'utf8');
const scanner = fs.readFileSync(scannerPath, 'utf8');
const checks = [
  ['producer input requires source-correlation receipt', /interface LaravelControllerResponseEvidenceProductionInput[\s\S]*?sourceCorrelation: LaravelControllerResponseEvidenceProductionSourceCorrelation<InvocationJudgment>/.test(response)],
  ['correlation receipt records invocation source and declaration source', /type LaravelControllerResponseEvidenceProductionSourceCorrelation[\s\S]*?invocationSource: InvocationJudgment\['sourceFile'\][\s\S]*?declarationSource: ControllerDeclarationEvidence\['source'\]\['file'\]/.test(response)],
  ['correlation receipt uses existing same-source identity judgment', /type LaravelControllerResponseEvidenceProductionSourceCorrelation[\s\S]*?identityJudgment: Extract<SourceFileIdentityRelationJudgment, \{ readonly kind: 'same_source_file_identity' \}>/.test(response)],
  ['source correlation is not declared as a new identity authority', !/interface LaravelControllerResponseEvidenceProductionSourceIdentityAuthorityInterface/.test(response)],
  ['empty inventory retains source correlation', /kind: 'response_evidence_inventory_empty'[\s\S]*?sourceCorrelation: LaravelControllerResponseEvidenceProductionSourceCorrelation<InvocationJudgment>/.test(response)],
  ['present inventory retains source correlation', /kind: 'response_evidence_inventory_present'[\s\S]*?sourceCorrelation: LaravelControllerResponseEvidenceProductionSourceCorrelation<InvocationJudgment>/.test(response)],
  ['producer contract version is 3', /interface LaravelControllerResponseEvidenceProductionInterface[\s\S]*?contractVersion: 3/.test(response)],
  ['producer obligations require upstream identity correlation', /declarationSourceCorrelationRule: 'producer-input-requires-an-upstream-same-source-file-identity-judgment/.test(response)],
  ['producer obligations preserve exact correlation receipt', /correlationRetentionRule: 'every-produced-inventory-retains-the-exact-input-declaration-source-correlation-receipt'/.test(response)],
  ['candidate remains descriptor-derived rather than direct PHP return evidence', /kind: 'controller_action_response_reference_candidate'[\s\S]*?origin: 'controller-action-descriptor-response-type'/.test(response) && /not-direct-proof-of-a-PHP-return-expression/.test(response)],
  ['new correlation type is publicly exported', /LaravelControllerResponseEvidenceProductionSourceCorrelation/.test(publicExports)],
  ['scanner implementation remains untouched and producer is not wired yet', !/responseEvidenceProduction\.produce/.test(scanner) && /controllerProducer\.produce\(\{ declaration: declarationEvidence, invocationJudgment \}\)/.test(scanner)],
  ['no relation/foundation subscanner was added', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/response/relations')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/response/foundation'))],
  ['existing relation/foundation references are not silently deleted', fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations'))],
];
const failures = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.length - failures.length}/${checks.length}\n`);
const report = {
  phase: 1994,
  title: 'Response Producer Declaration Source Correlation Interface First',
  checks: checks.map(([name, passed]) => ({ name, passed })),
  passed: checks.length - failures.length,
  total: checks.length,
  runtimeMigration: 'not-performed',
  typecheck: 'not-run',
};
fs.writeFileSync(path.join(root, 'PHASE1994_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (failures.length) process.exitCode = 1;
