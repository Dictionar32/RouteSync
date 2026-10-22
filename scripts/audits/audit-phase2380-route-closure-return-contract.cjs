const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const evidence = read('packages/core/src/types/upstream/routeDeclarationEvidence.ts');
const projection = read('packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const checks = [
  ['upstream closure target carries existing closed ControllerReturnSemantic ADT', /kind: 'closure'; readonly action: string; readonly returnSemantic: ControllerReturnSemantic/.test(evidence)],
  ['AST-to-evidence projection derives return semantic from closure returns', /value => \(\{ kind: 'closure' as const, action: value\.action\.value, returnSemantic: routeClosureReturnSemanticProduction\.produce\(/.test(projection)],
  ['evidence projection accepts source file provenance', /routeDeclarationEvidenceFromAst = \(declaration: RouteDeclarationAst, sourceFile: string\)/.test(projection)],
  ['scanner constructs evidence before route emission', /const evidence = routeDeclarationEvidenceFromAst\(declaration, file\);/.test(scanner)],
  ['query closure emission consumes evidence return semantic', /semanticReturn: declarationEvidence\.target\.kind === 'closure' \? declarationEvidence\.target\.returnSemantic : \{ kind: 'absent' as const \}/.test(scanner)],
  ['standard and query closure target consumes the existing evidence return semantic', /semanticReturn: declarationEvidence\.target\.kind === 'closure' \? declarationEvidence\.target\.returnSemantic/.test(scanner) && /laravel_route_declaration_method_query/.test(scanner) && /laravel_route_declaration_method_standard/.test(scanner)],
  ['scanner no longer derives return semantic directly from RouteDeclarationFlow', !/controllerReturnSemanticFromValues\(flow\.target\.value\.returns/.test(scanner)],
  ['producer input receives the already-created evidence instead of reconstructing evidence from AST', /routeProducerInputCompositionOperation\.compose\(\{ boundary, declaration: evidence, source: sourceSpan, methodJudgment \}\)/.test(scanner) && !/routeDeclarationEvidenceFromAst\(declaration, source\.file\.value\.value\)/.test(projection)],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`RESULT ${checks.length - failed}/${checks.length}\n`);
process.exitCode = failed ? 1 : 0;
