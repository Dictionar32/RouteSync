const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const binding = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/laravelControllerRequestSemanticBinding.ts'), 'utf8');
const wiring = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts'), 'utf8');
const judgment = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts'), 'utf8');
const publicIndex = fs.readFileSync(path.join(root, 'packages/core/src/index.ts'), 'utf8');
const checks = [
  ['request binding exposes typed_unresolved ADT', /kind: 'typed_unresolved';\s*readonly judgment: UnresolvedPhpParameterTypeJudgment/.test(binding)],
  ['unresolved judgment excludes resolved outcome', /Exclude<PhpParameterTypeJudgment,\s*Readonly<\{\s*readonly kind: 'resolved'/.test(binding)],
  ['wiring uses existing phpParameterTypeAlgebra', /phpParameterTypeAlgebra\.resolve\(requestTypeEvidence\(request\.type\)\)/.test(wiring)],
  ['resolved type judgment stays typed', /case 'resolved': return Object\.freeze\(\{ kind: 'typed', type: judgment\.expression \}\)/.test(wiring)],
  ['unsupported and malformed remain unresolved', /case 'unsupported':[\s\S]*?case 'malformed': return Object\.freeze\(\{ kind: 'typed_unresolved', judgment \}\)/.test(wiring)],
  ['legacy action resolver debt remains explicit', /scanControllerAction-and-resolveControllerActionContract/.test(wiring)],
  ['action contract version aligned to 15', /readonly version: 15/.test(judgment) && /version: 15 as const/.test(wiring)],
  ['unresolved request type exported publicly', /UnresolvedPhpParameterTypeJudgment/.test(judgment) && /UnresolvedPhpParameterTypeJudgment/.test(publicIndex)],
];
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
const failed = checks.filter(([, passed]) => !passed);
process.stdout.write(`Phase 2146: ${checks.length - failed.length}/${checks.length} passed\n`);
process.exitCode = failed.length ? 1 : 0;
