const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const contractPath = 'packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionContract.ts';
const wiringPath = 'packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts';
const scannerPath = 'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts';
const executionPath = 'packages/core/src/types/upstream/laravelControllerActionExecutionInterface.ts';
const contract = read(contractPath);
const wiring = read(wiringPath);
const scanner = read(scannerPath);
const execution = read(executionPath);
const checks = [
  ['contract exposes canonical semantic response ADT', /readonly semanticResponse:\s*ControllerResponse/.test(contract)],
  ['resolver creates one canonical resourceResponse judgment', /const resourceResponse:\s*ControllerResponse\s*=\s*response\.kind\s*===\s*'resource'/.test(contract)],
  ['return semantics consume canonical resourceResponse', /controllerReturnSemanticFromMethod\(method,\s*sourceFile\.value\.value,\s*resourceResponse\)/.test(contract)],
  ['dataflow consumes canonical resourceResponse', /response:\s*resourceResponse/.test(contract)],
  ['contract returns the same canonical semanticResponse', /semanticResponse:\s*resourceResponse/.test(contract)],
  ['adapter forwards canonical semanticResponse without reclassification', /response:\s*result\.contract\.semanticResponse/.test(wiring)],
  ['adapter no longer reconstructs response through responseTypeName', !/response:\s*Object\.freeze\(\{\s*kind:\s*'response_present'[^\n]*responseTypeName\(\)/.test(wiring)],
  ['scanner consumes response from action semantic judgment', /response:\s*result\.semanticJudgment\.semantic\.response/.test(scanner)],
  ['execution result preserves whole semantic judgment', /readonly semanticJudgment:\s*LaravelControllerActionSemanticJudgmentInterface</.test(execution)],
  ['response presence remains a discriminated union', /type ControllerResponse\s*=\s*\{\s*readonly kind:\s*'response_present'/.test(read('packages/core/src/types/upstream/controller.ts')) && /readonly kind:\s*'response_absent'/.test(read('packages/core/src/types/upstream/controller.ts'))],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
const failures = checks.filter(([, passed]) => !passed);
console.log(`Phase 2121 canonical controller response ADT audit: ${checks.length - failures.length}/${checks.length}`);
if (failures.length) process.exitCode = 1;
