const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['route manifest wiring calls semantic projection interface', () => read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLowering.ts').includes('requestTypeDerivationProjectionPipeline.derive({ routes, resources, requests, interner })')],
  ['route manifest wiring does not call scanner derivation facade', () => !read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLowering.ts').includes('RequestTypeDeriver.derive')],
  ['scanner facade delegates without constructing derivation context', () => !read('packages/core/src/compiler/scanner/operations/RequestTypeDeriver.ts').includes('createDerivationContext') && !read('packages/core/src/compiler/scanner/operations/RequestTypeDeriver.ts').includes('aggregateRequestTypeGroups')],
  ['scanner aggregator is a compatibility re-export only', () => read('packages/core/src/compiler/scanner/operations/request-deriver/groupAggregator.ts').length < 500 && read('packages/core/src/compiler/scanner/operations/request-deriver/groupAggregator.ts').includes('requestTypeDerivationSolver')],
  ['action derivation logic has one semantic owner', () => read('packages/core/src/compiler/scanner/operations/request-deriver/actionDeriver.ts').length < 300 && read('packages/core/src/compiler/semantic/request-type-derivation/actionContribution.ts').includes('deriveRouteAction')],
  ['response derivation logic has one semantic owner', () => read('packages/core/src/compiler/scanner/operations/request-deriver/responseDeriver.ts').length < 350 && read('packages/core/src/compiler/semantic/request-type-derivation/responseContribution.ts').includes('deriveActionResponseData')],
  ['semantic solver owns request lookup and group reconciliation', () => read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSolver.ts').includes('requestValue') && read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSolver.ts').includes('mergeGroup')],
  ['projection interface exposes one source-bound operation', () => read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProjectionInterface.ts').includes('readonly derive: (input: RequestTypeDerivationProjectionInput) => readonly RequestType[]')],
  ['projection pipeline composes solver, not local policy branches', () => read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProjectionPipeline.ts').includes('aggregateRequestTypeGroups(routes, resources, context)') && !read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProjectionPipeline.ts').includes('relationGate')],
  ['authority assessment is not falsely claimed as wired', () => read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProjectionInterface.ts').includes('not a claim') && read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProjectionInterface.ts').includes('closed proof-authority pipeline')],
  ['runtime executor source remains separate from this cutover', () => fs.existsSync(path.join(root, 'packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationRuntimeExecutor.ts'))],
];
let failed = 0;
for (const [name, test] of checks) {
  let pass = false;
  try { pass = Boolean(test()); } catch { pass = false; }
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
  if (!pass) failed++;
}
console.log(`${checks.length - failed}/${checks.length} checks passed`);
process.exitCode = failed ? 1 : 0;
