const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const interfacePath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const compositionPath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const consumerPaths = [
  path.join(root, 'packages/cli/src/commands/scan.ts'),
  path.join(root, 'packages/cli/src/commands/sync.ts'),
  path.join(root, 'packages/cli/src/commands/audit/driftAuditor.ts'),
];
const interfaceSource = fs.readFileSync(interfacePath, 'utf8');
const compositionSource = fs.readFileSync(compositionPath, 'utf8');
const consumers = consumerPaths.map(file => fs.readFileSync(file, 'utf8'));
const cliSourceRoot = path.join(root, 'packages/cli/src');
const activeTypeScript = [];
const walk = directory => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.isFile() && file.endsWith('.ts')) activeTypeScript.push(fs.readFileSync(file, 'utf8'));
  }
};
walk(cliSourceRoot);

const report = {
  phase: 3100,
  scope: 'replace CLI manifest terminal handler visitor with a fixed typed domain operation',
  handlerVisitorInterfaceRemovedFromActiveCliSources: !activeTypeScript.some(source => source.includes('ControllerInvocationManifestDriftAuditHandlersInterface')),
  continueForDriftAuditRemovedFromActiveCliSources: !activeTypeScript.some(source => source.includes('continueForDriftAudit')),
  fixedRequireCompleteManifestOperationDeclared: /requireCompleteManifest\s*:\s*\(\)\s*=>\s*Extract<ManifestBuilderJudgment, \{ readonly kind: 'manifest_builder_complete' \}>\['manifest'\]/.test(interfaceSource),
  typedTerminalFailureRetainsJudgment: /interface ControllerInvocationManifestTerminalFailure extends Error/.test(interfaceSource) && /readonly judgment: ControllerInvocationManifestTerminalFailureEvidence/.test(interfaceSource),
  successTerminalReturnsExactManifest: /requireCompleteManifest: \(\) => judgment\.manifest/.test(compositionSource),
  blockedAndRejectedTerminalsRetainTypedEvidenceOnFailure: compositionSource.includes('controllerInvocationManifestTerminalFailureFactory.create(judgment,') && compositionSource.includes('readonly judgment: ControllerInvocationManifestTerminalFailureEvidence'),
  allRuntimeConsumersUseFixedDomainOperation: consumers.every(source => source.includes('.requireCompleteManifest()') && !source.includes('continueForDriftAudit')),
  noCoreToCliDependencyIntroduced: !fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/phpSourceFrontendInterface.ts'), 'utf8').includes('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface'),
  fullTypecheckVerified: false,
  fullTestSuiteVerified: false,
  phpToCliManifestGeneratorE2eVerified: false,
};
const verificationFields = new Set(['fullTypecheckVerified', 'fullTestSuiteVerified', 'phpToCliManifestGeneratorE2eVerified']);
const failed = Object.entries(report).filter(([key, value]) => typeof value === 'boolean' && !value && !verificationFields.has(key)).map(([key]) => key);
const output = path.join(root, 'reports/PHASE3100_TERMINAL_MANIFEST_OPERATION_AUDIT.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exitCode = 1;
