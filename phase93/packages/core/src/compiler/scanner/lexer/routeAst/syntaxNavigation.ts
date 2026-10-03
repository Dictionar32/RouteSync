import type { TokenDescriptor } from '../phpAstTypes';
import { TokenCursor } from './tokenCursor';

/** Syntax navigation is a first-class model. Parser code consumes relations, not positions. */
export type SyntaxRelation =
  | 'current'
  | 'previous'
  | 'next'
  | 'after_next'
  | 'call_open'
  | 'call_argument'
  | 'second_call_argument'
  | 'call_close'
  | 'after_call'
  | 'terminal';

export type SyntaxPresence<T> =
  | { readonly kind: 'absent' }
  | { readonly kind: 'present'; readonly value: T };

export interface SyntaxSpan {
  readonly start: TokenCursor;
  readonly end: TokenCursor;
}

export interface SyntaxNavigation {
  readonly relation: (name: SyntaxRelation) => SyntaxPresence<TokenDescriptor | TokenCursor>;
  readonly advance: () => TokenCursor;
  readonly find: (predicate: (token: TokenDescriptor, cursor: TokenCursor) => boolean) => SyntaxPresence<TokenCursor>;
  readonly spanUntil: (predicate: (token: TokenDescriptor, cursor: TokenCursor) => boolean) => SyntaxSpan;
}

export const navigationOf = (cursor: TokenCursor): SyntaxNavigation => Object.freeze({
  relation: (name) => {
    const cursorRelations: Readonly<Record<SyntaxRelation, TokenDescriptor | TokenCursor | undefined>> = {
      current: cursor.current,
      previous: cursor.previous,
      next: cursor.next,
      after_next: cursor.afterNext,
      call_open: cursor.callOpen,
      call_argument: cursor.callArgument,
      second_call_argument: cursor.secondCallArgument,
      call_close: cursor.callCloseCursor,
      after_call: cursor.afterCallCursor,
      terminal: cursor.terminal,
    };
    const value = cursorRelations[name];
    return value === undefined ? { kind: 'absent' as const } : { kind: 'present' as const, value };
  },
  advance: () => cursor.advance(),
  find: (predicate) => {
    const found = cursor.find(predicate);
    return found === undefined ? { kind: 'absent' as const } : { kind: 'present' as const, value: found };
  },
  spanUntil: (predicate) => {
    const end = cursor.untilCursor(predicate);
    return Object.freeze({ start: cursor, end });
  },
});
