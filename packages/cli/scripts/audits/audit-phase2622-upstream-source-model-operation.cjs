const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const sourceModel = read('core/src/types/upstream/highLevelSourceModel.ts');
const builder = read('core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const upstreamIndex = read('core/src/types/upstream/index.ts');
const checks = [
  ['canonical source-model builder interface exists at its upstream semantic owner', /export interface CompleteLaravelSourceModelBuilderInterface/.test(sourceModel)],
  ['source-model build operation is an interface-typed frozen object', /export const buildCompleteLaravelSourceModel:\s*CompleteLaravelSourceModelBuilderInterface\s*=\s*Object\.freeze\(\s*\{/.test(sourceModel)],
  ['canonical source-model builder value follows export const name:interface', /export const completeLaravelSourceModelBuilder:\s*CompleteLaravelSourceModelBuilderInterface\s*=/.test(sourceModel)],
  ['legacy function declaration for source-model construction is retired', !/export function buildCompleteLaravelSourceModel\s*\(/.test(sourceModel)],
  ['canonical builder name aliases the same typed object operation', /completeLaravelSourceModelBuilder:\s*CompleteLaravelSourceModelBuilderInterface\s*=\s*buildCompleteLaravelSourceModel/.test(sourceModel)],
  ['upstream barrel exports source-model interface and operation owner', /export \* from ['"]\.\/highLevelSourceModel['"]/.test(upstreamIndex)],
  ['manifest builder injects the canonical source-model builder object', /const sourceModelBuilder = completeLaravelSourceModelBuilder satisfies CompleteLaravelSourceModelBuilderInterface/.test(builder) && /sourceModelBuilder,/.test(builder)],
  ['manifest builder no longer creates an inline duplicate source-model builder object', !/sourceModelBuilder:\s*Object\.freeze\(\s*\{/.test(builder)],
  ['manifest builder does not call source-model construction as an unbound function', !/buildCompleteLaravelSourceModel\s*\(/.test(builder)],
  ['manifest builder retains the explicit source-model builder dependency contract', /readonly sourceModelBuilder:\s*CompleteLaravelSourceModelBuilderInterface/.test(read('core/src/types/upstream/manifestBuilderInterface.ts'))],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.filter(([, passed]) => passed).length}/${checks.length}\n`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
