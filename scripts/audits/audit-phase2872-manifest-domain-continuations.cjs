const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const compositionPath = 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts';
const compositionText = read(compositionPath);
const compositionFile = ts.createSourceFile(compositionPath, compositionText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const decisions = [];
const isComposeRegion = node => {
  const start = compositionText.indexOf('const compose: ControllerInvocationManifestCompositionAuthorityInterface');
  return node.getStart(compositionFile) >= start;
};
const visit = node => {
  if (isComposeRegion(node) && (ts.isIfStatement(node) || ts.isConditionalExpression(node) || ts.isSwitchStatement(node))) {
    decisions.push({
      syntax: ts.SyntaxKind[node.kind],
      line: compositionFile.getLineAndCharacterOfPosition(node.getStart(compositionFile)).line + 1,
      expression: (node.condition ?? node.expression ?? node).getText(compositionFile).slice(0, 180),
      status: 'decision-point-requires-domain-ownership-review',
    });
  }
  ts.forEachChild(node, visit);
};
visit(compositionFile);
const canonicalizationContract = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const discoveryContract = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const identityBindingContract = read('packages/core/src/types/upstream/phpSourceDocumentIdentityBindingInterface.ts');
const manifestBuilderContract = read('packages/core/src/types/upstream/manifestBuilderInterface.ts');
const collectionsBytes = fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size;
const checks = {
  canonicalizationHasNamedExistingContract: /ControllerSourceProjectIdentityCanonicalizationResult/.test(canonicalizationContract) && /ControllerSourceProjectIdentityCanonicalizationInterface/.test(canonicalizationContract),
  discoveryUsesExistingUpstreamADT: /LaravelControllerSourceDiscoveryResult/.test(discoveryContract) && /LaravelControllerSourceDiscoveryInterface/.test(discoveryContract),
  identityBindingHasClosedJudgment: /type PhpSourceDocumentIdentityBindingJudgment\s*=/.test(identityBindingContract),
  manifestJudgmentAlreadyHasContinuation: /interface ManifestBuilderCompleteJudgment[\s\S]*?continueWith/.test(manifestBuilderContract),
  collectionsRemainsEmpty: collectionsBytes === 0,
  reportDoesNotClaimBranchesAlreadyRemoved: /does not claim those branches have been removed/.test(read('packages/core/src/types/upstream/PHASE2872_MANIFEST_DOMAIN_CONTINUATION_DESIGN.md')),
};
const report = {
  phase: 2872,
  title: 'Manifest Domain Continuation Decision-Point Audit',
  source: compositionPath,
  decisionPointCount: decisions.length,
  decisionPoints: decisions,
  checks,
  passedChecks: Object.values(checks).filter(Boolean).length,
  totalChecks: Object.keys(checks).length,
  collectionsBytes,
  interpretation: 'This phase records actual branch locations and maps each to its existing domain contract. It does not claim a migration, typecheck, build, or end-to-end test.',
};
fs.writeFileSync(path.join(root, 'packages/core/src/types/upstream/PHASE2872_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (report.passedChecks !== report.totalChecks) process.exitCode = 1;
