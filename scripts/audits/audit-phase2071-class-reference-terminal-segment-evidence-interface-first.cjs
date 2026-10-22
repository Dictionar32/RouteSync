const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const ast = read('packages/core/src/compiler/scanner/lexer/phpAstExpressionTypes.ts');
const parser = read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const scanner = read('packages/core/src/compiler/scanner/subscanners/controller/controllerDataflowContract.ts');
const resolver = read('packages/core/src/types/upstream/controllerStaticCallOriginAuthority.ts');
const test = read('packages/core/src/compiler/scanner/lexer/phpAstStaticCallClassReference.phase2070.test.ts');
const checks = [
  ['simple class-reference evidence carries a terminal segment', /kind: 'simple_name'; readonly sourceName: AstIdentifier; readonly terminalName: AstIdentifier/.test(ast)],
  ['qualified class-reference evidence carries a terminal segment', /readonly sourceName: AstIdentifier;\s*readonly terminalName: AstIdentifier;\s*readonly form:/.test(ast)],
  ['parser derives terminal segment alongside source spelling', /const terminalName = createAstIdentifier\(className\.split\('\\\\'\)\.at\(-1\) \?\? className\)/.test(parser)],
  ['parser-owned class-reference discriminant preserves terminal segment', /sourceName: className, terminalName, form: 'fully_qualified'/.test(parser) && /sourceName: className, terminalName, form: 'namespace_relative'/.test(parser)],
  ['resource AST projection reuses parser-owned terminal segment', /const resourceClassName = classReference\.terminalName/.test(parser)],
  ['controller resource candidate consumes terminal segment rather than full FQCN', /resourceName: SemanticValueFactory\.resourceName\(candidate\.classReference\.terminalName\)/.test(scanner)],
  ['controller scanner does not split or reclassify the source class spelling', !/candidate\.classReference\.sourceName\.split|classReference\.sourceName\.startsWith|classReference\.sourceName\.includes/.test(scanner)],
  ['semantic resolver still consumes full source spelling rather than terminal segment', /input\.classReference\.sourceName/.test(resolver) && !/input\.classReference\.terminalName/.test(resolver)],
  ['regression covers terminal segment of fully qualified static-call class', /terminalName: 'PostResource'/.test(test) && /sourceName: '\\\\App\\\\Http\\\\Resources\\\\PostResource'/.test(test)],
  ['source evidence remains a discriminated union', /kind: 'simple_name'/.test(ast) && /kind: 'qualified_name'/.test(ast) && /fully_qualified.*namespace_relative.*import_or_namespace_dependent/s.test(ast)],
  ['no relation/foundation subscanner is introduced', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/relation/foundation'))],
  ['audit is registered in package scripts', read('package.json').includes('audit:phase2071-class-reference-terminal-segment-evidence-interface-first')],
  ['phase docs and verification record exist', fs.existsSync(path.join(root, 'packages/core/src/types/upstream/docs/PHASE2071_CLASS_REFERENCE_TERMINAL_SEGMENT_EVIDENCE_INTERFACE_FIRST.md')) && fs.existsSync(path.join(root, 'PHASE2071_VERIFICATION.md'))],
];
let failed = 0;
for (const [name, pass] of checks) {
  const result = Boolean(pass);
  process.stdout.write(`${result ? 'PASS' : 'FAIL'} ${name}\n`);
  failed += result ? 0 : 1;
}
process.stdout.write(`Phase 2071: ${checks.length - failed}/${checks.length}\n`);
process.exitCode = failed ? 1 : 0;
