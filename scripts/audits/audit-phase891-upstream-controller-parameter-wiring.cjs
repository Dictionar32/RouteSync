const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const controller = read('packages/core/src/types/upstream/controller.ts');
const highLevel = read('packages/core/src/types/upstream/highLevelContracts.ts');
const canonical = read('packages/core/src/compiler/scanner/subscanners/controller/controllerAstCanonical.ts');
const producer = read('packages/core/src/compiler/scanner/subscanners/controller/controllerProducer.ts');
const contract = read('packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts');
const parser = read('packages/core/src/compiler/scanner/lexer/controllerMethodParser.ts');

const emptyLegacyFiles = (() => {
  let count = 0;
  const skip = new Set(['.git', 'node_modules']);
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skip.has(entry.name)) continue;
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (fs.statSync(file).size === 0) count++;
    }
  };
  walk(root);
  return count;
})();

const checks = {
  upstreamParameterKindExists: /export type ControllerParameterKind\s*=/.test(controller),
  upstreamParameterExists: /export interface ControllerParameter\s*\{/.test(controller),
  actionOwnsParameters: /export interface ControllerAction\s*\{[\s\S]*readonly parameters: Sequence<ControllerParameter>/.test(controller),
  flowContractRetainsAction: /export interface ControllerActionFlowContract extends ControllerActionHighLevelContract/.test(highLevel),
  canonicalParameterProducer: /const controllerParameters = \(method: ControllerMethodAst, dependencies: readonly ControllerDependency\[\], file: string\)/.test(canonical),
  dependencyUsesCanonicalIdentity: /candidate\.parameter\.value\.value, parameter\.name\.value\.value/.test(canonical),
  modelUsesExistingSemanticOrigin: /model: model\.name/.test(canonical),
  requestUsesExistingSemanticOrigin: /request: value\.name/.test(canonical),
  actionReceivesParameters: /parameters: controllerParameters\(method, dependencies, file\)/.test(canonical),
  producerStillUsesCanonicalActionFactory: /controllerActionFromMethod\(/.test(producer),
  noParameterTypeReclassification: !/parameter\.type/.test(canonical),
  existingDependencyResolverRemainsAuthority: /resolveMethodDependencies\(method\.parameters/.test(contract) && /resolveConstructorDependencies\(constructorParameters/.test(contract),
  parserRemainsEvidenceProducer: /readonly semantic: ControllerVariableSemantic/.test(parser) || /semantic: parameterSemantic/.test(parser),
  noNewModelSymbolTableWiring: !/ModelSymbolTable/.test(canonical),
};

const passed = Object.values(checks).every(Boolean) && emptyLegacyFiles === 203;
const report = {
  phase: 891,
  title: 'upstream controller parameter wiring',
  classification: passed ? 'WIRED_EXISTING_UPSTREAM_PARAMETER_CONTRACT' : 'REVIEW',
  checks,
  emptyLegacyFiles,
  deletedLegacyFiles: 0,
  authority: 'ControllerParameterAst.semantic -> ControllerParameter -> ControllerAction.parameters -> ControllerActionFlowContract',
  dependencyAuthority: 'ControllerDependency.parameter',
  routeBindingBoundary: 'route contract remains separate from controller parameter classification',
};
console.log(JSON.stringify(report, null, 2));
if (!passed) process.exitCode = 1;
