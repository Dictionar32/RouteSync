import type { TokenDescriptor } from '../phpAstTypes';
import { TokenCursor } from './relationalSyntaxCursor';
import { presenceFold, type Presence } from '../../../../types/upstream/presence';
import { SYNTAX_KIND_GROUPS, syntaxValueOperations } from './syntaxValue';

const STRING_ARROW_STRING_PATTERN = Object.freeze({
    key: SYNTAX_KIND_GROUPS.strings,
    operator: SYNTAX_KIND_GROUPS.arrows,
    value: SYNTAX_KIND_GROUPS.strings,
});

const matchesStringArrowString = (cursor: TokenCursor): boolean =>
    presenceFold(cursor.currentPresence, () => false, token =>
        syntaxValueOperations.tokenHasKind(token, STRING_ARROW_STRING_PATTERN.key) &&
        syntaxValueOperations.tokenHasKind(cursor.next, STRING_ARROW_STRING_PATTERN.operator) &&
        syntaxValueOperations.tokenHasKind(cursor.afterNext, STRING_ARROW_STRING_PATTERN.value));

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
        const output: TokenCursor[] = [];
        let cursor = start;
        while (cursor.isBefore(end)) {
            output.push(cursor);
            cursor = cursor.advance();
        }
        return Object.freeze(output);
    },
});

export const syntaxRange = (start: TokenCursor, end: TokenCursor): SyntaxRange => {
    const traversal = rangeTraversal(start, end);
    const cursors = traversal.cursors();
    const matching = (predicate: (token: TokenDescriptor, cursor: TokenCursor) => boolean): readonly TokenCursor[] =>
        Object.freeze(cursors.filter(cursor =>
            presenceFold(cursor.currentPresence, () => false, token => predicate(token, cursor))));
    const tokenValues = Object.freeze(
        cursors.flatMap(cursor =>
            presenceFold(cursor.currentPresence, () => [], token => [token])),
    );
    const findPresence = (predicate: (token: TokenDescriptor, cursor: TokenCursor) => boolean): Presence<TokenCursor> => {
        const values = matching(predicate);
        return values.length > 0 ? { kind: 'present', value: values[0] } : { kind: 'absent' };
    };
    return Object.freeze({
        start,
        end,
        contains: cursor => cursor.isBefore(end),
        find: predicate => findPresence(predicate),
        findPresence: predicate => findPresence(predicate),
        findAll: predicate => matching(predicate),
        project: <T>(mapper: RangeVisit<T>) => Object.freeze(cursors.flatMap(cursor => presenceFold(cursor.currentPresence, () => [], token => { const result = mapper(token, cursor); return Object.is(result.kind, 'present') ? [result.value] : []; }))),
        tokens: () => tokenValues,
        cursorAtEnd: () => end,
        stringArrowStringPairs: () => Object.freeze(cursors.flatMap(cursor => {
            const values = [cursor.currentPresence, cursor.afterNextPresence].flatMap(value =>
                presenceFold(value, () => [], token => [token]));
            return matchesStringArrowString(cursor) && values.length === 2
                ? [{ key: values[0].value, value: values[1].value }]
                : [];
        })),
        calls: method => Object.freeze(matching((token, cursor) =>
            syntaxValueOperations.tokenHasKind(cursor.callOpen, SYNTAX_KIND_GROUPS.openParens) &&
            syntaxValueOperations.tokenHasOperation(token, Object.freeze(method === undefined ? [] : [method])))),
    });
};
