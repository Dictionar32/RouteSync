import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const scannerPath = 'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts';
const contractPath = 'packages/core/src/types/upstream/laravelControllerScannerInterface.ts';
const scanner = readFileSync(scannerPath, 'utf8');
const contract = readFileSync(contractPath, 'utf8');
const checks = [];
const check = (name, predicate) => {
  assert.equal(predicate(), true, name);
  checks.push(name);
};

check('scanner implements the upstream scanner interface', () => /class LaravelControllerScannerExecutor implements LaravelControllerScannerInterface/.test(scanner));
check('scanner has no exported factory function', () => !/export\s+const\s+createLaravelControllerScanner\s*=/.test(scanner));
check('scanner has no top-level scanLaravelControllers function', () => !/^const\s+scanLaravelControllers\s*=/m.test(scanner));
check('sequence materialization is an executor method', () => /private sequenceToArray<T>\(items: Sequence<T>\)/.test(scanner));
check('public scan method implements the contract', () => /scan\(input: LaravelControllerScanInput\): Promise<LaravelControllerScanJudgment>/.test(scanner));
check('input requires a closed invocation inventory receipt', () => /readonly invocationInventory: LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt/.test(contract));
check('artifact is an outcome-indexed discriminated union', () => /export type LaravelControllerScanArtifact\s*=/.test(contract) && /LaravelControllerInvocationOutcome<'php_source_invocation_integration_complete'>/.test(contract));
check('response judgment is forwarded from the integrated response pipeline', () => /this\.responseSemanticPipeline\.judgeIntegratedResponse/.test(scanner));
check('AST projection consumes the same invocation and response judgments', () => /judgment: invocationJudgment,\s*responseJudgment,/.test(scanner));
check('no semantic relation/foundation subscanner was added by this phase', () => !/semantic\/(relations|foundation)\/(?:.*Subscanner|.*subscanner)/i.test(scanner));
check('singleton wiring uses the executor directly', () => /new LaravelControllerScannerExecutor\(controllerDeclarationSemanticJudgmentAuthority\)/.test(scanner));

console.log(JSON.stringify({ phase: 2075, audit: 'interface-first-controller-scanner', passed: checks.length, total: checks.length, checks }, null, 2));
