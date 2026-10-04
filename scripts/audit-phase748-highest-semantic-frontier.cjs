const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const target = path.join(root, 'packages/core/src/compiler/scanner/lexer/routeAst');
const read = file => fs.readFileSync(file, 'utf8');
const files = fs.readdirSync(target).filter(name => name.endsWith('.ts'));
const constraint = read(path.join(target, 'semanticConstraintHandlingRules.ts'));
const rewrite = read(path.join(target, 'semanticRewriteEngine.ts'));

const imports = constraint.split('\n').filter(line => line.startsWith('import '));
const importCount = token => imports.filter(line => line.includes(token)).length;
const forbidden = /\bas unknown\b|\bas\s+[A-Za-z_$]|\bany\b|\bunknown\b|\bundefined\b|\bnull\b|\?\?|\bif\b|\bfor\b|\bwhile\b|\bswitch\b|\.map\(|\.filter\(|\.reduce\(|\.flatMap\(|\bnew\s+/;

const checks = {
  relationMembershipImportsUnique: importCount('relationContains') === 1 && importCount('relationUnique') === 1,
  relationResolveImportedOnce: importCount('relationResolve') === 1,
  constraintUsesRewriteAuthority: constraint.includes('matchSemanticRelationPattern') && constraint.includes('instantiateSemanticRelationPattern'),
  constraintUsesCanonicalBindings: constraint.includes('SemanticRelationBindings'),
  rewriteExportsPatternMatcher: rewrite.includes('export const matchSemanticRelationPattern'),
  rewriteExportsPatternInstantiator: rewrite.includes('export const instantiateSemanticRelationPattern'),
  changedConstraintHasNoForbiddenHostConstructs: !forbidden.test(constraint),
  legacyParsedAstReservoirsEmpty: [
    'packages/core/src/types/semantic/parsedAstTypes.ts',
    'packages/core/src/types/semantic/parsedAstAlgebra.ts',
    'packages/core/src/types/semantic/__archive__/parsedAstTypes.ts',
    'packages/core/src/types/semantic/__archive__/parsedAstAlgebra.ts',
  ].every(file => fs.statSync(path.join(root, file)).size === 0),
};

const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
console.log(JSON.stringify({ phase: 748, model: 'highest-semantic-frontier', checks, failed, pass: failed.length === 0 }, null, 2));
process.exitCode = failed.length === 0 ? 0 : 1;
