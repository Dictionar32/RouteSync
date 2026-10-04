const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const file = path.join(root, 'packages/core/src/compiler/scanner/lexer/routeAst/routeSyntaxSemanticInterface.ts');
const source = fs.readFileSync(file, 'utf8');
const emptyFiles = [
  'packages/core/src/types/semantic/parsedAstTypes.ts',
  'packages/core/src/types/semantic/parsedAstAlgebra.ts',
  'packages/core/src/types/semantic/__archive__/parsedAstTypes.ts',
  'packages/core/src/types/semantic/__archive__/parsedAstAlgebra.ts',
  'packages/core/src/compiler/scanner/descriptors/model/entity/index.ts',
  'packages/core/src/compiler/scanner/descriptors/model/entity/modelDescriptorClass.ts',
  'packages/core/src/compiler/scanner/descriptors/model/entity/modelEntityFactory.ts',
  'packages/core/src/compiler/scanner/descriptors/model/entity/types.ts',
  'packages/core/src/compiler/scanner/descriptors/model/modelAccessorDescriptor.ts',
  'packages/core/src/compiler/scanner/descriptors/model/modelCastDescriptor.ts',
  'packages/core/src/compiler/scanner/descriptors/model/modelColumnDescriptor.ts',
  'packages/core/src/compiler/scanner/descriptors/model/modelEntityDescriptor.ts',
  'packages/core/src/compiler/scanner/descriptors/model/modelRelationDescriptor.ts',
  'packages/core/src/compiler/scanner/descriptors/model/relation/index.ts',
  'packages/core/src/compiler/scanner/descriptors/model/relation/modelRelationDescriptorClass.ts',
  'packages/core/src/compiler/scanner/descriptors/model/relation/relationFactories.ts',
  'packages/core/src/compiler/scanner/descriptors/model/relation/types.ts',
].map((relative) => ({ relative, empty: fs.statSync(path.join(root, relative)).size === 0 }));
const semanticSource = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
const forbidden = /\b(if|while|for|switch)\b|\.map\(|\.filter\(|\.reduce\(|\.flatMap\(|\?\?|\bas\b|\bany\b|\bunknown\b|\bundefined\b|\bnull\b|\bnew\s+/;
const checks = {
  typedRelationCatalog: /const ROUTE_SYNTAX_RELATIONS: readonly RouteSyntaxSemanticRelation\[\]/.test(source),
  contractUsesCanonicalCatalog: /relations: ROUTE_SYNTAX_RELATIONS/.test(source),
  proofLookupUsesRelationOption: /relationFirst\(ROUTE_SYNTAX_PROOF_RELATIONS/.test(source),
  noArrayAsOptionConfusion: !/relationOptionFold\(relationProject\(/.test(source),
  noForbiddenHostConstructs: !forbidden.test(semanticSource),
  parsedAstReservoirsEmpty: emptyFiles.slice(0, 4).every((entry) => entry.empty),
  legacyModelDescriptorReservoirsEmpty: emptyFiles.slice(4).every((entry) => entry.empty),
};
const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
const report = { phase: 750, model: 'route-syntax-semantic-interface-authority', checks, failed, pass: failed.length === 0 };
console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 1);
