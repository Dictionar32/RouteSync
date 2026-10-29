const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['upstream field judgment is a closed named contract', () => {
    const source = read('packages/core/src/types/upstream/resourceFieldSemanticAuthorityInterface.ts');
    return source.includes("kind: 'resource_field_semantic_judgment'") && source.includes('interface ResourceFieldSemanticAuthorityInterface') && source.includes('readonly judge:');
  }],
  ['upstream contract avoids scanner-owned AST imports', () => {
    const source = read('packages/core/src/types/upstream/resourceFieldSemanticAuthorityInterface.ts');
    return !source.includes('scanner/') && !source.includes('PhpAst');
  }],
  ['semantic authority is declared through the upstream interface', () => {
    const source = read('packages/core/src/compiler/semantic/resourceFieldSemanticAuthority.ts');
    return source.includes('export const resourceFieldSemanticAuthority: ResourceFieldSemanticAuthorityInterface<PhpAstValue, OriginModelSymbol>');
  }],
  ['semantic authority does not import relation or foundation', () => {
    const source = read('packages/core/src/compiler/semantic/resourceFieldSemanticAuthority.ts');
    return !/from\s+['"][^'"]*semantic\/(?:relations|foundation)\//.test(source);
  }],
  ['field producer consumes upstream judgment for meaning and type', () => {
    const source = read('packages/core/src/compiler/scanner/operations/resourceFieldProducer.ts');
    return source.includes('resourceFieldSemanticAuthority.judge({ value, expression, model })') && !source.includes('const fieldMeaning') && !source.includes('const fieldType');
  }],
  ['output shape is a closed upstream judgment', () => {
    const contract = read('packages/core/src/types/upstream/resourceFieldSemanticAuthorityInterface.ts');
    const authority = read('packages/core/src/compiler/semantic/resourceFieldSemanticAuthority.ts');
    return contract.includes('ResourceFieldOutputShapeJudgment') && contract.includes('readonly outputShape: ResourceFieldOutputShapeJudgment') && authority.includes('outputShape: outputShape(input.value)');
  }],
  ['field producer projects upstream output shape without relation combinators', () => {
    const source = read('packages/core/src/compiler/scanner/operations/resourceFieldProducer.ts');
    return source.includes('judgment.outputShape') && !source.includes('semantic/relations/') && source.includes('output-shape judgment disagrees with its source evidence');
  }],
  ['semantic type is preserved from resolved model source evidence', () => {
    const source = read('packages/core/src/compiler/semantic/resourceFieldSemanticAuthority.ts');
    return source.includes('return value.source.traversal.semanticType;') && source.includes('return value.source.semanticType;');
  }],
  ['upstream barrel exports the new contract', () => read('packages/core/src/types/upstream/index.ts').includes("export * from './resourceFieldSemanticAuthorityInterface';")],
  ['remaining Resource relation/subscanner debt is explicitly detectable', () => {
    const producer = read('packages/core/src/compiler/scanner/operations/resourceProducer.ts');
    const field = read('packages/core/src/compiler/scanner/operations/resourceFieldProducer.ts');
    const mapper = read('packages/core/src/compiler/scanner/operations/resourceAstExpressionMapper.ts');
    const authority = read('packages/core/src/compiler/frontend/php/routeAst/resourceExpressionSemanticAuthority.ts');
    return producer.includes('semantic/relations/') && !field.includes('semantic/relations/') && !mapper.includes('semantic/relations/') && authority.includes('semantic/relations/');
  }],
];
let failed = 0;
for (const [name, check] of checks) {
  let passed = false;
  try { passed = Boolean(check()); } catch (error) { console.error(error); }
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
  failed += Number(!passed);
}
console.log(`\nResult: ${checks.length - failed}/${checks.length} assertions passed`);
if (failed) process.exitCode = 1;
