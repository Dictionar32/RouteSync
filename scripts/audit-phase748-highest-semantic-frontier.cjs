const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = {};
const algebra = read('packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationalAlgebra.ts');
const rewrite = read('packages/core/src/compiler/scanner/lexer/routeAst/semanticRewriteEngine.ts');
const evidence = read('packages/core/src/compiler/scanner/lexer/routeAst/semanticEvidenceRelationCompiler.ts');
const program = read('packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationProgram.ts');
const typed = read('packages/core/src/compiler/scanner/lexer/routeAst/semanticTypedRelation.ts');
const descriptorIndex = read('packages/core/src/compiler/scanner/descriptors/index.ts');
checks.semanticAtomAuthority = /export type SemanticRelationAtom = RelationAtom;/.test(algebra);
checks.rewriteConsumesCentralAtom = /type \{ SemanticRelationAtom \}/.test(rewrite) && !/Object\.hasOwn\(/.test(rewrite);
checks.rewriteUsesHostCompatibleOwnershipWitness = /Object\.prototype\.hasOwnProperty\.call\(value, 'variable'\)/.test(rewrite);
checks.programUsesHostCompatibleOwnershipWitness = /Object\.prototype\.hasOwnProperty\.call\(term, 'variable'\)/.test(program);
checks.presenceUsesSemanticFold = /semanticPresenceFold\(flow\.guard/.test(evidence) && !/flow\.guard\.value/.test(evidence);
checks.relationPredicatesImported = /relationAny, relationEqual/.test(evidence);
checks.typedRelationImportsMembershipAuthority = /relationContains, relationInsert, type RelationMembership/.test(typed);
checks.legacyModelDescriptorExportRemoved = !/from ["']\.\/modelDescriptors["']/.test(descriptorIndex);
const changed = [
  ['semanticRewriteEngine.ts', rewrite],
  ['semanticEvidenceRelationCompiler.ts', evidence],
  ['semanticRelationProgram.ts', program],
  ['semanticTypedRelation.ts', typed],
];
const forbidden = /\b(?:Object\.hasOwn|undefined)\b|\?\?|\bas unknown\b/;
checks.noKnownDtsFrontierRegression = changed.every(([, source]) => !forbidden.test(source));
const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
const result = { phase: 748, model: 'highest-semantic-frontier', checks, failed, pass: failed.length === 0 };
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.pass ? 0 : 1;
