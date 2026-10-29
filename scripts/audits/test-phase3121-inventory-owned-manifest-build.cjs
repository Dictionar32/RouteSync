#!/usr/bin/env node
'use strict';

// Phase 3121: static CJS/TypeScript-AST gate for upstream inventory -> manifest build ownership.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const files = {
  contract: 'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts',
  authority: 'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts',
  cli: 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts',
  barrel: 'packages/core/src/index.ts',
  legacyTest: 'packages/core/src/types/upstream/__test__/laravelControllerInvocationSemanticJudgmentInventory.phase1953.test.ts',
};
const textByFile = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, fs.readFileSync(path.join(root, file), 'utf8')]));
const parsed = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, ts.createSourceFile(file, textByFile[key], ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)]));
const checks = [];
const check = (name, passed, evidence) => checks.push({ name, passed: Boolean(passed), ...(evidence === undefined ? {} : { evidence }) });
const contract = textByFile.contract;
const authority = textByFile.authority;
const cli = textByFile.cli;
check('validated inventory owns typed buildManifest operation', /interface LaravelControllerInvocationSemanticJudgmentInventoryValidated[\s\S]*?readonly buildManifest:\s*\(input: LaravelControllerInvocationSemanticJudgmentInventoryManifestBuildInput\) => Promise<ManifestBuilderJudgment>/.test(contract));
check('manifest build input carries route selection and manifest preparation', /interface LaravelControllerInvocationSemanticJudgmentInventoryManifestBuildInput[\s\S]*?routeSelection: LaravelRouteSourceSelectionIntent[\s\S]*?manifestBuilderPreparation: ManifestBuilderOperationPreparationInterface/.test(contract));
check('rejected inventory owns explicit identity-preserving operation', /readonly preserveRejectedInventory:\s*\(\) => LaravelControllerInvocationSemanticJudgmentInventoryRejected/.test(contract) && /preserveRejectedInventory:\s*\(\) => result/.test(authority));
check('validated authority builds from the original receipt', /invocationInventoryReceipt:\s*receipt/.test(authority) && /manifestBuilderPreparation\.prepare\(input\)/.test(authority));
check('generic inventory result visitor is retired from contract and producer', !/LaravelControllerInvocationSemanticJudgmentInventoryResultHandlers/.test(contract + authority) && !/continueWith:\s*<Result>\(handlers: LaravelControllerInvocationSemanticJudgmentInventoryResultHandlers/.test(contract + authority));
check('CLI consumes validated domain operation rather than visitor', /inventoryResult\.buildManifest\(Object\.freeze\(\{ routeSelection, manifestBuilderPreparation \}\)\)/.test(cli) && !/inventoryResult\.continueWith\(/.test(cli));
check('CLI preserves rejected inventory through the domain operation', /inventoryResult\.preserveRejectedInventory\(\)/.test(cli));
check('new public input contract is exported through core barrel', /LaravelControllerInvocationSemanticJudgmentInventoryManifestBuildInput/.test(textByFile.barrel));
check('legacy inventory test uses owned operations', !/result\.continueWith\(/.test(textByFile.legacyTest) && /result\.preserveRejectedInventory\(\)/.test(textByFile.legacyTest) && /result\.buildManifest/.test(textByFile.legacyTest));
const parseFailures = [];
for (const [key, source] of Object.entries(parsed)) if (source.parseDiagnostics.length) parseFailures.push({ file: files[key], count: source.parseDiagnostics.length });
check('all touched TypeScript files parse', parseFailures.length === 0, parseFailures);
const report = {
  phase: 3121,
  title: 'Inventory-Owned Manifest Build Operation Migration',
  runtimePath: 'controller source discovery -> source document semantic judgments -> inventory closure -> receipt-owned manifest build -> CLI manifest terminal',
  migratedDomain: 'LaravelControllerInvocationSemanticJudgmentInventoryResult',
  checks,
  failed: checks.filter(item => !item.passed),
  selectedRuntimeSliceMigrationComplete: checks.every(item => item.passed),
  repositoryWideExportInterfaceMigrationComplete: false,
  globalPrimitiveEliminationComplete: false,
  fullTypecheck: 'not run; extracted workspace dependencies are not installed',
  endToEndRuntimeTest: 'not run; this CJS gate checks source contracts and AST parseability',
};
const reportPath = path.join(root, 'reports/PHASE3121_INVENTORY_OWNED_MANIFEST_BUILD.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
for (const item of checks) process.stdout.write(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}${item.evidence === undefined ? '' : `: ${JSON.stringify(item.evidence)}`}\n`);
process.stdout.write(`Report: ${path.relative(root, reportPath)}\n`);
if (report.failed.length) process.exitCode = 1;
