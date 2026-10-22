const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const providerCanonical = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/providerAstCanonical.ts'), 'utf8');
const providerProducer = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/providerProducer.ts'), 'utf8');
const serviceCanonical = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/serviceAstCanonical.ts'), 'utf8');
const serviceProducer = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/serviceProducer.ts'), 'utf8');
const checks = [
  ['provider canonical operation is typed by existing ProviderProducer interface', /export const buildProviderSemanticResultFromSource:\s*ProviderProducer\['produceResult'\]/.test(providerCanonical)],
  ['provider canonical operation consumes existing ProviderProducerInput', /\(input:\s*ProviderProducerInput\):\s*ProviderProducerResult/.test(providerCanonical)],
  ['provider producer forwards its existing input object without positional unpacking', /produceResult:\s*input\s*=>\s*buildProviderSemanticResultFromSource\(input\)/.test(providerProducer)],
  ['service canonical operation is typed by existing ServiceProducer interface', /export const buildServiceProducerResult:\s*ServiceProducer\['produceResult'\]/.test(serviceCanonical)],
  ['service canonical operation consumes existing ServiceProducerInput', /\(input:\s*ServiceProducerInput\):\s*ServiceProducerResult/.test(serviceCanonical)],
  ['service producer forwards its existing input object without positional unpacking', /produceResult:\s*input\s*=>\s*buildServiceProducerResult\(input\)/.test(serviceProducer)],
  ['provider legacy AST helper export is retired', !/export function buildProviderAstFromSource/.test(providerCanonical)],
  ['service legacy AST helper export is retired', !/export function buildServiceAstFromSource/.test(serviceCanonical)],
  ['no new upstream interface or authority file introduced by this phase', !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/phase2473ProviderProducerInterface.ts')) && !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/phase2473ServiceProducerInterface.ts'))],
  ['existing producer interfaces remain the declared producer contracts', /export interface ProviderProducer\s*\{/.test(providerProducer) && /export interface ServiceProducer\s*\{/.test(serviceProducer)],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`RESULT ${checks.length - failures}/${checks.length}\n`);
process.exitCode = failures === 0 ? 0 : 1;
