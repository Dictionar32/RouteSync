const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const route = read('packages/core/src/types/upstream/route.ts');
const scannerContract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const producerRelations = read('packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts');
const checks = [
  ['producer input composition has a named closed upstream input contract', /interface RouteProducerInputCompositionInput[\s\S]*?readonly boundary: RouteBoundaryContract[\s\S]*?readonly declaration: import\('\.\/routeDeclarationEvidence'\)\.RouteDeclarationEvidence[\s\S]*?readonly source: SourceSpan[\s\S]*?readonly methodJudgment: import\('\.\/laravelRouteDeclarationMethodJudgment'\)\.LaravelRouteDeclarationMethodJudgment/.test(route)],
  ['composition is modeled as an explicit closed operation, not as RouteProducer', /interface RouteProducerInputComposition \{[\s\S]*?readonly kind: 'route_producer_input_composition'[\s\S]*?readonly closed: true[\s\S]*?readonly compose: \(input: RouteProducerInputCompositionInput\) => RouteProducerInput/.test(route)],
  ['existing LaravelRouteScannerInterface owns the composition operation', /readonly routeProducerInputComposition: RouteProducerInputComposition/.test(scannerContract)],
  ['scanner contract version reflects the operation contract evolution', /readonly contractVersion: 30/.test(scannerContract) && /contractVersion: 30/.test(scanner)],
  ['concrete operation consumes existing boundary/evidence/judgment contracts', /compose: \(input: import\('\.\.\/\.\.\/\.\.\/types\/upstream\/route'\)\.RouteProducerInputCompositionInput\): RouteProducerInput =>[\s\S]*?input\.boundary[\s\S]*?input\.declaration[\s\S]*?input\.source[\s\S]*?input\.methodJudgment/.test(producerRelations)],
  ['scanner executes the injected composition operation instead of calling the projection function directly', /routeProducerInputCompositionOperation\.compose\(\{ boundary, declaration: evidence, source: sourceSpan, methodJudgment \}\)/.test(scanner) && !/routeProducerInputFromRouteBoundary\(boundary, evidence/.test(scanner)],
  ['the exact operation instance is injected into scanner composition', /authorities\.routeProducerInputComposition/.test(scanner) && /routeProducerInputComposition,\s*routeProducer,/.test(scanner)],
  ['RouteProducer remains the sole RouteAst constructor', /routeProducerOperation\.produce\(producerInput\)/.test(scanner)],
  ['composition does not accept RouteDeclarationAst or reconstruct declaration evidence', !/RouteDeclarationAst/.test(route.match(/interface RouteProducerInputCompositionInput[\s\S]*?interface RouteProducerInputComposition[\s\S]*?\n\}/)?.[0] ?? '') && !/routeDeclarationEvidenceFromAst\(/.test(producerRelations.slice(producerRelations.indexOf('export const routeProducerInputComposition')))],
  ['no semantic/foundation dependency was introduced into the active scanner wiring', !/semantic\/foundation/.test(scanner)],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
const passed = checks.filter(([, value]) => value).length;
process.stdout.write(`\n${passed}/${checks.length} assertions passed\n`);
process.exitCode = passed === checks.length ? 0 : 1;
