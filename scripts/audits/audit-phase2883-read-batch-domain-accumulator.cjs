const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/phpSourceFrontendInterface.ts'), 'utf8');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'), 'utf8');
const checks = [
  ['source-read batch factory is interface-first', /export const phpSourceDocumentReadBatchFactory:\s*PhpSourceDocumentReadBatchFactoryInterface\s*=\s*Object\.freeze/.test(source)],
  ['batch aggregation does not use Array.reduce', !/results\.reduce\(/.test(source)],
  ['batch accumulation is domain-specific, not a generic collection ADT', /interface PhpSourceDocumentReadBatchAccumulator/.test(source) && /acceptComplete/.test(source) && /acceptBlocked/.test(source)],
  ['first blocker transitions the accumulator to blocked evidence', /acceptBlocked: blocked => blockedReadBatchAccumulator\(documents, Object\.freeze\(\[blocked\]\)\)/.test(source)],
  ['blocked accumulator preserves subsequent blockers', /acceptBlocked: blocked => blockedReadBatchAccumulator\(partialDocuments, Object\.freeze\(\[\.\.\.blockedReads, blocked\]\)/.test(source)],
  ['terminal judgment exposes continueWith', /continueWith: <Result>\(handlers: PhpSourceDocumentReadBatchHandlers<Result>\): Result => handlers\.onComplete\(evidence\)/.test(source) && /handlers\.onBlocked\(evidence\)/.test(source)],
  ['collections utility remains empty', collections.trim().length === 0],
];
for (const [label, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'} ${label}`);
const failed = checks.filter(([, pass]) => !pass).length;
console.log(`Phase2883 source-read batch domain accumulator: ${checks.length - failed}/${checks.length} checks passed`);
process.exitCode = failed ? 1 : 0;
