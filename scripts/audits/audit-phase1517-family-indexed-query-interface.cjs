const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['rule obligations preserve tuple-level types', /const queryOperationRuleRequirement\s*=\s*<\s*const Premises extends readonly QueryOperationSemanticPremise\[\]/s.test(read('packages/core/src/types/upstream/queryProducerSemanticInterface.ts'))],
  ['rule declaration is indexed by its semantic family', /export type QueryOperationSemanticRuleDeclarationFor<\s*Rule extends QueryOperationSemanticRuleFamily/s.test(read('packages/core/src/types/upstream/queryProducerSemanticInterface.ts'))],
  ['public declaration is a mapped closed union over rule families', /export type QueryOperationSemanticRuleDeclaration\s*=\s*\{\s*\[Rule in QueryOperationSemanticRuleFamily\]/s.test(read('packages/core/src/types/upstream/queryProducerSemanticInterface.ts'))],
  ['each family declaration encodes its required premises', /QueryOperationSemanticRequiredPremises<Rule>/s.test(read('packages/core/src/types/upstream/queryProducerSemanticInterface.ts'))],
  ['each family declaration encodes its required constraints', /QueryOperationSemanticRequiredConstraints<Rule>/s.test(read('packages/core/src/types/upstream/queryProducerSemanticInterface.ts'))],
  ['rule authoring helper is generic over the rule identity', /const declareQueryOperationRule = <Rule extends ClaimedQueryOperationRule\['kind'\]>/s.test(read('packages/core/src/types/upstream/queryProducerSemanticReasoning.ts'))],
  ['public index exports the family-indexed contract', /QueryOperationSemanticRuleFamily, QueryOperationSemanticRuleDeclarationFor/.test(read('packages/core/src/index.ts'))],
  ['scanner still consumes the upstream judgment rather than declaring rule obligations', /queryProducerSemanticAlgebra\.resolveQueryOperation\(/.test(read('packages/core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts'))],
];
let failed = false;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failed ||= !passed;
}
process.exitCode = failed ? 1 : 0;
