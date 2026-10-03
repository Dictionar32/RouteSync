const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const astPath = path.join(root, 'packages/core/src/types/upstream/ast.ts');
const ast = fs.readFileSync(astPath, 'utf8');
const required = [
  'export type AstJudgmentBase<Kind extends AstSemanticSchemaKind>',
  'export type AstJudgment = {',
  'export type SemanticAstNode<Kind extends AstSemanticSchemaKind> = Extract<AstJudgment',
  'export type CanonicalAstNode<Kind extends AstSemanticSchemaKind> = Extract<AstJudgment',
  'export type ExpressionAst = Extract<AstJudgment',
  'readonly identity:', 'readonly semantic:', 'readonly evidence:', 'readonly provenance:',
  'readonly constraints:', 'readonly dependencies:', 'readonly relations:', 'readonly derivation:',
  'readonly status:', 'readonly diagnostics:'
];
const missing = required.filter(x => !ast.includes(x));
const openGeneric = /SemanticAstNode<[^>]+,|CanonicalAstNode<[^>]+,[^>]+>/.test(ast);
const rawAny = /\bany\b/.test(ast);
const hostUndefined = /\bundefined\b/.test(ast);
const hostNull = /\bnull\b/.test(ast);
const report = {
  phase: 655,
  model: 'closed AST judgment ADT as single source of truth',
  interface: {
    requiredMembersPresent: missing.length === 0,
    missing,
    openGenericSemanticPayload: openGeneric,
    hostAny: rawAny,
    hostUndefined: hostUndefined,
    hostNull: hostNull,
    closedJudgmentUnion: /export type AstJudgment = \{[\s\S]*\}\[AstSemanticSchemaKind\];/.test(ast),
  },
  interpretation: 'AstJudgment is the closed SSOT universe; SemanticAstNode and CanonicalAstNode are narrowing projections, not independent schemas.'
};
const out = path.join(root, 'docs/PHASE655_AST_SSOT_AUDIT.json');
fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
