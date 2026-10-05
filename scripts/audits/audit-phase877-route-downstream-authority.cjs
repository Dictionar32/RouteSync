const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const target = path.join(root, 'packages/cli/src/generators/NextActionGenerator.ts');
const text = fs.readFileSync(target, 'utf8');
const forbidden = [
  'route.raw.pathParameters',
  'route.raw.queryParameters',
  'route.raw.requestContentType',
  'route.raw.executionSignature',
  'route.raw.auth',
  'route.raw.isMutating',
  'route.raw.schema',
];
const violations = forbidden.filter(token => text.includes(token));
const canonical = [
  'route.identity.parameters.path',
  'route.identity.parameters.query',
  'route.capability.requestContentType',
  'route.capability.executionSignature',
  'route.capability.auth',
];
const missingCanonical = canonical.filter(token => !text.includes(token));
const result = {
  phase: 877,
  audit: 'route-downstream-authority',
  target: 'packages/cli/src/generators/NextActionGenerator.ts',
  legacyFlatReads: violations,
  missingCanonicalReads: missingCanonical,
  pass: violations.length === 0 && missingCanonical.length === 0,
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.pass ? 0 : 1);
