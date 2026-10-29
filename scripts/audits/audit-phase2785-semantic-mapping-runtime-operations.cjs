const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
let passed = 0;
let failed = 0;
const check = (name, condition) => {
  if (condition) {
    passed += 1;
    process.stdout.write(`PASS ${name}\n`);
  } else {
    failed += 1;
    process.stderr.write(`FAIL ${name}\n`);
  }
};

const mapping = read('packages/core/src/types/upstream/semanticMapping.ts');
const derivation = read('packages/core/src/compiler/semantic/request-type-derivation/semanticMappingContractDerivation.ts');
const barrel = read('packages/core/src/index.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
const builder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const packageJson = JSON.parse(read('package.json'));

check('upstream collections contract remains intentionally empty', collections.length === 0);
check('semantic mapper operations have an explicit interface', /export interface SemanticMappingRuntimeOperationsInterface/.test(mapping));
check('read operation input and output are explicitly typed', /readonly readMapperFromResource:\s*\(\s*resource: ResourceName,[\s\S]*?\) => SemanticReadMapperContract/.test(mapping));
check('write operation input and output are explicitly typed', /readonly writeMapperFromAction:\s*\(\s*resource: ResourceName,[\s\S]*?\) => SemanticWriteMapperContract/.test(mapping));
check('public operation is a typed frozen object', /export const semanticMappingRuntimeOperations:\s*SemanticMappingRuntimeOperationsInterface\s*=\s*Object\.freeze\(/.test(mapping));
check('upstream module no longer exports legacy function declarations', !/^export\s+(?:async\s+)?function\s+semantic(?:ReadMapperFromResource|WriteMapperFromAction)\b/m.test(mapping));
check('legacy implementations are private typed arrow operations', /const semanticReadMapperFromResourceImpl\s*=\s*\([\s\S]*?\): SemanticReadMapperContract =>/.test(mapping) && /const semanticWriteMapperFromActionImpl\s*=\s*\([\s\S]*?\): SemanticWriteMapperContract =>/.test(mapping));
check('semantic derivation consumes the runtime operation object', /semanticMappingRuntimeOperations\.readMapperFromResource\(/.test(derivation) && /semanticMappingRuntimeOperations\.writeMapperFromAction\(/.test(derivation));
check('semantic derivation return types derive from operation signatures', /ReturnType<typeof semanticMappingRuntimeOperations\.readMapperFromResource>/.test(derivation) && /ReturnType<typeof semanticMappingRuntimeOperations\.writeMapperFromAction>/.test(derivation));
check('public barrel exports operation and interface', /export \{ semanticMappingRuntimeOperations, type SemanticMappingRuntimeOperationsInterface \}/.test(barrel));
check('manifest builder still publishes mapper semantics only after source model completion', /sourceModelBuilder\.build/.test(builder) && /resourceGroupCapabilitiesAlgebra\.compose\(completeAst\.ast\.routeFlows\)/.test(builder));
check('no new reasoning primitive was introduced', !/newSemanticReasoningPrimitive|SemanticMappingReasoningPrimitive/.test(mapping));
check('audit command is registered', packageJson.scripts?.['audit:phase2785-semantic-mapping-runtime-operations'] === 'node scripts/audits/audit-phase2785-semantic-mapping-runtime-operations.cjs');

process.stdout.write(`\nPhase 2785 audit: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exitCode = 1;
