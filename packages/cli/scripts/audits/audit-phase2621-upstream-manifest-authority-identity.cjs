const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const upstreamIndex = read('core/src/types/upstream/index.ts');
const coreIndex = read('core/src/index.ts');
const builder = read('core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const manifestContract = read('core/src/types/upstream/manifestBuilderInterface.ts');
const identity = read('core/src/types/upstream/sourceProjectIdentity.ts');
const inventory = read('core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const compositionInterface = read('cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const composition = read('cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const scan = read('cli/src/commands/scan.ts');
const checks = [
  ['upstream barrel re-exports the canonical manifest builder contract', /export\s+\*\s+from\s+['"]\.\/manifestBuilderInterface['"]/.test(upstreamIndex)],
  ['upstream barrel re-exports canonical source identity semantics', /export\s+\*\s+from\s+['"]\.\/sourceProjectIdentity['"]/.test(upstreamIndex)],
  ['upstream barrel re-exports the controller inventory judgment contract', /export\s+\*\s+from\s+['"]\.\/laravelControllerInvocationSemanticJudgmentInventoryInterface['"]/.test(upstreamIndex)],
  ['manifest builder has a closed complete-or-blocked judgment ADT', /export\s+type\s+ManifestBuilderJudgment\s*=\s*ManifestBuilderCompleteJudgment\s*\|\s*ManifestBuilderBlockedJudgment/.test(manifestContract)],
  ['manifest builder input carries explicit inventory receipt and route selection', /readonly\s+invocationInventoryReceipt:/.test(manifestContract) && /readonly\s+routeSelection:/.test(manifestContract)],
  ['manifest builder operation is prepared through the existing interface method type', /export\s+const\s+prepareManifestBuilderOperation:\s*ManifestBuilderOperationPreparationInterface\[['"]prepare['"]\]\s*=/.test(builder)],
  ['manifest builder preparation value uses export const name:interface', /export\s+const\s+manifestBuilderOperationPreparation:\s*ManifestBuilderOperationPreparationInterface\s*=/.test(builder)],
  ['legacy exported function declaration for manifest preparation is absent', !/export\s+function\s+prepareManifestBuilderOperation\s*\(/.test(builder)],
  ['Core entry point exports the canonical preparation operation and value', /export\s*\{[^}]*prepareManifestBuilderOperation[^}]*manifestBuilderOperationPreparation[^}]*\}\s*from\s*['"]\.\/compiler\/scanner\/wiring\/upstreamManifestBuilder['"]/.test(coreIndex)],
  ['source-project identity operation is owned by upstream and exported through Core', /export\s+const\s+createLaravelSourceProjectIdentity\s*=/.test(identity) && /createLaravelSourceProjectIdentity[^\n]*from\s+['"]\.\/types\/upstream\/sourceProjectIdentity['"]/.test(coreIndex)],
  ['inventory authority contract preserves source inventory and semantic judgments as explicit input', /readonly\s+sourceInventory:\s*LaravelControllerSourceInventoryInterface/.test(inventory) && /readonly\s+judgments:\s*readonly\s+LaravelControllerInvocationSemanticJudgmentInterface\[\]/.test(inventory)],
  ['composition contract delegates manifest construction to injected preparation interface', /ManifestBuilderOperationPreparationInterface/.test(compositionInterface) && /manifestBuilderPreparation\.prepare\(/.test(composition)],
  ['CLI command consumes the injected manifest composition authority', /manifestComposition\.compose\(/.test(scan) && /ControllerInvocationManifestCompositionAuthorityInterface/.test(compositionInterface)],
  ['active manifest-path files do not import semantic/foundation or semantic/relations', !/(?:semantic\/foundation|semantic\/relations)/.test(builder + composition + compositionInterface + scan)],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.filter(([, passed]) => passed).length}/${checks.length}\n`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
