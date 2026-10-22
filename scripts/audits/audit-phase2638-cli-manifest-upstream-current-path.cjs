const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const checks = [];
const check = (label, condition) => checks.push({ label, passed: Boolean(condition) });

const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const inventory = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory.ts');
const semanticPreparation = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticInputPreparation.ts');
const preflight = read('packages/core/src/compiler/scanner/wiring/routeManifestRequestResolutionPreflight.ts');
const assembler = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticPipelineAssembler.ts');
const production = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProductionComposition.ts');
const cliFactory = read('packages/cli/src/upstreamCompositionFactory.ts');
const loader = read('packages/cli/src/standaloneCompositionLoader.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const lowering = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts');
const projection = read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionAuthority.ts');

check('existing upstream contract owns closed judgment and 34 canonical laws',
  /REQUEST_TYPE_DERIVATION_LAW_IDS\s*=\s*\[/.test(contract) &&
  (contract.match(/^\s*'[^']+',?\s*$/gm) || []).length >= 34 &&
  /export type RequestTypeDerivationJudgment\s*=/.test(contract));
check('source inventory operation is explicitly interface-typed and preserves occurrence identity',
  /export const requestTypeDerivationSourceEvidenceInventory: RequestTypeDerivationSourceEvidenceInventoryInterface/.test(inventory) &&
  /canonicalRouteOccurrenceKey/.test(inventory) && /canonicalResourceOccurrenceKey/.test(inventory) && /canonicalRequestOccurrenceKey/.test(inventory));
check('manifest adapter delegates inventory and resolution to interface-first semantic preparation',
  /requestTypeDerivationSemanticInputPreparation\.prepare\(input\)/.test(preflight) &&
  /RequestTypeDerivationSemanticInputPreparationInterface\['prepare'\]/.test(semanticPreparation) &&
  /requestTypeDerivationSourceEvidenceInventory\.inventory\(input\)/.test(semanticPreparation) &&
  /requestTypeDerivationRequestResolutionInventory\.resolve/.test(semanticPreparation) &&
  /requestTypeDerivationResourceResolutionInventory\.resolve/.test(semanticPreparation));
check('assembler consumes supplied operations instead of deriving semantic decisions locally',
  /composition\.reasoning\.infer\(input\)/.test(assembler) && /verifier\.verify\(inference\)/.test(assembler) &&
  /composition\.decision\.decide/.test(assembler) && /authorityIntegrityGate\.evaluate/.test(assembler));
check('host loader validates the canonical contract and all required operation capabilities',
  /requestTypeDerivationContract/.test(loader) && /'infer'/.test(loader) && /'verify'/.test(loader) &&
  /'decide'/.test(loader) && /'evaluate'/.test(loader) && /'validate'/.test(loader));
check('CLI composition factory wires manifest authority to the assembled semantic pipeline',
  /assembleRequestTypeDerivationProductionPipeline\(semanticComposition\)/.test(cliFactory) &&
  /manifestComposition/.test(cliFactory) && /requestTypeDerivationPipeline: assembly\.pipeline/.test(cliFactory));
check('scan and sync require composition before source identity and source selection',
  [scan, sync].every(source => /requestTypeDerivationPipeline = composition\?\.requestTypeDerivationPipeline/.test(source) &&
    /requestTypeDerivationPipeline === undefined[\s\S]*createLaravelSourceProjectIdentity/.test(source)));
check('lowering and projection preserve non-projectable semantic outcomes as typed ADT',
  /derivation_not_projectable/.test(lowering) && /kind: 'not_projectable'/.test(projection));
check('retired solver and forbidden foundation/relation imports are absent from active path',
  !exists('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSolver.ts') &&
  !/semantic\/(foundation|relations|relation)/.test(contract + inventory + semanticPreparation + preflight + assembler + production + cliFactory + loader + scan + sync + lowering + projection));
check('missing concrete semantic kernel remains explicit and fail-closed',
  /does not ship concrete production reasoning\/verifier/.test(production) && /fails closed/.test(production) &&
  /composition_module_missing/.test(loader));

for (const item of checks) console.log(`${item.passed ? 'PASS' : 'FAIL'} ${item.label}`);
const failed = checks.filter(item => !item.passed);
console.log(`Phase 2638 CLI → manifest → upstream current-path audit: ${checks.length - failed.length}/${checks.length} assertions passed.`);
if (failed.length) process.exitCode = 1;
