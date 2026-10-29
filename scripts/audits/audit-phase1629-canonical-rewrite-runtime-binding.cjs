#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const executor = read('packages/core/src/types/upstream/semanticRewriteRuntimeExecutor.ts');
const constraintExecutor = read('packages/core/src/types/upstream/semanticConstraintRuntimeExecutor.ts');
const behaviorKernel = read('packages/core/src/types/upstream/semanticRelationalBehaviorKernel.ts');
const scannerFacade = read('packages/core/src/compiler/frontend/php/routeAst/semanticRewriteInterface.ts');
const resourceMapper = read('packages/core/src/compiler/scanner/operations/resource/resourceUpstreamExpressionMappings.ts');
const resourceRelations = read('packages/core/src/compiler/scanner/operations/resource/resourceSemanticMappingRelations.ts');
const index = read('packages/core/src/types/upstream/index.ts');
const productionFiles = [constraintExecutor, behaviorKernel, scannerFacade, resourceMapper, resourceRelations];
const checks = [
  ['the canonical executor is created once from the existing upstream authority', /export const semanticRewriteRuntimeExecutor:\s*SemanticRewriteRuntimeExecutorInterface\s*=\s*createSemanticRewriteRuntimeExecutor\(semanticRewriteAuthority\)/.test(executor)],
  ['constraint compatibility entry point delegates to canonical executor rather than creating another executor', /semanticRewriteRuntimeExecutor\.executeConstraints\(/.test(constraintExecutor) && !/createSemanticRewriteRuntimeExecutor\(/.test(constraintExecutor)],
  ['behavior kernel consumes canonical executor contract directly for both stages', /semanticRewriteRuntimeExecutor\.executeConstraints\(/.test(behaviorKernel) && /semanticRewriteRuntimeExecutor\.executeRelations\(/.test(behaviorKernel) && !/executeSemanticConstraintProgram/.test(behaviorKernel) && !/createSemanticRewriteRuntimeExecutor\(/.test(behaviorKernel)],
  ['scanner rewrite facade consumes canonical executor', /semanticRewriteRuntimeExecutor\.execute\(/.test(scannerFacade) && !/createSemanticRewriteRuntimeExecutor\(/.test(scannerFacade)],
  ['resource expression mapping consumes canonical executor', /resourceMappingExecutor\s*=\s*semanticRewriteRuntimeExecutor/.test(resourceMapper) && !/createSemanticRewriteRuntimeExecutor\(/.test(resourceMapper)],
  ['resource semantic mapping consumes canonical executor', /semanticMappingExecutor\s*=\s*semanticRewriteRuntimeExecutor/.test(resourceRelations) && !/createSemanticRewriteRuntimeExecutor\(/.test(resourceRelations)],
  ['canonical executor is exported through upstream index', /createSemanticRewriteRuntimeExecutor, semanticRewriteRuntimeExecutor/.test(index)],
  ['production consumers no longer instantiate the rewrite executor independently', productionFiles.every((source) => !/createSemanticRewriteRuntimeExecutor\(/.test(source))],
];
let failed = false;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  failed ||= !passed;
}
if (failed) process.exitCode = 1;
