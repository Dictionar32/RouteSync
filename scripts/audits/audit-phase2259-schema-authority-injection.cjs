const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const resolver = read('packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionContract.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const actionScanner = read('packages/core/src/compiler/scanner/operations/controller/actionScanner.ts');
const tests = read('packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionContract.phase10.test.ts');
const checks = [
  ['resolver imports schema authority contract only', resolver.includes("import type { ControllerActionSchemaSemanticJudgmentAuthorityInterface } from '../../../../types/upstream/controllerActionSchemaSemanticJudgmentInterface'") && !resolver.includes("import { controllerActionSchemaSemanticJudgmentAuthority } from '../../../../types/upstream/controllerActionSchemaSemanticJudgmentAuthority'")],
  ['resolver context owns injected schema authority', resolver.includes('readonly schemaSemanticJudgmentAuthority: ControllerActionSchemaSemanticJudgmentAuthorityInterface<SourceFile>')],
  ['schema judgment uses injected authority', resolver.includes('context.schemaSemanticJudgmentAuthority.judge({')],
  ['production dependency contract exposes schema authority', wiring.includes('readonly schemaSemanticJudgmentAuthority: ControllerActionSchemaSemanticJudgmentAuthorityInterface<SourceFile>')],
  ['action authority passes schema authority into resolver context', wiring.includes('schemaSemanticJudgmentAuthority,\n          classNameResolutionContext')],
  ['composition root binds existing upstream implementation', wiring.includes('schemaSemanticJudgmentAuthority: controllerActionSchemaSemanticJudgmentAuthority')],
  ['legacy action scanner supplies existing schema authority', actionScanner.includes('schemaSemanticJudgmentAuthority: controllerActionSchemaSemanticJudgmentAuthority')],
  ['resolver tests supply schema authority dependency', (tests.match(/schemaSemanticJudgmentAuthority: controllerActionSchemaSemanticJudgmentAuthority/g) ?? []).length === 4],
  ['no foundation or relation import introduced in edited resolver', !resolver.includes('semantic/foundation') && !resolver.includes('semantic/relations')],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} assertions passed`);
