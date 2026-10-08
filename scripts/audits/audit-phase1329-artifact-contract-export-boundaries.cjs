const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const entry = fs.readFileSync(path.join(root, 'packages/core/src/compiler/index.ts'), 'utf8');
const checks = [
  ['ScopeNode is type-only', /export \{ ScopeGraphArtifact, type ScopeNode \} from '\.\/artifacts\/ScopeGraphArtifact';/.test(entry)],
  ['BoundASTNode is type-only', /export \{ BoundASTArtifact, type BoundASTNode, type SymbolReference as BoundSymbolReference \} from '\.\/artifacts\/BoundASTArtifact';/.test(entry)],
  ['Symbol and SymbolTable are type-only', /export \{ SymbolGraphArtifact, type Symbol, type SymbolTable \} from '\.\/artifacts\/SymbolGraphArtifact';/.test(entry)],
  ['ScopeGraphArtifact remains a runtime export', /export \{ ScopeGraphArtifact, type ScopeNode \}/.test(entry)],
  ['BoundASTArtifact remains a runtime export', /export \{ BoundASTArtifact, type BoundASTNode/.test(entry)],
  ['SymbolGraphArtifact remains a runtime export', /export \{ SymbolGraphArtifact, type Symbol/.test(entry)],
];
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
if (checks.some(([, ok]) => !ok)) process.exitCode = 1;
else console.log(`\n${checks.length}/${checks.length} checks passed`);
