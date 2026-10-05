const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const targets = [
  'packages/core/src/compiler/scanner/lexer/controllerMethodParser.ts',
  'packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts',
  'packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts',
  'packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts',
  'packages/core/src/compiler/scanner/subscanners/controller/controllerDataflowContract.ts',
  'packages/core/src/compiler/scanner/subscanners/controller/controllerAstCanonical.ts',
  'packages/core/src/compiler/scanner/symbols/model/modelSymbolTableClass.ts',
  'packages/core/src/compiler/scanner/resolvers/resource/ResourceModelResolver.ts',
];
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const parser = read(targets[0]);
const dataflow = read(targets[1]);
const contract = read(targets[2]);
const route = read(targets[3]);
const controllerDataflow = read(targets[4]);
const canonical = read(targets[5]);
const symbol = read(targets[6]);
const resource = read(targets[7]);

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

const consumerRows = [
  ['controllerMethodParser', /kind:\s*'model_origin'/, 'candidate producer'],
  ['controllerDataflowAnalyzer', /kind:\s*'model_origin'/, 'candidate semantic transfer'],
  ['controllerActionContract', /semantic\.kind.*model_origin/s, 'candidate-dependent contract classification'],
  ['routeProducerRelations', /semantic\.kind.*model_origin/s, 'route binding projection'],
  ['controllerDataflowContract', /result\.value\.kind.*model_origin/s, 'semantic dataflow propagation'],
  ['controllerAstCanonical', /kind.*model_origin/, 'AST semantic projection'],
  ['modelSymbolTableClass', /findForControllerOrigin/, 'canonical verifier'],
  ['ResourceModelResolver', /findForControllerOrigin/, 'verified-model consumer'],
];

const rows = consumerRows.map(([name, pattern, role]) => ({ name, role, present: pattern.test({
  controllerMethodParser: parser,
  controllerDataflowAnalyzer: dataflow,
  controllerActionContract: contract,
  routeProducerRelations: route,
  controllerDataflowContract: controllerDataflow,
  controllerAstCanonical: canonical,
  modelSymbolTableClass: symbol,
  ResourceModelResolver: resource,
}[name]) }));

const verifierConsumers = [resource, contract, route, controllerDataflow, canonical]
  .reduce((count, text) => count + (text.match(/findForControllerOrigin/g) || []).length, 0);

const parserIsCandidate = /kind:\s*'model_origin'.*model_class/s.test(parser);
const noTypeRecomputation = !/parameter\.type|controllerParameterClassName\([^)]*type/.test(contract) &&
  !/parameter\.type|toPascalCase\([^)]*parameter/.test(route);
const controllerHasVerifierWiring = /findForControllerOrigin/.test(contract) || /findForControllerOrigin/.test(route);

const report = {
  phase: 890,
  title: 'controller model-origin consumer trace',
  classification: parserIsCandidate && verifierConsumers === 1 && noTypeRecomputation && !controllerHasVerifierWiring
    ? 'CANDIDATE_ORIGIN_CONSUMERS_CLEAN_VERIFIER_NOT_YET_WIRED'
    : 'REVIEW',
  parserIsCandidate,
  verifier: 'ModelSymbolTable.findForControllerOrigin',
  verifierConsumerCount: verifierConsumers,
  verifierCurrentConsumer: verifierConsumers === 1 ? 'ResourceModelResolver' : 'multiple-or-missing',
  controllerHasVerifierWiring,
  noTypeRecomputation,
  consumers: rows,
  recommendation: 'Keep model_origin as candidate origin. Do not add a second resolved-origin ADT. The next safe cutover is to pass the existing ModelSymbolTable into the controller semantic boundary only where a consumer requires verified model identity.',
  emptyLegacyFiles,
};

console.log(JSON.stringify(report, null, 2));
if (report.classification === 'REVIEW' || report.emptyLegacyFiles !== 203) process.exitCode = 1;
