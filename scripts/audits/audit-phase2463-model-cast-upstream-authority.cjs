const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const interfacePath = path.join(root, 'packages/core/src/types/upstream/modelCastFactsAuthorityInterface.ts');
const authorityPath = path.join(root, 'packages/core/src/types/upstream/modelCastFactsAuthority.ts');
const evidencePath = path.join(root, 'packages/core/src/compiler/scanner/modelCastEvidenceProducer.ts');
const scannerPath = path.join(root, 'packages/core/src/compiler/scanner/laravelModelScanner.ts');
const oldPath = path.join(root, 'packages/core/src/compiler/scanner/modelCastFactsDerivation.ts');
const contract = fs.readFileSync(interfacePath, 'utf8');
const authority = fs.readFileSync(authorityPath, 'utf8');
const evidence = fs.readFileSync(evidencePath, 'utf8');
const scanner = fs.readFileSync(scannerPath, 'utf8');
const checks = [
  ['upstream contract defines source evidence without compiler AST imports', /interface ModelCastSourceEvidence/.test(contract) && !/compiler\/scanner|ModelDeclarationAst|PhpAstValue/.test(contract)],
  ['upstream authority is explicitly interface-first', /interface ModelCastFactsAuthorityInterface/.test(contract) && /export const modelCastFactsAuthority:\s*ModelCastFactsAuthorityInterface\s*=\s*Object\.freeze/.test(authority)],
  ['upstream authority owns cast target judgment', /judge: input => Object\.freeze\(input\.evidence\.map\(castFrom\)\)/.test(authority)],
  ['upstream authority has no direct relation/foundation dependency', !/semantic\/(relations|foundation)/.test(authority)],
  ['upstream authority no longer delegates to EloquentCastMapper', !/EloquentCastMapper|types\/domain\/eloquentTypes/.test(authority)],
  ['source evidence producer has an explicit typed interface', /interface ModelCastEvidenceProducerInterface/.test(evidence) && /export const modelCastEvidenceProducer:\s*ModelCastEvidenceProducerInterface\s*=\s*Object\.freeze/.test(evidence)],
  ['source evidence producer only imports upstream evidence plus compiler AST types', /ModelCastSourceEvidence/.test(evidence) && !/semantic\/(relations|foundation)/.test(evidence)],
  ['model scanner connects source evidence to upstream authority', /modelCastEvidenceProducer\.produce\(/.test(scanner) && /modelCastFactsAuthority\.judge\(\{ evidence: castEvidence \}\)/.test(scanner)],
  ['legacy scanner-local cast derivation is retired', !fs.existsSync(oldPath)],
  ['upstream evidence preserves property, raw target, and source provenance', /readonly property: PropertyName/.test(contract) && /readonly target: ModelCastTargetSourceEvidence/.test(contract) && /literal_cast_target/.test(contract) && /class_cast_target/.test(contract) && /readonly source: SourceSpan/.test(contract)],
  ['cast authority returns canonical upstream ModelCast', /import type \{ ModelCast \} from '\.\/model'/.test(contract) && /readonly judge: .*readonly ModelCast\[\]/.test(contract)],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
console.log(`RESULT ${checks.filter(([, passed]) => passed).length}/${checks.length}`);
process.exitCode = checks.every(([, passed]) => passed) ? 0 : 1;
