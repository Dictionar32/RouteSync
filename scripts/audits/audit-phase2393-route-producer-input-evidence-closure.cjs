const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const producerRelations = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/operations/routeProducerRelations.ts'), 'utf8');
const scanner = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts'), 'utf8');
const assertions = [
  ['producer input composer no longer accepts concrete RouteDeclarationAst', /routeProducerInputFromRouteBoundary\s*=\s*\(\s*route:[\s\S]*?declarationEvidence:\s*RouteDeclarationEvidence,\s*source:/.test(producerRelations) && !/routeProducerInputFromRouteBoundary\s*=\s*\([\s\S]{0,300}declaration:\s*RouteDeclarationAst/.test(producerRelations)],
  ['producer input group context is projected from canonical declaration evidence', /routeGroupFactFromEvidence\s*=\s*\(evidence:\s*RouteDeclarationEvidence\)/.test(producerRelations) && /resolveRouteGroupContextFromFact\(routeGroupFactFromEvidence\(declarationEvidence\)\)/.test(producerRelations)],
  ['producer input composer no longer re-reads AST dataflow', !producerRelations.includes('routeDeclarationFlow(') && !producerRelations.includes('routeDeclarationFlow }')],
  ['group prefix/middleware/name/controller/domain/binding scope come from evidence', ['evidence.prefix.map(stringValue)', 'evidence.middleware.map(createMiddlewareName)', 'evidence.groupNamePrefix.map(stringValue)', 'evidence.groupController', 'evidence.groupDomain', 'evidence.groupBindingScope'].every(fragment => producerRelations.includes(fragment))],
  ['group constraints preserve parameter, method, argument and group provenance', /evidence\.groupConstraints\.map\(constraint => Object\.freeze\(\{[\s\S]*?parameter: createRouteParameterName\(constraint\.parameter\)[\s\S]*?method: constraint\.method[\s\S]*?source: Object\.freeze\(\{ kind: 'group' as const \}\)/.test(producerRelations)],
  ['scanner passes evidence and source span, not declaration AST, to producer input composition', /routeProducerInputCompositionOperation\.compose\(\{ boundary, declaration: evidence, source: sourceSpan, methodJudgment \}\)/.test(scanner)],
  ['canonical RouteProducer remains sole RouteAst constructor in scanner path', /routeProducerOperation\.produce\(producerInput\)/.test(scanner)],
  ['no new duplicate producer interface was introduced', !producerRelations.includes('interface RouteProducerInputComposer') && !scanner.includes('interface RouteProducerInputComposer')],
];
let failures = 0;
for (const [name, pass] of assertions) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!pass) failures += 1;
}
process.stdout.write(`\n${assertions.length - failures}/${assertions.length} assertions passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
