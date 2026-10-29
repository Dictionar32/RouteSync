const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const upstreamIndex = path.join(root, 'core/src/types/upstream/index.ts');
const routeAstIndex = path.join(root, 'core/src/compiler/frontend/php/routeAst/index.ts');
const coreIndex = path.join(root, 'core/src/index.ts');
const cliScan = path.join(root, 'cli/src/commands/scan.ts');
const manifestComposition = path.join(root, 'cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const read = file => fs.readFileSync(file, 'utf8');
const checks = [
  ['upstream barrel exports canonical ManifestBuilder contracts', /export\s+\*\s+from\s+['"]\.\/manifestBuilderInterface['"]/.test(read(upstreamIndex))],
  ['routeAst barrel exports SyntaxRange type', /export\s+type\s+\{\s*SyntaxRange\s*\}\s+from\s+['"]\.\/syntaxRange['"]/.test(read(routeAstIndex))],
  ['routeAst barrel exports syntaxRange operation', /export\s+\{\s*syntaxRange\s*\}\s+from\s+['"]\.\/syntaxRange['"]/.test(read(routeAstIndex))],
  ['Core package exports the manifest preparation operation', /export\s*\{[^}]*manifestBuilderOperationPreparation[^}]*\}\s*from\s*['"]\.\/compiler\/scanner\/wiring\/upstreamManifestBuilder['"]/.test(read(coreIndex))],
  ['CLI scan consumes injected manifest composition', /manifestComposition\.compose\(/.test(read(cliScan))],
  ['CLI manifest composition consumes ManifestBuilderOperationPreparationInterface', /ManifestBuilderOperationPreparationInterface/.test(read(manifestComposition))],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
