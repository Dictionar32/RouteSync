import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const files = {
  producer: readFileSync(resolve(root, 'packages/core/src/compiler/scanner/subscanners/resourceProducer.ts'), 'utf8'),
  canonical: readFileSync(resolve(root, 'packages/core/src/compiler/scanner/subscanners/resource/resourceUpstreamExpressionCanonical.ts'), 'utf8'),
  mappings: readFileSync(resolve(root, 'packages/core/src/compiler/scanner/subscanners/resource/resourceUpstreamExpressionMappings.ts'), 'utf8'),
  atom: readFileSync(resolve(root, 'packages/core/src/types/upstream/phpTypeAtomAlgebra.ts'), 'utf8'),
  test: readFileSync(resolve(root, 'packages/core/src/compiler/scanner/subscanners/resource/php-type-context-wiring.phase1482.test.ts'), 'utf8'),
};
const checks = [
  ['resource producer derives explicit class context', /enclosingClass:\s*input\.resourceName\.value\.value/.test(files.producer) && /parentClass:\s*input\.baseClass\.value\.value/.test(files.producer)],
  ['resource statement mapping receives class context', /mapResourcePhpStatementsToSourceStatements\(input\.method\.body, sourceFile\.value\.value, classContext\)/.test(files.producer)],
  ['parameter evidence receives context for all variants', /kind:\s*'primitive',\s*name:\s*value\.name,\s*classContext/.test(files.mappings) && /kind:\s*'named',\s*name:\s*value\.name,\s*classContext/.test(files.mappings) && /kind:\s*'nullable',\s*inner:\s*toEvidence\(value\.inner\),\s*classContext/.test(files.mappings)],
  ['recursive expression mapping preserves context', /mapResourcePhpAstToUpstream\(child, file, classContext\)/.test(files.canonical)],
  ['closure and anonymous method type resolution receives context', /resolveClosureParameter\(item, resolveChild, file, classContext\)/.test(files.canonical) && /mapAnonymousClassParameter\(item, resolveExpression, file, classContext\)/.test(files.canonical)],
  ['nested statement projection preserves context', /mapResourcePhpStatementsToSourceStatements\(recurrence\.body\.statements, file, classContext\)/.test(files.canonical) && /mapResourcePhpStatementsToSourceStatements\(item\.body\.statements, file, classContext\)/.test(files.canonical)],
  ['anonymous class uses its own context boundary', /anonymousClassContext/.test(files.canonical) && /parentClass:\s*node\.class\.extendsClass/.test(files.canonical)],
  ['late-static semantics remain fail-closed and regression cases exist', /late-static type requires a dedicated target representation/.test(files.atom) && /resolves self from enclosing class evidence/.test(files.test) && /resolves parent from declared base-class evidence/.test(files.test) && /does not silently classify static/.test(files.test)],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed++;
}
process.stdout.write(`RESULT ${checks.length - failed}/${checks.length}\n`);
if (failed) process.exitCode = 1;
