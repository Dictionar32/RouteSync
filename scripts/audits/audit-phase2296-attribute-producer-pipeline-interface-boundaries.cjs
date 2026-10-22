const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['producer interface exists outside implementation', fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/attributeProducerInterface.ts'))],
  ['producer contract uses existing AST and contextuality judgments', /AttributeAst/.test(read('packages/core/src/compiler/scanner/attributeProducerInterface.ts')) && /LaravelAttributeContextualityJudgment/.test(read('packages/core/src/compiler/scanner/attributeProducerInterface.ts'))],
  ['producer implementation consumes extracted interface', /from '\.\.\/attributeProducerInterface'/.test(read('packages/core/src/compiler/scanner/subscanners/attributeProducer.ts'))],
  ['existing upstream pipeline interface retained', /interface LaravelSourceAstPipelineInterface/.test(read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts'))],
  ['existing upstream pipeline dependency interface retained', /interface LaravelSourceAstPipelineDependenciesInterface/.test(read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts'))],
  ['attribute scanner evolves in place to upstream contract v15', /interface LaravelAttributeScannerInterface\s*\{[^}]*contractVersion: 15/s.test(read('packages/core/src/types/upstream/laravelAttributeScannerInterface.ts'))],
  ['no foundation dependency introduced by producer contract', !/semantic\/foundation/.test(read('packages/core/src/compiler/scanner/attributeProducerInterface.ts'))],
  ['trace documents producer/pipeline migration mismatch', /does not yet satisfy scanner contract v14/.test(read('packages/core/src/types/upstream/docs/PHASE2296-ATTRIBUTE-PRODUCER-AND-PIPELINE-INTERFACE-BOUNDARIES.md'))],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
