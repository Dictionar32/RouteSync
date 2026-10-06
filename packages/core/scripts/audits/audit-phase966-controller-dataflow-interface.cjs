const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const repo = path.resolve(root, '../..');
const read = p => fs.readFileSync(path.join(repo, p), 'utf8');
const exists = p => fs.existsSync(path.join(repo, p));
const routeSync = read('packages/core/src/compiler/analysis/routeSyncDataflowAnalysis.ts');
const projection = read('packages/core/src/types/upstream/semanticDataflowControllerProjection.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
const authority = read('packages/core/src/types/upstream/semanticDataflowAuthority.ts');
const legacy = read('packages/core/src/compiler/scanner/lexer/routeAst/semanticDataFlowAnalyzer.ts');
const fixture = path.join(repo, 'examples/ecommerce-shop-source/app/Http/Controllers');
const files = fs.readdirSync(fixture, { recursive: true }).filter(f => String(f).endsWith('.php'));
const content = files.map(f => read(path.join('examples/ecommerce-shop-source/app/Http/Controllers', f))).join('\n');
const analysisPathExists = () => exists('packages/core/src/compiler/analysis/routeSyncDataflowAnalysis.ts');
const checks = {
  upstreamProjectionExists: exists('packages/core/src/types/upstream/semanticDataflowControllerProjection.ts'),
  upstreamProjectionExported: upstreamIndex.includes("./semanticDataflowControllerProjection"),
  productionConsumesProjection: routeSync.includes('manifest.dataflowInputs') && analysisPathExists(),
  projectionOnlySeeds: projection.includes('SemanticDataflowInputFact') && !projection.includes('relationFixedPoint') && !projection.includes('export const createSemanticDataflowJudgment'),
  projectionModelToResource: projection.includes("'resource-access'") && projection.includes("'binding'"),
  projectionResourceToResponse: projection.includes("'emitted_value'") && projection.includes("'emission'"),
  authorityOwnsFixedPoint: authority.includes('relationFixedPoint') && authority.includes('createSemanticDataflowJudgment'),
  legacySolverRemoved: !legacy.includes('relationFixedPoint(') && legacy.includes('@deprecated Compatibility facade'),
  ecommerceHasResourceReturns: /Resource::collection|new\s+\w+Resource/.test(content),
  ecommerceHasModelQueries: /::where(?:Key)?\s*\(|->where\s*\(/.test(content),
  ecommerceHasModelParameters: /function\s+\w+\s*\([^)]*\b(?:Order|ProdukItem|Payment|User)\s+\$\w+/.test(content),
};
const failed = Object.entries(checks).filter(([,v]) => !v).map(([k]) => k);
console.log(JSON.stringify({ phase: 966, checks, fixtureControllerPhpFiles: files.length, clean: failed.length === 0, failed }, null, 2));
process.exitCode = failed.length ? 1 : 0;
