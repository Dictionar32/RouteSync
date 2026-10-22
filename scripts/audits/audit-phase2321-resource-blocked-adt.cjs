const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const resourceInterface = read('packages/core/src/types/upstream/laravelResourceScannerInterface.ts');
const resourceScanner = read('packages/core/src/compiler/scanner/wiring/laravelResourceScanner.ts');
const pipelineInterface = read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const checks = [
  ['resource scanner interface advances to contract version 18', /interface LaravelResourceScannerInterface[\s\S]*?contractVersion: 18/.test(resourceInterface)],
  ['resource judgment is a closed complete-or-blocked ADT', /kind: 'laravel_resource_scan_complete'[\s\S]*?kind: 'laravel_resource_scan_blocked'/.test(resourceInterface)],
  ['blocked resource judgment preserves rejected artifacts', /readonly rejectedArtifacts: readonly LaravelResourceRejectedArtifact\[\]/.test(resourceInterface)],
  ['complete resource judgment carries resolved artifacts only', /kind: 'laravel_resource_scan_complete'[\s\S]*?LaravelResourceIntegratedResponse<LaravelResourceResolvedArtifact>/.test(resourceInterface)],
  ['scanner computes rejected artifacts from original source-ordered outcomes', /const rejectedArtifacts = Object\.freeze\(resources\.artifacts\.filter/.test(resourceScanner)],
  ['scanner returns blocked judgment when rejected artifacts exist', /kind: 'laravel_resource_scan_blocked'[\s\S]*?rejectedArtifacts,/.test(resourceScanner)],
  ['scanner returns complete judgment with resolved-only sequence', /kind: 'laravel_resource_scan_complete'[\s\S]*?sequenceFromArray\(resolvedArtifacts\)/.test(resourceScanner)],
  ['source-AST projection has a resource-scan blocked arm', /kind: 'laravel_source_ast_projection_resource_scan_blocked'[\s\S]*?laravel_resource_scan_blocked/.test(pipelineInterface)],
  ['pipeline stops and preserves the resource blocker before response projection', /if \(resourceScan\.kind === 'laravel_resource_scan_blocked'\)[\s\S]*?kind: 'laravel_source_ast_projection_resource_scan_blocked'[\s\S]*?scan: resourceScan/.test(pipeline)],
  ['pipeline no longer silently filters rejected resource artifacts', !/resourceArtifacts\.filter\([\s\S]*?laravel_resource_resolved_artifact/.test(pipeline)],
  ['pipeline contract version advances to 14', /contractVersion: 14/.test(pipelineInterface) && /kind: "laravel_source_ast_pipeline",\s*closed: true,\s*contractVersion: 14/.test(pipeline)],
  ['new path introduces no semantic foundation or relation imports', !/semantic\/(foundation|relations)/.test(resourceInterface + pipelineInterface)],
  ['new path introduces no casts or loose any/unknown types', !/\bas\s+(?:any|unknown)\b|:\s*(?:any|unknown)\b/.test(resourceInterface + resourceScanner + pipelineInterface + pipeline)],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
