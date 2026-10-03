const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const relations = read('packages/core/src/compiler/scanner/lexer/routeAst/semanticKnowledgeDataFlowRelations.ts');
const state = read('packages/core/src/compiler/scanner/lexer/routeAst/semanticStateDataFlow.ts');
const adapter = read('packages/core/src/compiler/scanner/lexer/routeAst/phpAstSemanticKnowledgeDataFlowAdapter.ts');
const evidence = read('packages/core/src/compiler/scanner/lexer/routeAst/phpAstExpressionSyntaxEvidenceRegistry.ts');
const controller = read('packages/core/src/compiler/scanner/lexer/controllerBodyParser.ts');
const packageJson = JSON.parse(read('package.json'));

const checks = {
  upstreamAccessMemberIsClosedAdt: /export type SemanticAccessMember = \{[\s\S]*kind: 'knowledge-id'[\s\S]*KnowledgeId[\s\S]*kind: 'identifier'[\s\S]*SemanticIdentifier[\s\S]*\};/.test(relations),
  semanticAccessUsesCanonicalMemberAdt: /readonly member: SemanticAccessMember;/.test(relations),
  stateLocationReusesUpstreamMemberAdt: /readonly member: SemanticAccessMember;/.test(state),
  stateMergeReusesCanonicalSemanticPresence: /readonly selector: SemanticPresence<KnowledgeId>;/.test(state) && /selector: merge\.selector,/.test(state),
  stateDoesNotRebuildMemberFromUnrefinedUnion: !/value: access\.member\b/.test(state),
  propertyAdapterUsesMemberWitness: /member: \{ kind: 'identifier', value: semanticIdentifier\(target\.property\) \}/.test(adapter),
  arrayAdapterUsesKnowledgeMemberWitness: /member: \{ kind: 'knowledge-id', value: index \}/.test(adapter),
  evidenceUsesMemberWitness: /member: \{ kind: 'identifier', value: semanticIdentifier\(value\.property\) \}/.test(evidence) && /member: \{ kind: 'knowledge-id', value: index \}/.test(evidence),
  statusFoldsUseNumericNone: !/relationOptionFold\([^\n]*relationNone<TokenDescriptor>/.test(controller) && /function parseErrorStatus/.test(controller) && /function parseJsonStatus/.test(controller) && /function scanJsonStatus/.test(controller),
  auditRegistered: packageJson.scripts?.['audit:phase738-upstream-access-adt'] === 'node scripts/audit-phase738-upstream-access-adt.cjs',
};

const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
const result = { phase: 738, checks, failed, pass: failed.length === 0 };
console.log(JSON.stringify(result, null, 2));
process.exit(result.pass ? 0 : 1);
