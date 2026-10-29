const fs = require('node:fs');
const path = require('node:path');
let ts;
try { ts = require('typescript'); } catch { ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript'); }
const root = path.resolve(__dirname, '../..');
const checks = [];
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });
const changed = [
  'packages/core/src/types/upstream/semanticDataflowQueryPolicy.ts',
  'packages/core/src/types/upstream/highLevelSourceModel.ts',
  'packages/core/src/types/upstream/sourceProjectIdentity.ts',
  'packages/core/src/types/upstream/semanticDataflowManifestSurface.ts',
  'packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts',
  'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts',
  'packages/core/src/types/upstream/index.ts',
  'packages/core/src/index.ts',
  'packages/sdk/tests/middlewareProducer.spec.ts',
  'packages/sdk/tests/channelProducer.spec.ts',
  'packages/sdk/tests/attributeProducer.spec.ts',
  'packages/sdk/tests/dtoAstProducer.spec.ts',
];
const syntaxDiagnostics = [];
for (const relative of changed) {
  const text = read(relative);
  const source = ts.createSourceFile(relative, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  syntaxDiagnostics.push(...source.parseDiagnostics.map(d => `${relative}: ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`));
}
check('changed TypeScript files parse', syntaxDiagnostics.length === 0, syntaxDiagnostics.length ? syntaxDiagnostics.join('; ') : `${changed.length} files, 0 parse diagnostics`);
const policy = read('packages/core/src/types/upstream/semanticDataflowQueryPolicy.ts');
check('selection ADT has default and explicit states', policy.includes('semantic_dataflow_query_policy_default_selection') && policy.includes('semantic_dataflow_query_policy_explicit_selection'), 'two named policy-selection states');
check('selection ADT exposes domain continuation', /interface SemanticDataflowQueryPolicySelectionOperations\s*\{[\s\S]*?continueWith/.test(policy), 'continueWith operation declared on selection ADT');
check('selection runtime uses interface-first export', /export const semanticDataflowQueryPolicySelectionFactory:\s*SemanticDataflowQueryPolicySelectionFactoryInterface\s*=\s*Object\.freeze/.test(policy), 'factory export is explicitly annotated');
const model = read('packages/core/src/types/upstream/highLevelSourceModel.ts');
check('project identity has required policy selection', /readonly queryPolicySelection:\s*SemanticDataflowQueryPolicySelection/.test(model) && !/dataflowQueryPolicyIntent\?/.test(model), 'no optional project policy intent field');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
check('CLI canonicalization consumes policy ADT', composition.includes('input.sourceProject.queryPolicySelection.continueWith') && !composition.includes('dataflowQueryPolicyIntent === undefined'), 'no undefined-based policy branch');
const surface = read('packages/core/src/types/upstream/semanticDataflowManifestSurface.ts');
check('manifest surface consumes policy ADT', surface.includes('selection.continueWith') && !surface.includes('intent === undefined'), 'policy choice delegated to domain selection');
const builder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
check('manifest builder passes required selection', builder.includes('sourceProject.queryPolicySelection') && !builder.includes('sourceProject.dataflowQueryPolicyIntent'), 'builder does not pass optional intent');
check('upstream barrel exports policy contract', read('packages/core/src/types/upstream/index.ts').includes("export * from './semanticDataflowQueryPolicy';"), 'policy ADT is exported from upstream barrel');
check('collections utility remains empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0, 'collections.ts is 0 bytes');
const failed = checks.filter(c => !c.pass);
console.log(JSON.stringify({ phase: 2885, audit: 'explicit-query-policy-selection', passed: checks.length - failed.length, total: checks.length, checks }, null, 2));
if (failed.length) process.exitCode = 1;
