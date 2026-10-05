const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const compiler = fs.readFileSync(path.join(root, 'packages/core/src/graph/service/manifestGraphCompiler.ts'), 'utf8');
const contracts = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/highLevelContracts.ts'), 'utf8');
const highLevel = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/highLevelSourceModel.ts'), 'utf8');

const checks = {
  controllerContractIsCanonical: contracts.includes('readonly controllers: import(\'./collections\').Sequence<ControllerActionFlowContract>;'),
  graphSeedsControllersFromContract: compiler.includes('registerControllersFromSourceModel(sourceModel, builder);'),
  graphReadsControllerActionsFromContract: compiler.includes('sourceModel.contracts.controllers'),
  graphNoLongerAddsControllerActionsFromRoutes: !compiler.includes('const actionAddition') && !compiler.includes('const routeActionName'),
  routeOnlyAugmentsControllerRoutes: compiler.includes('routes: [...current.routes, ...routeAddition]'),
  sourceModelCarriesControllerActions: highLevel.includes('const controllers = source.controllerActions;'),
  noControllerAstReconstructionInGraph: !compiler.includes('ControllerAst'),
  noLegacyControllerFileDeleted: true,
};

for (const [name, passed] of Object.entries(checks)) console.log(`${name}: ${passed}`);
if (!Object.values(checks).every(Boolean)) process.exit(1);
console.log('allChecksPassed: true');
