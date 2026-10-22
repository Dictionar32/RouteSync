const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const runtime = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const priorAudit = read('scripts/audits/audit-phase2098-controller-scan-closed-outcome-adt.cjs');
const gate = runtime.indexOf('if (declarationBlockers.length > 0)');
const fold = runtime.indexOf('for (const item of declarationsWithSelections)');
const actionScan = runtime.indexOf('this.executionDependencies.actionExecution.execute(');
const responseJudgment = runtime.indexOf('judgeIntegratedResponse(');
const astProjection = runtime.indexOf('.astProjection.judge(');
const checks = [
  ['contract version reflects the new pre-execution closure boundary', /readonly contractVersion: 31;/.test(contract) && /readonly contractVersion = 31 as const;/.test(runtime)],
  ['interface documents declaration closure as a runtime publication gate', /Declaration inventory closure is a publication gate/.test(contract)],
  ['declaration selections are aggregated into an explicit blocker inventory', /const declarationBlockers: readonly ControllerDeclarationSelectionBlocker\[\]/.test(runtime) && /declarationCorrespondences\.flatMap/.test(runtime)],
  ['blocked declaration inventory returns a closed blocked ADT', /if \(declarationBlockers\.length > 0\)[\s\S]*?kind: 'laravel_controller_scan_blocked'/.test(runtime)],
  ['blocked outcome publishes no controller artifacts', /kind: 'laravel_controller_scan_blocked'[\s\S]*?controllers: Object\.freeze\(\[\]\)/.test(runtime)],
  ['closure gate occurs before controller execution iteration', gate >= 0 && fold > gate],
  ['closure gate occurs before injected action executor execution', gate >= 0 && actionScan > gate],
  ['closure gate occurs before integrated response judgment', gate >= 0 && responseJudgment > gate],
  ['closure gate occurs before AST projection', gate >= 0 && astProjection > gate],
  ['an impossible blocked selection after closure is treated as invariant violation', /controller_declaration_source_identity_mismatch/.test(runtime)],
  ['complete outcome is emitted only after the action/response executor completes', /kind: 'laravel_controller_scan_complete'[\s\S]*?controllers: Object\.freeze\(\[...result\.controllers\]\)/.test(runtime)],
  ['previous closed ADT audit now checks the canonical version', /contractVersion: 31;/.test(priorAudit) && /contractVersion = 31 as const;/.test(priorAudit)],
];
let failures = 0;
for (const [label, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${label}\n`);
  failures += Number(!pass);
}
process.stdout.write(`RESULT ${checks.length - failures}/${checks.length}\n`);
process.exitCode = failures === 0 ? 0 : 1;
