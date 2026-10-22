const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const interfacePath = 'packages/core/src/types/upstream/modelAccessorFactsAuthorityInterface.ts';
const authorityPath = 'packages/core/src/types/upstream/modelAccessorFactsAuthority.ts';
const producerPath = 'packages/core/src/compiler/scanner/modelAccessorEvidenceProducer.ts';
const scannerPath = 'packages/core/src/compiler/scanner/laravelModelScanner.ts';
const vocabularyPath = 'packages/core/src/types/upstream/modelVocabulary.ts';
const interfaceSource = read(interfacePath);
const authority = read(authorityPath);
const producer = read(producerPath);
const scanner = read(scannerPath);
const vocabulary = read(vocabularyPath);
const checks = [
  ['upstream accessor authority interface exists', exists(interfacePath)],
  ['upstream contract uses evidence ADT without compiler AST imports', /ModelAccessorMethodEvidence/.test(interfaceSource) && !/compiler\/scanner|ModelDeclarationAst|PhpAstValue/.test(interfaceSource)],
  ['contract exposes a closed return-type evidence union', /kind: 'absent'/.test(interfaceSource) && /kind: 'class_reference'/.test(interfaceSource) && /kind: 'other_return_type'/.test(interfaceSource)],
  ['authority uses export const name: existing interface pattern', /export const modelAccessorFactsAuthority:\s*ModelAccessorFactsAuthorityInterface\s*=\s*Object\.freeze/.test(authority)],
  ['authority has no direct relation/foundation dependency', !/semantic\/(relations|foundation)/.test(authority)],
  ['scanner produces evidence then delegates judgment upstream', /modelAccessorEvidenceProducer\.produce\(/.test(scanner) && /modelAccessorFactsAuthority\.judge\(/.test(scanner)],
  ['compiler evidence producer is interface-backed', /export const modelAccessorEvidenceProducer:\s*ModelAccessorEvidenceProducerInterface\s*=\s*Object\.freeze/.test(producer)],
  ['producer consumes existing PHP expression authority interface instead of a function wrapper', /phpAstExpressionSemanticAuthority\.derive\(/.test(producer) && !exists('packages/core/src/compiler/scanner/modelAccessorExpressionMapper.ts')],
  ['compiler-local accessor semantic derivation has been retired', !exists('packages/core/src/compiler/scanner/modelAccessorFactsDerivation.ts')],
  ['upstream model vocabulary has no direct relation/foundation import', !/semantic\/(relations|foundation)/.test(vocabulary)],
  ['existing ModelAccessorFact contract remains the judgment output', /readonly judge: \(input: ModelAccessorFactsAuthorityInput\) => readonly ModelAccessorFact\[\]/.test(interfaceSource)],
];
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
const failed = checks.filter(([, passed]) => !passed);
process.stdout.write(`Phase2464 audit: ${checks.length - failed.length}/${checks.length} passed\n`);
process.exitCode = failed.length === 0 ? 0 : 1;
