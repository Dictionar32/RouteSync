'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const interfacePath = path.join(root, 'src/types/upstream/queryProducerSemanticInterface.ts');
const algebraPath = path.join(root, 'src/types/upstream/queryProducerSemanticAlgebra.ts');
const producerPath = path.join(root, 'src/compiler/scanner/subscanners/queryEvidenceProducer.ts');
const testPath = path.join(root, 'src/types/upstream/__test__/queryProducerSemanticAlgebra.phase1487.test.ts');
const source = Object.fromEntries(Object.entries({
  interface: interfacePath, algebra: algebraPath, producer: producerPath, tests: testPath,
}).map(([key, file]) => [key, fs.readFileSync(file, 'utf8')]));
const checks = {
  interfaceOwnsRelationPathJudgment: /resolveRelationPath:\s*\(evidence: Expression \| RelationNoneValue\) => QueryProducerSemanticJudgment<RelationPath>/.test(source.interface),
  interfaceOwnsGroupingJudgment: /resolveQueryGrouping:\s*\(evidence: readonly Expression\[\]\) => QueryProducerSemanticJudgment<QueryGrouping>/.test(source.interface),
  interfaceOwnsDateVocabulary: /resolveQueryDatePart/.test(source.interface) && /resolveQueryDateRelative/.test(source.interface),
  relationPathDelegatesToUpstream: /queryProducerSemanticAlgebra\.resolveRelationPath\(expression\)/.test(source.producer),
  groupingDelegatesToUpstream: /queryProducerSemanticAlgebra\.resolveQueryGrouping\(expressions\)/.test(source.producer),
  dateCatalogRemovedFromProducer: !/const queryDate(?:Part|Relative)Catalog/.test(source.producer) && !/queryDate(?:Part|Relative)\s*=\s*\(name: string\).*relationCatalogValueOr/.test(source.producer),
  unknownOrderingIsMalformed: /unsupported ordering direction/.test(source.algebra) && /resolveOrderingDirection: \(evidence: Expression \| RelationNoneValue\) => QueryProducerSemanticJudgment<OrderDirection>/.test(source.interface),
  negativeSemanticTestsExist: /retains malformed relation-path evidence/.test(source.tests) && /never defaults unknown methods to today\/date/.test(source.tests) && /rejects unknown ordering direction/.test(source.tests),
};
const failed = Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name);
const result = { phase: 1489, direction: 'semantic model => interface contract => scanner wiring => AST projection', checks, passed: failed.length === 0, failed };
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (failed.length > 0) process.exitCode = 1;
