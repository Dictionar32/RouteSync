const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const sourceModel = read('core/src/types/upstream/highLevelSourceModel.ts');
const builder = read('core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const upstreamIndex = read('core/src/types/upstream/index.ts');
const checks = [
  ['canonical source-model builder interface exists at its upstream semantic owner', /export interface CompleteLaravelSourceModelBuilderInterface/.test(sourceModel)],
  ['source-model build operation is typed from the existing interface method', /export const buildCompleteLaravelSourceModel:\s*CompleteLaravelSourceModelBuilderInterface\[['"]build['"]\]\s*=/.test(sourceModel)],
  ['canonical source-model builder value follows export const name:interface', /export const completeLaravelSourceModelBuilder:\s*CompleteLaravelSourceModelBuilderInterface\s*=/.test(sourceModel)],
  ['legacy function declaration for source-model construction is retired', !/export function buildCompleteLaravelSourceModel\s*\(/.test(sourceModel)],
  ['canonical builder value binds the typed build operation', /build:\s*buildCompleteLaravelSourceModel/.test(sourceModel)],
  ['upstream barrel exports source-model interface and operation owner', /export \* from ['"]\.\/highLevelSourceModel['"]/.test(upstreamIndex)],
  ['manifest builder wires the canonical source-model builder value', /sourceModelBuilder:\s*completeLaravelSourceModelBuilder\s+satisfies\s+CompleteLaravelSourceModelBuilderInterface/.test(builder)],
  ['manifest builder no longer creates an inline duplicate source-model builder object', !/sourceModelBuilder:\s*Object\.freeze\(\s*\{/.test(builder)],
  ['manifest builder does not call source-model construction as an unbound function', !/buildCompleteLaravelSourceModel\s*\(/.test(builder)],
  ['manifest builder retains the explicit source-model builder dependency contract', /readonly sourceModelBuilder:\s*CompleteLaravelSourceModelBuilderInterface/.test(read('core/src/types/upstream/manifestBuilderInterface.ts'))],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.filter(([, passed]) => passed).length}/${checks.length}\n`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
