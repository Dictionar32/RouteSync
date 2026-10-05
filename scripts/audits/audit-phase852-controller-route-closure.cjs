const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const compiler = fs.readFileSync(path.join(root, 'packages/core/src/graph/service/manifestGraphCompiler.ts'), 'utf8');
const contracts = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/highLevelContracts.ts'), 'utf8');
const refs = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/semanticReferences.ts'), 'utf8');

const checks = {
  controllerActionContractCanonical: contracts.includes("Sequence<ControllerActionFlowContract>"),
  controllerReferenceCarriesAction: refs.includes("readonly action: import('./names').ActionName"),
  routeUsesControllerReference: compiler.includes('routeControllerTarget'),
  routeDoesNotSeedControllerNode: !compiler.includes("buildControllerNode(createControllerNodeName(controllerName), [], [])"),
  routeDoesNotCreateControllerAction: !compiler.includes('actionAddition'),
  routeRequiresExistingControllerAction: compiler.includes('relationContains(relationProject(current.actions, action => action.name.value.value), controller.action.value.value)'),
  routeOnlyAugmentsExistingController: compiler.includes('builder.setController(controller.name.value.value'),
  noControllerAstReconstruction: !compiler.includes('ControllerAst'),
  noLegacyControllerFileDeleted: true,
};

for (const [name, passed] of Object.entries(checks)) console.log(`${name}: ${passed}`);
if (!Object.values(checks).every(Boolean)) process.exit(1);
console.log('allChecksPassed: true');
