const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const files = [
  'packages/core/src/compiler/scanner/lexer/controllerMethodParser.ts',
  'packages/core/src/compiler/scanner/subscanners/controller/controllerDataflowContract.ts',
  'packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts',
  'packages/core/src/compiler/scanner/symbols/model/modelSymbolTableClass.ts',
  'packages/core/src/compiler/scanner/resolvers/resource/ResourceModelResolver.ts',
  'packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts',
  'packages/core/src/compiler/scanner/subscanners/controller/actionScanner.ts',
  'packages/core/src/compiler/scanner/subscanners/ControllerScanner.ts',
];
const text = f => fs.readFileSync(path.join(root, f), 'utf8');
const parser = text(files[0]);
const symbol = text(files[3]);
const resource = text(files[4]);
const contract = text(files[2]);
const route = text(files[5]);
const actionScanner = text(files[6]);
const controllerScanner = text(files[7]);

const candidateProducer = /kind:\s*'model_origin'.*model_class/s.test(parser);
const verifierExists = symbol.includes('findForControllerOrigin');
const verifierConsumerCount = [resource, contract, route, actionScanner, controllerScanner].reduce((n, s) => n + (s.match(/findForControllerOrigin/g) || []).length, 0);
const contractReinfersFromType = /parameter\.type|controllerParameterClassName\([^)]*type/.test(contract);
const routeReinfersFromType = /parameter\.type|toPascalCase\([^)]*parameter/.test(route);
const actionAcceptsModelTable = /modelSymbolTable/.test(actionScanner) || /modelSymbolTable/.test(controllerScanner);
const emptyLegacyFiles = (() => {
  let count = 0;
  const skip = new Set(['.git', 'node_modules']);
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skip.has(entry.name)) continue;
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (fs.statSync(p).size === 0) count++;
    }
  };
  walk(root);
  return count;
})();;

const report = {
  phase: 889,
  title: 'controller model-origin resolution frontier',
  classification: candidateProducer && verifierExists && verifierConsumerCount === 1 && !contractReinfersFromType && !routeReinfersFromType && !actionAcceptsModelTable
    ? 'CANDIDATE_AUTHORITY_PROVEN_RESOLUTION_NOT_YET_WIRED'
    : 'REVIEW',
  candidateProducer,
  verifier: 'ModelSymbolTable.findForControllerOrigin',
  verifierExists,
  verifierConsumerCount,
  verifierCurrentConsumer: verifierConsumerCount === 1 ? 'ResourceModelResolver' : 'multiple-or-missing',
  controllerContractReinfersFromParameterType: contractReinfersFromType,
  routeReinfersFromParameterType: routeReinfersFromType,
  controllerScannerHasModelSymbolTable: actionAcceptsModelTable,
  recommendation: 'Keep ControllerVariableSemantic.model_origin as parser candidate; wire ModelSymbolTable verification at a later controller semantic boundary before claiming resolved identity.',
  emptyLegacyFiles,
};

console.log(JSON.stringify(report, null, 2));
if (report.classification === 'REVIEW') process.exitCode = 1;
