const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const producer = read('packages/core/src/types/upstream/routeProducer.ts');
const compatibility = read('packages/core/src/compiler/scanner/subscanners/routeProducer.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const checks = [
  ['existing scanner contract owns the route producer operation', /readonly routeProducer: RouteProducer/.test(contract)],
  ['scanner contract version advances with the required operation', /readonly contractVersion: 26/.test(contract)],
  ['route producer is included in the existing scanner contract Pick', /'routeProducer'/.test(scanner)],
  ['route AST construction executes the injected producer operation', /routeProducerOperation\.produce\(/.test(scanner)],
  ['scan passes the producer supplied at scanner construction', /authorities\.routeProducer,\s*input\.controllerScan/.test(scanner)],
  ['default scanner injects the upstream-owned producer', /import \{ routeProducer \} from '\.\.\/\.\.\/\.\.\/types\/upstream\/routeProducer'/.test(scanner) && /routeProducer,\s*\}\);/.test(scanner)],
  ['upstream producer implements the existing RouteProducer contract', /export const routeProducer: RouteProducer/.test(producer)],
  ['upstream producer only materializes the supplied semantic contract', /createDomainAstJudgment\(/.test(producer) && !/semantic\/relations|semantic\/foundation/.test(producer)],
  ['legacy subscanner export delegates to the upstream implementation', /export \{ routeProducer \} from '\.\.\/\.\.\/\.\.\/types\/upstream\/routeProducer'/.test(compatibility)],
  ['CLI pipeline still injects the scanner through existing dependencies', /routeScanner: laravelRouteScanner/.test(pipeline)],
  ['active route scanner no longer imports routeProducer from subscanners', !/from ['"]\.\.\/subscanners\/routeProducer['"]/.test(scanner)],
  ['active route scanner does not import semantic foundation directly', !/semantic\/foundation/.test(scanner)],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`Phase 2361 audit: ${checks.length - failed}/${checks.length} passed\n`);
assert.equal(failed, 0, 'Phase 2361 audit failed');
