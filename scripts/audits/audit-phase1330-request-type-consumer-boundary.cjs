const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const compilerEntry = fs.readFileSync(path.join(root, 'packages/core/src/compiler/index.ts'), 'utf8');
const requestArtifact = fs.readFileSync(path.join(root, 'packages/core/src/compiler/artifacts/RequestTypesArtifact.ts'), 'utf8');
const requestConsumer = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/RequestTypeDeriver.ts'), 'utf8');
const checks = [
  ['RequestType is declared as an interface in domain contract', /export interface RequestType\b/.test(fs.readFileSync(path.join(root, 'packages/core/src/types/domain/request.ts'), 'utf8'))],
  ['RequestTypesArtifact re-exports RequestType as a type', /export type \{[\s\S]*?RequestType[\s\S]*?\} from '\.\.\/\.\.\/types\/domain\/request';/.test(requestArtifact)],
  ['RequestTypeDeriver imports RequestType with import type', /import type \{ RequestType \} from "\.\.\/\.\.\/artifacts\/RequestTypesArtifact";/.test(requestConsumer)],
  ['ScopeNode remains type-only in compiler barrel', /export \{ ScopeGraphArtifact, type ScopeNode \} from '\.\/artifacts\/ScopeGraphArtifact';/.test(compilerEntry)],
  ['BoundASTNode and SymbolReference remain type-only in compiler barrel', /export \{ BoundASTArtifact, type BoundASTNode, type SymbolReference as BoundSymbolReference \} from '\.\/artifacts\/BoundASTArtifact';/.test(compilerEntry)],
  ['Symbol and SymbolTable remain type-only in compiler barrel', /export \{ SymbolGraphArtifact, type Symbol, type SymbolTable \} from '\.\/artifacts\/SymbolGraphArtifact';/.test(compilerEntry)],
  ['Artifact constructors remain runtime exports', /export \{ ScopeGraphArtifact, type ScopeNode \}/.test(compilerEntry) && /export \{ BoundASTArtifact, type BoundASTNode/.test(compilerEntry) && /export \{ SymbolGraphArtifact, type Symbol/.test(compilerEntry)],
];
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
if (checks.some(([, ok]) => !ok)) process.exitCode = 1;
else console.log(`\n${checks.length}/${checks.length} checks passed`);
