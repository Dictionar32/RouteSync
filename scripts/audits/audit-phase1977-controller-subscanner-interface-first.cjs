const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/types/upstream/laravelSubscannerRetirementInterface.ts');
const barrelPath = path.join(root, 'packages/core/src/index.ts');
const contract = fs.readFileSync(contractPath, 'utf8');
const barrel = fs.readFileSync(barrelPath, 'utf8');
const expectedModules = [
  'actionScanner.ts', 'actionValidationExtractor.ts', 'controllerAstCanonical.ts',
  'controllerBodyResolver.ts', 'controllerDataflowContract.ts', 'controllerProducer.ts',
  'resourceDataflowAggregator.ts', 'resourceInvocationDetector.ts',
  'responseAttributeScanner.ts', 'responseDetector.ts', 'responseDtoReader.ts', 'index.ts',
];
const checks = [
  ['contract-version-4', /readonly version: 4;/.test(contract)],
  ['responsibility-union-exists', /export type LaravelControllerSubscannerResponsibility\s*=/.test(contract)],
  ['all-12-nonempty-controller-modules-mapped', expectedModules.every((name) => contract.includes(`legacyModule: '${name}'`))],
  ['each-responsibility-forbids-scanner-semantic-decisions', (contract.match(/semanticDecisionInScanner: false/g) || []).length === 12],
  ['invocation-to-response-to-ast-flow-closed', /source-evidence-to-canonical-invocation-semantic-judgment-to-exact-integrated-response-to-discriminated-AST-projection/.test(contract)],
  ['runtime-executor-explicitly-non-reasoning', /runtime-executes-the-complete-source-correlated-contract-and-does-not-reason-classify-or-reconstruct-response-outcomes/.test(contract)],
  ['no-relation-foundation-or-parallel-authority-replacement', /forbiddenReplacementLayers: readonly \['semantic\/relations', 'semantic\/foundation', 'replacement-subscanner', 'parallel-invocation-authority'\]/.test(contract)],
  ['type-only-public-export', /export type \{ LaravelControllerSubscannerResponsibility, LaravelSubscannerRetirementDomain, LaravelSubscannerRetirementInterface \}/.test(barrel)],
];
const results = checks.map(([name, pass]) => ({ name, pass }));
const report = { phase: 1977, title: 'Controller subscanner interface-first responsibility trace', scope: 'type/interface declarations and type-only public export; runtime/wiring/scanner implementation untouched', checks: results, passed: results.filter((item) => item.pass).length, total: results.length };
const output = path.join(root, 'PHASE1977_AUDIT.json');
fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (report.passed !== report.total) process.exitCode = 1;
