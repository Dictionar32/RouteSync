const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const controller = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/lexer/controllerBodyParser.ts'), 'utf8');
const dataflow = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/lexer/routeAst/semanticDataFlowAnalyzer.ts'), 'utf8');
const semanticPresence = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/lexer/routeAst/semanticKnowledgeDataFlowRelations.ts'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

const checks = {
  controllerValidationOptionIsTyped: controller.includes('relationNone<{ readonly entries: readonly PhpArrayEntry[]; readonly endIndex: number }>()'),
  controllerUsesCanonicalArrayKey: controller.includes('requireStringArrayKey(current.key)'),
  controllerLiteralUsesClosedRefinement: controller.includes("candidate is Extract<typeof candidate, { readonly kind: 'literal'; readonly literalType: 'string' }>"),
  controllerTypedStatusOptions: controller.includes('relationNone<number>()'),
  controllerTypedTokenOptions: controller.includes('relationNone<TokenDescriptor>()'),
  controllerTypedStringOptions: controller.includes('relationNone<string>()'),
  semanticPresenceHasFoldAuthority: semanticPresence.includes('export function semanticPresenceFold'),
  semanticPresenceUsesRefinementWitness: semanticPresence.includes('semanticPresenceRefine(presence'),
  dataflowUsesSemanticPresenceFold: dataflow.includes('semanticPresenceFold(guard'),
  dataflowNoDirectGuardValueAccess: !dataflow.includes('guard.value'),
  auditRegistered: pkg.scripts['audit:phase737-scanner-presence-frontier'] === 'node scripts/audit-phase737-scanner-presence-frontier.cjs',
};
const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
console.log(JSON.stringify({ phase: 737, checks, failed, pass: failed.length === 0 }, null, 2));
process.exit(failed.length === 0 ? 0 : 1);
