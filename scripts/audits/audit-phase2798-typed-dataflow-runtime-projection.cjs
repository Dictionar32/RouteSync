'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
let passed = 0;
function check(name, condition) { if (!condition) { console.error(`FAIL ${name}`); process.exitCode = 1; return; } passed++; console.log(`PASS ${name}`); }
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
const pipeline = read('packages/core/src/compiler/analysis/semanticDataflowPipeline.ts');
const analysis = read('packages/core/src/compiler/analysis/routeSyncDataflowAnalysis.ts');
const judgment = read('packages/core/src/types/upstream/semanticDataflow.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
const manifest = read('packages/core/src/types/upstream/semanticDataflowManifestSurface.ts');
check('closed judgment projection declares named operation interface', /interface ClosedSemanticDataflowJudgmentProjectionInterface/.test(pipeline));
check('runtime projection export is interface-first and frozen', /export const closedSemanticDataflowJudgmentProjection:\s*ClosedSemanticDataflowJudgmentProjectionInterface\s*=\s*Object\.freeze\(/.test(pipeline));
check('projection has explicit typed project operation', /project: \(\s*input: SemanticDataflowJudgment,\s*runtime: SemanticDataflowRuntimeBoundary,\s*\): SemanticDataflowAnalysisResult/.test(pipeline));
check('dataflow runtime consumes named projection object', /closedSemanticDataflowJudgmentProjection\.project\(/.test(analysis) && !/projectClosedSemanticDataflowJudgment/.test(analysis));
check('projection only projects closed judgments and does not create semantic closure', /runtime\.project\(input\)/.test(pipeline) && !/semanticDataflowReasoningAuthority|semanticDataflowClosureOperation/.test(pipeline.split('export const closedSemanticDataflowJudgmentProjection')[1] || ''));
check('semantic judgment remains an existing upstream domain contract', /SemanticDataflowJudgment/.test(judgment));
check('manifest surface continues to reuse existing upstream interface', /SemanticDataflowManifestSurfaceInterface/.test(manifest) && /export const semanticDataflowManifestSurface:\s*SemanticDataflowManifestSurfaceInterface\s*=\s*Object\.freeze\(/.test(manifest));
check('collections.ts remains exactly empty', collections.length === 0);
console.log(`${passed}/8 passed`);
if (passed !== 8) process.exitCode = 1;
