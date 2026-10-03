const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const algebra = read('packages/core/src/types/domain/phpAst/algebra.ts');
const projector = read('packages/core/src/compiler/projectors/ApiFieldProjector.ts');
const resourceDescriptorIndex = read('packages/core/src/compiler/scanner/descriptors/resource/index.ts');
const resourceClass = read('packages/core/src/compiler/scanner/descriptors/resource/resourceDescriptorClass.ts');
const resourceTypes = read('packages/core/src/compiler/scanner/descriptors/resource/resourceDescriptorTypes.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = {
  phpAstUsesRefinementAlgebra: algebra.includes('relationRefine(') && algebra.includes('relationOptionFold('),
  phpAstNoNeverCast: !algebra.includes('as never'),
  phpAstNoRelationBooleanNarrowing: !algebra.includes('relationResolve(\n        relationEqual('),
  phpAstArgumentClosedElimination: algebra.includes("Extract<PhpArgument, { readonly kind: 'named' }>") && algebra.includes("Extract<PhpArgument, { readonly kind: 'unpacked' }>"),
  phpAstReturnClosedElimination: algebra.includes("Extract<PhpReturnExpression, { readonly kind: 'value' }>"),
  phpAstStatementClosedElimination: algebra.includes("Extract<PhpStatement, { readonly kind: 'return_statement' }>"),
  apiProjectorUsesRequestMeaning: projector.includes('field.meaning') && projector.includes('meaning.accept'),
  apiProjectorNoLegacyTypeAccess: !projector.includes('field.type'),
  apiProjectorNoUnknownCast: !projector.includes('unknown'),
  apiProjectorNoHostControlFlow: !/\b(if|for|while|switch)\s*\(/.test(projector),
  legacyResourceDescriptorIndexEmpty: resourceDescriptorIndex.trim() === '',
  legacyResourceDescriptorClassEmpty: resourceClass.trim() === '',
  legacyResourceDescriptorTypesEmpty: resourceTypes.trim() === '',
  phaseScriptRegistered: typeof packageJson.scripts?.['audit:phase720-php-ast-request-projector'] === 'string',
};
const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
const result = { phase: 720, checks, pass: failed.length === 0, failed };
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.pass ? 0 : 1;
