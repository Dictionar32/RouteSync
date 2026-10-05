const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const producer = read('packages/core/src/compiler/scanner/subscanners/controller/controllerProducer.ts');
const scanner = read('packages/core/src/compiler/scanner/subscanners/ControllerScanner.ts');
const sourceAst = read('packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
const sourceModel = read('packages/core/src/types/upstream/highLevelSourceModel.ts');

const checks = {
  controllerProducerReturnsSemanticBundle: /export interface ControllerProducerResult[\s\S]*readonly ast: ControllerAst;[\s\S]*readonly actions: Sequence<ControllerActionFlowContract>/.test(producer),
  controllerProducerUsesExistingActionAuthority: /controllerActionFromMethod/.test(producer) && /ControllerActionFlowContract/.test(producer),
  controllerBundleCarriesActions: /readonly actions: readonly ControllerActionFlowContract\[\]/.test(scanner),
  sourceAstsCarriesControllerActions: /readonly controllerActions: readonly import\('\.\/highLevelContracts'\)\.ControllerActionFlowContract\[\]/.test(collections),
  scannerPublishesProducerActions: /const controllerActions = controllerBundle\.actions/.test(sourceAst) && /controllerActions,/.test(sourceAst),
  highLevelModelConsumesProducerActions: /const controllers = source\.controllerActions/.test(sourceModel),
  highLevelModelDoesNotReconstructFromControllerAst: !/controllerNodesFromAst|sequenceExpand\(controllers, controllerNodesFromAst\)/.test(sourceModel),
  noLegacyControllerFileDeleted: fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/controller/controllerProducer.ts')),
};

const allChecksPassed = Object.values(checks).every(Boolean);
console.log(JSON.stringify({ ...checks, allChecksPassed }, null, 2));
process.exitCode = allChecksPassed ? 0 : 1;
