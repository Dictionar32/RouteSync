const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const accessorPath = path.join(root, 'packages/core/src/types/upstream/modelAccessorFactsAuthority.ts');
const accessorContractPath = path.join(root, 'packages/core/src/types/upstream/modelAccessorFactsAuthorityInterface.ts');
const accessorEvidencePath = path.join(root, 'packages/core/src/compiler/scanner/modelAccessorEvidenceProducer.ts');
const castsPath = path.join(root, 'packages/core/src/types/upstream/modelCastFactsAuthority.ts');
const castContractPath = path.join(root, 'packages/core/src/types/upstream/modelCastFactsAuthorityInterface.ts');
const castEvidencePath = path.join(root, 'packages/core/src/compiler/scanner/modelCastEvidenceProducer.ts');
const mapperPath = path.join(root, 'packages/core/src/compiler/scanner/modelAccessorExpressionMapper.ts');
const scannerPath = path.join(root, 'packages/core/src/compiler/scanner/laravelModelScanner.ts');
const oldAccessorPath = path.join(root, 'packages/core/src/compiler/scanner/operations/model/memberAccessorsParser.ts');
const oldCastsPath = path.join(root, 'packages/core/src/compiler/scanner/operations/model/memberCastsParser.ts');
const oldMapperPath = path.join(root, 'packages/core/src/compiler/scanner/operations/model/modelAccessorExpressionMapper.ts');
const accessor = fs.readFileSync(accessorPath, 'utf8');
const accessorContract = fs.readFileSync(accessorContractPath, 'utf8');
const accessorEvidence = fs.readFileSync(accessorEvidencePath, 'utf8');
const casts = fs.readFileSync(castsPath, 'utf8');
const castContract = fs.readFileSync(castContractPath, 'utf8');
const castEvidence = fs.readFileSync(castEvidencePath, 'utf8');
const scanner = fs.readFileSync(scannerPath, 'utf8');
const checks = [
  ['accessor semantic authority has upstream interface and typed const export', /interface ModelAccessorFactsAuthorityInterface/.test(accessorContract) && /export const modelAccessorFactsAuthority:\s*ModelAccessorFactsAuthorityInterface\s*=\s*Object\.freeze/.test(accessor)],
  ['cast authority uses upstream interface and typed const export', /interface ModelCastFactsAuthorityInterface/.test(castContract) && /export const modelCastFactsAuthority:\s*ModelCastFactsAuthorityInterface\s*=\s*Object\.freeze/.test(casts)],
  ['accessor upstream authority has no direct relation/foundation imports', !/semantic\/(relations|foundation)/.test(accessor) && !/compiler\/scanner|ModelDeclarationAst|PhpAstValue/.test(accessorContract)],
  ['accessor evidence producer has typed export and upstream evidence output', /export const modelAccessorEvidenceProducer:\s*ModelAccessorEvidenceProducerInterface\s*=\s*Object\.freeze/.test(accessorEvidence) && /ModelAccessorMethodEvidence/.test(accessorEvidence)],
  ['cast authority and evidence producer have no direct relation/foundation imports', !/semantic\/(relations|foundation)/.test(casts) && !/semantic\/(relations|foundation)/.test(castEvidence)],
  ['scanner consumes the existing typed PHP expression authority; redundant mapper wrappers are retired', !fs.existsSync(mapperPath) && !fs.existsSync(oldMapperPath) && /phpAstExpressionSemanticAuthority\.derive\(/.test(accessorEvidence)],
  ['model scanner wires upstream cast authority and accessor operation directly', /modelCastFactsAuthority\.judge\(/.test(scanner) && /modelCastEvidenceProducer\.produce\(/.test(scanner) && /modelAccessorFactsAuthority\.judge\(/.test(scanner) && /modelAccessorEvidenceProducer\.produce\(/.test(scanner)],
  ['legacy accessor/cast parser modules retired', !fs.existsSync(oldAccessorPath) && !fs.existsSync(oldCastsPath) && !fs.existsSync(accessorPath.replace('/types/upstream/modelAccessorFactsAuthority.ts', '/compiler/scanner/modelAccessorFactsDerivation.ts'))],
  ['cast evidence producer reads canonical initialization ADT', /property\.initialization\.kind === 'present'/.test(castEvidence) && /initialization\.value/.test(castEvidence)],
  ['cast contract uses upstream-owned evidence and ModelCast; accessor output remains upstream', /interface ModelCastSourceEvidence/.test(castContract) && /readonly judge: .*readonly ModelCast\[\]/.test(castContract) && /ModelCastTargetSourceEvidence/.test(castContract) && /readonly judge: \(input: ModelAccessorFactsAuthorityInput\) => readonly ModelAccessorFact\[\]/.test(accessorContract)],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
console.log(`RESULT ${checks.filter(([, passed]) => passed).length}/${checks.length}`);
process.exitCode = checks.every(([, passed]) => passed) ? 0 : 1;
