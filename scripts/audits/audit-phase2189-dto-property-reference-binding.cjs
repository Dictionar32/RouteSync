const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['existing reference-binding authority is imported and exposed by the integrated pipeline', () => read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts').includes("import { laravelDtoTypeReferenceBindingAuthority } from './laravelDtoTypeReferenceBindingAuthority';") && read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts').includes('dtoTypeReferenceBindingAuthority: laravelDtoTypeReferenceBindingAuthority')],
  ['resolved DTO declarations are traversed through canonical DtoProperty sequence', () => read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts').includes('declaration.declaration.semantic.properties.items')],
  ['class-reference property evidence enters the existing binding authority', () => read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts').includes('laravelDtoTypeReferenceBindingAuthority.bind(Object.freeze({'),],
  ['lexical context is forwarded from canonical property evidence', () => read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts').includes('lexicalContext: property.typeEvidence.lexicalContext')],
  ['project inventory and source provenance are forwarded', () => read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts').includes('inventory: input.dtoDeclarationInventory') && read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts').includes('source: property.typeEvidence.source')],
  ['property-level binding evidence retains its owning declaration and property', () => read('packages/core/src/types/upstream/laravelDtoTypeReferenceBindingInterface.ts').includes('ownerDeclaration: LaravelDtoDeclarationResolvedSourceEvidence') && read('packages/core/src/types/upstream/laravelDtoTypeReferenceBindingInterface.ts').includes('property: DtoProperty')],
  ['property binding judgment is retained in integrated response evidence', () => read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts').includes("kind: 'response_dto_property_type_reference_binding_judgment' as const")],
  ['unresolved property binding blocks response completion', () => read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts').includes("kind: 'response_dto_property_type_reference_unresolved'" )],
  ['pipeline and response judgment contract versions are incremented', () => read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts').includes('contractVersion: 23,') && read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts').includes('readonly contractVersion: 11;')],
  ['focused regression test covers DTO property import-alias binding', () => read('packages/core/src/types/upstream/__tests__/laravel-dto-type-reference-binding.phase2187.test.ts').includes('binds a DTO property class reference using the lexical context retained by the Laravel scanner')],
  ['no relation/foundation/subscanner layer is introduced', () => !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/relation')) && !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/foundation'))],
];

const failed = checks.filter(([name, test]) => {
  const passed = test();
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  return !passed;
});
process.stdout.write(`Phase 2189 static audit: ${checks.length - failed.length}/${checks.length} passed\n`);
process.exitCode = failed.length === 0 ? 0 : 1;
