import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const sequence = readFileSync('packages/core/src/types/upstream/sequence.ts', 'utf8');
const relations = readFileSync('packages/core/src/semantic/relations/relationalSequence.ts', 'utf8');
const collections = readFileSync('packages/core/src/types/upstream/collections.ts', 'utf8');
const scanner = readFileSync('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts', 'utf8');

assert.match(sequence, /export type Sequence<T>/);
assert.match(sequence, /kind: 'empty'/);
assert.match(sequence, /kind: 'cons'/);
assert.match(relations, /export type \{ Sequence \} from '\.\.\/\.\.\/types\/upstream\/sequence'/);
assert.match(collections, /import type \{ Sequence \} from '\.\/sequence'/);
assert.match(scanner, /import type \{ Sequence \} from '\.\.\/\.\.\/\.\.\/types\/upstream\/sequence'/);
assert.match(scanner, /semantic\/relations/); // explicitly guards against falsely claiming full migration
assert.match(scanner, /operations\/controller/); // explicitly guards against falsely claiming executor-only status
process.stdout.write('Phase 2077 static contract audit: 8 assertions passed; remaining relation/subscanner dependencies are intentionally reported.\n');
