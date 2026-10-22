const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const dependencies = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipelineDependencies.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelResourceScanner.ts');
const contract = read('packages/core/src/types/upstream/laravelResourceScannerInterface.ts');
const evidence = read('packages/core/src/compiler/scanner/lexer/resourceSourceEvidence.ts');
const pipelineContract = read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts');
const publicExports = read('packages/core/src/index.ts');
const checks = [
  ['upstream defines a generic Resource evidence contract without importing compiler or lexer types', /interface LaravelResourceSourceEvidence<Identity extends object, Syntax extends object>/.test(contract) && !/from ['"][^'"]*(compiler\/scanner|\/lexer\/)/.test(contract)],
  ['Resource scanner contract receives a complete evidence inventory', /resourceEvidence:\s*readonly Evidence\[\]/.test(contract) && /LaravelResourceScanInput<Evidence>/.test(contract)],
  ['source evidence implements the upstream evidence contract', /extends LaravelResourceSourceEvidence<ResourceScanIdentityEvidence, ResourceScanSyntaxEvidence>/.test(evidence)],
  ['source-evidence producer is exported as an interface-typed const operation', /export const resourceSourceEvidenceScanner:\s*ResourceSourceEvidenceScannerInterface<ResourceScanEvidence>/.test(evidence) && /scan:\s*scanResourceSourceEvidence/.test(evidence)],
  ['pipeline acquires Resource evidence once through its declared dependency', (pipeline.match(/dependencies\.resourceEvidenceScanner\.scan\(sourceProject\)/g) || []).length === 1 && /resourceEvidenceScanner:\s*ResourceSourceEvidenceScannerInterface<Evidence>/.test(pipelineContract)],
  ['composition root wires the existing evidence-scanner contract', /resourceEvidenceScanner:\s*resourceSourceEvidenceScanner/.test(dependencies)],
  ['pipeline passes the exact inventory to the Resource scanner', /resourceEvidence:\s*resourceSourceEvidence/.test(pipeline)],
  ['Resource scanner does not rediscover or reread Resource source files', !/scanResourceSourceEvidence|\bsourceProject\s*=/.test(scanner)],
  ['binding judgment derives relation facts from the same evidence inventory', /const sourceEvidence = input\.resourceEvidence/.test(scanner) && /sourceEvidence\.flatMap\(evidence => evidence\.relations\)/.test(scanner)],
  ['legacy relationEvidence side-channel is removed from Resource scan input', !/relationEvidence:\s*readonly ResourceRelationBindingEvidence\[\]/.test(contract) && !/relationEvidence:\s*resourceRelationEvidence/.test(pipeline)],
  ['Resource scanner contract version advances to 19', /contractVersion:\s*19/.test(contract) && /contractVersion:\s*19/.test(scanner)],
  ['upstream source-AST dependency contract carries the evidence type parameter', /LaravelSourceAstPipelineDependenciesInterface<Evidence extends LaravelResourceSourceEvidence<object, object>/.test(pipelineContract)],
  ['new upstream evidence contracts are publicly type-exported', /LaravelResourceSourceEvidence/.test(publicExports) && /ResourceSourceEvidenceScannerInterface/.test(publicExports)],
];
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
const failed = checks.filter(([, passed]) => !passed);
process.stdout.write(`\n${checks.length - failed.length}/${checks.length} assertions passed\n`);
process.exitCode = failed.length === 0 ? 0 : 1;
