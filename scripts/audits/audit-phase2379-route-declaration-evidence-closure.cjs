const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const evidence = read('packages/core/src/types/upstream/routeDeclarationEvidence.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const producerRelations = read('packages/core/src/compiler/scanner/operations/routeProducerRelations.ts');
const emitter = read('packages/core/src/compiler/scanner/operations/route-scanner/routeEmitter.ts');
const checks = [
  ['source evidence target is a closed ADT', /export type RouteDeclarationTargetEvidence\s*=/.test(evidence) && /kind: 'controller_action'/.test(evidence) && /kind: 'controller_invokable'/.test(evidence) && /kind: 'closure'/.test(evidence) && /kind: 'unsupported'/.test(evidence)],
  ['closure evidence carries ControllerReturnSemantic', /kind: 'closure'; readonly action: string; readonly returnSemantic: ControllerReturnSemantic/.test(evidence)],
  ['scanner consumes closure return semantic from evidence', /semanticReturn: declarationEvidence\.target\.kind === 'closure' \? declarationEvidence\.target\.returnSemantic/.test(scanner)],
  ['existing return-semantic production contract is used', /ControllerReturnSemanticProductionInterface/.test(producerRelations) && /routeClosureReturnSemanticProduction\.produce/.test(producerRelations)],
  ['scanner creates one evidence datum and reuses it for method judgment and emission', /const evidence = routeDeclarationEvidenceFromAst\(declaration, file\)/.test(scanner) && /methodAuthority\.judge\(\{ method: evidence\.method, targetMethods: evidence\.targetMethods \}\)/.test(scanner) && /emitDeclaration\(evidence, methodJudgment/.test(scanner)],
  ['emitter contract requires semantic return for closure target', /semanticReturn: ControllerReturnSemantic/.test(emitter)],
];
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
console.log(`RESULT ${checks.filter(([, ok]) => ok).length}/${checks.length}`);
process.exitCode = checks.every(([, ok]) => ok) ? 0 : 1;
