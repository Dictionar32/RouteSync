const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = process.cwd();
const scanner = readFileSync(join(root, 'packages/core/src/types/upstream/laravelControllerScannerInterface.ts'), 'utf8');
const action = readFileSync(join(root, 'packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts'), 'utf8');
const dependency = readFileSync(join(root, 'packages/core/src/types/upstream/controllerDependencySemanticJudgmentInterface.ts'), 'utf8');
const wiring = readFileSync(join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts'), 'utf8');

const checks = [
  ['scanner input uses the existing ClassName value object', /contextualAttributeNames:\s*readonly ClassName\[\]/.test(scanner)],
  ['action judgment input uses the same ClassName value object', /contextualAttributeNames:\s*readonly ClassName\[\]/.test(action)],
  ['existing dependency semantic authority already owns ClassName[]', /customContextualAttributeNames:\s*readonly ClassName\[\]/.test(dependency)],
  ['migration ADT explicitly records the primitive contextual-name input debt', action.includes("kind: 'custom_contextual_attribute_name_primitive_input'") && action.includes("targetOwner: 'existing_class_name_value_object_contract'")],
  ['action semantic contract version advances to 51', /readonly version: 51;/.test(action)],
  ['scanner interface and complete/blocked judgments advance to version 39', (scanner.match(/contractVersion: 39/g) || []).length === 3],
  ['runtime is left untouched at its prior contract version for interface-first sequencing', /contractVersion = 38 as const/.test(wiring) && /contractVersion: 38 as const/.test(wiring)],
  ['scanner upstream contract imports neither semantic/foundation nor semantic/relations', !/from ['"][^'"]*semantic\/(foundation|relations)/.test(scanner)],
];

for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
