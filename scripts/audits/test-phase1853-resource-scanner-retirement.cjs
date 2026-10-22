const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const cliComposition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const resourceWiring = read('packages/core/src/compiler/scanner/wiring/laravelResourceScanner.ts');
const upstream = read('packages/core/src/types/upstream/laravelResourceScannerInterface.ts');
const retirement = read('packages/core/src/types/upstream/laravelSubscannerRetirementInterface.ts');
const results = [
  ['cli pipeline composition remains canonical', cliComposition.includes('buildManifestWithInvocationPipeline')],
  ['source AST pipeline consumes LaravelResourceScannerInterface implementation', pipeline.includes('laravelResourceScanner.scan')],
  ['legacy ResourceScanner.ts is absent', !exists('packages/core/src/compiler/scanner/subscanners/ResourceScanner.ts')],
  ['legacy resourceProducer remains an active production dependency', resourceWiring.includes("from '../subscanners/resourceProducer'") && resourceWiring.includes('resourceProducer.produceResult')],
  ['resource scanner interface owns closed scan contract', upstream.includes('interface LaravelResourceScannerInterface') && upstream.includes('readonly closed: true')],
  ['retirement contract explicitly gates deletion on zero production consumers', retirement.includes('zero-production-consumers-and-audit-passes')],
  ['resource binding consumes complete controller scan judgment', resourceWiring.includes('controllerScan: input.controllerScan')],
  ['resource binding authority is called for one batch', resourceWiring.includes('input.bindingAuthority.judgeBatch')],
];
for (const [name, passed] of results) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`RESULT ${results.filter(([, passed]) => passed).length}/${results.length}`);
if (results.some(([, passed]) => !passed)) process.exitCode = 1;
