const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const checks = [
  ['upstream payload location vocabulary', /RoutePayloadLocation/.test(read('packages/core/src/types/upstream/routeExecutionVocabulary.ts'))],
  ['route capability owns payload location', /readonly payloadLocation: RoutePayloadLocation/.test(read('packages/core/src/types/upstream/route.ts'))],
  ['semantic authority resolves payload location', /routePayloadLocationFromMethod/.test(read('packages/core/src/types/upstream/routeCapabilitySemanticAuthority.ts'))],
  ['api projection carries payload location', /payloadLocation: '\$\{route\.raw\.capability\.payloadLocation\}'/.test(read('packages/cli/src/generators/sdk/apiObjectEmitter.ts'))],
  ['runtime splitter does not classify by method', !/const method = route\.method/.test(read('packages/sdk/src/api-runtime/optionSplitter.ts'))],
  ['runtime splitter consumes upstream projection', /route\.payloadLocation/.test(read('packages/sdk/src/api-runtime/optionSplitter.ts'))],
  ['generated api keeps declarative nested resource/action projection', /defineApi\(\{/.test(read('packages/cli/src/generators/sdk/apiObjectEmitter.ts')) && /\$\{groupName\}: \{/.test(read('packages/cli/src/generators/sdk/apiObjectEmitter.ts'))],
];
let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (!ok) failed++;
}
process.exitCode = failed ? 1 : 0;
