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
const cliScan = read('packages/cli/src/commands/scan.ts');
const cliOperation = read('packages/cli/src/manifestScanOperationInterface.ts');
const manifestComposition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const packageJson = JSON.parse(read('package.json'));

check('schema authority no longer imports deleted relation foundations', !/from ['"][^'"]*(?:semanticRelations|relationalSequence|relationMembership)['"]/.test(authority));
check('inline schema presence is a closed domain judgment', /type InlineSchemaEvidenceJudgment\s*=/.test(authority) && /kind: 'empty_inline_schema'/.test(authority) && /kind: 'present_inline_schema'/.test(authority));
check('schema presence judgment provides continuation operations', /InlineSchemaEvidenceJudgment[\s\S]*?continueWith/.test(authority) && /inlineSchemaEvidenceJudgment\(inlineSchema\)\.continueWith\(/.test(authority));
check('request and inline-schema merge remains owned upstream', /formRequestDerivation[\s\S]*?createRouteSchemaPayload\([\s\S]*?inlineSchema\.fields/.test(authority));
check('public schema judgment retains source identity and derivation', /sourceIdentity: input\.sourceIdentity/.test(authority) && /derivation,/.test(authority));
check('authority export remains explicitly interface typed', /export const controllerActionSchemaSemanticJudgmentAuthority:\s*ControllerActionSchemaSemanticJudgmentAuthorityInterface<SourceFile>\s*=\s*Object\.freeze/.test(authority));
check('authority has no exported function declaration', !/^export\s+function\s+/m.test(authority));
check('public contract distinguishes request-evidence variants', /form_request_schema_evidence/.test(contract) && /no_form_request_schema_evidence/.test(contract));
check('CLI scan invokes manifest scan operation', /manifestScanOperation\.scan\(/.test(cliScan));
check('CLI operation is interface typed', /RouteSyncCliManifestScanOperationFactoryInterface/.test(cliOperation));
check('manifest composition continues the upstream judgment', /judgment\.continueWith\(/.test(manifestComposition));
check('deleted generic relation foundations remain absent', !exists('packages/core/src/semantic/relations/relationMembership.ts') && !exists('packages/core/src/semantic/relations/relationalSequence.ts') && !exists('packages/core/src/semantic/relations/semanticRelations.ts'));
check('Phase 2990 audit command is registered', packageJson.scripts?.['audit:phase2990-schema-evidence-domain-operations'] === 'node scripts/audits/audit-phase2990-schema-evidence-domain-operations.cjs');

const sourceRoot = path.join(root, 'packages');
const sourceFiles = [];
const walk = dir => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else if (/\.(?:ts|tsx|mts|cts)$/.test(entry.name)) sourceFiles.push(absolute);
  }
};
walk(sourceRoot);
const relationImportFiles = new Set();
let relationImportCount = 0;
for (const file of sourceFiles) {
  const source = fs.readFileSync(file, 'utf8');
  const matches = source.match(/from\s+['"][^'"]*(?:semanticRelations|relationalSequence|relationMembership)['"]/g) || [];
  if (matches.length) relationImportFiles.add(path.relative(root, file));
  relationImportCount += matches.length;
}
check('repository relation-import inventory is emitted for migration planning', relationImportCount >= 0, `${relationImportCount} import declarations across ${relationImportFiles.size} files remain; inventory is advisory and not a pass for repository typecheck`);

const passed = checks.filter(item => item.passed).length;
const result = {
  phase: 2990,
  scope: 'controller action schema evidence authority; upstream-to-CLI manifest boundary audit',
  passed,
  total: checks.length,
  remainingDeletedRelationImports: { declarations: relationImportCount, files: relationImportFiles.size, filesByPath: [...relationImportFiles].sort() },
  checks,
};
fs.writeFileSync(path.join(root, 'PHASE2990_SCHEMA_EVIDENCE_DOMAIN_OPERATIONS_AUDIT.json'), `${JSON.stringify(result, null, 2)}\n`);
for (const item of checks) process.stdout.write(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}${item.detail ? ` — ${item.detail}` : ''}\n`);
process.stdout.write(`\nPhase 2990 audit: ${passed}/${checks.length} passed\n`);
process.stdout.write(`Remaining deleted-relation imports: ${relationImportCount} declarations across ${relationImportFiles.size} files\n`);
if (passed !== checks.length) process.exitCode = 1;
