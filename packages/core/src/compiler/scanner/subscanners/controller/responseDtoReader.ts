import { readSourceTextSync } from '../scannerUtils';
/** Reads Laravel response DTOs into a verified contract boundary. */
import { LaravelSourceLexer } from '../../LaravelSourceLexer';
import type { ResourceFieldDescriptor } from '../../../../types/route';
import { ScannedResourceFieldDescriptor } from '../../descriptors/resourceDescriptors';
import { JsonValueType, NullableType, PrimitiveKind, PrimitiveType, ReferenceType, type SemanticType } from '../../../types/SemanticType';
import { createAstIdentifier } from '../../lexer/phpAstTypes';
import type { PhpPropertyTypeAst } from '../../lexer/responseDtoAstTypes';
import type { ResponseDtoDeclarationAst } from '../../lexer/responseDtoAstTypes';

import type { ResponseContractField, ResponseNullability, ResponseValueContract } from '../../../../types/domain/responseContracts';
import { BoundSemanticFactory } from '../../../../types/domain/boundAst';
import { createResponseFieldName, createResponseTypeName } from '../../../../types/domain/semanticValueFactories';
import { relationEqual, relationGate, relationProject, relationRange, relationOptionFold, relationSome, type RelationOption } from '../../../../semantic/kernel/relationalSequence';

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
    const expression = relationGate(
        relationEqual(property.type.kind, 'primitive'),
        () => ({ kind: 'primitive' as const, type: toPrimitiveKind(property.type as Extract<PhpPropertyTypeAst, { kind: 'primitive' }>) }),
        () => ({ kind: 'unsupported' as const, reason: 'unsupported_syntax' as const }),
    );

    return ScannedResourceFieldDescriptor.fromExpression(
        property.name, expression, resolvedType, property.name, BoundSemanticFactory.unsupported('parser_gap')
    );
}

function resolveSemanticType(type: PhpPropertyTypeAst): SemanticType {
    const base = relationGate(
        relationEqual(type.kind, 'primitive'),
        () => primitiveType(toPrimitiveKind(type as Extract<PhpPropertyTypeAst, { kind: 'primitive' }>)),
        () => relationGate(
            relationEqual(type.kind, 'named'),
            () => ReferenceType.response('response', (type as Extract<PhpPropertyTypeAst, { kind: 'named' }>).name),
            () => JsonValueType(),
        ),
    );
    return relationGate(type.nullable, () => NullableType(base), () => base);
}

function toContractField(property: ResponseDtoDeclarationAst['properties'][number]): ResponseContractField {
    return Object.freeze({
        name: createResponseFieldName(property.name),
        value: toResponseValueContract(property.type),
        nullability: toNullability(property.type.nullable),
        evidence: { kind: 'declared' }
    });
}

const toNullability = (nullable: boolean): ResponseNullability => relationGate(
    nullable,
    () => ({ kind: 'nullable' }),
    () => ({ kind: 'required' }),
);

function toResponseValueContract(type: PhpPropertyTypeAst): ResponseValueContract {
    return relationGate(
        relationEqual(type.kind, 'primitive'),
        () => toPrimitiveResponseValue(type as Extract<PhpPropertyTypeAst, { kind: 'primitive' }>),
        () => relationGate(
            relationEqual(type.kind, 'named'),
            () => ({ kind: 'named_type', name: createResponseTypeName((type as Extract<PhpPropertyTypeAst, { kind: 'named' }>).name) }),
            () => ({ kind: 'unresolved_declaration', reason: 'mixed_declaration' }),
        ),
    );
}

function toPrimitiveResponseValue(type: Extract<PhpPropertyTypeAst, { kind: 'primitive' }>): ResponseValueContract {
    return relationGate(
        relationEqual(type.name, 'string'),
        () => ({ kind: 'scalar', value: { kind: 'textual' } }),
        () => relationGate(
            relationEqual(type.name, 'int'),
            () => ({ kind: 'scalar', value: { kind: 'whole_number' } }),
            () => relationGate(
                relationEqual(type.name, 'float'),
                () => ({ kind: 'scalar', value: { kind: 'decimal_number' } }),
                () => relationGate(
                    relationEqual(type.name, 'bool'),
                    () => ({ kind: 'scalar', value: { kind: 'boolean_flag' } }),
                    () => ({ kind: 'unresolved_declaration', reason: 'mixed_declaration' }),
                ),
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

function toPrimitiveKind(type: Extract<PhpPropertyTypeAst, { kind: 'primitive' }>): PrimitiveKind {
    return relationGate(
        relationEqual(type.name, 'string'),
        () => PrimitiveKind.STRING,
        () => relationGate(
            relationEqual(type.name, 'bool'),
            () => PrimitiveKind.BOOLEAN,
            () => relationGate(
                relationEqual(type.name, 'int'),
                () => PrimitiveKind.NUMBER,
                () => relationGate(relationEqual(type.name, 'float'), () => PrimitiveKind.NUMBER, () => PrimitiveKind.INDETERMINATE),
            ),
        ),
    );
}
