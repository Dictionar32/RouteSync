import { readSourceTextSync } from '../scannerUtils';
/** Reads Laravel response DTOs into a verified contract boundary. */
import { LaravelSourceLexer } from '../../LaravelSourceLexer';
import type { ResourceFieldDescriptor } from '../../../../types/route';
import { ResourceFieldSemanticBinding } from '../../semantic/resourceFieldSemanticBinding';
import { type SemanticType } from '../../../types/SemanticType';
import { typeExpressionToSemanticType } from '../../../domain/common/typeExpressionSemanticType';
import { createAstIdentifier } from '../../lexer/phpAstTypes';
import type { TypeExpression } from '../../../../types/upstream/typeVocabulary';
import type { PrimitiveVocabulary } from '../../../../types/upstream/primitiveVocabulary';
import type { ResponseDtoDeclarationAst } from '../../lexer/responseDtoAstTypes';

import type { ResponseContractField, ResponseNullability, ResponseValueContract } from '../../../../types/domain/responseContracts';
import { BoundSemanticFactory } from '../../../../types/domain/boundAst';
import { createResponseFieldName, createResponseTypeName } from '../../../../types/domain/semanticValueFactories';
import { relationEqual, relationGate, relationProject, relationRange, relationOptionFold, relationSome, relationVariantFold, type RelationOption } from '../../../../semantic/kernel/relationalSequence';

export interface ResponseDtoAnalysis {
    readonly fields: readonly ResourceFieldDescriptor[];
    readonly contractFields: readonly ResponseContractField[];
}

export function readResponseDtoAnalysis(file: string): ResponseDtoAnalysis {
    const ast = parse(file);
    const fields = relationProject(ast.properties, toField);
    const contractFields = relationProject(ast.properties, toContractField);
    return Object.freeze({
        fields: Object.freeze(fields),
        contractFields: Object.freeze(contractFields)
    });
}

export function readResponseDtoFields(file: string): readonly ResourceFieldDescriptor[] {
    return readResponseDtoAnalysis(file).fields;
}

function parse(file: string): ResponseDtoDeclarationAst {
    const source = readSourceTextSync(file);
    const tokens = LaravelSourceLexer.tokenize(source);
    return LaravelSourceLexer.parseResponseDtoDeclaration(tokens, findClassName(tokens));
}

function toField(property: ResponseDtoDeclarationAst['properties'][number]): ResourceFieldDescriptor {
    const resolvedType = resolveSemanticType(property.type);
    const expression = toFieldExpression(property.type);

    return ResourceFieldSemanticBinding.fromExpression(
        property.name, expression, resolvedType, property.name, BoundSemanticFactory.unsupported('parser_gap')
    );
}

function resolveSemanticType(type: TypeExpression): SemanticType {
    return typeExpressionToSemanticType(type);
}

function toContractField(property: ResponseDtoDeclarationAst['properties'][number]): ResponseContractField {
    return Object.freeze({
        name: createResponseFieldName(property.name),
        value: toResponseValueContract(property.type),
        nullability: toNullability(property.type),
        evidence: { kind: 'declared' }
    });
}

const toNullability = (type: TypeExpression): ResponseNullability => relationVariantFold(
    type,
    'nullable',
    () => ({ kind: 'required' }),
    () => ({ kind: 'nullable' }),
);

function toResponseValueContract(type: TypeExpression): ResponseValueContract {
    return relationVariantFold(
        type,
        'nullable',
        () => relationVariantFold(
            type,
            'primitive',
            () => relationVariantFold(
                type,
                'reference',
                () => ({ kind: 'unresolved_declaration', reason: 'mixed_declaration' }),
                reference => ({ kind: 'named_type', name: createResponseTypeName(reference.value.name.value.value) }),
            ),
            primitive => toPrimitiveResponseValue(primitive),
        ),
        nullable => toResponseValueContract(nullable.value),
    );
}

function toPrimitiveResponseValue(type: Extract<TypeExpression, { readonly kind: 'primitive' }>): ResponseValueContract {
    return relationGate(
        relationEqual(type.value.kind, 'string'),
        () => ({ kind: 'scalar', value: { kind: 'textual' } }),
        () => relationGate(
            relationEqual(type.value.kind, 'number'),
            () => ({ kind: 'scalar', value: { kind: 'whole_number' } }),
            () => relationGate(
                relationEqual(type.value.kind, 'boolean'),
                () => ({ kind: 'scalar', value: { kind: 'boolean_flag' } }),
                () => ({ kind: 'unresolved_declaration', reason: 'mixed_declaration' }),
            ),
        ),
    );
}

function findClassName(tokens: readonly { readonly value: string }[]) {
    const find = (index: number): RelationOption<string> => relationGate(
        index >= tokens.length,
        () => ({ kind: 'none' }),
        () => relationGate(
            relationEqual(tokens[index].value, 'class'),
            () => relationGate(
                index + 1 < tokens.length,
                () => relationSome(tokens[index + 1].value),
                () => ({ kind: 'none' }),
            ),
            () => find(index + 1),
        ),
    );
    return relationOptionFold(find(0), () => { throw Error('Response DTO class declaration not found'); }, value => createAstIdentifier(value));
}

function toFieldExpression(type: TypeExpression): ResourceFieldDescriptor['expression'] {
    return relationVariantFold(
        type,
        'nullable',
        () => relationVariantFold(
            type,
            'primitive',
            () => ({ kind: 'unsupported', reason: 'unsupported_syntax' }),
            primitive => ({ kind: 'primitive', type: primitiveKind(primitive.value.kind) }),
        ),
        nullable => toFieldExpression(nullable.value),
    );
}

function primitiveKind(kind: PrimitiveVocabulary['kind']): PrimitiveKind {
    return relationGate(
        relationEqual(kind, 'string'),
        () => PrimitiveKind.STRING,
        () => relationGate(
            relationEqual(kind, 'boolean'),
            () => PrimitiveKind.BOOLEAN,
            () => relationGate(
                relationEqual(kind, 'number'),
                () => PrimitiveKind.NUMBER,
                () => PrimitiveKind.INDETERMINATE,
            ),
        ),
    );
}

