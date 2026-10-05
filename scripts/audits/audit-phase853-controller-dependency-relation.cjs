const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const refs = read('packages/core/src/types/upstream/semanticReferences.ts');
const model = read('packages/core/src/types/upstream/highLevelSourceModel.ts');
const high = read('packages/core/src/types/upstream/highLevelContracts.ts');
const controller = read('packages/core/src/types/upstream/controller.ts');
const legacy = read('packages/core/src/types/upstream/__tests__/controller-dependency-flow.phase31.test.ts');
const checks = {
  controllerActionAuthority: high.includes('ControllerActionFlowContract'),
  dependencyAuthorityIsControllerContract: high.includes('readonly dependencies: import(\'./collections\').Sequence<ControllerDependency>'),
  dependencySemanticRelationExists: refs.includes("kind: 'controller_dependency'"),
  dependencyUsesClassReference: refs.includes('dependency: ClassReference'),
  indexConsumesControllerDependencies: model.includes('controller.action.dependencies'),
  indexProducesControllerDependencyRelation: model.includes("kind: 'controller_dependency' as const"),
  relationUsesDependencyType: model.includes('name: dependency.type'),
  noControllerAstDependencyReconstruction: !model.includes('ControllerAst') || !model.includes('controllerActionFromMethod'),
  legacyTestRetained: fs.existsSync(path.join(root, 'packages/core/src/types/upstream/__tests__/controller-dependency-flow.phase31.test.ts')),
  legacyTestStillTargetsCanonicalContract: legacy.includes('ControllerActionFlowContract'),
};
for (const [k,v] of Object.entries(checks)) console.log(`${k}: ${v}`);
if (!Object.values(checks).every(Boolean)) process.exit(1);
console.log('allChecksPassed: true');
