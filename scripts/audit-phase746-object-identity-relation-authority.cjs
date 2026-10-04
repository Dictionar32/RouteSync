const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const files = [
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticObjectIdentityRelations.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticInterproceduralDataFlowRelations.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticVersionedStateDataFlowRelations.ts',
].map(file => path.join(root, file));

const forbidden = /\b(?:if|while|for|switch|map|filter|reduce|flatMap|undefined|unknown|any|new)\b|\?\?|===|\bas\b/;
const source = files.map(file => fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ''));
const checks = {
  objectIdentityRewriteIsTyped: /type IdentityRewriteId =/.test(source[0]) && /id: IdentityRewriteId/.test(source[0]),
  objectIdentityRewriteCatalogTyped: /SemanticRelationRewrite<IdentityRelation>/.test(source[0]),
  objectIdentityPresenceIsRefined: /entry is \{ readonly fact: SemanticRelation<IdentityRelation>; readonly left: PresentKnowledgeId; readonly right: PresentKnowledgeId \}/.test(source[0]),
  objectIdentityAliasTupleIsTyped: /readonly \(readonly \[string, SemanticAliasRelation\]\)\[\]/.test(source[0]),
  interproceduralSeedIsTyped: /const seed: readonly SemanticRelation<InterproceduralRelation>\[\]/.test(source[1]),
  interproceduralIndexesAreTyped: /readonly \(readonly \[string, SemanticInvocation\]\)\[\]/.test(source[1]) && /readonly \(readonly \[string, SemanticCallable\]\)\[\]/.test(source[1]),
  interproceduralRewriteIsTyped: /type InterproceduralRewriteId =/.test(source[1]) && /const interproceduralRewrite =/.test(source[1]),
  versionedStatePresent: source[2].includes('relationOptionMap'),
  noForbiddenHostConstructs: source.every(text => !forbidden.test(text)),
};
const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
const result = { phase: 746, checks, failed, pass: failed.length === 0 };
process.stdout.write(JSON.stringify(result, null, 2) + '\n');
process.exitCode = result.pass ? 0 : 1;
