const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const authority = read('packages/core/src/types/upstream/laravelControllerActionRouteCorrelationAuthority.ts');
const targetFunction = scanner.slice(scanner.indexOf('const actionJudgmentForTarget ='), scanner.indexOf('const sequenceToArray ='));
const checks = [
  ['existing correlation authority interface is owned by LaravelRouteScannerInterface', /readonly controllerActionRouteCorrelationAuthority: ControllerActionRouteCorrelationAuthorityInterface/.test(contract)],
  ['scanner contract version records correlation dependency injection', /readonly contractVersion: 30/.test(contract) && /contractVersion: 30/.test(scanner)],
  ['route target correlation consumes the injected authority for controller_action', /case 'controller_action':[\s\S]*?correlationAuthority\.judge\(/.test(targetFunction)],
  ['route target correlation consumes the injected authority for controller_reference', /case 'controller_reference':[\s\S]*?correlationAuthority\.judge\(/.test(targetFunction)],
  ['closure remains an explicit non-controller-invocation judgment', /case 'closure':[\s\S]*?unmatched_action_judgment/.test(targetFunction)],
  ['scanner operation receives the authority from its declared contract', /authorities\.controllerActionRouteCorrelationAuthority/.test(scanner) && /input\.controllerScan,[\s\S]*?authorities\.declarationMethodAuthority/.test(scanner)],
  ['default scanner wiring supplies the canonical existing authority instance', /controllerActionRouteCorrelationAuthority,\s*routeProducerInputComposition/.test(scanner)],
  ['correlation logic remains upstream and retains source-span coherence', /publicationCoherence/.test(authority) && /source_span_mismatch/.test(authority)],
  ['active target judgment no longer reaches through the singleton directly', !/controllerActionRouteCorrelationAuthority\.judge\(/.test(targetFunction)],
  ['no semantic/foundation dependency was introduced into scanner contract or wiring', !/semantic\/foundation/.test(contract + scanner)],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
const passed = checks.filter(([, value]) => value).length;
process.stdout.write(`\n${passed}/${checks.length} assertions passed\n`);
process.exitCode = passed === checks.length ? 0 : 1;
