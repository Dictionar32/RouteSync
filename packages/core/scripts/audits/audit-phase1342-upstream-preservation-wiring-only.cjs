#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../../..');
const restoredUpstream = [
  'packages/core/src/types/upstream/sourceBoundary.ts',
  'packages/core/src/compiler/scanner/upstream/upstreamManifestBuilder.ts',
  'packages/core/src/compiler/scanner/upstream/semanticDataflowInputAdapter.ts',
  'packages/core/src/compiler/scanner/upstream/routeManifestLowerer.ts',
  'packages/core/src/types/upstream/astSemanticStageTransition.ts',
  'packages/core/src/types/upstream/routeNames.ts',
  'packages/core/src/types/upstream/astSemanticAuthorityPipeline.ts',
  'packages/core/src/types/upstream/astSemanticStagePreservation.ts',
  'packages/core/src/types/upstream/astSemanticStageContract.ts',
];
let failures = 0;
for (const relative of restoredUpstream) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file) || fs.statSync(file).size === 0) {
    console.error(`FAIL upstream source must remain intact: ${relative}`);
    failures++;
  } else console.log(`PASS upstream source preserved: ${relative}`);
}
const wiringRoot = path.join(root, 'packages/core/src/compiler/scanner/wiring');
const emptyProductionWiring = [];
function visit(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) visit(full);
    else if (/\.tsx?$/.test(entry.name) && !/\.test\.[cm]?tsx?$/.test(entry.name) && fs.statSync(full).size === 0) {
      emptyProductionWiring.push(path.relative(root, full));
    }
  }
}
if (fs.existsSync(wiringRoot)) visit(wiringRoot);
if (emptyProductionWiring.length) {
  for (const file of emptyProductionWiring) console.error(`FAIL empty wiring source: ${file}`);
  failures += emptyProductionWiring.length;
} else console.log('PASS scanner wiring source files are not emptied');
if (failures) process.exit(1);
console.log(`PASS Phase 1342 corrective audit (${restoredUpstream.length} upstream files preserved)`);
