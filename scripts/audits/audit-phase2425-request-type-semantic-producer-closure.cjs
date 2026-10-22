#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  [
    'active lowering still exposes the legacy solver path',
    read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLowering.ts').includes('requestTypeDerivationProjectionPipeline.derive'),
  ],
  [
    'authority-backed lowering requires an injected semantic pipeline',
    read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts').includes('pipeline: RequestTypeDerivationSemanticPipelineInterface'),
  ],
  [
    'semantic assembler composes reasoning, verifier, decision, and authority',
    ['composition.reasoning.infer(input)', 'composition.verifier.verify(inference)', 'composition.decision.decide(', 'composition.authority.evaluate(input, candidate)']
      .every(fragment => read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticPipelineAssembler.ts').includes(fragment)),
  ],
  [
    'legacy solver returns projection groups without proof-backed judgment',
    read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProjectionPipeline.ts').includes('aggregateRequestTypeGroups(routes, resources, context)'),
  ],
  [
    'upstream contract already defines the source-to-judgment reasoning interface',
    read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts').includes('export interface RequestTypeDerivationSemanticReasoningInterface'),
  ],
  [
    'no fake authority is claimed as the fix',
    read('PHASE2425_REQUEST_TYPE_SEMANTIC_PRODUCER_CLOSURE.md').includes('Blocked at the semantic producer boundary; no fake integration applied.'),
  ],
];

let failures = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
