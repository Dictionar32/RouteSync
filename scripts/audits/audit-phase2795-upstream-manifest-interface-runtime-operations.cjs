const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const checks = [];
const check = (name, pass) => checks.push({ name, pass: Boolean(pass) });
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const upstream = 'packages/core/src/types/upstream/';
const surfacePath = upstream + 'semanticDataflowManifestSurface.ts';
const surface = read(surfacePath);
const builder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const scanner = read('packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts');
const cliScan = read('packages/cli/src/commands/scan.ts');
const cliSync = read('packages/cli/src/commands/sync.ts');
const builderContract = read(upstream + 'manifestBuilderInterface.ts');
const pipelineContract = read(upstream + 'laravelSourceAstPipelineInterface.ts');
const routeOperationContract = read('packages/core/src/compiler/scanner/orchestrator/RouteSyncManifestScanOperationInterface.ts');

check('manifest dataflow surface is exported as interface-typed frozen runtime object', /export const semanticDataflowManifestSurface:\s*SemanticDataflowManifestSurfaceInterface\s*=\s*Object\.freeze\(/.test(surface));
check('manifest surface exports no free function declarations or inferred arrow operation aliases', !/^export\s+function\s+/m.test(surface) && !/^export\s+const\s+(?:createSemanticDataflowManifestSurface|semanticDataflowInputsFromSourceModel|semanticDataflowJudgmentsFromInputs)\s*=\s*\(/m.test(surface));
check('manifest surface reuses existing producer and reasoning authority contracts', /semanticDataflowInputProducer\.sourceModelSeeds\(sourceModel\)/.test(surface) && /judgmentsFromInputs\(inputs, semanticDataflowReasoningAuthority\)/.test(surface));
check('manifest surface contract remains the owning operation boundary', /interface SemanticDataflowManifestSurfaceInterface/.test(surface) && /readonly inputsFromSourceModel:/.test(surface) && /readonly judgmentsFromInputs:/.test(surface) && /readonly queryPolicyContractsFromJudgments:/.test(surface));
check('manifest builder consumes the existing surface object contract', /semanticDataflowManifestSurface/.test(builder) && /inputsFromSourceModel\(/.test(builder) && /judgmentsFromInputs\(/.test(builder));
check('source AST pipeline is already wired as a typed factory operation object', /export const laravelSourceAstPipelineFactory:\s*LaravelSourceAstPipelineFactoryInterface\s*=\s*Object\.freeze\(/.test(pipeline));
check('manifest preparation is already wired through its existing preparation contract', /export const manifestBuilderOperationPreparation:\s*ManifestBuilderOperationPreparationInterface\s*=\s*Object\.freeze\(/.test(builder));
check('CLI scan and sync call the injected manifest scan operation', /manifestScanOperation\.scan\(/.test(cliScan) && /manifestScanOperation\.scan\(/.test(cliSync));
check('scanner facade follows the manifest builder ADT continuation and preserves blocked outcomes', /judgment\.continueWith\(/.test(scanner) && /onBlocked:/.test(scanner) && /onComplete:/.test(scanner) && /kind: 'route_sync_manifest_flow_complete'/.test(scanner));
check('manifest builder contract retains explicit complete and blocked outcome arms', /ManifestBuilderCompleteJudgment \| ManifestBuilderBlockedJudgment/.test(builderContract));
check('source-AST pipeline contract retains explicit complete and blocked projection judgments', /laravel_source_ast_projection_complete/.test(pipelineContract) && /laravel_source_ast_projection_blocked/.test(pipelineContract));
check('scanner operation contract retains explicit flow complete plus builder-blocked ADT', /ManifestBuilderBlockedJudgment/.test(routeOperationContract) && /RouteSyncManifestFlowCompleteJudgment/.test(routeOperationContract));
check('legacy manifest surface factory and forwarding aliases have no remaining TS consumers', !/createSemanticDataflowManifestSurface|semanticDataflowInputsFromSourceModel|semanticDataflowJudgmentsFromInputs/.test([
  ...['packages/core/src','packages/cli/src'].flatMap(base => {
    const files = [];
    const walk = dir => { for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) { const rel = path.join(dir, entry.name); if (entry.isDirectory()) walk(rel); else if (entry.isFile() && rel.endsWith('.ts') && rel !== surfacePath) files.push(read(rel)); } };
    walk(base);
    return files;
  }),
].join('\n')));
check('upstream collections remains exactly empty', fs.statSync(path.join(root, upstream, 'collections.ts')).size === 0);
const phase2794 = read(upstream + 'PHASE2794_UPSTREAM_CONTRACT_RUNTIME_SCANNER_AUDIT.md');
check('CLI-to-manifest trace and contract-first policy are carried forward', /commands\/scan\.ts \/ sync\.ts/.test(phase2794) && /inspect `packages\/core\/src\/types\/upstream` before introducing|inspect `packages\/core\/src\/types\/upstream` and/i.test(phase2794));

for (const result of checks) console.log(`${result.pass ? 'PASS' : 'FAIL'} ${result.name}`);
console.log(`\n${checks.filter(item => item.pass).length}/${checks.length} checks passed`);
if (checks.some(item => !item.pass)) process.exitCode = 1;
