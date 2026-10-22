const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const resourceScanner = read('packages/core/src/compiler/scanner/wiring/laravelResourceScanner.ts');
const resourceContract = read('packages/core/src/types/upstream/laravelResourceScannerInterface.ts');
const evidenceProducer = read('packages/core/src/compiler/scanner/lexer/resourceSourceEvidence.ts');
const dependencies = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipelineDependencies.ts');
const checks = [
  ['pipeline acquires canonical Resource evidence once through the upstream-bound dependency', (pipeline.match(/dependencies\.resourceEvidenceScanner\.scan\(sourceProject\)/g) || []).length === 1],
  ['pipeline passes complete source evidence through the existing scanner contract', /resourceEvidence:\s*resourceSourceEvidence/.test(pipeline) && /resourceEvidenceScanner:\s*resourceSourceEvidenceScanner/.test(dependencies)],
  ['pipeline does not pass a detached relation-evidence side channel', !/relationEvidence:\s*resourceRelationEvidence/.test(pipeline)],
  ['scanner binding authority receives relation facts derived from its exact input inventory', /const sourceEvidence = input\.resourceEvidence/.test(resourceScanner) && /sourceEvidence\.flatMap\(evidence => evidence\.relations\)/.test(resourceScanner) && /relations:\s*relationEvidence/.test(resourceScanner)],
  ['scanner no longer performs hidden Resource evidence acquisition', !/scanResourceSourceEvidence/.test(resourceScanner)],
  ['existing upstream contracts own the evidence envelope and acquisition operation', /interface LaravelResourceSourceEvidence<Identity extends object, Syntax extends object>/.test(resourceContract) && /interface ResourceSourceEvidenceScannerInterface/.test(resourceContract) && /export const resourceSourceEvidenceScanner:\s*ResourceSourceEvidenceScannerInterface<ResourceScanEvidence>/.test(evidenceProducer)],
];
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
const failed = checks.filter(([, passed]) => !passed);
process.stdout.write(`\n${checks.length - failed.length}/${checks.length} assertions passed\n`);
process.exitCode = failed.length === 0 ? 0 : 1;
