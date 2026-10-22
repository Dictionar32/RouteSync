const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts');
const upstreamPath = path.join(root, 'packages/core/src/types/upstream/controller.ts');
const canonicalPath = path.join(root, 'packages/core/src/compiler/scanner/subscanners/controller/controllerAstCanonical.ts');
const contract = fs.readFileSync(contractPath, 'utf8');
const upstream = fs.readFileSync(upstreamPath, 'utf8');
const canonical = fs.readFileSync(canonicalPath, 'utf8');
const checks = [
  ['existing ControllerActionContract remains the typed owner of semanticReturn', contract.includes('readonly semanticReturn: import(\'../../../../types/upstream/controller\').ControllerReturnSemantic;')],
  ['semanticReturn consumes the canonical controller return semantic producer', contract.includes('controllerReturnSemanticFromMethod(method, sourceFile.value.value, resourceResponse)')],
  ['response-presence knowledge is represented once as ControllerResponse ADT', contract.includes('const resourceResponse: ControllerResponse = relationGate(')],
  ['same response-presence ADT feeds controller dataflow', contract.includes('createControllerDataflowContract({') && contract.includes('classNameResolutionContextEvidence,')],
  ['semantic return no longer uses a type assertion', !/const semanticReturn[\s\S]{0,500} as import\(['"]\.\.\/\.\.\/\.\.\/\.\.\/types\/upstream\/controller['"]\)\.ControllerReturnSemantic/.test(contract)],
  ['canonical producer explicitly returns the existing ControllerReturnSemantic ADT', canonical.includes('export function controllerReturnSemanticFromMethod(method: ControllerMethodAst, file: string, response: ControllerResponse): import(\'../../../../types/upstream/controller\').ControllerReturnSemantic')],
  ['ControllerReturnSemantic remains a closed discriminated union', upstream.includes("readonly kind: 'absent'") && upstream.includes("readonly kind: 'branches'") && upstream.includes("readonly kind: 'resource'") && upstream.includes("readonly kind: 'model'") && upstream.includes("readonly kind: 'expression'")],
  ['no new relation/foundation subscanner is introduced', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/foundation')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/relation'))],
  ['existing invocation and integrated response ownership remains unchanged', fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts'), 'utf8').includes('responseSemanticPipeline.judgeIntegratedResponse(') && !fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts'), 'utf8').includes('function responseJudgmentFor')],
  ['no new parallel invocation authority is declared in the action contract', !contract.includes('InvocationSemanticAuthorityInterface')],
];
let passed = 0;
for (const [name, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (ok) passed += 1;
}
process.stdout.write(`Phase 2043: ${passed}/${checks.length} checks passed\n`);
if (passed !== checks.length) process.exitCode = 1;
