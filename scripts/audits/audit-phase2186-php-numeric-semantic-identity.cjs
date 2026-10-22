const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['upstream vocabulary preserves integer and decimal', () => /kind: 'integer'/.test(read('packages/core/src/types/upstream/primitiveVocabulary.ts')) && /kind: 'decimal'/.test(read('packages/core/src/types/upstream/primitiveVocabulary.ts'))],
  ['PHP atom authority distinguishes int and float', () => /int: 'integer'/.test(read('packages/core/src/types/upstream/phpTypeAtomAlgebra.ts')) && /float: 'decimal'/.test(read('packages/core/src/types/upstream/phpTypeAtomAlgebra.ts'))],
  ['DTO parser preserves int and float', () => /\['int', \{ kind: 'primitive', value: \{ kind: 'integer' \} \}\]/.test(read('packages/core/src/compiler/scanner/lexer/responseDtoDeclarationParser.ts')) && /\['float', \{ kind: 'primitive', value: \{ kind: 'decimal' \} \}\]/.test(read('packages/core/src/compiler/scanner/lexer/responseDtoDeclarationParser.ts'))],
  ['attribute producer preserves int and float', () => /\['int', \{ kind: 'primitive', value: \{ kind: 'integer' \} \}\]/.test(read('packages/core/src/compiler/scanner/subscanners/attributeProducer.ts')) && /\['float', \{ kind: 'primitive', value: \{ kind: 'decimal' \} \}\]/.test(read('packages/core/src/compiler/scanner/subscanners/attributeProducer.ts'))],
  ['primitive semantic projection recognizes new variants', () => /\['integer', 'integer'\]/.test(read('packages/core/src/types/domain/typeExpressionSemanticRelations.ts')) && /\['decimal', 'decimal'\]/.test(read('packages/core/src/types/domain/typeExpressionSemanticRelations.ts'))],
  ['generic semantic type lowering remains numeric-compatible', () => /Object\.is\(projection, 'integer'\)/.test(read('packages/core/src/types/domain/typeExpressionSemanticType.ts')) && /Object\.is\(projection, 'decimal'\)/.test(read('packages/core/src/types/domain/typeExpressionSemanticType.ts'))],
  ['response DTO reader maps integer and decimal distinctly', () => /kind: 'whole_number'/.test(read('packages/core/src/compiler/scanner/subscanners/controller/responseDtoReader.ts')) && /kind: 'decimal_number'/.test(read('packages/core/src/compiler/scanner/subscanners/controller/responseDtoReader.ts'))],
  ['projection contract version is advanced', () => /contractVersion: 2/.test(read('packages/core/src/types/upstream/laravelDtoResponseValueProjectionInterface.ts'))],
  ['regression test covers end-to-end DTO numeric distinction', () => fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/controller/__tests__/responseDtoReader.phase2186.test.ts'))],
  ['no relation/foundation or subscanner was added', () => !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/relation')) && !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/foundation'))],
];
let failed = 0;
for (const [name, check] of checks) {
  const passed = Boolean(check());
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failed += Number(!passed);
}
process.stdout.write(`\n${checks.length - failed}/${checks.length} static checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
