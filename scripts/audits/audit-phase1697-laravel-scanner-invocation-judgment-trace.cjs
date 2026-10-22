const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['controller interface exposes source-backed FormRequest evidence', /formRequests:\s*readonly FormRequestSource\[\]/.test(read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts'))],
  ['controller interface imports the domain evidence type', /import type \{ FormRequestSource \} from '\.\.\/domain\/request'/.test(read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts'))],
  ['route runtime still consumes legacy controller index (must be adapted, not cast)', /RelationIndex<string, RelationIndex<string, ControllerActionInfo>>/.test(read('packages/core/src/compiler/scanner/subscanners/RouteScanner.ts'))],
  ['resource runtime still consumes model symbol table', /modelSymbolTable: ModelSymbolTable/.test(read('packages/core/src/compiler/scanner/subscanners/ResourceScanner.ts'))],
  ['resource runtime still consumes controller resource dataflow', /ControllerResourceDataflow/.test(read('packages/core/src/compiler/scanner/subscanners/ResourceScanner.ts'))],
  ['invocation semantics go through canonical pipeline', /invocationSemanticPipeline\.analyzeKnowledge/.test(read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts'))],
  ['source-AST pipeline remains orchestration-only target (no subscanner interface wiring claimed)', /RouteScanner\.scanCanonicalBundle/.test(read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts'))],
  ['no forbidden semantic/foundation dependency added to new Laravel scanner contracts', !/semantic\/foundation/.test(['laravelRouteScannerInterface.ts','laravelControllerScannerInterface.ts','laravelModelScannerInterface.ts','laravelFormRequestScannerInterface.ts','laravelResourceScannerInterface.ts','laravelChannelScannerInterface.ts'].map(f => read(`packages/core/src/types/upstream/${f}`)).join('\n'))],
];
let failed = false;
for (const [label, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`);
  failed ||= !ok;
}
process.stdout.write(`${checks.filter(([, ok]) => ok).length}/${checks.length} checks passed\n`);
process.exitCode = failed ? 1 : 0;
