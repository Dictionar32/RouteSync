const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const sourceModelPath = path.join(root, 'packages/core/src/types/upstream/highLevelSourceModel.ts');
const manifestContractPath = path.join(root, 'packages/core/src/types/upstream/manifestBuilderInterface.ts');
const builderPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const collectionsPath = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const barrelPath = path.join(root, 'packages/core/src/types/upstream/index.ts');
const sourceModel = fs.readFileSync(sourceModelPath, 'utf8');
const manifestContract = fs.readFileSync(manifestContractPath, 'utf8');
const builder = fs.readFileSync(builderPath, 'utf8');
const barrel = fs.readFileSync(barrelPath, 'utf8');
const collectionsBytes = fs.readFileSync(collectionsPath).length;

const checks = [
  ['source-model result has fixed-domain continuation interface', sourceModel.includes('interface CompleteSourceModelManifestBuildContinuationInterface')],
  ['complete source-model judgment owns continueToManifestBuild', /interface CompleteSourceModelBuildCompleteResult[\s\S]*?continueToManifestBuild:/.test(sourceModel)],
  ['blocked source-model judgment owns continueToManifestBuild', /interface CompleteSourceModelBuildBlockedResult[\s\S]*?continueToManifestBuild:/.test(sourceModel)],
  ['complete source-model operation dispatches to onComplete', /continueToManifestBuild:[\s\S]{0,250}continuation\.onComplete\(completeJudgment\)/.test(sourceModel)],
  ['blocked source-model operation dispatches to onBlocked', /continueToManifestBuild:[\s\S]{0,250}continuation\.onBlocked\(blockedJudgment\)/.test(sourceModel)],
  ['manifest builder consumes source-model continuation', builder.includes('completeLaravelSourceModelBuildResult.continueToManifestBuild(')],
  ['manifest builder no longer branches on source-model discriminator', !builder.includes("completeLaravelSourceModelBuildResult.kind === 'source_model_build_blocked'")],
  ['source-model builder contract version is 2', /complete_laravel_source_model_builder'[\s\S]{0,80}contractVersion: 2/.test(sourceModel)],
  ['manifest builder contract version is 10', manifestContract.includes('readonly contractVersion: 10;') && builder.includes('contractVersion: 10,')],
  ['high-level source model is exported by upstream barrel', barrel.includes("export * from './highLevelSourceModel';")],
  ['collections.ts remains empty', collectionsBytes === 0],
];

const result = {
  phase: 2937,
  title: 'Source-model to manifest domain continuation closure',
  checks: checks.map(([name, passed]) => ({ name, passed })),
  passed: checks.filter(([, passed]) => passed).length,
  total: checks.length,
  collectionsBytes,
  runtimeTestStatus: 'not-run',
  typecheckStatus: 'not-run',
};

const output = path.join(root, 'PHASE2937_AUDIT.json');
fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
console.log(`${result.passed}/${result.total} structural checks passed`);
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (result.passed !== result.total) process.exitCode = 1;
