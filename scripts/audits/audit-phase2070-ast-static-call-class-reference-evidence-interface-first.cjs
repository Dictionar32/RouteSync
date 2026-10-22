const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const ast = read('packages/core/src/compiler/scanner/lexer/phpAstExpressionTypes.ts');
const parser = read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const factory = read('packages/core/src/compiler/scanner/lexer/phpAstFactory.ts');
const candidateAlgebra = read('packages/core/src/types/upstream/scannerAstExpressionCandidateAlgebra.ts');
const scanner = read('packages/core/src/compiler/scanner/subscanners/controller/controllerDataflowContract.ts');
const consumers = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticEvidenceAdapter.ts') + read('packages/core/src/compiler/scanner/lexer/routeAst/phpAstExpressionSyntaxEvidenceRegistry.ts') + read('packages/core/src/compiler/scanner/subscanners/form-request/ruleCollector.ts') + read('packages/core/src/compiler/scanner/operations/resourceAstExpressionMapper.ts');
const test = read('packages/core/src/compiler/scanner/lexer/phpAstStaticCallClassReference.phase2070.test.ts');
const checks = [
  ['static-call AST carries parser-owned discriminated class-reference evidence', /kind: Extract<PhpAstExpressionKind, 'static_call'>; readonly classReference: PhpClassReferenceSourceEvidence;/.test(ast) && !/kind: Extract<PhpAstExpressionKind, 'static_call'>; readonly className: AstIdentifier/.test(ast)],
  ['source evidence distinguishes simple and qualified class-name forms', /kind: 'simple_name'/.test(ast) && /fully_qualified.*namespace_relative.*import_or_namespace_dependent/.test(ast)],
  ['parser derives the class-reference discriminant from the token spelling', /className\.startsWith\('\\\\'\)/.test(parser) && /className\.startsWith\('namespace\\\\'\)/.test(parser) && /className\.includes\('\\\\'\)/.test(parser)],
  ['candidate algebra locates static-call separators after qualified names', /const staticSeparatorIndex = values\.indexOf\('::'\)/.test(candidateAlgebra) && /values\[staticSeparatorIndex \+ 2\] === '\('/.test(candidateAlgebra)],
  ['AST factory accepts typed source evidence instead of a raw class-name string', /staticCall\(classReference: import\('\.\/phpAstExpressionTypes'\)\.PhpClassReferenceSourceEvidence/.test(factory)],
  ['controller scanner forwards the AST discriminant without string reclassification', /classReference: classReferenceEvidence\(value\.classReference\)/.test(scanner) && !/className\.startsWith|className\.includes/.test(scanner)],
  ['class-reference adapter preserves the parser discriminant', /switch \(evidence\.kind\)/.test(scanner) && /form: evidence\.form/.test(scanner)],
  ['other AST consumers read the typed sourceName', consumers.includes('value.classReference.sourceName') && consumers.includes('.classReference.sourceName')],
  ['regression covers all four class-reference source forms', ['fully_qualified', 'namespace_relative', 'import_or_namespace_dependent', 'simple_name'].every(value => test.includes(value))],
  ['existing upstream class-name resolution remains the semantic authority', fs.existsSync(path.join(root, 'packages/core/src/types/upstream/phpClassNameResolutionAuthority.ts'))],
  ['no relation/foundation subscanner is added', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/relation/foundation'))],
  ['audit is registered in package scripts', read('package.json').includes('audit:phase2070-ast-static-call-class-reference-evidence-interface-first')],
  ['phase docs and verification records exist', fs.existsSync(path.join(root, 'packages/core/src/types/upstream/docs/PHASE2070_AST_STATIC_CALL_CLASS_REFERENCE_EVIDENCE_INTERFACE_FIRST.md')) && fs.existsSync(path.join(root, 'PHASE2070_VERIFICATION.md'))],
];
let failed = 0;
for (const [name, pass] of checks) {
  const result = Boolean(pass);
  process.stdout.write(`${result ? 'PASS' : 'FAIL'} ${name}\n`);
  failed += result ? 0 : 1;
}
process.stdout.write(`Phase 2070: ${checks.length - failed}/${checks.length}\n`);
process.exitCode = failed ? 1 : 0;
