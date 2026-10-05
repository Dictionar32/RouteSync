/** Semantic cast derivation from canonical PHP AST values. */
import type { ModelCast } from "../../../../types/upstream/model";
import type { PhpClassPropertyAst, ModelDeclarationAst, PhpAstValue } from "../../lexer";
import { EloquentCastMapper } from "../../../../types/domain/eloquentTypes";
import { SemanticValueFactory } from "../../../../types/domain/semanticValues";
import { relationAll, relationEqual } from "../../../../semantic/foundation/semanticRelations";
import { relationExpand, relationFold, relationGate, relationProject, relationSelect } from "../../../../semantic/foundation/relationalSequence";

const readCastValue = (value: PhpAstValue): string =>
    relationGate(
        relationAll([relationEqual(value.kind, 'literal'), relationEqual(value.literalType, 'string')]),
        () => value.value,
        () => relationGate(
            relationEqual(value.kind, 'class_reference'),
            () => value.className.value,
            () => { throw Error('Model cast value must be a string literal or class reference'); },
        ),
    );

const castTargets = {
    integer: { kind: 'integer' }, float: { kind: 'float' }, boolean: { kind: 'boolean' }, string: { kind: 'string' },
    datetime: { kind: 'date_time' }, date: { kind: 'date_time' }, timestamp: { kind: 'date_time' },
    array: { kind: 'json' }, json: { kind: 'json' }, object: { kind: 'json' }, collection: { kind: 'json' },
    encrypted: { kind: 'string' }, custom: { kind: 'string' }
} as const;

type SourceSpan = import("../../../../types/upstream/provenance").SourceSpan;

const readArray = (value: PhpAstValue, source: SourceSpan): readonly ModelCast[] =>
    relationGate(
        relationEqual(value.kind, 'nested_array'),
        () => relationProject(
            relationSelect(value.entries, entry => relationAll([relationEqual(entry.kind, 'keyed'), relationEqual(entry.key.kind, 'string')])),
            entry => {
                const rawTargetType = readCastValue(entry.value);
                const mapped = EloquentCastMapper.resolve(rawTargetType);
                return {
                    kind: 'model_cast',
                    property: SemanticValueFactory.propertyName(entry.key.value),
                    target: castTargets[mapped.castKind],
                    source,
                };
            },
        ),
        () => [],
    );

const propertyCasts = (propertyAsts: readonly PhpClassPropertyAst[], source: SourceSpan): readonly ModelCast[] =>
    relationFold(propertyAsts, [] as readonly ModelCast[], (casts, property) => [
        ...casts,
        ...relationGate(
            relationAll([relationEqual(property.name.value, '$casts'), relationEqual(property.value.kind, 'present')]),
            () => readArray(property.value.value, source),
            () => [],
        ),
    ]);

const methodCasts = (declaration: ModelDeclarationAst, source: SourceSpan): readonly ModelCast[] =>
    relationFold(declaration.methods, [] as readonly ModelCast[], (casts, method) => [
        ...casts,
        ...relationGate(
            relationEqual(method.name.value, 'casts'),
            () => relationExpand(method.returns, returned => readArray(returned, source)),
            () => [],
        ),
    ]);

export function parseModelCasts(
    propertyAsts: readonly PhpClassPropertyAst[],
    declaration: ModelDeclarationAst,
    casts: ModelCast[],
    source: SourceSpan,
): void {
    const discovered = [...propertyCasts(propertyAsts, source), ...methodCasts(declaration, source)];
    relationFold(discovered, casts, (target, value) => [...target, value]);
}
