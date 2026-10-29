const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });
const algebraInterface = read('packages/core/src/types/upstream/invocationSemanticAlgebraInterface.ts');
const algebra = read('packages/core/src/types/upstream/invocationSemanticJudgmentAlgebra.ts');
const authority = read('packages/core/src/types/upstream/invocationSemanticJudgmentAuthority.ts');
const upstreamTest = read('packages/core/src/types/upstream/__tests__/invocation-semantic-algebra.phase1677.test.ts');
const routeAstTest = read('packages/core/src/compiler/frontend/php/routeAst/semanticInterproceduralDataFlow.phase219.test.ts');
const upstreamBarrel = read('packages/core/src/types/upstream/index.ts');
const scannerFacade = read('packages/core/src/compiler/frontend/php/routeAst/semanticInterproceduralDataFlowRelations.ts');
const collectionsPath = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const oldName = 'invocationPositionalEvidenceUnproven';
const newName = 'unprovenPositionalEvidenceFor';
check('operation interface owns unproven positional evidence construction', algebraInterface.includes(`readonly ${newName}:`) && algebraInterface.includes('InvocationPositionalEvidenceInput'), 'InvocationSemanticKnowledgeAlgebraOperationsInterface declares a typed domain operation.');
check('implementation is private behind operation object', algebra.includes(`const ${newName} =`) && !algebra.includes(`export const ${oldName}`), 'Implementation helper is private; old standalone exported callable is absent.');
check('operation object has explicit interface annotation and frozen object', /export const invocationSemanticKnowledgeAlgebraOperations:\s*InvocationSemanticKnowledgeAlgebraOperationsInterface\s*=\s*Object\.freeze\(/.test(algebra) && algebra.includes(`${newName},`), 'Public operation surface is interface-first and Object.freeze-backed.');
check('authority uses domain operation', authority.includes(`invocationSemanticKnowledgeAlgebraOperations.${newName}(`) && !authority.includes(oldName), 'Judgment validation uses the shared operation object.');
check('batch analysis uses private implementation within owner', algebra.includes(`knowledge, invocation, ${newName}(invocation),`), 'Batch analysis preserves existing local ownership without self-dispatch through public facade.');
check('upstream test migrated to operation object', upstreamTest.includes(`invocationSemanticKnowledgeAlgebraOperations.${newName}(`) && !upstreamTest.includes(oldName), 'Upstream algebra tests exercise the named operation.');
check('route-AST test migrated to operation object', routeAstTest.includes(`invocationSemanticKnowledgeAlgebraOperations.${newName}(`) && !routeAstTest.includes(oldName), 'Route-AST consumer test uses the shared operation.');
check('operation interface type remains available from upstream barrel', upstreamBarrel.includes('InvocationSemanticKnowledgeAlgebraOperationsInterface'), 'Existing type export remains available.');
check('scanner facade exports the typed operation surface', scannerFacade.includes('invocationSemanticKnowledgeAlgebraOperations'), 'Scanner-facing facade retains the named operation surface.');
check('no old positional-evidence callable remains in production invocation modules', !algebra.includes(oldName) && !authority.includes(oldName), 'Legacy helper name absent from the two production owner modules.');
check('collections invariant preserved', fs.statSync(collectionsPath).size === 1 && fs.readFileSync(collectionsPath, 'utf8') === '\n', 'collections.ts remains one newline byte.');
const deletedRelations = [
  'packages/core/src/semantic/relations/relationMembership.ts',
  'packages/core/src/semantic/relations/relationalSequence.ts',
  'packages/core/src/semantic/relations/semanticRelations.ts',
];
check('deleted relation foundation remains absent', deletedRelations.every((file) => !fs.existsSync(path.join(root, file))), 'No deleted relation foundation modules were restored.');
const result = {
  phase: 3014,
  title: 'Fully Explicit Simplicity Typed Runtime Scanner Operations — Positional Evidence Domain Operation',
  checksPassed: checks.filter((entry) => entry.pass).length,
  checksTotal: checks.length,
  checks,
  limitations: [
    'Structural checks do not prove TypeScript typecheck or runtime correctness.',
    'Unit tests and Laravel CLI end-to-end tests were not run in this phase.',
    'This change migrates one reachable exported callable; it is not a repository-wide callable migration.',
  ],
};
const output = path.join(root, 'PHASE3014_AUDIT.json');
fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (result.checksPassed !== result.checksTotal) process.exitCode = 1;
