const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const interfacePath = path.join(root, 'packages/core/src/types/upstream/queryProducerSemanticInterface.ts');
const algebraPath = path.join(root, 'packages/core/src/types/upstream/queryProducerSemanticAlgebra.ts');
const scannerPath = path.join(root, 'packages/core/src/compiler/scanner/operations/queryEvidenceProducer.ts');
const semanticInterface = fs.readFileSync(interfacePath, 'utf8');
const semanticAlgebra = fs.readFileSync(algebraPath, 'utf8');
const scanner = fs.readFileSync(scannerPath, 'utf8');

const failures = [];
if (!semanticInterface.includes('resolveModelStaticOperation')) failures.push('upstream interface does not expose resolveModelStaticOperation');
if (!semanticInterface.includes('ResolvedModelStaticOperation')) failures.push('upstream interface does not define the closed operation contract');
if (!semanticAlgebra.includes('const resolveModelStaticOperation =')) failures.push('upstream algebra does not implement model-static operation resolution');
if (!semanticAlgebra.includes("case 'orderBy':")) failures.push('upstream algebra does not own static ordering operation resolution');
if (!semanticAlgebra.includes("case 'where':")) failures.push('upstream algebra does not own static where operation resolution');
if (semanticAlgebra.includes('modelOriginStaticVocabulary')) failures.push('model origin still has a duplicate static-operation vocabulary catalog');
if (scanner.includes('modelStaticOperationCatalog')) failures.push('scanner still owns a modelStaticOperationCatalog');
if (scanner.includes('type ModelStaticOperationResolver')) failures.push('scanner still declares a model-static operation resolver type');
if (!scanner.includes('queryProducerSemanticAlgebra.resolveModelStaticOperation(expression)')) failures.push('scanner does not delegate static operation resolution to upstream authority');

if (failures.length > 0) {
  process.stderr.write(`Phase 1495 query-operation authority audit failed:\n${failures.map(value => `- ${value}`).join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('Phase 1495 query-operation authority audit passed.\n');
}
