const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const sourcePipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const sourceAsts = read('packages/core/src/types/upstream/collections.ts');
const controllerScanner = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const publicCli = read('packages/cli/src/parsers/php/index.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['composition interface version advances with rejection-preservation semantics', /readonly version: 2/.test(contract) && /version: 2,/.test(composition) && /readonly rejectionPreservation:/.test(contract) && /rejectionPreservation:/.test(composition)],
  ['terminal inventory result is converted into the existing closed CLI terminal ADT', /terminalOutcomeFrom\(/.test(composition) && /kind: 'validated_inventory'/.test(contract) && /kind: 'rejected_inventory'/.test(contract)],
  ['terminal conversion is exhaustive over the upstream validated/rejected ADT', /case 'laravel_controller_invocation_semantic_judgment_inventory_validated'/.test(composition) && /case 'laravel_controller_invocation_semantic_judgment_inventory_rejected'/.test(composition)],
  ['validated terminal branch forwards the exact authority-produced receipt', /manifestBuilder\.build\(terminalOutcome\.result\.receipt\)/.test(composition)],
  ['rejected terminal branch throws a typed error rather than losing the result to a string', /throw new ControllerInvocationManifestCompositionRejectedError\(sourceProject, documents, terminalOutcome\)/.test(composition)],
  ['typed error retains the exact rejected terminal ADT and its full rejection ledger', /readonly terminalOutcome: Extract<ControllerInvocationManifestCompositionTerminalOutcome, \{ readonly kind: 'rejected_inventory' \}>/.test(composition) && /this\.terminalOutcome = terminalOutcome/.test(composition) && /terminalOutcome\.result\.rejections/.test(composition)],
  ['error message is only a summary while structured rejection details remain inspectable', /rejections\.map\(rejection => rejection\.kind\)/.test(composition) && /readonly terminalOutcome/.test(composition)],
  ['CLI terminal adapter does not reclassify invocation or integrated response semantics', /noReclassification: 'cli-must-not-classify-invocations-or-reconstruct-integrated-response-outcomes'/.test(contract) && !/response\.kind/.test(composition)],
  ['source AST pipeline retains exact inventory receipt rather than reconstructing invocation judgments', /controllerInvocationSemanticInventory: invocationInventoryReceipt/.test(sourcePipeline) && /Do not rebuild judgments from ASTs/.test(sourcePipeline)],
  ['SourceAsts models the receipt as part of the canonical AST bundle', /controllerInvocationSemanticInventory: import\('\.\/laravelControllerInvocationSemanticJudgmentInventoryInterface'\)\.LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt/.test(sourceAsts)],
  ['controller scanner receives only the authority-closed inventory receipt', /invocationInventory: LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt/.test(controllerScanner) && /never-reconstructs-source-judgment-correspondence/.test(controllerScanner)],
  ['typed error is exposed from the CLI PHP composition surface', /ControllerInvocationManifestCompositionRejectedError/.test(publicCli)],
  ['new audit is registered as a package script', packageJson.scripts['audit:phase1956-controller-manifest-terminal-adt-interface-first'] === 'node scripts/audits/audit-phase1956-controller-manifest-terminal-adt-interface-first.cjs'],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
const passed = checks.filter(([, result]) => result).length;
const summary = { phase: 1956, audit: 'controller-manifest-terminal-adt-interface-first', passed, total: checks.length, checks: checks.map(([name, result]) => ({ name, passed: Boolean(result) })) };
fs.writeFileSync(path.join(root, 'PHASE1956_AUDIT.json'), `${JSON.stringify(summary, null, 2)}\n`);
process.stdout.write(`RESULT ${passed}/${checks.length}\n`);
if (passed !== checks.length) process.exitCode = 1;
