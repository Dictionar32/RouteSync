const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['existing DTO inventory producer', read('packages/core/src/compiler/scanner/operations/dtoAstCanonical.ts').includes('export async function scanDtoAsts(sourceProject: SourceProjectIdentity): Promise<readonly DtoAst[]>')],
  ['source AST pipeline publishes DTO ASTs', read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts').includes('dtos: { kind: "dto_asts", items: scanned(dtos) }')],
  ['controller scan occurs before DTO scan', read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts').indexOf('laravelControllerScanner.scan(') < read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts').indexOf('scanDtoAsts(sourceProject)')],
  ['controller scan input lacks DTO inventory', !read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts').slice(read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts').indexOf('export interface LaravelControllerScanInput'), read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts').indexOf('/** Stable upstream view')).includes('dtoInventory')],
  ['integrated response input only receives controller declaration evidence', read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts').slice(read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts').indexOf('export interface LaravelControllerResponseIntegratedJudgmentInput'), read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts').indexOf('/** Closed result of composing')).includes('declarationEvidence: ControllerDeclarationEvidence')],
  ['binding requires exact invocation source', read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts').includes("readonly completeMeaning: 'non-empty-evidence-set-and-every-item-is-bound-to-the-exact-invocation-source-subject'")],
  ['legacy resolver remains active', read('packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionContract.ts').includes('resolveResponse(')],
  ['no new relation/foundation/subscanner proposed', read('packages/core/src/types/upstream/docs/PHASE2167-INTERFACE-FIRST-DTO-INVENTORY-ORDER-AND-BINDING-TRACE.md').includes('No new `relation/foundation` layer.')],
];
for (const [name, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, pass]) => !pass)) process.exitCode = 1;
