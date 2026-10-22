const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const checks = [
  ['existing scanner contract has async preparation', contract.includes('readonly prepare: (input: LaravelRouteScanInput) => Promise<LaravelRouteScanOperationInterface>;')],
  ['scanner contract version is 36 after dependency-ownership correction', contract.includes('readonly contractVersion: 36;') && scanner.includes('contractVersion: 36,')],
  ['prepared operation version is 2', contract.includes('readonly contractVersion: 2;') && scanner.includes('contractVersion: 2 as const,')],
  ['execute has no parameters', contract.includes('readonly execute: () => Promise<LaravelRouteScanOutcome>;') && scanner.includes('async execute() {')],
  ['execute only returns the outcome captured by preparation', /async execute\(\)\s*\{\s*return outcome;\s*\}/.test(scanner)],
  ['file IO and route parsing occur before operation creation', scanner.indexOf('await fs.promises.readFile') < scanner.indexOf("kind: 'prepared_laravel_route_scan_operation'") && scanner.indexOf('LaravelSourceLexer.parseRouteDeclarations') < scanner.indexOf("kind: 'prepared_laravel_route_scan_operation'")],
  ['semantic judgment and AST construction occur before operation creation', scanner.indexOf('bindingAuthority.judge') < scanner.indexOf("kind: 'prepared_laravel_route_scan_operation'") && scanner.indexOf('routeProducerOperation') === -1 && scanner.indexOf('authorities.routeProducer.produce') < scanner.indexOf("kind: 'prepared_laravel_route_scan_operation'")],
  ['active pipeline awaits preparation before execution', pipeline.includes('const routeOperation = await routeScanner.prepare({') && pipeline.includes('const routeScan = await routeOperation.execute();')],
  ['runtime executor contains no input access or file IO', !/async execute\(\)\s*\{[^}]*this\.input|async execute\(\)\s*\{[^}]*fs\./s.test(scanner)],
];
let failed = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`Phase2453 prepared executor assertions: ${checks.length - failed}/${checks.length}\n`);
process.exitCode = failed === 0 ? 0 : 1;
