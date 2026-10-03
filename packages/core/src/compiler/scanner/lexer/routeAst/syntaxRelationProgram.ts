import type { TokenDescriptor } from '../phpAstTypes';
import { absent, present, type Presence } from '../../../../types/upstream/presence';
import { relationGate, relationProject, relationSelect, relationOptionFold, relationNone, relationSome, type RelationOption } from '../../../../semantic/kernel/relationalSequence';
import { relationEqual } from '../../../../semantic/kernel/semanticRelations';
import type { TokenCursor } from '../../../../semantic/kernel/syntax/relationalSyntaxCursor';

/**
 * Declarative syntax relation IR.
 * Matching and repetition are relation programs; execution only interprets
 * their semantic relations and produces presence facts.
 */
export type SyntaxMatch<T> = Presence<T>;
export type SyntaxMatcher<T> = (cursor: TokenCursor) => SyntaxMatch<T>;

export type SyntaxRelationName = 'token' | 'sequence' | 'repeat' | 'until' | 'delimited';

export interface SyntaxRelationProgram<T> {
  readonly relation: SyntaxRelationName;
  readonly children: readonly SyntaxRelationProgram<unknown>[];
  readonly matcher: RelationOption<SyntaxMatcher<T>>;
  readonly open: RelationOption<SyntaxMatcher<TokenDescriptor>>;
  readonly close: RelationOption<SyntaxMatcher<TokenDescriptor>>;
}

export interface SyntaxRelationPattern<T> {
  readonly program: SyntaxRelationProgram<T>;
  readonly match: SyntaxMatcher<T>;
}

const invokePresence = <T>(
  value: Presence<T>,
  visitor: { readonly absent: () => T | Presence<T>; readonly present: (entry: T) => T | Presence<T> },
): T | Presence<T> => {
  const entries: Readonly<Record<'absent' | 'present', () => T | Presence<T>>> = {
    absent: visitor.absent,
    present: () => visitor.present((value as Extract<Presence<T>, { readonly kind: 'present' }>).value),
  };
  return entries[value.kind]();
};

const firstChild = <T>(program: SyntaxRelationProgram<T>): RelationOption<SyntaxRelationProgram<T>> =>
  relationGate(program.children.length > 0,
    () => relationSome(program.children[0] as SyntaxRelationProgram<T>),
    () => relationNone(),
  );

const executeToken = <T>(program: SyntaxRelationProgram<T>, cursor: TokenCursor): SyntaxMatch<T> =>
  relationOptionFold(program.matcher, () => absent<T>(), matcher => matcher(cursor));

const executeSequence = <T>(program: SyntaxRelationProgram<T>, cursor: TokenCursor): SyntaxMatch<T> => {
  const children = program.children as readonly SyntaxRelationProgram<T>[];
  const run = (index: number, values: readonly T[]): SyntaxMatch<readonly T[]> => relationGate(
    index >= children.length,
    () => present(Object.freeze(values)),
    () => invokePresence(executeSyntaxRelation(children[index], cursorFromOffset(cursor, index)), {
      absent: () => absent<readonly T[]>(),
      present: value => run(index + 1, Object.freeze([...values, value])),
    }) as SyntaxMatch<readonly T[]>,
  );
  return run(0, []) as SyntaxMatch<T>;
};

const cursorFromOffset = (cursor: TokenCursor, offset: number): TokenCursor => {
  const advance = (current: TokenCursor, remaining: number): TokenCursor =>
    relationGate(remaining <= 0, () => current, () => advance(current.advance(), remaining - 1));
  return advance(cursor, offset);
};

const executeRepeat = <T>(program: SyntaxRelationProgram<T>, cursor: TokenCursor): SyntaxMatch<T> => {
  const run = (child: SyntaxRelationProgram<T>, current: TokenCursor, values: readonly T[]): SyntaxMatch<readonly T[]> =>
    invokePresence(executeSyntaxRelation(child, current), {
      absent: () => present(Object.freeze(values)),
      present: value => run(child, current.advance(), Object.freeze([...values, value])),
    }) as SyntaxMatch<readonly T[]>;
  return relationOptionFold(firstChild(program), () => present(Object.freeze([])) as SyntaxMatch<T>, child => run(child, cursor, []) as SyntaxMatch<T>);
};

const executeUntil = <T>(program: SyntaxRelationProgram<T>, cursor: TokenCursor): SyntaxMatch<T> => {
  const run = (child: SyntaxRelationProgram<T>, current: TokenCursor, values: readonly T[]): SyntaxMatch<readonly T[]> =>
    invokePresence(executeSyntaxRelation(child, current), {
      present: value => present(Object.freeze([...values, value])),
      absent: () => relationGate(current.atEnd, () => absent<readonly T[]>(), () => run(child, current.advance(), values)),
    }) as SyntaxMatch<readonly T[]>;
  return relationOptionFold(firstChild(program), () => absent<readonly T[]>() as SyntaxMatch<T>, child => run(child, cursor, []) as SyntaxMatch<T>);
};

