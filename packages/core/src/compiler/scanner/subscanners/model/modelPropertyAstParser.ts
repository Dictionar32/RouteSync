import type { PhpClassPropertyAst, PhpPropertyVisibility, PhpPropertyTypeAst, TokenDescriptor } from '../../lexer';
import { createAstIdentifier, createSourceOffset, createSourceLineNumber, classifyAstTokens } from '../../lexer';
import { relationAll, relationAny, relationEqual, relationGate } from '../../../../semantic/foundation/semanticRelations';
import { relationAdvanceIndex, relationFold, relationLastIndexOf, relationSlice, relationTextSlice } from '../../../../semantic/foundation/relationalSequence';

type PropertyScanState = Readonly<{
    readonly classSeen: boolean;
    readonly classBodyOpened: boolean;
    readonly classBodyDepth: number;
    readonly depth: number;
    readonly skipUntil: number;
    readonly properties: readonly PhpClassPropertyAst[];
}>;

const modifierBeforeVariable = (tokens: readonly TokenDescriptor[], index: number, modifier: string): boolean => {
    const start = relationGate(index > 8, () => index - 8, () => 0);
    const window = relationSlice(tokens, start, index);
    const modifierIndex = relationLastIndexOf(window, token => relationEqual(token.value, modifier));
    const boundaryIndex = relationLastIndexOf(window, token => relationAny([
        relationEqual(token.value, ';'), relationEqual(token.value, '{'), relationEqual(token.value, '}')
    ]));
    return relationAll([modifierIndex >= 0, modifierIndex > boundaryIndex]);
};

const visibility = (tokens: readonly TokenDescriptor[], index: number): PhpPropertyVisibility => {
    const value = relationGate(index > 0, () => tokens[relationAdvanceIndex(index, -1)].value, () => '');
    return relationGate(relationEqual(value, 'public'), () => 'public', () => relationGate(relationEqual(value, 'protected'), () => 'protected', () => relationGate(relationEqual(value, 'private'), () => 'private', () => 'implicit')));
};

const propertyType = (tokens: readonly TokenDescriptor[], index: number): PhpPropertyTypeAst => {
    const start = relationGate(index > 8, () => index - 8, () => 0);
    const values = relationSlice(tokens, start, index);
    const parts = relationFold(values, [] as string[], (current, token) => relationGate(relationAny([
        relationEqual(token.value, 'public'), relationEqual(token.value, 'protected'), relationEqual(token.value, 'private'),
        relationEqual(token.value, 'static'), relationEqual(token.value, 'readonly'), relationEqual(token.value, 'var'),
        relationEqual(token.value, ';'), relationEqual(token.value, '{'), relationEqual(token.value, '}')
    ]), () => current, () => [...current, token.value]));
    return relationGate(relationEqual(parts.length, 0), () => ({ kind: 'untyped' }), () => ({ kind: 'declared', value: parts.join('') }));
};

const endOfValue = (tokens: readonly TokenDescriptor[], start: number): number => {
    const state = relationFold(tokens, { depth: 0, end: tokens.length, active: false }, (current, token, index) => relationGate(index < start, () => current, () => relationGate(current.active, () => current, () => {
        const opened = relationAny([relationEqual(token.value, '['), relationEqual(token.value, '('), relationEqual(token.value, '{')]);
        const closed = relationAny([relationEqual(token.value, ']'), relationEqual(token.value, ')'), relationEqual(token.value, '}')]);
        const nextDepth = relationGate(opened, () => current.depth + 1, () => relationGate(closed, () => current.depth - 1, () => current.depth));
        return relationGate(relationAll([relationEqual(token.value, ';'), relationEqual(current.depth, 0)]), () => ({ depth: current.depth, end: index, active: true }), () => ({ depth: nextDepth, end: current.end, active: false }));
    })));
    return state.end;
};

export function parseModelPropertyAsts(tokens: readonly TokenDescriptor[]): readonly PhpClassPropertyAst[] {
    const initial: PropertyScanState = { classSeen: false, classBodyOpened: false, classBodyDepth: 0, depth: 0, skipUntil: -1, properties: [] };
    const state = relationFold(tokens, initial, (current, token, index) => relationGate(index <= current.skipUntil, () => current, () => {
        const classSeen = relationGate(relationEqual(token.value, 'class'), () => true, () => current.classSeen);
        const depthOpened = relationGate(relationEqual(token.value, '{'), () => current.depth + 1, () => relationGate(relationEqual(token.value, '}'), () => current.depth - 1, () => current.depth));
        const bodyOpened = relationGate(relationAll([relationEqual(token.value, '{'), classSeen, !current.classBodyOpened]), () => true, () => current.classBodyOpened);
        const bodyDepth = relationGate(relationAll([relationEqual(token.value, '{'), classSeen, !current.classBodyOpened]), () => depthOpened, () => current.classBodyDepth);
        const inBody = relationAll([bodyOpened, relationEqual(depthOpened, bodyDepth), !relationEqual(token.value, '}')]);
        const next = relationGate(relationAll([inBody, relationEqual(token.type, 'VARIABLE')]), () => {
            const nextToken = tokens[relationAdvanceIndex(index, 1)];
            const nextValue = relationGate(relationAdvanceIndex(index, 1) < tokens.length, () => nextToken.value, () => '');
            const valid = relationAny([relationEqual(nextValue, '='), relationEqual(nextValue, ';')]);
            return relationGate(valid, () => {
                const end = relationGate(relationEqual(nextValue, '='), () => endOfValue(tokens, relationAdvanceIndex(index, 2)), () => relationAdvanceIndex(index, 1));
                const initialized = relationEqual(nextValue, '=');
                const valueTokens = relationGate(initialized, () => relationSlice(tokens, relationAdvanceIndex(index, 2), end), () => []);
                const startToken = relationGate(index > 0, () => tokens[relationAdvanceIndex(index, -1)], () => token);
                const endIndex = relationGate(end > index, () => end - 1, () => index);
                const endToken = tokens[endIndex];
                const property: PhpClassPropertyAst = Object.freeze({
                    kind: 'class_property',
                    name: createAstIdentifier(relationTextSlice(token.value, 1)),
                    visibility: visibility(tokens, index),
                    storage: relationGate(modifierBeforeVariable(tokens, index, 'static'), () => 'static' as const, () => 'instance' as const),
                    mutability: relationGate(modifierBeforeVariable(tokens, index, 'readonly'), () => 'readonly' as const, () => 'mutable' as const),
                    type: propertyType(tokens, index),
                    promotion: { kind: 'declared' },
                    initialization: relationGate(initialized, () => ({ kind: 'present', value: classifyAstTokens(valueTokens) }), () => ({ kind: 'absent' })),
                    value: relationGate(initialized, () => ({ kind: 'present', value: classifyAstTokens(valueTokens) }), () => ({ kind: 'absent' })),
                    startOffset: createSourceOffset(startToken.startOffset),
                    endOffset: createSourceOffset(endToken.endOffset),
                    startLine: createSourceLineNumber(startToken.line),
                    endLine: createSourceLineNumber(endToken.line)
                });
                return { classSeen, classBodyOpened: bodyOpened, classBodyDepth: bodyDepth, depth: depthOpened, skipUntil: end, properties: [...current.properties, property] };
            }, () => ({ ...current, classSeen, classBodyOpened: bodyOpened, classBodyDepth: bodyDepth, depth: depthOpened }));
        }, () => ({ ...current, classSeen, classBodyOpened: bodyOpened, classBodyDepth: bodyDepth, depth: depthOpened }));
        return next;
    }));
    return Object.freeze(state.properties);
}
