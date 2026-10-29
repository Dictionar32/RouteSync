const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const checks = [];
const check = (name, passed) => checks.push({ name, passed: Boolean(passed) });

const contract = read('packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts');
const executor = read('packages/core/src/types/upstream/invocationSemanticRuntimeExecutor.ts');
const routeComposition = read('packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts');
const generator = read('packages/cli/src/generators/ManifestGenerator.ts');
const serializer = read('packages/cli/src/generators/ManifestSerializer.ts');
const lowerer = read('packages/core/src/compiler/scanner/wiring/routeManifestLowerer.ts');
const upstreamManifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const channelModel = read('packages/core/src/types/upstream/channel.ts');
const channelProducer = read('packages/core/src/compiler/scanner/operations/channelProducer.ts');

check('factory contract is an explicit upstream domain interface', /interface InvocationSemanticRuntimeExecutorFactoryInterface/.test(contract));
check('factory runtime export is interface-typed and frozen', /export const invocationSemanticRuntimeExecutorFactory:\s*InvocationSemanticRuntimeExecutorFactoryInterface\s*=\s*Object\.freeze\(/.test(executor));
check('factory operation creates executor from exact authority instances', /create:\s*\([\s\S]*?authority\.analyze\(input\)[\s\S]*?batchAuthority\.analyze\(knowledge\)/.test(executor));
check('production singleton uses canonical factory operation', /invocationSemanticRuntimeExecutorFactory\.create\(invocationSemanticAuthority, semanticInterproceduralDataFlowAuthority\)/.test(executor));
check('legacy parameterized factory symbol is absent from production implementation', !/createInvocationSemanticRuntimeExecutor/.test(executor));
check('route composition continues schema evidence through domain operations', /continueToRouteSchemaEvidence\(\)/.test(routeComposition) && /schemaEvidence\.continueWith\(/.test(routeComposition));
check('manifest generator uses interface-typed runtime operations', /export const manifestGeneratorOperations:\s*ManifestGeneratorOperationsInterface\s*=\s*Object\.freeze\(/.test(generator));
check('manifest serializer preserves route binding as one canonical value', /binding:\s*route\.binding/.test(serializer) && /readonly binding:\s*RouteSemanticFlow\['binding'\]/.test(serializer));
check('channel kind ADT owns an explicit domain continuation', /interface ChannelKindHandlers<Result>/.test(channelModel) && /readonly continueWith: <Result>/.test(channelModel) && /export const channelKindFactory:\s*ChannelKindFactoryInterface\s*=\s*Object\.freeze\(/.test(channelModel));
check('route lowerer no longer re-derives channel semantics with primitive equality', /channel\.semantic\.channelKind\.continueWith\(/.test(lowerer) && !/requiresAuthentication\.kind\s*===/.test(lowerer) && !/kind\s*===\s*'presence'/.test(lowerer));
check('channel producer no longer imports deleted relation foundation modules', !/semantic\/relations\/(?:relationMembership|relationalSequence|semanticRelations)/.test(channelProducer));
check('channel definition has one canonical channel-kind owner without duplicated authentication data', /const channelKind = channelKindFactory\.fromSourceKind\(input\.channel\.kind\)/.test(channelProducer) && !/requiresAuthentication\s*:/.test(channelProducer) && !/export type ChannelDefinition = \{[\s\S]*?readonly requiresAuthentication:/.test(channelModel));
check('route lowerer is interface-first and lowers the completed upstream manifest', /export const routeSyncManifestLoweringOperations:\s*RouteSyncManifestLoweringOperationsInterface\s*=\s*Object\.freeze\(/.test(lowerer) && /routeFlows:\s*\(manifest: RouteSyncManifest\)/.test(lowerer));
check('upstream manifest builder is a typed preparation operation with outcome continuation', /export const manifestBuilderOperationPreparation:\s*ManifestBuilderOperationPreparationInterface\s*=\s*Object\.freeze\(/.test(upstreamManifestBuilder) && /projection\.continueToManifestBuild\(/.test(upstreamManifestBuilder) && /completeLaravelSourceModelBuildResult\.continueToManifestBuild\(/.test(upstreamManifestBuilder));
check('upstream collections remains intentionally empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0);
check('removed relation foundation modules remain absent', !exists('packages/core/src/semantic/relations/relationMembership.ts') && !exists('packages/core/src/semantic/relations/relationalSequence.ts') && !exists('packages/core/src/semantic/relations/semanticRelations.ts'));

const runtimeFiles = [
  'packages/core/src/types/upstream/invocationSemanticRuntimeExecutor.ts',
  'packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts',
  'packages/core/src/compiler/scanner/wiring/routeManifestLowerer.ts',
  'packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts',
  'packages/core/src/types/upstream/channel.ts',
  'packages/core/src/compiler/scanner/operations/channelProducer.ts',
  'packages/cli/src/generators/ManifestGenerator.ts',
  'packages/cli/src/generators/ManifestSerializer.ts',
];
const runtimeText = runtimeFiles.map(read).join('\n');
check('scoped runtime trace contains no export function declaration', !/\bexport\s+(?:async\s+)?function\s+[A-Za-z_$][\w$]*\s*\(/.test(runtimeText));

const result = {
  phase: 3001,
  title: 'Interface-First Typed Runtime Executor and Upstream-to-Manifest Trace',
  checksPassed: checks.filter(item => item.passed).length,
  checksTotal: checks.length,
  status: checks.every(item => item.passed) ? 'passed' : 'failed',
  scope: runtimeFiles,
  checks,
  caveat: 'Structural source audit only; not a substitute for TypeScript typecheck, Vitest, or end-to-end Laravel CLI execution.',
};
const output = path.join(root, 'PHASE3001_AUDIT.json');
fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
for (const item of checks) process.stdout.write(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}\n`);
process.stdout.write(`\n${result.checksPassed}/${result.checksTotal} checks passed\n`);
if (result.status !== 'passed') process.exitCode = 1;
