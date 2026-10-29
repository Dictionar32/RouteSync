#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const judgment = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const judgmentAuthority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts');
const scannerContract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const sourcePipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const routeScanner = read('packages/core/src/compiler/scanner/operations/RouteScanner.ts');
const subscannerIndex = read('packages/core/src/compiler/scanner/operations/index.ts');
const packageJson = JSON.parse(read('package.json'));
const legacyFile = path.join(root, 'packages/core/src/compiler/scanner/operations/ControllerScanner.ts');
const productionFiles = [];
const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
  const full = path.join(directory, entry.name);
  if (entry.isDirectory()) walk(full);
  else if (/\.(ts|tsx|mts|cts|js|mjs|cjs)$/.test(entry.name) && !full.includes(`${path.sep}scripts${path.sep}audits${path.sep}`)) productionFiles.push(full);
});
walk(path.join(root, 'packages/core/src'));
const productionText = productionFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
const checks = [
  ['judgment remains an outcome-indexed value rather than a callable boundary', /export type LaravelControllerInvocationSemanticJudgmentInterface\s*=/.test(judgment) && /export interface LaravelControllerInvocationSemanticJudgmentAuthorityInterface/.test(judgment)],
  ['integrated response subject-closure rule is added to contract v10 and authority value', /readonly version: 11/.test(judgment) && /version: 11,/.test(judgmentAuthority) && /integratedResponseSubjectClosureRule/.test(judgment) && /integratedResponseSubjectClosureRule/.test(judgmentAuthority)],
  ['four exact integrated outcomes remain separately correlated', ['not_connected', 'source_binding_rejected', 'complete', 'blocked'].every((outcome) => judgment.includes(`php_source_invocation_integration_${outcome}`) && judgmentAuthority.includes(`case 'php_source_invocation_integration_${outcome}'`))],
  ['controller scanner boundary tracks current v109 and records legacy-entry retirement', /readonly version: 109/.test(scannerContract) && /version: 109,/.test(scannerContract) && /subscannerDirectoryRealityBoundary/.test(scannerContract) && /does-not-imply-the-controller-subscanner-directory-is-empty/.test(scannerContract)],
  ['canonical scanner projects response from the exact source-correlated invocation judgment', /correspondences\.map\(invocationJudgment => Object\.freeze\(\{\s*invocationJudgment,/.test(scanner) && /parseControllerDeclarationFromInvocationJudgment\([^;]*invocationJudgment\)/s.test(scanner) && !/integratedResponse/.test(scanner)],
  ['production source pipeline uses the canonical controller scanner interface', /laravelControllerScanner\.scan\(/.test(sourcePipeline) && !/ControllerScanner\.scanCanonicalBundle/.test(sourcePipeline)],
  ['legacy ControllerScanner implementation is deleted', !fs.existsSync(legacyFile)],
  ['legacy controller scanner is not exported from the subscanner barrel', !/ControllerScanner/.test(subscannerIndex)],
  ['legacy route subscanner has no ControllerScanner import', !/ControllerScanner/.test(routeScanner)],
  ['no production source imports or references the legacy ControllerScanner entry', !/from\s*["'][^"']*\/ControllerScanner["']|ControllerScanner\.scanCanonicalBundle|ControllerScanner\.extractResourceDataflow/.test(productionText)],
  ['no semantic foundation dependency is introduced', !/semantic\/foundation/.test(judgment + judgmentAuthority + scannerContract + scanner)],
  ['audit command is registered', packageJson.scripts?.['audit:phase1876-laravel-invocation-judgment-subscanner-retirement-interface-first'] === 'node scripts/audits/audit-phase1876-laravel-invocation-judgment-subscanner-retirement-interface-first.cjs'],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
