const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const correlation = read('packages/core/src/types/upstream/laravelControllerActionRouteCorrelationAuthority.ts');
const targetFunction = scanner.slice(scanner.indexOf('const actionJudgmentForTarget ='), scanner.indexOf('const sequenceToArray ='));
const checks = [
  ['controller_action target is correlated through the existing upstream authority', /case 'controller_action':[\s\S]*?correlationAuthority\.judge\(/.test(targetFunction)],
  ['controller_action correlation uses the target action identity rather than consumer reconstruction', /controller: target\.action\.controllerName,[\s\S]*?action: target\.action\.actionName/.test(targetFunction)],
  ['controller_reference retains the same canonical correlation authority', /case 'controller_reference':[\s\S]*?correlationAuthority\.judge\(/.test(targetFunction)],
  ['closure is not falsely correlated to a controller invocation judgment', /case 'closure':[\s\S]*?unmatched_action_judgment/.test(targetFunction)],
  ['existing authority retains identity, source-span and ambiguity judgments', /publicationCoherence/.test(correlation) && /ambiguous_action_judgments/.test(correlation) && /source_span_mismatch/.test(correlation)],
  ['route boundary projection passes the correlated judgment into its existing contract factory', /routeBoundaryContractFromRouteFacts\([\s\S]*?actionJudgmentForTarget\(target, publications, correlationAuthority\)/.test(scanner)],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
const passed = checks.filter(([, value]) => value).length;
process.stdout.write(`\n${passed}/${checks.length} assertions passed\n`);
process.exitCode = passed === checks.length ? 0 : 1;
