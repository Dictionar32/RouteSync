import { relationResolve } from '../../../relational/sequence';
import type { TokenDescriptor } from '../phpAstTypes';
import { TokenCursor } from './relationalSyntaxCursor';
import { presenceFold, type Presence } from '../../../../types/upstream/presence';
import { relationEqual, relationAll } from '../../../../semantic/foundation/semanticRelations';
import { SYNTAX_KIND_GROUPS, tokenHasKind, tokenHasOperation } from './syntaxValue';
import { projectRelation, selectRelation, expandRelation, relationGate, relationResolve } from '../../../relational/sequence';

const STRING_ARROW_STRING_PATTERN = Object.freeze({
    key: SYNTAX_KIND_GROUPS.strings,
    operator: SYNTAX_KIND_GROUPS.arrows,
    value: SYNTAX_KIND_GROUPS.strings,
});

const matchesStringArrowString = (cursor: TokenCursor): boolean =>
    presenceFold(cursor.currentPresence, () => false, token =>
        relationGate(tokenHasKind(token, STRING_ARROW_STRING_PATTERN.key),
            () => relationAll([tokenHasKind(cursor.next, STRING_ARROW_STRING_PATTERN.operator), tokenHasKind(cursor.afterNext, STRING_ARROW_STRING_PATTERN.value)]),
            () => false));

const presenceFromValue = <T>(value: Presence<T>): Presence<T> => value;

/**
 * A bounded syntax-navigation model.
 *
 * Range membership and bounded search belong to navigation, not to parser
 * control flow. Parsers consume the relation and do not reconstruct the
 * boundary arithmetic themselves.
 */
export interface SyntaxRange {
    readonly start: TokenCursor;
    readonly end: TokenCursor;
    readonly contains: (cursor: TokenCursor) => boolean;
    readonly find: (predicate: (token: TokenDescriptor, cursor: TokenCursor) => boolean) => Presence<TokenCursor>;
    readonly findPresence: (predicate: (token: TokenDescriptor, cursor: TokenCursor) => boolean) => Presence<TokenCursor>;
    readonly findAll: (predicate: (token: TokenDescriptor, cursor: TokenCursor) => boolean) => readonly TokenCursor[];
    readonly project: <T>(mapper: (token: TokenDescriptor, cursor: TokenCursor) => T | void) => readonly T[];
    readonly tokens: () => readonly TokenDescriptor[];
    readonly cursorAtEnd: () => TokenCursor;
    readonly stringArrowStringPairs: () => readonly {
        readonly key: string;
        readonly value: string;
    }[];
    readonly calls: (method?: string) => readonly TokenCursor[];
}

type RangeVisit<T> = (token: TokenDescriptor, cursor: TokenCursor) => Presence<T>;
type RangeTraversal = {
    readonly start: TokenCursor;
    readonly end: TokenCursor;
    readonly cursors: () => readonly TokenCursor[];
};

const rangeTraversal = (start: TokenCursor, end: TokenCursor): RangeTraversal => Object.freeze({
    start,
    end,
    cursors: () => {
        const collect = (cursor: TokenCursor, output: readonly TokenCursor[]): readonly TokenCursor[] =>
            relationGate(cursor.isBefore(end), () => collect(cursor.advance(), Object.freeze([...output, cursor])), () => output);
        return Object.freeze(collect(start, Object.freeze([])));
    },
});

const mapPresent = <T, R>(values: readonly T[], mapper: (value: T) => Presence<R>): readonly R[] =>
    projectRelation(
        selectRelation(
            projectRelation(values, mapper),
            (value): value is Extract<typeof value, { readonly kind: 'present' }> => Object.is(value.kind, 'present'),
        ),
        value => value.value,
    );

export const syntaxRange = (start: TokenCursor, end: TokenCursor): SyntaxRange => {
    const traversal = rangeTraversal(start, end);
    const cursors = traversal.cursors();
    const matching = (predicate: (token: TokenDescriptor, cursor: TokenCursor) => boolean): readonly TokenCursor[] =>
        Object.freeze(selectRelation(cursors, cursor =>
            presenceFold(cursor.currentPresence, () => false, token => predicate(token, cursor))));
    const tokenValues = Object.freeze(
        projectRelation(
            selectRelation(
                projectRelation(cursors, cursor => cursor.currentPresence),
                value => Object.is(value.kind, 'present'),
            ),
            value => value.value,
        ),
    );
    const findPresence = (predicate: (token: TokenDescriptor, cursor: TokenCursor) => boolean): Presence<TokenCursor> => {
        const values = matching(predicate);
        return relationResolve(values.length > 0, () => ({ kind: 'present', value: values[0] }), () => ({ kind: 'absent' }));
    };
    return Object.freeze({
        start,
        end,
        contains: cursor => cursor.isBefore(end),
        find: predicate => findPresence(predicate),
        findPresence: predicate => presenceFromValue(matching(predicate)[0]),
        findAll: predicate => matching(predicate),
        project: <T>(mapper: RangeVisit<T>) => mapPresent(tokenValues, (token, index) => mapper(token, cursors[index])),
        tokens: () => tokenValues,
        cursorAtEnd: () => end,
        stringArrowStringPairs: () => Object.freeze(expandRelation(cursors, cursor => {
            const values = projectRelation(
                selectRelation(
                    [cursor.currentPresence, cursor.afterNextPresence],
                    value => Object.is(value.kind, 'present'),
                ),
                value => value.value,
            );
            return relationGate(
                relationAll([matchesStringArrowString(cursor), relationEqual(values.length, 2)]),
                () => [{ key: values[0].value, value: values[1].value }],
                () => [],
            );
        })),
        calls: method => Object.freeze(matching((token, cursor) =>
            relationGate(tokenHasKind(cursor.callOpen, SYNTAX_KIND_GROUPS.openParens),
                () => tokenHasOperation(token, Object.freeze([method])),
                () => false))),
    });
};
