const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const atomInterface = read('packages/core/src/types/upstream/phpTypeAtomInterface.ts');
const atomAlgebra = read('packages/core/src/types/upstream/phpTypeAtomAlgebra.ts');
const expressionInterface = read('packages/core/src/types/upstream/phpTypeExpressionInterface.ts');
const expressionAlgebra = read('packages/core/src/types/upstream/phpTypeExpressionAlgebra.ts');
const parameterInterface = read('packages/core/src/types/upstream/phpParameterTypeInterface.ts');
const parameterAlgebra = read('packages/core/src/types/upstream/phpParameterTypeAlgebra.ts');
const tests = read('packages/core/src/types/upstream/__test__/php-type-atom-judgment.phase1480.test.ts');
const checks = [
  ['atom contract separates resolved, unsupported, and malformed', /kind: 'resolved'[\s\S]*kind: 'unsupported'[\s\S]*kind: 'malformed'/.test(atomInterface)],
  ['unsupported atom reasons are closed', /reason: 'context_required' \| 'missing_vocabulary'/.test(atomInterface)],
  ['class contextual atoms have context-required judgments', /contextualAtoms[\s\S]*self[\s\S]*parent[\s\S]*static/.test(atomAlgebra) && /'context_required'/.test(atomAlgebra)],
  ['missing canonical vocabulary is not mislabeled as syntax', /unsupportedVocabularyAtoms[\s\S]*void[\s\S]*callable/.test(atomAlgebra) && /'missing_vocabulary'/.test(atomAlgebra)],
  ['expression judgment preserves unsupported outcome', /kind: 'unsupported'/.test(expressionInterface) && /if \(judgment\.kind === 'unsupported'\) return judgment/.test(expressionAlgebra)],
  ['expression composition propagates rejected member judgments', /members\.find\(member => member\.kind !== 'resolved'\)/.test(expressionAlgebra)],
  ['parameter judgment preserves unsupported outcome', /kind: 'unsupported'/.test(parameterInterface) && /if \(atom\.kind === 'unsupported'\) return atom/.test(parameterAlgebra) && /case 'named':[\s\S]*phpTypeAtomAlgebra\.resolve/.test(parameterAlgebra)],
  ['nullable parameter evidence does not erase unsupported result', /if \(inner\.kind !== 'resolved'\) return inner/.test(parameterAlgebra)],
  ['regression tests exercise both rejection reasons and malformed atoms', /context_required[\s\S]*missing_vocabulary[\s\S]*malformed/.test(tests)],
  ['runtime projection keeps AST error projection boundary', /judgment\.kind === 'resolved'[\s\S]*kind: 'error'[\s\S]*judgment\.diagnostic/.test(read('packages/core/src/compiler/scanner/operations/propertyProducer.ts'))],
];
let failures = 0;
for (const [label, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!pass) failures += 1;
}
process.stdout.write(`RESULT ${checks.length - failures}/${checks.length}\n`);
process.exitCode = failures === 0 ? 0 : 1;
