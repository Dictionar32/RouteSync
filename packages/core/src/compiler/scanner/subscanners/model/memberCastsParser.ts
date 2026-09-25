/**
 * Semantic cast derivation from canonical PHP AST values.
 * Syntax/token recognition is owned by the lexer AST producer.
 */
import type { ModelCast } from "../../../../types/upstream/model";
import type { PhpClassPropertyAst, ModelDeclarationAst, PhpAstValue } from "../../lexer";
import { EloquentCastMapper } from "../../../../types/domain/eloquentTypes";
import { SemanticValueFactory } from "../../../../types/domain/semanticValues";

function readCastValue(value: PhpAstValue): string {
    if (value.kind === 'literal' && value.literalType === 'string') return value.value;
    if (value.kind === 'class_reference') return value.className.value;
    throw new Error('Model cast value must be a string literal or class reference');
}

const castTargets = {
    integer: { kind: 'integer' }, float: { kind: 'float' }, boolean: { kind: 'boolean' }, string: { kind: 'string' },
    datetime: { kind: 'date_time' }, date: { kind: 'date_time' }, timestamp: { kind: 'date_time' },
    array: { kind: 'json' }, json: { kind: 'json' }, object: { kind: 'json' }, collection: { kind: 'json' },
    encrypted: { kind: 'string' }, custom: { kind: 'string' }
} as const;

function readArray(value: PhpAstValue, casts: ModelCast[], source: import("../../../../types/upstream/provenance").SourceSpan): void {
    if (value.kind !== 'nested_array') return;
    for (const entry of value.entries) {
        if (entry.kind !== 'keyed' || entry.key.kind !== 'string') continue;
        const rawTargetType = readCastValue(entry.value);
        const mapped = EloquentCastMapper.map(rawTargetType);
        const targetType = SemanticValueFactory.castTypeName(rawTargetType);
        casts.push({
            kind: 'model_cast',
            property: SemanticValueFactory.propertyName(entry.key.value),
            target: castTargets[mapped.castKind],
            source
        });
    }
}

export function parseModelCasts(
    propertyAsts: readonly PhpClassPropertyAst[],
    declaration: ModelDeclarationAst,
    casts: ModelCast[],
    source: import("../../../../types/upstream/provenance").SourceSpan
): void {
    for (const property of propertyAsts) {
        if (property.name.value === '$casts' && property.value.kind === 'present') readArray(property.value.value, casts, source);
    }
    for (const method of declaration.methods) {
        if (method.name.value !== 'casts') continue;
        for (const returned of method.returns) readArray(returned, casts, source);
    }
}
