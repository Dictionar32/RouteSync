const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = process.cwd();
const wiring = readFileSync(join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts'), 'utf8');
const contract = readFileSync(join(root, 'packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts'), 'utf8');

const start = wiring.indexOf('semantic: Object.freeze({', wiring.indexOf('judge: <TInvocationJudgment'));
const end = wiring.indexOf('\n          }),\n        }),\n        projection: contract,', start);
const semanticPublication = wiring.slice(start, end);

const checks = [
  ['canonical semantic publication exists', start >= 0 && end > start],
  ['canonical publication does not read legacy projection fields', !semanticPublication.includes('contract.')],
  ['action identity comes from method evidence', semanticPublication.includes('createActionName(input.method.name)')],
  ['dataflow judgment comes from the method body judgment', semanticPublication.includes('dataflowJudgment: input.method.body.dataflow')],
  ['request judgment comes from upstream authority output', semanticPublication.includes('request: requestBindingJudgment')],
  ['schema comes from upstream schema judgment', semanticPublication.includes('schema: schemaSemanticJudgment.derivation.schema')],
  ['resource bindings come from upstream authority output', semanticPublication.includes('resourceBindings.map(binding => resourceBindingAuthority.publishResolved')],
  ['legacy contract remains only as sibling projection', wiring.includes('projection: contract,')],
  ['action contract version evolved to 49', contract.includes('readonly version: 49;') && wiring.includes('version: 49 as const')],
];

for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
}

if (checks.some(([, passed]) => !passed)) {
  process.exitCode = 1;
}
