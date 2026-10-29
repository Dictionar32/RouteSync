const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const upstream = read('packages/core/src/types/upstream/resourceProducerInterface.ts');
const producer = read('packages/core/src/compiler/scanner/operations/resourceProducer.ts');
const field = read('packages/core/src/compiler/scanner/operations/resourceFieldProducer.ts');
const binder = read('packages/core/src/compiler/scanner/binders/resource/resourceBinder.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['upstream ResourceProducerInterface owns field projection operation', /export interface ResourceProducerInterface<[\s\S]*?readonly produceField:\s*\(input:\s*ResourceFieldProducerInput<Value, Model>\)/.test(upstream)],
  ['field projection has an upstream callable operation contract', /export interface ResourceFieldProductionOperationInterface<Value extends object, Model extends object>/.test(upstream) && /export const produceResourceField:\s*ResourceFieldProductionOperationInterface<PhpAstValue, OriginModelSymbol>/.test(field)],
  ['producer implementation uses upstream ResourceProducerInterface', /type ResourceProducerContract = import\('\.\.\/\.\.\/\.\.\/types\/upstream\/resourceProducerInterface'\)\.ResourceProducerInterface</.test(producer) && /export const resourceProducer: ResourceProducerContract = Object\.freeze\(/.test(producer)],
  ['producer exposes explicit contract identity', /kind: 'laravel_resource_producer'/.test(producer) && /contractVersion: 1/.test(producer)],
  ['resource producer consumes its typed field operation', /resourceProducer\.produceField\(\{\s*entryKey: entry\.key\.value/.test(producer)],
  ['resource binder imports producer contract from upstream, not implementation types', /types\/upstream\/resourceProducerInterface/.test(binder) && !/import\("\.\.\/\.\.\/operations\/resourceProducer"\)\.ResourceProducer/.test(binder)],
  ['binder field alias is typed from upstream producer operation', /type ResourceProducerOperations = ResourceProducerInterface</.test(binder) && /export const buildResourceField:\s*ResourceProducerOperations\['produceField'\]/.test(binder)],
  ['no foundation import was introduced into field producer', !/semantic\/foundation/.test(field)],
  ['audit script remains registered', typeof packageJson.scripts['audit:phase2475-resource-field-producer-interface-wiring'] === 'string'],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`RESULT ${checks.length - failures}/${checks.length}\n`);
process.exitCode = failures === 0 ? 0 : 1;
