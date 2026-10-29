const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['method contract exports the existing typed method-name ADT', /EloquentRelationMethodName/.test(read('packages/core/src/types/upstream/eloquentRelationMethodAuthorityInterface.ts'))],
  ['method authority uses judge input contract', /judge\(input: \{ readonly method: EloquentRelationMethodName \}\)/.test(read('packages/core/src/types/upstream/eloquentRelationMethodAuthorityInterface.ts'))],
  ['method authority uses export const name: Interface', /export const eloquentRelationMethodAuthority:\s*EloquentRelationMethodAuthorityInterface/.test(read('packages/core/src/types/upstream/eloquentRelationMethodAuthority.ts'))],
  ['complete relation authority exists upstream', /eloquentRelationFactsAuthority/.test(read('packages/core/src/types/upstream/eloquentRelationFactsAuthority.ts'))],
  ['scanner-boundary operation has an explicit interface', /interface ModelRelationFactsProducerInterface/.test(read('packages/core/src/compiler/scanner/modelRelationFactsProducer.ts'))],
  ['old subscanner producer is removed', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/model/eloquentProducer.ts'))],
];
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
const failed = checks.filter(([, passed]) => !passed);
process.stdout.write(`Phase2465 method authority audit: ${checks.length - failed.length}/${checks.length} passed\n`);
process.exitCode = failed.length === 0 ? 0 : 1;
