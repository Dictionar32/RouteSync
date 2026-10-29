const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const valueObjects = read('packages/core/src/types/upstream/valueObjects.ts');
const adapter = read('packages/core/src/compiler/frontend/php/routeAst/phpControllerDataflowSourcePayloadEvidenceAdapter.ts');
const test = read('packages/core/src/types/upstream/__tests__/statementIndexDomainOperations.phase3025.test.ts');
const collections = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const relationFoundationPaths = [
  'packages/core/src/semantic/relations/relationMembership.ts',
  'packages/core/src/semantic/relations/relationalSequence.ts',
  'packages/core/src/semantic/relations/semanticRelations.ts',
];
const checks = {
  statementIndexIsDedicatedAdt: /export interface StatementIndex\s*\{[\s\S]*?kind: 'statement_index'[\s\S]*?ordinal: NumberValue/.test(valueObjects) && !/export type StatementIndex\s*=\s*NumberValue/.test(valueObjects),
  domainOperationsAreInterfaceBacked: /export interface StatementIndexOperationsInterface/.test(valueObjects) && /export const statementIndexOperations:\s*StatementIndexOperationsInterface\s*=\s*Object\.freeze\(/.test(valueObjects),
  sequenceOwnsInitialPosition: /first:\s*Object\.freeze\(\{ kind: 'statement_index'/.test(valueObjects),
  sequenceOwnsSuccessor: /successor:\s*\(current: StatementIndex\): StatementIndex[\s\S]*?current\.ordinal\.value \+ 1/.test(valueObjects),
  comparisonReturnsClosedJudgment: /export type StatementIndexOrder\s*=/.test(valueObjects) && /same_statement_index/.test(valueObjects) && /earlier_statement_index/.test(valueObjects) && /later_statement_index/.test(valueObjects),
  phpAdapterUsesDomainSequence: /let nextStatementIndex = statementIndexOperations\.first/.test(adapter) && /statementIndexOperations\.successor\(nextStatementIndex\)/.test(adapter) && !/let nextStatementIndex = 0|nextStatementIndex\s*\+=\s*1/.test(adapter),
  domainTestsCoverSuccessionAndOrdering: /owns statement succession/.test(test) && /explicit domain ordering judgment/.test(test),
  removedRelationFoundationsRemainAbsent: relationFoundationPaths.every(file => !exists(file)),
  collectionsSentinelRemainsOneNewlineByte: fs.existsSync(collections) && fs.statSync(collections).size === 1 && fs.readFileSync(collections).equals(Buffer.from('\n')),
};
const report = {
  phase: 3025,
  title: 'StatementIndex Domain Operations — Runtime Scanner Vertical Slice',
  scope: 'Static contract audit. Typecheck and Vitest execution require project dependencies that are absent from this workspace runtime.',
  checks,
  remainingDebt: [
    'StatementIndex ordinal still stores NumberValue as boundary/serialization evidence; consumers should avoid reading it directly except where an external representation is required.',
    'SourceSpan still exposes generic NumberValue start/end and needs a separate all-consumer migration.',
    'numberValue and truthValue remain function-valued exports and need consumer-traced interface-backed domain operations.',
    'Domain name factories still accept raw strings.',
    'The wider repository still contains primitive checks, nullish fallbacks, ternaries, reductions and parser traversal arithmetic outside this migrated slice.'
  ]
};
console.log(JSON.stringify(report, null, 2));
if (Object.values(checks).some(value => !value)) process.exitCode = 1;
