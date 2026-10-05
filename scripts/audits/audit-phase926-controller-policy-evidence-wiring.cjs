const fs = require('fs');
const path = require('path');
const root = process.cwd();
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const controller = read('packages/core/src/types/upstream/controller.ts');
const policy = read('packages/core/src/types/upstream/controllerActionPolicyRelations.ts');
const sourceModel = read('packages/core/src/types/upstream/highLevelSourceModel.ts');
const scanner = read('packages/core/src/compiler/scanner/subscanners/ControllerScanner.ts');
const dataflow = read('packages/core/src/types/upstream/semanticDataflowInterface.ts');
const result = {
  controllerCarriesPolicyEvidence: /readonly policy: Sequence<ControllerPolicyRelation>/.test(controller),
  controllerCarriesInheritanceEvidence: /readonly inheritedFrom: readonly ControllerName\[\]/.test(controller),
  evidenceProjectionPresent: /controllerActionPolicyRelationsFromEvidence/.test(policy),
  sourceModelConsumesActionPolicy: /controllerActionPolicyRelationsFromEvidence\([\s\S]*controller\.action\.policy/.test(sourceModel),
  scannerPassesPolicyToAction: /controllerActionFromMethod\([\s\S]*contract\.policy, inheritedControllerNames/.test(scanner),
  scannerNoDataflowPolicyVocabulary: !/dataflow_(?:middleware|authorization|policy)/.test(scanner),
  dataflowPolicyVocabularyAbsent: !/dataflow_(?:middleware|authorization|policy)/.test(dataflow),
  fixtureAbsent: !fs.existsSync(path.join(root, 'examples/ecomerce-shop-source')),
};
result.clean = Object.values(result).every(Boolean);
console.log(JSON.stringify(result, null, 2));
if (!result.clean) process.exitCode = 1;
