const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const checks = [];
const check = (name, passed, detail = '') => checks.push({ name, passed: Boolean(passed), detail });

const authorityPath = 'packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentAuthority.ts';
const authority = read(authorityPath);
const contract = read('packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentInterface.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const actionContract = read('packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionContract.ts');
const cliScan = read('packages/cli/src/commands/scan.ts');
const cliOperation = read('packages/cli/src/manifestScanOperationInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const serializer = read('packages/cli/src/generators/ManifestSerializer.ts');
const packageJson = JSON.parse(read('package.json'));

check('inline-schema ADT uses domain-specific operation instead of generic callback', /deriveFormRequestSchema:\s*\(fields: readonly RequestField\[\]\) => ControllerActionSchemaDerivation/.test(authority) && !/continueWith\s*:\s*<Result>/.test(authority));
check('empty inline schema derives FormRequest-only schema', /kind: 'empty_inline_schema'[\s\S]*?deriveFormRequestSchema:\s*formRequestOnlyDerivation/.test(authority));
check('present inline schema derives combined FormRequest and inline schema', /kind: 'present_inline_schema'[\s\S]*?deriveFormRequestSchema:\s*\(fields: readonly RequestField\[\]\) => combinedFormRequestDerivation\(fields, schema\)/.test(authority));
check('schema merge policy remains upstream-owned', /inlineSchemaEvidenceJudgment\(inlineSchema\)\.deriveFormRequestSchema\(fields\)/.test(authority) && /inlineSchema\.validationEntries/.test(authority));
check('source identity and inline validation provenance remain published', /sourceIdentity: input\.sourceIdentity/.test(authority) && /inlineValidationEntries: Object\.freeze\(\[\.\.\.input\.inlineValidationEntries\]\)/.test(authority));
check('runtime authority is explicitly interface-typed and frozen', /export const controllerActionSchemaSemanticJudgmentAuthority:\s*ControllerActionSchemaSemanticJudgmentAuthorityInterface<SourceFile>\s*=\s*Object\.freeze/.test(authority));
check('authority adds no exported function declaration', !/^export\s+(?:async\s+)?function\s+/m.test(authority));
check('scanner runtime invokes the injected schema authority', /schemaSemanticJudgmentAuthority\.judge\(/.test(wiring) && /schemaSemanticJudgmentAuthority:\s*controllerActionSchemaSemanticJudgmentAuthority/.test(wiring));
check('action contract projects the completed upstream schema judgment', /schemaSemanticJudgment:\s*context\.schemaSemanticJudgment/.test(actionContract) && /schema:\s*context\.schemaSemanticJudgment\.derivation\.schema/.test(actionContract));
check('canonical controller publication carries the derived schema', /schema:\s*schemaSemanticJudgment\.derivation\.schema/.test(wiring));
check('CLI scan uses its typed manifest scan operation', /manifestScanOperation\.scan\(/.test(cliScan) && /export interface RouteSyncCliManifestScanOperationInterface/.test(cliOperation));
check('CLI composition wires the invocation semantic pipeline and inventory', /sourceInvocationPipeline:\s*phpSourceInvocationSemanticPipelineOperations/.test(composition) && /inventoryAuthority:\s*laravelControllerInvocationSemanticJudgmentInventoryAuthority/.test(composition));
check('manifest serializer reads the final request-body schema', /schema:\s*serialized\.request\.body\.schema/.test(serializer));
check('relation foundations remain absent', !exists('packages/core/src/semantic/relations/relationMembership.ts') && !exists('packages/core/src/semantic/relations/relationalSequence.ts') && !exists('packages/core/src/semantic/relations/semanticRelations.ts'));
check('Phase 2991 audit command is registered', packageJson.scripts?.['audit:phase2991-schema-evidence-domain-operations'] === 'node scripts/audits/audit-phase2991-schema-evidence-domain-operations.cjs');

const passed = checks.filter(item => item.passed).length;
const result = {
  phase: 2991,
  scope: 'schema evidence domain operation and source-to-CLI manifest boundary trace',
  passed,
  total: checks.length,
  status: passed === checks.length ? 'structural checks passed; not a full build or end-to-end provenance proof' : 'structural audit has failures',
  checks,
};
fs.writeFileSync(path.join(root, 'PHASE2991_SCHEMA_EVIDENCE_DOMAIN_OPERATIONS_AUDIT.json'), `${JSON.stringify(result, null, 2)}\n`);
for (const item of checks) process.stdout.write(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}${item.detail ? ` — ${item.detail}` : ''}\n`);
process.stdout.write(`\nPhase 2991 audit: ${passed}/${checks.length} passed\n`);
if (passed !== checks.length) process.exitCode = 1;
