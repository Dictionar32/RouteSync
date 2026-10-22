const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const controllerEvidence = read('packages/core/src/types/upstream/controllerEvidence.ts');
const responseInterface = read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const pipeline = read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const index = read('packages/core/src/index.ts');
const testFixture = read('packages/core/src/compiler/scanner/subscanners/controller/controllerHasMiddleware.phase900.test.ts');
const subscannerRoot = path.join(root, 'packages/core/src/compiler/scanner/subscanners');
const subscannerFiles = [];
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).forEach(entry => {
  const target = path.join(directory, entry.name);
  if (entry.isDirectory()) walk(target);
  else if (entry.isFile()) subscannerFiles.push(path.relative(root, target));
});
walk(subscannerRoot);

const checks = [
  ['upstream evidence has a closed expression-kind and exact statement/expression provenance contract', () => {
    assert.match(controllerEvidence, /interface ControllerReturnExpressionEvidence/);
    assert.match(controllerEvidence, /readonly expressionKind: PhpAstExpressionKind/);
    assert.match(controllerEvidence, /readonly expressionSource: SourceSpan/);
    assert.match(controllerEvidence, /readonly returnExpressions: readonly ControllerReturnExpressionEvidence\[\]/);
  }],
  ['upstream return evidence does not import scanner AST types', () => {
    assert.doesNotMatch(controllerEvidence, /from ['"].*compiler\/scanner/);
    assert.match(controllerEvidence, /from '\.\/phpAstSyntaxKind'/);
  }],
  ['response evidence differentiates parser-observed return from descriptor candidate', () => {
    assert.match(responseInterface, /kind: 'observed_controller_return'[\s\S]*?expressionKind: PhpAstExpressionKind/);
    assert.match(responseInterface, /kind: 'controller_action_response_reference_candidate'/);
  }],
  ['evidence inventory uses a canonical method observation with direct-return evidence', () => {
    assert.match(responseInterface, /kind: 'controller_method_response_observation'/);
    assert.match(responseInterface, /readonly returnExpressions: readonly ControllerReturnExpressionEvidence\[\]/);
    assert.match(responseInterface, /LaravelControllerResponseEvidenceProductionEvidence/);
  }],
  ['producer preserves parser return evidence independently from action descriptor response', () => {
    assert.match(pipeline, /methodEvidence\.returnExpressions\.map/);
    assert.match(pipeline, /kind: 'observed_controller_return'/);
    assert.match(pipeline, /kind: 'controller_action_response_reference_candidate'/);
    assert.match(pipeline, /observations\.flatMap\(observation => observation\.evidence\)/);
  }],
  ['response evidence production contract version is 5', () => {
    assert.match(responseInterface, /interface LaravelControllerResponseEvidenceProductionInterface \{[\s\S]*?contractVersion: 5/);
    assert.match(pipeline, /kind: 'laravel_controller_response_evidence_production',[\s\S]*?contractVersion: 5/);
  }],
  ['source binding and response authority still retain existing identity ownership', () => {
    assert.match(pipeline, /relateSourceFiles\(input\.invocationJudgment\.sourceFile, evidence\.sourceFile\)/);
    assert.match(pipeline, /sourceIdentitySemantics: laravelSourceIdentitySemantics/);
  }],
  ['response authority does not promote direct syntax evidence into a response product', () => {
    assert.match(pipeline, /kind: 'controller_response_blocked'[\s\S]*?blocker: unresolvedResponseBlocker/);
    assert.match(responseInterface, /descriptorCandidateBoundary/);
  }],
  ['scanner maps existing parsed return statements into upstream evidence with exact spans', () => {
    assert.match(scanner, /method\.returns\.map\(\(returnStatement\): ControllerReturnExpressionEvidence/);
    assert.match(scanner, /returnStatement\.source\.startOffset/);
    assert.match(scanner, /returnStatement\.expression\.source\.startOffset/);
    assert.match(scanner, /returnStatement\.expression\.kind/);
  }],
  ['scanner still correlates declaration source before calling the evidence producer', () => {
    assert.ok(scanner.indexOf('pipeline.correlateDeclarationSource') < scanner.indexOf('pipeline.evidenceProduction.produce'));
  }],
  ['return evidence type and production evidence type are publicly exported', () => {
    assert.match(index, /export type \{ ControllerReturnExpressionEvidence \}/);
    assert.match(index, /LaravelControllerResponseEvidenceProductionEvidence/);
  }],
  ['existing controller test fixture carries the strengthened evidence contract', () => {
    assert.match(testFixture, /returnExpressions: Object\.freeze\(show!\.returns\.map/);
    assert.match(testFixture, /expressionKind: returnStatement\.expression\.kind/);
  }],
  ['no new relation/foundation subscanner files were introduced', () => {
    assert.ok(fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/lexer/controllerReturnParser.ts')));
    assert.equal(subscannerFiles.some(file => /phase2002|responseSemanticPipeline/i.test(path.basename(file))), false);
  }],
  ['pipeline and response contract versions are advanced together', () => {
    assert.match(responseInterface, /interface LaravelControllerResponseSemanticPipelineContract \{[\s\S]*?contractVersion: 6/);
    assert.match(pipeline, /kind: 'laravel_controller_response_semantic_pipeline',[\s\S]*?contractVersion: 6/);
  }],
  ['source-absence descriptor does not erase parser-observed return evidence', () => {
    assert.match(responseInterface, /descriptorAbsenceRule: 'response-absent-action-descriptors-produce-no-descriptor-candidate-but-do-not-erase-parser-observed-return-expressions'/);
    assert.match(pipeline, /case 'response_absent':[\s\S]*?return emptyResponseEvidence/);
  }],
];

const results = checks.map(([name, check]) => {
  try { check(); return { name, passed: true }; }
  catch (error) { return { name, passed: false, error: String(error.message || error) }; }
});
const report = { phase: 2002, audit: 'parser-return-evidence-interface-first', passed: results.filter(result => result.passed).length, total: results.length, checks: results };
fs.writeFileSync(path.join(root, 'PHASE2002_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`${report.passed}/${report.total} checks passed`);
for (const result of results) console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}${result.error ? `: ${result.error}` : ''}`);
if (report.passed !== report.total) process.exitCode = 1;
