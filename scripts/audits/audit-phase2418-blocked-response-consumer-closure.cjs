const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const consumerPath = path.join(root, 'packages/core/src/compiler/semantic/request-type-derivation/responseContribution.ts');
const consumer = fs.readFileSync(consumerPath, 'utf8');
const resourceStart = consumer.indexOf('function responseResource(');
const integratedStart = consumer.indexOf('const deriveIntegratedResourceResponseData');
const deriveStart = consumer.indexOf('export function deriveActionResponseData(');
const resourceConsumer = consumer.slice(resourceStart, integratedStart);
const deriveConsumer = consumer.slice(deriveStart);
const checks = [
  ['resource lookup reads the canonical response binding', resourceConsumer.includes('route.binding.responseProjection')],
  ['method-correlated response uses the exact canonical product', resourceConsumer.includes("case 'controller_method_response':") && resourceConsumer.includes('projection.product.result')],
  ['blocked projection is handled by the canonical binding switch', resourceConsumer.includes("case 'controller_response_projection_blocked':")],
  ['resource derivation does not read the compatibility descriptor', !resourceConsumer.includes('route.binding.response;')],
  ['action response derivation handles blocked judgment in the canonical switch', deriveConsumer.includes("case 'controller_response_projection_blocked':")],
  ['action response derivation does not read the compatibility descriptor', !deriveConsumer.includes('route.binding.response;')],
  ['unsupported canonical variants do not fall back to legacy inline/resource/void semantics', deriveConsumer.includes("case 'declared_response':") && deriveConsumer.includes("case 'inline_response':") && deriveConsumer.includes('return relationNone<ResponseData>()')],
  ['canonical no-content result remains explicit', consumer.includes("if (result.kind === 'no_content') return relationNone<ResponseData>()")],
  ['existing response data contract is reused without a duplicate ADT', consumer.includes('RelationOption<ResponseData>') && !consumer.includes('type Phase2418Response')],
  ['no semantic foundation dependency is introduced', !consumer.includes('semantic/foundation')],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
const passed = checks.filter(([, ok]) => ok).length;
console.log(`RESULT ${passed}/${checks.length}`);
process.exitCode = passed === checks.length ? 0 : 1;
