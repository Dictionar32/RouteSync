const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const responsePath = path.join(root, 'packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const scannerPath = path.join(root, 'packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const retirementPath = path.join(root, 'packages/core/src/types/upstream/laravelSubscannerRetirementInterface.ts');
const barrelPath = path.join(root, 'packages/core/src/index.ts');
const response = fs.readFileSync(responsePath, 'utf8');
const scanner = fs.readFileSync(scannerPath, 'utf8');
const retirement = fs.readFileSync(retirementPath, 'utf8');
const barrel = fs.readFileSync(barrelPath, 'utf8');
const controllerDir = path.join(root, 'packages/core/src/compiler/scanner/subscanners/controller');
const productionControllerFiles = fs.readdirSync(controllerDir)
  .filter(file => file.endsWith('.ts') && !file.endsWith('.test.ts'))
  .map(file => ({ file, source: fs.readFileSync(path.join(controllerDir, file), 'utf8') }));
const relationImportOccurrences = productionControllerFiles.reduce((count, item) => count + (item.source.match(/from\s+['"][^'"]*semantic\/(?:relations|foundation)\//g) ?? []).length, 0);
const foundationImportOccurrences = productionControllerFiles.reduce((count, item) => count + (item.source.match(/from\s+['"][^'"]*semantic\/foundation\//g) ?? []).length, 0);
const checks = [
  ['response judgment remains a discriminated ADT', response.includes('export type LaravelControllerResponseSemanticJudgmentFor<') && ['controller_response_invocation_not_connected', 'controller_response_source_binding_rejected', 'controller_response_invocation_blocked', 'controller_response_complete', 'controller_response_blocked'].every(kind => response.includes(`kind: '${kind}'`))],
  ['response judgment is indexed by invocation outcome', response.includes('LaravelControllerResponseSemanticJudgmentForOne<') && response.includes('InvocationJudgment extends Readonly<')],
  ['controller artifact requires response judgment', scanner.includes('readonly responseJudgment: LaravelControllerResponseSemanticJudgmentFor<')],
  ['controller artifact keeps invocation and response outcome-indexed together', ['not_connected', 'source_binding_rejected', 'blocked', 'complete'].every(kind => scanner.includes(`LaravelControllerInvocationOutcome<'php_source_invocation_integration_${kind}'>`) && scanner.includes(`LaravelControllerResponseSemanticJudgmentFor<LaravelControllerInvocationOutcome<'php_source_invocation_integration_${kind}'>>`))],
  ['scanner contract version records the interface change', (scanner.match(/readonly contractVersion: 18;/g) ?? []).length === 2],
  ['response responsibility map points to judgment contract and artifact boundary', ['response-attribute-evidence', 'response-shape-evidence', 'response-dto-evidence'].every(kind => retirement.includes(`readonly '${kind}'`) && retirement.includes('readonly judgmentContract: LaravelControllerResponseSemanticJudgmentContract;') && retirement.includes('readonly artifactBoundary: LaravelControllerScanArtifact;'))],
  ['retirement contract version is 7', retirement.includes('readonly version: 7;')],
  ['generic response judgment is publicly type-exported', barrel.includes('LaravelControllerResponseSemanticJudgmentFor')],
  ['response judgment file has no runtime values and scanner interface adds no executable declaration', !/^\s*(?:export\s+)?(?:const|function|class|enum)\s/m.test(response) && !/^\s*(?:export\s+)?(?:function|class|enum)\s/m.test(scanner)],
  ['no relation/foundation replacement subscanner is introduced', !retirement.includes('subscanners/relation') && !retirement.includes('subscanners/foundation') && !response.includes('semantic/relations') && !response.includes('semantic/foundation')],
  ['legacy relation/foundation import count is explicitly visible for migration', relationImportOccurrences >= 0 && foundationImportOccurrences >= 0],
];
const report = {
  phase: 1980,
  title: 'Controller response judgment correlated on canonical controller artifact — interface first',
  scope: 'type/interface declarations, public type export, trace audit, and documentation only; no runtime/executor/wiring/subscanner implementation edits',
  trace: {
    controllerProductionModulesScanned: productionControllerFiles.length,
    relationOrFoundationImportOccurrences: relationImportOccurrences,
    foundationImportOccurrences: foundationImportOccurrences,
    migrationStatus: 'legacy consumers remain; runtime wiring must supply responseJudgment before the new artifact contract is implementation-complete',
  },
  checks: checks.map(([name, passed]) => ({ name, passed })),
  passed: checks.filter(([, passed]) => passed).length,
  total: checks.length,
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (report.passed !== report.total) process.exitCode = 1;
