const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const vocabularyPath = path.join(root, 'packages/core/src/types/upstream/modelVocabulary.ts');
const interfacePath = path.join(root, 'packages/core/src/types/upstream/modelAccessorExpressionProjectionInterface.ts');
const implementationPath = path.join(root, 'packages/core/src/compiler/scanner/modelAccessorExpressionProjection.ts');
const producerPath = path.join(root, 'packages/core/src/types/upstream/modelAccessorFactsAuthority.ts');
const authorityContractPath = path.join(root, 'packages/core/src/types/upstream/modelAccessorFactsAuthorityInterface.ts');
const evidenceProducerPath = path.join(root, 'packages/core/src/compiler/scanner/modelAccessorEvidenceProducer.ts');
const consumerPath = path.join(root, 'packages/core/src/compiler/scanner/operations/model/modelCanonical.ts');
const legacyPath = path.join(root, 'packages/core/src/compiler/scanner/operations/model/modelAccessorCanonical.ts');
const vocabulary = fs.readFileSync(vocabularyPath, 'utf8');
const contract = fs.readFileSync(interfacePath, 'utf8');
const implementation = fs.readFileSync(implementationPath, 'utf8');
const producer = fs.readFileSync(producerPath, 'utf8');
const authorityContract = fs.readFileSync(authorityContractPath, 'utf8');
const evidenceProducer = fs.readFileSync(evidenceProducerPath, 'utf8');
const consumer = fs.readFileSync(consumerPath, 'utf8');
const checks = [
  ['upstream computation ADT contains expression for rejected cases', /kind: 'rejected'; readonly expression: import\('\.\/expression'\)\.Expression; readonly result: TypeExpression/.test(vocabulary) && !/kind: 'rejected'; readonly reason:/.test(vocabulary)],
  ['upstream operation interface exists and is closed over existing ADT', /interface ModelAccessorExpressionProjectionInterface/.test(contract) && /ModelAccessorComputation/.test(contract) && /ResolvedExpression/.test(contract)],
  ['implementation uses export const name: interface', /export const modelAccessorExpressionProjection:\s*ModelAccessorExpressionProjectionInterface\s*=\s*Object\.freeze/.test(implementation)],
  ['projection has no relation/foundation dependency', !/semantic\/(relations|foundation)/.test(implementation)],
  ['projection does not classify/reconstruct rejected cases', /expression: computation\.expression/.test(implementation) && !/unsupported_expression|switch\s*\(|\bif\s*\(/.test(implementation)],
  ['upstream accessor authority supplies complete rejected expression', /kind: 'rejected' as const/.test(producer) && /missing_return_expression/.test(producer)],
  ['scanner evidence producer emits canonical expressions without exposing AST in upstream contract', /returnedExpressions/.test(evidenceProducer) && /ModelAccessorMethodEvidence/.test(authorityContract) && !/PhpAstValue|ModelDeclarationAst/.test(authorityContract)],
  ['canonical consumer uses the interface-backed projection', /modelAccessorExpressionProjection\.project\(\{ computation: accessor\.computation \}\)/.test(consumer)],
  ['legacy uncontracted canonicalizer removed', !fs.existsSync(legacyPath)],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
console.log(`RESULT ${checks.filter(([, passed]) => passed).length}/${checks.length}`);
process.exitCode = checks.every(([, passed]) => passed) ? 0 : 1;
