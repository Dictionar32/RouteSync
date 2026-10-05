/**
 * routeContextTracker.ts
 *
 * Route context is represented as relation-backed evidence and option state.
 *
 * @module core/compiler/scanner/subscanners/route-scanner
 */

import type { TokenDescriptor } from "../../lexer/phpAstTypes";
import { routeAuthorizationKnowledge } from "../../semantic/route/routeMiddlewareKnowledgeCatalog";
import { createMiddlewareName } from "../../../../types/upstream/names";
import { relationAll, relationEqual } from "../../../../semantic/foundation/semanticRelations";
import {
    relationGate,
    relationExpand,
    relationFirstOption,
    relationOptionFold,
    relationProject,
    relationRange,
    relationSome,
    relationNone,
    type RelationOption,
} from "../../../../semantic/foundation/relationalSequence";

type ContextToken = TokenDescriptor;

const tokenAt = (tokens: readonly ContextToken[], start: number): RelationOption<ContextToken> =>
    relationFirstOption(relationRange(tokens, start, start + 1), () => true);

const valueAt = (tokens: readonly ContextToken[], start: number): RelationOption<string> =>
    relationOptionFold(tokenAt(tokens, start), () => relationNone<string>(), token => relationSome(token.value));

const typeAt = (tokens: readonly ContextToken[], start: number): RelationOption<string> =>
    relationOptionFold(tokenAt(tokens, start), () => relationNone<string>(), token => relationSome(token.type));

const optionEquals = (value: RelationOption<string>, expected: string): boolean =>
    relationOptionFold(value, () => false, candidate => relationEqual(candidate, expected));

const optionAllEquals = (left: RelationOption<string>, first: string, right: RelationOption<string>, second: string): boolean =>
    relationAll([optionEquals(left, first), optionEquals(right, second)]);

const normalizePrefix = (value: string): string => value.replace(/^\/+|\/+$/g, '');

const collectUntilClose = (
    tokens: readonly ContextToken[],
    index: number,
    output: readonly string[] = [],
): readonly string[] =>
    relationGate(
        index >= tokens.length,
        () => output,
        () => {
            const token = tokens[index];
            return relationGate(
                relationEqual(token.value, ']'),
                () => output,
                () => {
                    const next = relationGate(
                        relationEqual(token.type, 'STRING'),
                        () => [...output, token.value],
                        () => output,
                    );
                    return collectUntilClose(tokens, index + 1, next);
                },
            );
        },
    );

const collectMiddlewareValues = (tokens: readonly ContextToken[], start: number): readonly string[] =>
    relationOptionFold<ContextToken, readonly string[]>(
        relationFirstOption(relationRange(tokens, start, start + 1), token => relationEqual(token.value, '[')),
        () => relationOptionFold(
            relationFirstOption(relationRange(tokens, start, start + 1), token => relationEqual(token.type, 'STRING')),
            () => [],
            token => [token.value],
        ),
        () => collectUntilClose(tokens, start + 1),
    );

const cloneValues = (values: readonly string[]): string[] => [...relationProject(values, value => value)];

const appendContext = <T>(stack: readonly T[], value: T): T[] => [...stack, value];

const removeContext = <T>(stack: readonly T[]): T[] =>
    relationGate(relationEqual(stack.length, 0), () => [], () => [...relationRange(stack, 0, stack.length - 1)]);

const contextMiddleware = (stack: readonly string[][]): readonly string[] =>
    [...relationExpand(stack, values => cloneValues(values))];

export class RouteContextTracker {
    public prefixStack: string[] = [];
    public pendingPrefix: RelationOption<string> = relationNone<string>();
    public middlewareStack: string[][] = [];
    public pendingMiddleware: string[] = [];

    public handleToken(tokens: readonly TokenDescriptor[], i: number): void {
        const current = valueAt(tokens, i);
        const next = valueAt(tokens, i + 1);
        const nextTwo = valueAt(tokens, i + 2);
        const currentIsPrefix = optionEquals(current, 'prefix');
        const currentIsMiddleware = optionEquals(current, 'middleware');
        const currentIsGroup = optionEquals(current, 'group');
        const currentIsClose = optionEquals(current, '}');

        relationGate(
            currentIsPrefix,
            () => relationGate(
                optionAllEquals(next, '(', typeAt(tokens, i + 2), 'STRING'),
                () => {
                    this.pendingPrefix = relationOptionFold(nextTwo, () => relationNone<string>(), token => relationSome(normalizePrefix(token)));
                },
                () => false,
            ),
            () => false,
        );

        relationGate(
            currentIsMiddleware,
            () => relationGate(
                optionEquals(next, '('),
                () => {
                    this.pendingMiddleware = [...relationProject(collectMiddlewareValues(tokens, i + 2), value => value)];
                },
                () => false,
            ),
            () => false,
        );

        relationGate(
            currentIsGroup,
            () => relationGate(
                optionEquals(next, '('),
                () => {
                    this.middlewareStack = appendContext(this.middlewareStack, cloneValues(this.pendingMiddleware));
                    this.pendingMiddleware = [];
                    this.prefixStack = appendContext(
                        this.prefixStack,
                        relationOptionFold(this.pendingPrefix, () => '', value => value),
                    );
                    this.pendingPrefix = relationNone<string>();
                },
                () => false,
            ),
            () => false,
        );

        relationGate(
            currentIsClose,
            () => {
                this.middlewareStack = removeContext(this.middlewareStack);
                this.prefixStack = removeContext(this.prefixStack);
            },
            () => false,
        );
    }

    public getCurrentMiddlewares(): string[] {
        return [...relationProject(contextMiddleware(this.middlewareStack), value => value)];
    }

    public isCurrentAuth(): boolean {
        const names = relationProject(this.getCurrentMiddlewares(), value => createMiddlewareName(value));
        return relationEqual(routeAuthorizationKnowledge(names).kind, 'authorized');
    }
}
