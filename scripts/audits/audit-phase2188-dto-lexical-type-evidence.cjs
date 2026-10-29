const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['DTO AST retains explicit class-reference evidence', read('packages/core/src/compiler/frontend/php/responseDtoAstTypes.ts').includes("kind: 'php_class_reference_property_type'")],
  ['class-reference evidence retains lexical context', read('packages/core/src/compiler/frontend/php/responseDtoAstTypes.ts').includes('readonly lexicalContext: PhpClassNameResolutionContext')],
  ['DTO parser captures namespace/import context', read('packages/core/src/compiler/frontend/php/responseDtoDeclarationParser.ts').includes('phpClassNameResolutionContextAt')],
  ['controller and DTO parser share one lexical context parser', read('packages/core/src/compiler/frontend/php/controllerDeclarationParser.ts').includes("from './phpClassNameContextParser'") && read('packages/core/src/compiler/frontend/php/responseDtoDeclarationParser.ts').includes("from './phpClassNameContextParser'")],
  ['unsupported property type syntax is explicit', read('packages/core/src/compiler/frontend/php/responseDtoDeclarationParser.ts').includes("kind: 'php_unsupported_property_type_syntax'")],
  ['upstream DTO property evidence retains class lexical context', read('packages/core/src/types/upstream/dtoPropertyTypeEvidenceInterface.ts').includes('readonly lexicalContext: PhpClassNameResolutionContext')],
  ['DTO producer carries lexical evidence into canonical DtoProperty', read('packages/core/src/compiler/scanner/operations/dtoProducer.ts').includes('typeEvidence: typeEvidence(input, item)')],
  ['upstream and package entrypoints export the evidence contract', read('packages/core/src/types/upstream/index.ts').includes('DTO_PROPERTY_TYPE_EVIDENCE_CONTRACT') && read('packages/core/src/index.ts').includes('DTO_PROPERTY_TYPE_EVIDENCE_CONTRACT')],
  ['nullable class reference keeps nullable TypeExpression', read('packages/core/src/compiler/frontend/php/responseDtoDeclarationParser.ts').includes("kind: 'nullable', value: expression")],
  ['regression test covers aliases and fully-qualified names', read('packages/core/src/compiler/frontend/php/__tests__/responseDtoTypeLexicalEvidence.phase2188.test.ts').includes('AccountUser') && read('packages/core/src/compiler/frontend/php/__tests__/responseDtoTypeLexicalEvidence.phase2188.test.ts').includes('\\\\App')],
  ['no new subscanner, relation, or foundation directory introduced', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/dtoTypeReferenceBinding')) && !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/relation')) && !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/foundation'))],
];
let failed = false;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failed ||= !passed;
}
process.stdout.write(`${checks.filter(([, passed]) => passed).length}/${checks.length} static checks passed\n`);
process.exitCode = failed ? 1 : 0;
