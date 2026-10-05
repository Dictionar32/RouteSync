/**
 * Declarative ObjectType lowering.
 *
 * Deduplication, stream accumulation, and alias selection are relation folds;
 * no host-language iteration is semantic authority here.
 */
import type { ObjectType, ObjectProperty } from '../../../../types/SemanticType';
import { ControllerActionToAlias } from '../typeScriptVocabulary';
import { TypeScriptSyntax } from '../typeScriptSyntax';
import {
    SourceLineRange,
    type GeneratedInterfaceMetadata,
    type LoweredTypeDeclaration,
    type TypeScriptBuildResult
} from '../typeScriptMetadata';
import { relationAny, relationEqual, relationResolve } from '../../../../../semantic/foundation/semanticRelations';
import { relationFold, relationProject } from '../../../../../semantic/foundation/relationalSequence';

type UniqueResult<T> = Readonly<{ readonly values: readonly T[] }>;

const uniqueBy = <T>(values: readonly T[], key: (value: T) => string): readonly T[] =>
    relationFold(values, { values: Object.freeze([]) } as UniqueResult<T>, (state, value) =>
        relationResolve(
            relationAny(relationProject(state.values, item => relationEqual(key(item), key(value)))),
            () => state,
            () => ({ values: Object.freeze([...state.values, value]) }),
        ),
    ).values;

const declarationBlocks = (aliases: readonly string[], interfaceDeclaration: string): readonly string[] =>
    relationResolve(
        relationEqual(aliases.length, 0),
        () => [interfaceDeclaration],
        () => [interfaceDeclaration, TypeScriptSyntax.joinDeclarations(aliases)],
    );

export function lowerObjectType(
    objType: ObjectType,
    lowerPropertyFn: (prop: ObjectProperty) => string
): LoweredTypeDeclaration {
    const uniqueProps = uniqueBy(objType.properties, property => property.name.value.value);
    const ifaceDecl = TypeScriptSyntax.formatInterface(objType.name, uniqueProps, lowerPropertyFn);
    const aliases = [
        TypeScriptSyntax.formatResourceAlias(objType.baseName, ControllerActionToAlias.show, objType.name),
        TypeScriptSyntax.formatResourceAlias(objType.baseName, ControllerActionToAlias.index, TypeScriptSyntax.array(objType.name)),
    ];
    return {
        code: TypeScriptSyntax.joinBlocks(declarationBlocks(aliases, ifaceDecl)),
        metadata: {
            name: objType.name,
            propertyCount: uniqueProps.length,
            lineRange: SourceLineRange.Unmapped,
        },
    };
}

type CompileState = Readonly<{
    readonly declarations: readonly string[];
    readonly interfaces: readonly GeneratedInterfaceMetadata[];
    readonly interfaceNames: readonly string[];
    readonly aliasNames: readonly string[];
    readonly currentLine: number;
}>;

const initialCompileState: CompileState = Object.freeze({
    declarations: Object.freeze([]),
    interfaces: Object.freeze([]),
    interfaceNames: Object.freeze([]),
    aliasNames: Object.freeze([]),
    currentLine: 1,
});

const contains = (values: readonly string[], value: string): boolean =>
    relationAny(relationProject(values, entry => relationEqual(entry, value)));

const appendAlias = (
    state: CompileState,
    key: string,
): CompileState => relationResolve(
    contains(state.aliasNames, key),
    () => state,
    () => ({ ...state, aliasNames: Object.freeze([...state.aliasNames, key]) }),
);

const aliasesFor = (
    state: CompileState,
    objType: ObjectType,
): readonly string[] => relationFold(
    [
        { key: `${objType.baseName}Show`, value: TypeScriptSyntax.formatResourceAlias(objType.baseName, ControllerActionToAlias.show, objType.name) },
        { key: `${objType.baseName}Index`, value: TypeScriptSyntax.formatResourceAlias(objType.baseName, ControllerActionToAlias.index, TypeScriptSyntax.array(objType.name)) },
    ],
    { state, values: Object.freeze([] as readonly string[]) },
    (current, entry) => relationResolve(
        contains(current.state.aliasNames, entry.key),
        () => current,
        () => ({ state: appendAlias(current.state, entry.key), values: Object.freeze([...current.values, entry.value]) }),
    ),
).values;

const compileOne = (
    state: CompileState,
    objType: ObjectType,
    lowerPropertyFn: (prop: ObjectProperty) => string,
): CompileState => relationResolve(
    contains(state.interfaceNames, objType.name),
    () => state,
    () => {
        const uniqueProps = uniqueBy(objType.properties, property => property.name.value.value);
        const ifaceDecl = TypeScriptSyntax.formatInterface(objType.name, uniqueProps, lowerPropertyFn);
        const aliasDelta = aliasesFor(state, objType);
        const aliasState = relationFold(
            [
                `${objType.baseName}Show`,
                `${objType.baseName}Index`,
            ],
            state,
            (current, key) => appendAlias(current, key),
        );
        const blocks = declarationBlocks(aliasDelta, ifaceDecl);
        const code = TypeScriptSyntax.joinBlocks(blocks);
        const lineCount = code.split('\n').length;
        return {
            declarations: Object.freeze([...state.declarations, code]),
            interfaces: Object.freeze([...state.interfaces, { name: objType.name, propertyCount: uniqueProps.length, lineRange: SourceLineRange.create(state.currentLine, state.currentLine + lineCount - 1) }]),
            interfaceNames: Object.freeze([...state.interfaceNames, objType.name]),
            aliasNames: aliasState.aliasNames,
            currentLine: state.currentLine + lineCount + 1,
        };
    },
);

export function compileTypeStream(
    types: readonly ObjectType[],
    lowerPropertyFn: (prop: ObjectProperty) => string
): TypeScriptBuildResult {
    const state = relationFold(types, initialCompileState, (current, objType) => compileOne(current, objType, lowerPropertyFn));
    return { code: TypeScriptSyntax.joinBlocks(state.declarations), interfaces: Object.freeze(state.interfaces) };
}
