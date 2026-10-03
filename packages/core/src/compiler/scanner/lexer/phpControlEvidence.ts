import { relationEqual } from '../../../semantic/kernel/semanticRelations';
import { relationFirstOption, relationOptionFold, type RelationOption } from '../../../semantic/kernel/relationalSequence';
import type { TokenDescriptor } from './PhpAst';

/** Raw syntax spellings are confined to lexer evidence. Semantic dispatch sees only abstract relations. */
export type PhpControlEvidence =
  | 'conditional'
  | 'collection_iteration'
  | 'counted_iteration'
  | 'pretest_iteration'
  | 'selection_dispatch'
  | 'exception_guard'
  | 'exception_raise';

const CONTROL_KEYWORDS: readonly (readonly [string, PhpControlEvidence])[] = Object.freeze([
  ['if', 'conditional'],
  ['foreach', 'collection_iteration'],
  ['for', 'counted_iteration'],
  ['while', 'pretest_iteration'],
  ['switch', 'selection_dispatch'],
  ['try', 'exception_guard'],
  ['throw', 'exception_raise'],
]);

export const phpControlEvidence = (token: TokenDescriptor): RelationOption<PhpControlEvidence> =>
  relationOptionFold(
    relationFirstOption(CONTROL_KEYWORDS, entry => relationEqual(entry[0], token.value)),
    () => ({ kind: 'none' }),
    entry => ({ kind: 'some', value: entry[1] }),
  );
