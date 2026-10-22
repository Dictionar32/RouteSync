const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../packages/core');
const canonical = fs.readFileSync(path.join(root, 'src/compiler/scanner/subscanners/controller/controllerAstCanonical.ts'), 'utf8');
const scanner = fs.readFileSync(path.join(root, 'src/compiler/scanner/wiring/laravelControllerScanner.ts'), 'utf8');
const pipeline = fs.readFileSync(path.join(root, 'src/compiler/scanner/wiring/laravelSourceAstPipeline.ts'), 'utf8');
const test = fs.readFileSync(path.join(root, 'src/compiler/scanner/subscanners/controller/controllerMethodContract.phase894.test.ts'), 'utf8');
const checks = {
  queryAstConsumedByControllerCanonical: canonical.includes('QueryAst') && canonical.includes('controllerQueryOperations'),
  sourceSpanContainsQuery: canonical.includes('query.source') && canonical.includes('methodSource'),
  modelWriteFromQueryEvidence: canonical.includes("'model_write'") && canonical.includes('queryOperationIsWrite'),
  databaseTableFromQueryEvidence: canonical.includes("'database_table'") && canonical.includes('literalStringFromExpression'),
  canonicalControllerContractReceivesQueryEvidence: scanner.includes('const queries: readonly QueryAst[] = input.queries') && scanner.includes('controllerMethodContractFromMethod') && scanner.includes('queries'),
  scannerPassesQueries: pipeline.includes('queries,') && scanner.includes('queries: readonly QueryAst[]'),
  queryProducerRunsBeforeCanonicalControllerScanner: pipeline.indexOf('const queries = queryProducer.produce') < pipeline.indexOf('laravelControllerScanner.scan('),
  regressionCoversWriteAndTable: test.includes('model_write:Order') && test.includes('database_table:orders'),
  noMethodNameInference: !canonical.includes("method.name.value.value === 'store'") && !canonical.includes("method.name.value.value === 'show'") && !canonical.includes("method.name.value.value === 'update'"),
};
const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
const result = { phase: 897, checks, allPassed: failed.length === 0, failed };
console.log(JSON.stringify(result, null, 2));
process.exitCode = failed.length === 0 ? 0 : 1;