const executeDelimited = <T>(program: SyntaxRelationProgram<T>, cursor: TokenCursor): SyntaxMatch<T> =>
  relationOptionFold(program.open,
    () => absent<readonly T[]>(),
    openingMatcher => relationOptionFold(firstChild(program),
      () => absent<readonly T[]>(),
      child => invokePresence(openingMatcher(cursor), {
        absent: () => absent<readonly T[]>(),
        present: () => relationOptionFold(program.close,
          () => absent<readonly T[]>(),
          closeMatcher => invokePresence(executeSyntaxRelation(child, cursor.advance()), {
            absent: () => absent<readonly T[]>(),
            present: value => invokePresence(closeMatcher(cursor.advance()), {
              absent: () => absent<readonly T[]>(),
              present: () => present(Object.freeze([value])),
            }),
          }),
        ),
      }) as SyntaxMatch<readonly T[]>,
    ),
  ) as SyntaxMatch<T>;

const SYNTAX_RELATION_EXECUTORS: Readonly<Record<SyntaxRelationName, <T>(program: SyntaxRelationProgram<T>, cursor: TokenCursor) => SyntaxMatch<T>>> = Object.freeze({
  token: executeToken,
  sequence: executeSequence,
  repeat: executeRepeat,
  until: executeUntil,
  delimited: executeDelimited,
});

export const executeSyntaxRelation = <T>(program: SyntaxRelationProgram<T>, cursor: TokenCursor): SyntaxMatch<T> =>
  SYNTAX_RELATION_EXECUTORS[program.relation](program, cursor);

export const syntaxRelationProgram = <T>(program: SyntaxRelationProgram<T>): SyntaxRelationProgram<T> => Object.freeze({
  relation: program.relation,
  children: Object.freeze([...program.children]),
  matcher: program.matcher,
  open: program.open,
  close: program.close,
});

export const syntaxTokenRelation = <T>(matcher: SyntaxMatcher<T>): SyntaxRelationProgram<T> => syntaxRelationProgram({
  relation: 'token',
  children: Object.freeze([]),
  matcher: relationSome(matcher),
  open: relationNone(),
  close: relationNone(),
});

export const syntaxSequenceRelation = <T>(children: readonly SyntaxRelationProgram<T>[]): SyntaxRelationProgram<readonly T[]> => syntaxRelationProgram({
  relation: 'sequence',
  children: Object.freeze([...children]) as readonly SyntaxRelationProgram<T>[],
  matcher: relationNone(),
  open: relationNone(),
  close: relationNone(),
});

export const syntaxRepeatRelation = <T>(child: SyntaxRelationProgram<T>): SyntaxRelationProgram<readonly T[]> => syntaxRelationProgram({
  relation: 'repeat',
  children: Object.freeze([child]),
  matcher: relationNone(),
  open: relationNone(),
  close: relationNone(),
});

export const syntaxUntilRelation = <T>(child: SyntaxRelationProgram<T>): SyntaxRelationProgram<readonly T[]> => syntaxRelationProgram({
  relation: 'until',
  children: Object.freeze([child]),
  matcher: relationNone(),
  open: relationNone(),
  close: relationNone(),
});

export const syntaxDelimitedRelation = <T>(
  open: SyntaxMatcher<TokenDescriptor>,
  close: SyntaxMatcher<TokenDescriptor>,
  child: SyntaxRelationProgram<T>,
): SyntaxRelationProgram<readonly T[]> => syntaxRelationProgram({
  relation: 'delimited',
  children: Object.freeze([child]),
  matcher: relationNone(),
  open: relationSome(open),
  close: relationSome(close),
});

export const syntaxRelationFacts = <T>(pattern: SyntaxRelationPattern<T>): readonly [SyntaxRelationName, number][] => Object.freeze(relationProject(
  [pattern.program.relation],
  relation => [relation, relationGate(relationEqual(relation, 'token'), () => 1, () => pattern.program.children.length)] as [SyntaxRelationName, number],
));

export const projectSyntaxRelation = <T, R>(
  source: readonly T[],
  project: (value: T, index: number) => R,
): readonly R[] => relationProject(source, project);

export const selectSyntaxRelation = <T>(
  source: readonly T[],
  predicate: (value: T, index: number) => boolean,
): readonly T[] => relationSelect(source, predicate);

export { absent, present };
