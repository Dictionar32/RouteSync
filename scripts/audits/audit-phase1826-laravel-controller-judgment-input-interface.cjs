const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scanner = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const judgment = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const integrationContract = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegrationInterface.ts');
const authority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts');
const rootExports = read('packages/core/src/index.ts');
const upstreamExports = read('packages/core/src/types/upstream/index.ts');
const production = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const scripts = JSON.parse(read('package.json')).scripts;
const checks = [
  ['scanner interface contract supersedes v6 with v7', /readonly contractVersion: 7/.test(scanner)],
  ['scan judgment contract version is v7', /interface LaravelControllerScanJudgment[\s\S]*?readonly contractVersion: 7/.test(scanner)],
  ['scanner has no injected invocation judgment authority', !/readonly invocationJudgmentAuthority/.test(scanner)],
  ['scanner accepts only an authority-validated total judgment inventory', /readonly invocationInventory: LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt/.test(scanner)],
  ['scanner interface does not accept raw pipeline results', !/PhpSourceInvocationSemanticPipelineResult/.test(scanner)],
  ['old raw delivery ADTs are removed from scanner boundary', !/LaravelControllerInvocationDelivery|LaravelControllerInvocationSourceDelivery|source_correlated_delivery_inventory/.test(scanner)],
  ['source-bound judgment is retained as a single artifact member', /readonly invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface/.test(scanner)],
  ['judgment carries canonical source identity and exact integrated response', /readonly sourceFile: SourceFile/.test(judgment) && /readonly response: PhpSourceInvocationSemanticPipelineIntegrationResult/.test(judgment)],
  ['not-connected pipeline state remains a distinct upstream integrated outcome', /php_source_invocation_integration_not_connected/.test(integrationContract)],
  ['source binding rejection remains a distinct upstream integrated outcome', /php_source_invocation_integration_source_binding_rejected/.test(integrationContract)],
  ['blocked pipeline remains a distinct upstream integrated outcome', /php_source_invocation_integration_blocked/.test(integrationContract)],
  ['complete pipeline remains a distinct upstream integrated outcome', /php_source_invocation_integration_complete/.test(integrationContract)],
  ['authority alone composes source binding and integration dependencies', /dependencies\.sourceBinding\.bind/.test(authority) && /dependencies\.integration\.project/.test(authority)],
  ['boundary contract version is v43 and requires receipt-only inventory input', /readonly version: 43/.test(scanner) && /version: 43/.test(scanner) && /judgmentInputBoundary/.test(scanner)],
  ['boundary explicitly requires total source judgment inventory', /completeInventoryGate/.test(scanner) && /exactly-one-judgment-per-controller-source/.test(scanner)],
  ['boundary forbids scanner-side judgment construction and fallback', /source-artifact-collection-only-no-semantic-judgment-construction/.test(scanner) && /scanner-never-invents-a-fallback/.test(scanner)],
  ['contract interface fields and constant fields remain aligned', (() => { const i = scanner.slice(scanner.indexOf('export interface LaravelControllerInvocationSemanticBoundaryContract'), scanner.indexOf('export const LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_BOUNDARY_CONTRACT')); const o = scanner.slice(scanner.indexOf('export const LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_BOUNDARY_CONTRACT')); const ik = [...i.matchAll(/readonly (\w+):/g)].map(x => x[1]); const ok = [...o.matchAll(/^\s{2}(\w+):/gm)].map(x => x[1]); return ik.length === ok.length && ik.every(k => ok.includes(k)) && ok.every((k, n) => ok.indexOf(k) === n); })()],
  ['public root no longer exports removed raw-delivery types', !/LaravelControllerInvocationDelivery|LaravelControllerInvocationSourceDelivery/.test(rootExports)],
  ['upstream barrel exports controller interface', /export \* from '\.\/laravelControllerScannerInterface'/.test(upstreamExports)],
  ['production wiring is truthfully still marked legacy', /ControllerScanner\.scanCanonicalBundle/.test(production)],
  ['no semantic foundation dependency introduced', !/semantic\/foundation/.test(scanner + judgment + authority + integrationContract)],
  ['audit command is registered', scripts['audit:phase1826-laravel-controller-judgment-input-interface'] === 'node scripts/audits/audit-phase1826-laravel-controller-judgment-input-interface.cjs'],
];
let failures = 0;
for (const [name, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!pass);
}
process.stdout.write(`\n${checks.length - failures}/${checks.length} checks passed.\n`);
process.stdout.write('Status: scanner boundary now requires an authority-validated total judgment inventory; inventory authority implementation is complete; production wiring and legacy subscanner retirement remain pending.\n');
process.exitCode = failures === 0 ? 0 : 1;
