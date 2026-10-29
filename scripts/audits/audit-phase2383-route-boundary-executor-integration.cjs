const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const scannerPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const relationPath = path.join(root, 'packages/core/src/compiler/scanner/operations/routeProducerRelations.ts');
const scanner = fs.readFileSync(scannerPath, 'utf8');
const relations = fs.readFileSync(relationPath, 'utf8');
const checks = [
  ['active declaration executor returns canonical RouteBoundaryContract', /const emitDeclaration =[\s\S]*?\): readonly RouteBoundaryContract\[\] =>/.test(scanner)],
  ['standard boundary operation projects to canonical boundary', scanner.includes('emitStandardRouteBoundaries(') && /export function emitStandardRouteBoundaries[\s\S]*?readonly RouteBoundaryContract\[\]/.test(fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/operations/route-scanner/routeEmitter.ts'), 'utf8'))],
  ['resource boundary operation projects to canonical boundary', scanner.includes('emitResourceRouteBoundariesFromJudgment(') && /export function emitResourceRouteBoundariesFromJudgment[\s\S]*?readonly RouteBoundaryContract\[\]/.test(fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/operations/route-scanner/routeEmitter.ts'), 'utf8'))],
  ['active origin stream stores boundary, not RouteEmission', /const origins: readonly \{ readonly boundary: RouteBoundaryContract;/.test(scanner) && !/const origins: readonly \{ readonly route: RouteEmission;/.test(scanner)],
  ['producer consumes boundary from origin stream directly', /routeProducerInputCompositionOperation\.compose\(\{ boundary, declaration: evidence, source: sourceSpan, methodJudgment \}\)/.test(scanner)],
  ['source evidence is preserved through active origin stream', /readonly evidence: import\([^)]*routeDeclarationEvidence[^)]*\)\.RouteDeclarationEvidence/.test(scanner) && /boundary, declaration: evidence, source: sourceSpan/.test(scanner)],
  ['producer input projection no longer reconstructs evidence from AST', /routeProducerInputFromRouteBoundary =[\s\S]*?declarationEvidence: RouteDeclarationEvidence,[\s\S]*?\): RouteProducerInput => \{\s*const declarationMethods/.test(relations) && !/routeProducerInputFromRouteBoundary =[\s\S]*?routeDeclarationEvidenceFromAst\(declaration, source\.file/.test(relations)],
  ['runtime artifact authorization comes from canonical boundary', /authorization: boundary\.authorization/.test(scanner)],
];
const failures = checks.filter(([, pass]) => !pass);
for (const [name, pass] of checks) process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.length - failures.length}/${checks.length}\n`);
if (failures.length) process.exitCode = 1;
