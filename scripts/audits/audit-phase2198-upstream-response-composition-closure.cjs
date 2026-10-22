const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const pipelinePath = path.join(root, 'packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts');
const indexPath = path.join(root, 'packages/core/src/types/upstream/index.ts');
const contract = fs.readFileSync(contractPath, 'utf8');
const pipeline = fs.readFileSync(pipelinePath, 'utf8');
const index = fs.readFileSync(indexPath, 'utf8');
const assertions = [
  ['complete dependency contract requires evidence producer', contract.includes('readonly evidenceProduction: LaravelControllerResponseEvidenceProductionInterface;')],
  ['complete dependency contract requires method AST projection', contract.includes('readonly methodResponseAstProjection: LaravelControllerMethodResponseAstProjectionInterface;')],
  ['integrated response calls injected producer', pipeline.includes('dependencies.evidenceProduction.produce(productionInput)')],
  ['integrated response does not call module producer directly', !pipeline.includes('const inventory = evidenceProduction.produce(productionInput)')],
  ['method projection factory binds output type authority', pipeline.includes('createLaravelControllerMethodResponseAstProjection(\n  outputTypeJudgment: LaravelControllerResponseOutputTypeJudgmentInterface,')],
  ['projection exposes its bound output authority', contract.includes('readonly outputTypeJudgment: LaravelControllerResponseOutputTypeJudgmentInterface;')],
  ['pipeline derives output judgment from injected projection', pipeline.includes('responseOutputTypeJudgment: dependencies.methodResponseAstProjection.outputTypeJudgment')],
  ['new projection factory is publicly exported', index.includes('createLaravelControllerMethodResponseAstProjection')],
  ['pipeline contract version is 28', pipeline.includes('contractVersion: 28') && contract.includes('readonly contractVersion: 28;')],
];
let failures = 0;
for (const [name, pass] of assertions) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!pass);
}
process.stdout.write(`${assertions.length - failures}/${assertions.length} assertions passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
