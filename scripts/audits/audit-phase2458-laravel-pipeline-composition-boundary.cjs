const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const composition = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipelineDependencies.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const contract = read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts');
const modelScanner = read('packages/core/src/compiler/scanner/laravelModelScanner.ts');
const checks = [
  ['runtime pipeline no longer imports model/form-request/response/migration/DTO/query/service/middleware/provider subscanner implementations', !/from\s+["'][^"']*operations\/(?:responseScanner|migrationAstCanonical|dtoAstCanonical|queryProducer|serviceAstCanonical|middlewareAstCanonical|providerAstCanonical|schemaProducer)["']/.test(pipeline) && !/import\s*\{[^}]*\b(?:FormRequestScanner|ModelScanner)\b[^}]*\}\s*from\s*["'][^"']*operations["']/.test(pipeline)],
  ['remaining channel legacy call is explicit and not disguised as migrated', /import \{ ChannelScanner \} from ["']\.\.\/operations["']/.test(pipeline) && /ChannelScanner\.scanCanonicalAsts\(sourceProject\)/.test(pipeline)],
  ['existing dependency contract remains the single composition contract', /export interface LaravelSourceAstPipelineDependenciesInterface/.test(contract) && /export const laravelSourceAstPipelineDependencies:\s*LaravelSourceAstPipelineDependenciesInterface/.test(composition)],
  ['model scanner and composition values use existing upstream scanner interfaces', /export const laravelModelScanner:\s*LaravelModelScannerInterface/.test(modelScanner) && /modelScanner:\s*laravelModelScanner/.test(composition) && /const upstreamFormRequestScanner:\s*LaravelFormRequestScannerInterface/.test(composition) && /satisfies LaravelMigrationScannerInterface/.test(composition) && /satisfies LaravelServiceScannerInterface/.test(composition)],
  ['pipeline keeps input-bound parameterless execute contract', /readonly execute: \(\) => Promise<LaravelSourceAstProjectionJudgment<Receipt>>/.test(contract) && /async execute\(\): Promise<LaravelSourceAstProjectionJudgment<Receipt>>/.test(pipeline)],
  ['manifest composition root imports dependency value from its canonical owner', /import \{ laravelSourceAstPipelineDependencies \} from ["']\.\/laravelSourceAstPipelineDependencies["']/.test(manifestBuilder)],
  ['legacy dependency export remains compatible without re-owning composition', /export \{ laravelSourceAstPipelineDependencies \} from ["']\.\/laravelSourceAstPipelineDependencies["']/.test(pipeline)],
];
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
const failed = checks.filter(([, passed]) => !passed);
process.stdout.write(`\n${checks.length - failed.length}/${checks.length} assertions passed\n`);
process.exitCode = failed.length === 0 ? 0 : 1;
