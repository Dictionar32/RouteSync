const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const contract = read('packages/core/src/types/upstream/resourceProducerInterface.ts');
const producer = read('packages/core/src/compiler/scanner/operations/resourceProducer.ts');
const field = read('packages/core/src/compiler/scanner/operations/resourceFieldProducer.ts');
const authority = read('packages/core/src/compiler/semantic/resourceFieldSemanticAuthority.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelResourceScanner.ts');
const checks = [
  ['existing field operation contract is the produceField property type', /readonly produceField:\s*ResourceFieldProductionOperationInterface<Value, Model>/.test(contract)],
  ['canonical producer delegates to the operation owner', producer.includes('from "./resourceFieldProducer"')],
  ['field operation is owned by scanner operations, not subscanners', exists('packages/core/src/compiler/scanner/operations/resourceFieldProducer.ts') && !exists('packages/core/src/compiler/scanner/subscanners/resource/resourceFieldProducer.ts')],
  ['field operation remains explicitly typed by the existing upstream operation interface', /export const produceResourceField:\s*ResourceFieldProductionOperationInterface<PhpAstValue, OriginModelSymbol>/.test(field)],
  ['field operation consumes the closed upstream semantic judgment once', field.includes('const judgment = resourceFieldSemanticAuthority.judge({ value, expression, model })') && field.includes('judgment.outputShape') && field.includes('meaning: judgment.meaning') && field.includes('type: judgment.type')],
  ['field semantic authority imports neither relations nor foundation', !/from\s+['"][^'"]*semantic\/(?:relations|foundation)\//.test(authority)],
  ['canonical scanner still wires the existing ResourceProducerInterface', scanner.includes('ResourceProducerInterface') && scanner.includes('resourceProducerOperations: LaravelResourceProducerOperations = resourceProducer')],
  ['no semantic foundation dependency was added to field operation', !field.includes('semantic/foundation')],
  ['remaining expression-mapper relation dependency is explicitly visible at semantic authority', field.includes('./resourceAstExpressionMapper') && !read('packages/core/src/compiler/scanner/operations/resourceAstExpressionMapper.ts').includes('semantic/relations') && read('packages/core/src/compiler/scanner/lexer/routeAst/resourceExpressionSemanticAuthority.ts').includes('semantic/relations')],
];
let failed = 0;
for (const [label, passed] of checks) { console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`); failed += Number(!passed); }
console.log(`Result: ${checks.length - failed}/${checks.length} assertions passed`);
if (failed) process.exitCode = 1;
