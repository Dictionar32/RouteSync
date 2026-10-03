/**
 * Semantic accessor derivation from the canonical ModelDeclarationAst.
 * Syntax/token recognition is owned by the lexer AST producer.
 *
 * Accessor selection is represented as relation candidates and recursive
 * projection; this module does not own imperative dispatch.
 */
import type { ModelAccessorFact } from "../../../../types/upstream/modelSourceFacts";
import type { ModelDeclarationAst } from "../../lexer";
import { resolveModelAccessorReturnExpression } from "./modelAccessorExpressionMapper";
import type { TypeExpression } from "../../../../types/upstream/typeVocabulary";
import { relationGate, relationProject, relationTextSlice, relationNone, relationSome, relationOptionFold, type RelationOption } from "../../../../semantic/kernel/relationalSequence";
import { relationAny, relationEqual } from "../../../../semantic/kernel/semanticRelations";

type AccessorReturnType = 'textual' | 'numeric' | 'boolean' | 'array';

function accessorSemanticType(type: AccessorReturnType): TypeExpression {
    const semanticKinds: Readonly<Record<AccessorReturnType, { readonly kind: 'string' | 'number' | 'boolean' | 'json' }>> = {
        textual: { kind: 'string' },
        numeric: { kind: 'number' },
        boolean: { kind: 'boolean' },
        array: { kind: 'json' },
    };
    return { kind: 'primitive', value: semanticKinds[type] };
}

function parseAccessorReturnType(value: string): AccessorReturnType {
    const normalized = value.toLowerCase();
    const numeric = relationAny([relationEqual('float', normalized), relationEqual('int', normalized), relationEqual('integer', normalized), relationEqual('number', normalized)]);
    const boolean = relationAny([relationEqual('bool', normalized), relationEqual('boolean', normalized)]);
    return relationGate(numeric, () => 'numeric', () => relationGate(boolean, () => 'boolean', () => relationGate(
        relationEqual(normalized, 'array'),
        () => 'array',
        () => 'textual',
    )));
}

const isLegacyAccessor = (name: string): boolean => relationAllAccessor([
    relationGate(name.startsWith('get'), () => true, () => false),
    relationGate(name.endsWith('Attribute'), () => true, () => false),
]);

const relationAllAccessor = (values: readonly boolean[], index = 0): boolean =>
    relationGate(index >= values.length, () => true, () => relationGate(values[index], () => relationAllAccessor(values, index + 1), () => false));

const isModernAccessor = (method: ModelDeclarationAst['methods'][number]): boolean =>
    relationGate(relationEqual(method.returnType.kind, 'present'), () => relationGate(
        relationEqual(method.returnType.value.kind, 'class_reference'),
        () => relationEqual(method.returnType.value.className.value, 'Attribute'),
        () => false,
    ), () => false);

const propertyNameFor = (name: string, legacy: boolean): string => {
    const core = relationTextSlice(name, 3, name.length - 9);
    const first = core.charAt(0).toLowerCase();
    return relationGate(legacy, () => first + relationTextSlice(core, 1), () => name);
};

const hintedType = (method: ModelDeclarationAst['methods'][number], modern: boolean): string =>
    relationGate(modern, () => 'Attribute', () => relationGate(
        relationAllAccessor([relationEqual(method.returnType.kind, 'present'), relationEqual(method.returnType.value.kind, 'class_reference')]),
        () => method.returnType.value.className.value,
        () => 'string',
    ));

const firstReturn = (method: ModelDeclarationAst['methods'][number]): RelationOption<ModelDeclarationAst['methods'][number]['returns'][number]> =>
    relationGate(method.returns.length > 0, () => relationSome(method.returns[0]), () => relationNone());

const buildAccessor = (
    method: ModelDeclarationAst['methods'][number],
    source: import("../../../../types/upstream/provenance").SourceSpan,
): RelationOption<ModelAccessorFact> => {
    const name = method.name.value;
    const legacy = isLegacyAccessor(name);
    const modern = isModernAccessor(method);
    const accepted = relationAny([legacy, modern]);
    return relationGate(accepted, () => {
        const propertyName = propertyNameFor(name, legacy);
        const result = accessorSemanticType(relationGate(modern, () => 'textual', () => parseAccessorReturnType(hintedType(method, modern))));
        const returned = firstReturn(method);
        return relationOptionFold(returned,
            () => ({
                name: { kind: 'method_name', value: { kind: 'string_value', value: name } },
                propertyName: { kind: 'property_name', value: { kind: 'string_value', value: propertyName } },
                computation: { kind: 'rejected', reason: 'missing_return_expression', result },
                result,
                source,
            }),
            value => ({
                name: { kind: 'method_name', value: { kind: 'string_value', value: name } },
                propertyName: { kind: 'property_name', value: { kind: 'string_value', value: propertyName } },
                computation: { kind: 'expression', expression: resolveModelAccessorReturnExpression(value), result },
                result,
                source,
            }),
        );
    }, () => relationNone());
};

export function parseModelAccessors(
    declaration: ModelDeclarationAst,
    accessors: ModelAccessorFact[],
    source: import("../../../../types/upstream/provenance").SourceSpan,
): void {
    const derived = relationProject(declaration.methods, method => buildAccessor(method, source));
    const append = (entries: readonly RelationOption<ModelAccessorFact>[], index = 0): void =>
        relationGate(index >= entries.length, () => { }, () => relationOptionFold(
            entries[index],
            () => append(entries, index + 1),
            value => { accessors.push(value); append(entries, index + 1); },
        ));
    append(derived);
}
