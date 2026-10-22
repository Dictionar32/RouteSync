const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const scannerPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const contractPath = path.join(root, 'packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const scanner = fs.readFileSync(scannerPath, 'utf8');
const contract = fs.readFileSync(contractPath, 'utf8');
const checks = [
  ['scanner imports canonical source identity semantics', scanner.includes("import { laravelSourceIdentitySemantics } from '../../../types/upstream/sourceProjectIdentity';")],
  ['controller selection correlation delegates to canonical identity interface', scanner.includes('laravelSourceIdentitySemantics.relateSourceFiles(selection.sourceFile, invocationJudgment.sourceFile).kind === \'same_source_file_identity\'')],
  ['raw wrapped path comparison removed from selection correlation', !scanner.includes('selection.sourceFile.value.value === invocationJudgment.sourceFile.value.value')],
  ['existing declaration semantic authority remains injected', scanner.includes('declarationAuthority.selections(')],
  ['existing invocation judgment is forwarded unchanged to producer', scanner.includes('controllerProducer.produce({ declaration: declarationEvidence, invocationJudgment })')],
  ['existing response pipeline still computes response judgment', scanner.includes('responseJudgmentFor(invocationJudgment, declarationEvidence, responseSemanticPipeline)')],
  ['response AST projection receives the same invocation judgment', scanner.includes('judgment: invocationJudgment,\n                responseJudgment,')],
  ['artifact retains invocation and response judgments', scanner.includes('invocationJudgment,\n                responseJudgment,\n                projectionJudgment,')],
  ['contract declares canonical source identity ownership', contract.includes('Source correlation must use LaravelSourceIdentitySemanticsInterface')],
  ['no relation/foundation subscanner introduced by this phase', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/foundation')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/relation'))],
];
let passed = 0;
for (const [name, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (ok) passed += 1;
}
process.stdout.write(`Phase 2041: ${passed}/${checks.length} checks passed\n`);
if (passed !== checks.length) process.exitCode = 1;
