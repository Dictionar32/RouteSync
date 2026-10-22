const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const implementation = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const contract = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const cli = read('packages/cli/src/index.ts');
const loader = read('packages/cli/src/standaloneCompositionLoader.ts');
const checks = [];
const check = (name, passed, detail) => checks.push({ name, passed: Boolean(passed), detail });

const workflowLiterals = (source, pattern) => {
  const block = source.match(pattern);
  return block ? [...block[1].matchAll(/'([^']+)'/g)].map(match => match[1]) : [];
};
const declaredWorkflow = workflowLiterals(contract, /readonly workflow: readonly \[([\s\S]*?)\];/);
const implementedWorkflow = workflowLiterals(implementation, /workflow: Object\.freeze\(\[([\s\S]*?)\] as const\)/);
check('manifest-workflow-implementation-matches-its-closed-contract',
  declaredWorkflow.length > 0 && declaredWorkflow.length === implementedWorkflow.length && declaredWorkflow.every((step, index) => step === implementedWorkflow[index]),
  `contract steps=${declaredWorkflow.length}; implementation steps=${implementedWorkflow.length}; exact ordered equality required`);

const identityBinding = implementation.indexOf('dependencies.sourceDocumentIdentityBinding.bind(');
const invocationAnalysis = implementation.indexOf('dependencies.sourceInvocationPipeline.analyze(document)');
const inventoryClosure = implementation.indexOf('dependencies.inventoryAuthority.close(');
check('source-identity-binding-precedes-analysis-and-inventory-closure',
  identityBinding >= 0 && invocationAnalysis > identityBinding && inventoryClosure > invocationAnalysis,
  'requested source identity is bound before invocation analysis and before complete inventory closure');
check('identity-rejection-is-a-terminal-composition-judgment',
  implementation.includes("kind: 'controller_invocation_manifest_source_document_identity_rejected'") &&
  implementation.includes('if (identityRejections.length > 0)') &&
  implementation.indexOf('if (identityRejections.length > 0)') < invocationAnalysis,
  'identity mismatch returns a closed rejection before semantic analysis can consume the document');
check('all-successful-reads-and-blockers-are-bound-before-partition',
  implementation.includes('sourceReadResults.map(read => dependencies.sourceDocumentIdentityBinding.bind') &&
  implementation.includes("binding.kind === 'php_source_document_identity_bound'") &&
  implementation.includes("binding.kind === 'php_source_document_identity_rejected'"),
  'both complete and blocked reader outcomes pass through the same identity-binding operation');
check('scan-and-sync-share-the-same-upstream-preflight-contract',
  scan.includes('routeManifestRequestResolutionPreflight.evaluate(completeManifest)') &&
  sync.includes('routeManifestRequestResolutionPreflight.evaluate(completeManifest)') &&
  scan.includes('createRouteManifestProjectionComposition(requestTypeDerivationPipeline).project(\n        requestResolutionPreflight') &&
  sync.includes('createRouteManifestProjectionComposition(requestTypeDerivationPipeline).project(\n        requestResolutionPreflight'),
  'both commands pass the exact preflight packet to projection; no alternate RequestType fallback is present');
check('standalone-executable-loads-host-composition-before-dispatch',
  cli.includes('loadRouteSyncStandaloneComposition(process.env[ROUTESYNC_UPSTREAM_COMPOSITION_MODULE])') &&
  cli.includes('createProgramFromSemanticComposition(loaded.composition)') &&
  cli.includes('programResolution.program.parseAsync(process.argv)') &&
  loader.includes("kind: 'composition_module_missing'") && loader.includes("kind: 'composition_module_invalid'"),
  'CLI dispatch requires the host-owned composition module and validates its canonical contract');
check('no-foundation-or-relation-import-on-manifest-upstream-path',
  !/semantic\/(foundation|relation)/.test([implementation, contract, scan, sync, cli, loader].join('\n')),
  'the audited path does not depend on forbidden foundation/relation modules');

for (const result of checks) process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}: ${result.detail}\n`);
const failures = checks.filter(result => !result.passed);
process.stdout.write(`\nPhase 2614: ${checks.length - failures.length}/${checks.length} assertions passed.\n`);
if (failures.length) process.exitCode = 1;
