const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const consumerPath = path.join(root, 'packages/core/src/compiler/semantic/request-type-derivation/responseContribution.ts');
const consumer = fs.readFileSync(consumerPath, 'utf8');
const checks = [
  ['response contribution reads EndpointResponseBinding', consumer.includes('route.binding.responseProjection')],
  ['method response product is the canonical resource source', consumer.includes("case 'controller_method_response':") && consumer.includes('projection.product.result')],
  ['resource reference comes from ResponseResult.resource', consumer.includes('result.resource.name.value.value')],
  ['resource cardinality comes from canonical result', consumer.includes('result.cardinality.kind === \'collection\'')],
  ['canonical resource response resolves against resource index', consumer.includes('responseResource(route, resourceIndex)')],
  ['canonical no-content response is not inferred from legacy descriptor', consumer.includes("if (result.kind === 'no_content') return relationNone<ResponseData>()")],
  ['all endpoint response variants are handled through the canonical binding', ['controller_method_response', 'controller_response_projection_blocked', 'declared_response', 'inline_response', 'redirect_response', 'file_response', 'empty_response'].every(kind => consumer.includes(`case '${kind}'`))],
  ['response derivation no longer reads the legacy ResponseDescriptor', !consumer.includes('route.binding.response;') && !consumer.includes('descriptor.resourceName')],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
const passed = checks.filter(([, ok]) => ok).length;
console.log(`RESULT ${passed}/${checks.length}`);
process.exitCode = passed === checks.length ? 0 : 1;
