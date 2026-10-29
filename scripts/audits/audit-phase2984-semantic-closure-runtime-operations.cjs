const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const enginePath = path.join(root, 'packages/core/src/types/upstream/semanticClosureEngine.ts');
const engine = fs.readFileSync(enginePath, 'utf8');
const artifactPath = path.join(root, 'packages/core/src/compiler/frontend/php/routeAst/semanticCompilationArtifact.ts');
const artifact = fs.readFileSync(artifactPath, 'utf8');
const consumers = [
  path.join(root, 'packages/core/src/types/upstream/__test__/semanticClosureEngine.phase1550.test.ts'),
  path.join(root, 'packages/core/src/compiler/frontend/php/routeAst/semanticClosureContract.phase1631.test.ts'),
  path.join(root, 'packages/core/src/compiler/frontend/php/routeAst/semanticClosureEngine.phase270.test.ts'),
];
const checks = [
  ['runtime interface exists', /export interface SemanticClosureRuntimeOperationsInterface/.test(engine)],
  ['runtime export is explicitly interface-typed and frozen', /export const semanticClosureRuntimeOperations:\s*SemanticClosureRuntimeOperationsInterface\s*=\s*Object\.freeze\(/.test(engine)],
  ['ADT judgment exposes continuation', /CanonicalSemanticRelationNameJudgment[\s\S]*continueWith/.test(engine)],
  ['legacy exported closure functions removed', !/export const (closeCanonicalSemanticRelations|closeCanonicalSemanticTheory|canonicalSemanticFact)\b/.test(engine)],
  ['deleted relation foundations not imported by closure engine', !/semantic\/relations\/(relationalSequence|semanticRelations|relationMembership)/.test(engine)],
  ['manifest artifact uses runtime operation object', /semanticClosureRuntimeOperations\.closeRelations\(/.test(artifact)],
  ['tests use runtime operation object', consumers.every(file => fs.existsSync(file) && /semanticClosureRuntimeOperations\.(closeRelations|createFact)\(/.test(fs.readFileSync(file, 'utf8')))],
  ['source truth remains upstream-owned', /types\/upstream\/semanticClosureEngine/.test(path.relative(root, enginePath))],
];
const failed = checks.filter(([, passed]) => !passed);
const result = { phase: 2984, title: 'Semantic Closure Explicit Runtime Operations', passed: checks.length - failed.length, total: checks.length, checks: checks.map(([name, passed]) => ({ name, passed })) };
fs.writeFileSync(path.join(root, 'PHASE2984_SEMANTIC_CLOSURE_RUNTIME_OPERATIONS_AUDIT.json'), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
if (failed.length) process.exitCode = 1;
