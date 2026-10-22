const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const executorPath = path.join(root, 'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationRuntimeExecutor.ts');
const upstreamPath = path.join(root, 'packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const testPath = path.join(root, 'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationRuntimeExecutor.phase1625.test.ts');
const scannerTypeLoweringPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts');
const scannerProjectionPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/routeManifestProjectionAuthority.ts');
const executor = fs.readFileSync(executorPath, 'utf8');
const upstream = fs.readFileSync(upstreamPath, 'utf8');
const test = fs.readFileSync(testPath, 'utf8');
const scannerTypeLowering = fs.readFileSync(scannerTypeLoweringPath, 'utf8');
const scannerProjection = fs.readFileSync(scannerProjectionPath, 'utf8');
const checks = [
  ['executor interface is owned by upstream contract', /export interface RequestTypeDerivationRuntimeExecutorInterface<[\s\S]*?TInput extends RequestTypeDerivationInput[\s\S]*?execute: \(input: TInput\)/.test(upstream)],
  ['runtime implementation imports the upstream executor contract', /RequestTypeDerivationRuntimeExecutorInterface/.test(executor) && !/export interface RequestTypeDerivationRuntimeExecutorInterface/.test(executor)],
  ['scanner wiring imports result algebra from upstream', /RequestTypeDerivationRuntimeExecutionResult/.test(scannerTypeLowering) && /types\/upstream\/requestTypeDerivationInterface/.test(scannerTypeLowering) && !/import type \{ RequestTypeDerivationRuntimeExecutionResult \} from/.test(scannerTypeLowering) && /RequestTypeDerivationRuntimeExecutionResult/.test(scannerProjection) && /types\/upstream\/requestTypeDerivationInterface/.test(scannerProjection) && !/import type \{ RequestTypeDerivationRuntimeExecutionResult \} from/.test(scannerProjection)],
  ['execution result preserves expected input type', /expectedInput: TInput/.test(upstream)],
  ['factory derives input type from semantic inference', /RequestTypeDerivationRuntimeExecutorInterface<TProjection, TInference\['input'\]>/.test(executor)],
  ['type test verifies input preservation', /toEqualTypeOf<NarrowInput>/.test(test)],
  ['runtime executor does not implement semantic inference', !/\.infer\(/.test(executor) && !/resolveRequestIdentity|mergeGroupContributions/.test(executor)],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
