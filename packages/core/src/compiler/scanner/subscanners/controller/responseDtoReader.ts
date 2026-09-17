/** Reads Laravel response DTOs into a verified contract boundary. */
import fs from 'fs-extra';
import { LaravelSourceLexer } from '../../LaravelSourceLexer';
import type { ResourceFieldDescriptor } from '../../../../types/route';
import { ScannedResourceFieldDescriptor } from '../../descriptors/resourceDescriptors';
import { NullableType, PrimitiveKind, PrimitiveType } from '../../../types/SemanticType';
import { createAstIdentifier } from '../../lexer/phpAstTypes';
import type { PhpPropertyTypeAst } from '../../lexer/responseDtoAstTypes';
import type { ResponseDtoDeclarationAst } from '../../lexer/responseDtoAstTypes';

import type { ResponseContractField, ResponseNullability, ResponseValueContract } from '../../../../types/domain/responseContracts';
import { createResponseFieldName, createResponseTypeName } from '../../../../types/domain/semanticValueFactories';

export interface ResponseDtoAnalysis {
    readonly fields: readonly ResourceFieldDescriptor[];
    readonly contractFields: readonly ResponseContractField[];
}

export function readResponseDtoAnalysis(file: string): ResponseDtoAnalysis {
    const ast = parse(file);
    const fields = ast.properties.map(toField);
    const contractFields = ast.properties.map(toContractField);
    return Object.freeze({
        fields: Object.freeze(fields),
        contractFields: Object.freeze(contractFields)
    });
}

export function readResponseDtoFields(file: string): readonly ResourceFieldDescriptor[] {
    return readResponseDtoAnalysis(file).fields;
}

function parse(file: string): ResponseDtoDeclarationAst {
    const source = fs.readFileSync(file, 'utf8');
    const tokens = LaravelSourceLexer.tokenize(source);
    return LaravelSourceLexer.parseResponseDtoDeclaration(tokens, findClassName(tokens));
}

function toField(property: ResponseDtoDeclarationAst['properties'][number]): ResourceFieldDescriptor {
    const semanticType = toPrimitiveKind(property.type);
    const expression = semanticType === PrimitiveKind.UNKNOWN
        ? { kind: 'unsupported' as const, reason: 'invalid_boundary_input' as const }
        : { kind: 'primitive' as const, type: semanticType };

    const type = new PrimitiveType(semanticType);
    const resolvedType = property.type.nullable ? new NullableType(type) : type;
    return ScannedResourceFieldDescriptor.fromExpression(
        property.name, expression, resolvedType, property.name
    );
}

function toContractField(property: ResponseDtoDeclarationAst['properties'][number]): ResponseContractField {
    return Object.freeze({
        name: createResponseFieldName(property.name.value),
        value: toResponseValueContract(property.type),
        nullability: toNullability(property.type.nullable)
    });
}

function toNullability(nullable: boolean): ResponseNullability {
    return nullable ? { kind: 'nullable' } : { kind: 'required' };
}

function toResponseValueContract(type: PhpPropertyTypeAst): ResponseValueContract {
    switch (type.kind) {
        case 'primitive':
            switch (type.name) {
                case 'string': return { kind: 'scalar', value: { kind: 'textual' } };
                case 'int': return { kind: 'scalar', value: { kind: 'whole_number' } };
                case 'float': return { kind: 'scalar', value: { kind: 'decimal_number' } };
                case 'bool': return { kind: 'scalar', value: { kind: 'boolean_flag' } };
            }
        case 'mixed':
            return { kind: 'unresolved_declaration', reason: 'mixed_declaration' };
        case 'named':
            return { kind: 'named_type', name: createResponseTypeName(type.name.value) };
    }
}

function findClassName(tokens: readonly { readonly value: string }[]) {
    for (let i = 0; i + 1 < tokens.length; i++) {
        if (tokens[i].value === 'class') return createAstIdentifier(tokens[i + 1].value);
    }
    throw new Error('Response DTO class declaration not found');
}

function toPrimitiveKind(type: PhpPropertyTypeAst): PrimitiveKind {
    switch (type.kind) {
        case 'primitive':
            switch (type.name) {
                case 'string': return PrimitiveKind.STRING;
                case 'int':
                case 'float': return PrimitiveKind.NUMBER;
                case 'bool': return PrimitiveKind.BOOLEAN;
            }
        case 'mixed':
        case 'named':
            return PrimitiveKind.UNKNOWN;
    }
}
