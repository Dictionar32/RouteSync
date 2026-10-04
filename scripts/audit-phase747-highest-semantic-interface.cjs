const fs = require('fs');
const path = require('path');

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const size = file => fs.statSync(path.join(root, file)).size;
const exists = file => fs.existsSync(path.join(root, file));
const changed = [
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationalAlgebra.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticRewriteEngine.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticObjectIdentityRelations.ts',
  'packages/core/src/compiler/scanner/subscanners/model/modelParser.ts',
  'packages/core/src/compiler/scanner/semantic/model/modelSemanticDefinition.ts',
];
const forbidden = /\b(?:if|while|for|switch)\b|\.\s*(?:map|filter|reduce|flatMap)\s*\(|\bundefined\b|\?\?|\bnull\b|===|!==|\bas\s+(?:unknown|any)\b|\bnew\s+/g;
const legacyModel = [
  'packages/core/src/compiler/scanner/descriptors/model/modelEntityDescriptor.ts',
  'packages/core/src/compiler/scanner/descriptors/model/entity/modelDescriptorClass.ts',
  'packages/core/src/compiler/scanner/descriptors/model/entity/index.ts',
  'packages/core/src/compiler/scanner/descriptors/modelDescriptors.ts',
];
const checks = {
  semanticAtomAuthority: /export type SemanticRelationAtom = RelationAtom;/.test(read(changed[0])),
  rewriteConsumesCentralAtom: /type SemanticRelationAtom/.test(read(changed[1])) && /from '\.\/semanticRelationalAlgebra'/.test(read(changed[1])),
  identityConsumesCentralAtom: /from '\.\/semanticRelationalAlgebra'/.test(read(changed[2])),
  modelBuilderMovedToSemanticNamespace: exists(changed[4]) && /export function buildModelSemanticDefinition/.test(read(changed[4])),
  modelParserUsesSemanticNamespace: /\.\.\/\.\.\/semantic\/model\/modelSemanticDefinition/.test(read(changed[3])),
  legacyModelDescriptorFilesEmpty: legacyModel.every(file => size(file) === 0),
  parsedAstReservoirEmpty: [
    'packages/core/src/types/semantic/parsedAstAlgebra.ts',
    'packages/core/src/types/semantic/parsedAstTypes.ts',
    'packages/core/src/types/semantic/__archive__/parsedAstAlgebra.ts',
    'packages/core/src/types/semantic/__archive__/parsedAstTypes.ts',
  ].every(file => size(file) === 0),
  noForbiddenChangedLayerConstructs: changed.every(file => !forbidden.test(read(file))),
};
// RegExp is stateful under global matching; reset between files.
checks.noForbiddenChangedLayerConstructs = changed.every(file => { forbidden.lastIndex = 0; return !forbidden.test(read(file)); });
const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
const result = { phase: 747, model: 'highest-semantic-interface', checks, failed, pass: failed.length === 0 };
console.log(JSON.stringify(result, null, 2));
process.exit(result.pass ? 0 : 1);
