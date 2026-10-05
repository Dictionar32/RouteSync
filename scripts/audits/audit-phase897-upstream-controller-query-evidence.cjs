const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../packages/core');
const canonical = fs.readFileSync(path.join(root, 'src/compiler/scanner/subscanners/controller/controllerAstCanonical.ts'), 'utf8');
const producer = fs.readFileSync(path.join(root, 'src/compiler/scanner/subscanners/controller/controllerProducer.ts'), 'utf8');
const scanner = fs.readFileSync(path.join(root, 'src/compiler/scanner/subscanners/ControllerScanner.ts'), 'utf8');
const orchestrator = fs.readFileSync(path.join(root, 'src/compiler/scanner/orchestrator/sourceAstScanner.ts'), 'utf8');
const test = fs.readFileSync(path.join(root, 'src/compiler/scanner/subscanners/controller/controllerMethodContract.phase894.test.ts'), 'utf8');

const checks = {
  queryAstConsumedByControllerCanonical: canonical.includes('QueryAst') && canonical.includes('controllerQueryOperations'),
  sourceSpanContainsQuery: canonical.includes('query.source') && canonical.includes('methodSource'),
  modelWriteFromQueryEvidence: canonical.includes("'model_write'") && canonical.includes('queryOperationIsWrite'),
  databaseTableFromQueryEvidence: canonical.includes("'database_table'") && canonical.includes('literalStringFromExpression'),
  producerCarriesQueries: producer.includes('queries?: readonly QueryAst[]') && producer.includes('input.queries ?? []'),
  scannerPassesQueries: scanner.includes('queries: readonly QueryAst[]') && scanner.includes('queries,'),
  orchestratorProducesQueriesBeforeController: orchestrator.indexOf('const queries = queryProducer.produce') < orchestrator.indexOf('ControllerScanner.scanCanonicalBundle'),
  regressionCoversWriteAndTable: test.includes('model_write:Order') && test.includes('database_table:orders'),
  noMethodNameInference: !canonical.includes("method.name.value.value === 'store'") && !canonical.includes("method.name.value.value === 'show'") && !canonical.includes("method.name.value.value === 'update'"),
};
const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
const result = { phase: 897, checks, allPassed: failed.length === 0, failed };
console.log(JSON.stringify(result, null, 2));
process.exitCode = failed.length === 0 ? 0 : 1;
