import { scannerSemanticType } from '../../../semanticTypeConstructionRelations';
/**
 * Declarative resource-expression binders.
 *
 * PHP conditional syntax remains syntax evidence. Its binding is expressed as
 * relation-shaped data and catalog selection; host-language branch syntax is
 * not used as the semantic dispatcher.
 */
import { relationResolve } from "../../../../relational/sequence";
import { relationContains } from '../../../../../semantic/foundation/relationMembership';
import { relationAll, relationEqual } from "../../../../../semantic/foundation/semanticRelations";
import { relationFirst, relationOptionFold, relationSome, relationNone } from "../../../../../semantic/foundation/relationalSequence";
import type { OriginModelSymbol, ModelSymbolTable } from "../../../symbols/ModelSymbolTable";
import type { PhpAstValue } from "../../../lexer/PhpAst";
import { ResourceFieldExpressionFactory } from "../../../../../types/route";
import { BoundSemanticFactory } from "../../../../../types/domain/boundAst";
import { SemanticValueFactory } from "../../../../../types/domain/semanticValues";
import { ResourceFieldSemanticBinding } from "../../../../../types/domain/resourceFieldSemanticBinding";
import { PrimitiveKind } from "../../../../../types/domain/semanticType";
import { toCamelCase } from "../../../../../utils/resource-naming";
import type { BoundResourceFieldResult } from "../../SemanticResourceBinder";

type BindField = (params: {
    readonly key: string;
    readonly value: PhpAstValue;
    readonly modelSymbol: OriginModelSymbol;
    readonly modelSymbolTable: ModelSymbolTable;
}) => BoundResourceFieldResult;

type RuntimeLiteralType = 'number' | 'boolean' | 'string';
const RUNTIME_LITERAL_TYPE: Readonly<Record<string, RuntimeLiteralType>> = Object.freeze({
    number: 'number',
    boolean: 'boolean',
    string: 'string',
});
const PRIMITIVE_KIND: Readonly<Record<RuntimeLiteralType, PrimitiveKind>> = Object.freeze({
    number: PrimitiveKind.NUMBER,
    boolean: PrimitiveKind.BOOLEAN,
    string: PrimitiveKind.STRING,
});

const literalValue = (value: Extract<PhpAstValue, { kind: 'literal' }>) => {
    const readers = Object.freeze({
        number: () => ({ kind: 'number' as const, value: value.value }),
        boolean: () => ({ kind: 'boolean' as const, value: value.value }),
        null: () => ({ kind: 'null' as const, value: null }),
        string: () => ({ kind: 'string' as const, value: value.value }),
    });
    return readers[value.literalType]();
};

const literalBoundValue = (value: Extract<PhpAstValue, { kind: 'literal' }>) => {
    const readers = Object.freeze({
        number: () => ({ kind: 'number' as const, value: value.value }),
        boolean: () => ({ kind: 'boolean' as const, value: value.value }),
        null: () => ({ kind: 'null' as const }),
        string: () => ({ kind: 'string' as const, value: value.value }),
    });
    return readers[value.literalType]();
};

export function bindLiteralField(
    key: string,
    value: Extract<PhpAstValue, { kind: 'literal' }>,
): BoundResourceFieldResult {
    const runtimeType = relationOptionFold(
        relationFirst(Object.entries(RUNTIME_LITERAL_TYPE), entry => relationEqual(entry[0], typeof value.value)),
        () => 'string' as RuntimeLiteralType,
        entry => entry[1],
    );
    const primKind = PRIMITIVE_KIND[runtimeType];
    const primitive = scannerSemanticType.primitive(primKind);
    const boundAst = BoundSemanticFactory.primitive(primitive, literalBoundValue(value));
    const expression = ResourceFieldExpressionFactory.literal(literalValue(value));
    const binding = ResourceFieldSemanticBinding.fromExpression(
        key,
        expression,
        primitive,
        toCamelCase(key),
        boundAst,
    );
    return { binding, boundAst };
}

const verifiedType = (result: BoundResourceFieldResult, fallback: () => ErrorType) =>
    relationResolve(
        relationEqual(result.binding.semantic.kind, 'verified'),
        () => result.binding.semantic.type,
        fallback,
    );

const branchType = (
    first: BoundResourceFieldResult,
    second: BoundResourceFieldResult,
    message: string,
) => relationResolve(
    relationEqual(first.binding.semantic.kind, 'verified'),
    () => first.binding.semantic.type,
    () => relationResolve(
        relationEqual(second.binding.semantic.kind, 'verified'),
        () => second.binding.semantic.type,
        () => scannerSemanticType.error(message),
    ),
);

export function bindShortTernaryField(
    key: string,
    value: Extract<PhpAstValue, { kind: 'short_ternary' }>,
    modelSymbol: OriginModelSymbol,
    modelSymbolTable: ModelSymbolTable,
    bindFieldFn: BindField,
): BoundResourceFieldResult {
    const condition = bindFieldFn({ key, value: value.condition, modelSymbol, modelSymbolTable });
    const falsy = bindFieldFn({ key, value: value.falseBranch, modelSymbol, modelSymbolTable });
    const semanticType = branchType(condition, falsy, 'Short ternary branches could not be semantically resolved');
    const boundAst = BoundSemanticFactory.ternary({
        conditionExpression: SemanticValueFactory.conditionExpression(value.condition.kind),
        branches: { kind: 'then_else', whenTrue: condition.boundAst, whenFalse: falsy.boundAst },
        resultingType: semanticType,
    });
    const expression = ResourceFieldExpressionFactory.shortTernary(condition.binding.expression, falsy.binding.expression);
    const binding = ResourceFieldSemanticBinding.fromExpression(key, expression, semanticType, toCamelCase(key), boundAst);
    return { binding, boundAst };
}

const CAST_KIND: Readonly<Record<string, PrimitiveKind>> = Object.freeze({
    int: PrimitiveKind.NUMBER,
    float: PrimitiveKind.NUMBER,
    bool: PrimitiveKind.BOOLEAN,
    string: PrimitiveKind.STRING,
});

export function bindCastField(
    key: string,
    value: Extract<PhpAstValue, { kind: 'cast_expression' }>,
    modelSymbol: OriginModelSymbol,
    modelSymbolTable: ModelSymbolTable,
    bindFieldFn: BindField,
): BoundResourceFieldResult {
    const operand = bindFieldFn({ key, value: value.operand, modelSymbol, modelSymbolTable });
    const castKind = relationFirst(Object.entries(CAST_KIND), entry => relationEqual(entry[0], value.castType.kind));
    const semanticType = relationResolve(
        relationEqual(castKind.kind, 'some'),
        () => scannerSemanticType.primitive(relationOptionFold(castKind, () => PrimitiveKind.STRING, entry => entry[1])),
        () => verifiedType(operand, () => scannerSemanticType.error('Cast operand could not be semantically resolved')),
    );
    const expression = ResourceFieldExpressionFactory.typeCast(
        SemanticValueFactory.castTypeName(value.castType.kind),
        operand.binding.expression,
    );
    const boundAst = operand.boundAst;
    const binding = ResourceFieldSemanticBinding.fromExpression(key, expression, semanticType, toCamelCase(key), boundAst);
    return { binding, boundAst };
}

export function bindTernaryField(
    key: string,
    value: Extract<PhpAstValue, { kind: 'ternary_expression' }>,
    modelSymbol: OriginModelSymbol,
    modelSymbolTable: ModelSymbolTable,
    bindFieldFn: BindField,
): BoundResourceFieldResult {
    const trueBranch = bindFieldFn({ key, value: value.trueBranch, modelSymbol, modelSymbolTable });
    const falseBranch = bindFieldFn({ key, value: value.falseBranch, modelSymbol, modelSymbolTable });
    const semanticType = branchType(trueBranch, falseBranch, 'Ternary branches could not be semantically resolved');
    const boundAst = BoundSemanticFactory.ternary({
        conditionExpression: SemanticValueFactory.conditionExpression(value.condition.kind),
        branches: { kind: 'then_else', whenTrue: trueBranch.boundAst, whenFalse: falseBranch.boundAst },
        resultingType: semanticType,
    });
    const binding = ResourceFieldSemanticBinding.fromExpression(
        key,
        trueBranch.binding.expression,
        semanticType,
        toCamelCase(key),
        boundAst,
    );
    return { binding, boundAst };
}

const BINARY_OPERATOR: Readonly<Record<string, string>> = Object.freeze({
    addition: 'add', subtraction: 'subtract', multiplication: 'multiply', division: 'divide', modulo: 'modulo',
    equal: 'equal', identical: 'equal', not_equal: 'not_equal', not_identical: 'not_equal',
    less_than: 'less_than', less_or_equal: 'less_than_or_equal', greater_than: 'greater_than', greater_or_equal: 'greater_than_or_equal',
    logical_and: 'and', logical_or: 'or',
});
const NUMERIC_OPERATORS = Object.freeze(['add', 'subtract', 'multiply', 'divide', 'modulo']);
const BOOLEAN_OPERATORS = Object.freeze(['equal', 'not_equal', 'less_than', 'less_than_or_equal', 'greater_than', 'greater_than_or_equal', 'and', 'or']);

const binaryOperator = (kind: string) => ({
    kind: 'semantic_operator' as const,
    value: relationOptionFold(
        relationFirst(Object.entries(BINARY_OPERATOR), entry => relationEqual(entry[0], kind)),
        () => 'concat' as const,
        entry => entry[1],
    ),
});

export function bindBinaryField(
    key: string,
    value: Extract<PhpAstValue, { kind: 'binary_expression' }>,
    modelSymbol: OriginModelSymbol,
    modelSymbolTable: ModelSymbolTable,
    bindFieldFn: BindField,
): BoundResourceFieldResult {
    const left = bindFieldFn({ key, value: value.left, modelSymbol, modelSymbolTable });
    const right = bindFieldFn({ key, value: value.right, modelSymbol, modelSymbolTable });
    const verified = relationAll([
        relationEqual(left.binding.semantic.kind, 'verified'),
        relationEqual(right.binding.semantic.kind, 'verified'),
    ]);
    return relationResolve(
        verified,
        () => {
            const operator = binaryOperator(value.operator.kind);
            const resultingType = relationResolve(
                relationContains(NUMERIC_OPERATORS, operator.value),
                () => scannerSemanticType.number(),
                () => relationResolve(relationContains(BOOLEAN_OPERATORS, operator.value), () => scannerSemanticType.boolean(), () => left.binding.semantic.type),
            );
            const expression = ResourceFieldExpressionFactory.binary(operator, left.binding.expression, right.binding.expression);
            const boundAst = BoundSemanticFactory.binary({ operator, left: left.boundAst, right: right.boundAst, resultingType });
            const binding = ResourceFieldSemanticBinding.fromExpression(key, expression, resultingType, toCamelCase(key), boundAst);
            return { binding, boundAst };
        },
        () => bindFallbackField(key),
    );
}

export function bindNullCoalesceField(
    key: string,
    value: Extract<PhpAstValue, { kind: 'null_coalesce' }>,
    modelSymbol: OriginModelSymbol,
    modelSymbolTable: ModelSymbolTable,
    bindFieldFn: BindField,
): BoundResourceFieldResult {
    const left = bindFieldFn({ key, value: value.left, modelSymbol, modelSymbolTable });
    const right = bindFieldFn({ key, value: value.right, modelSymbol, modelSymbolTable });
    const verified = relationAll([
        relationEqual(left.binding.semantic.kind, 'verified'),
        relationEqual(right.binding.semantic.kind, 'verified'),
    ]);
    return relationResolve(
        verified,
        () => {
            const operator = { kind: 'semantic_operator' as const, value: 'null_coalesce' as const };
            const resultingType = relationResolve(
                left.binding.semantic.type.isNullable(),
                () => right.binding.semantic.type,
                () => left.binding.semantic.type,
            );
            const expression = ResourceFieldExpressionFactory.binary(operator, left.binding.expression, right.binding.expression);
            const boundAst = BoundSemanticFactory.binary({ operator, left: left.boundAst, right: right.boundAst, resultingType });
            const binding = ResourceFieldSemanticBinding.fromExpression(key, expression, resultingType, toCamelCase(key), boundAst);
            return { binding, boundAst };
        },
        () => bindFallbackField(key),
    );
}

export function bindFallbackField(key: string): BoundResourceFieldResult {
    const boundAst = BoundSemanticFactory.unsupported('unsupported_syntax');
    const expression = ResourceFieldExpressionFactory.unsupported('unsupported_syntax');
    const binding = ResourceFieldSemanticBinding.fromExpression(
        key,
        expression,
        scannerSemanticType.error('Resource expression requires semantic binding before a type can be assigned'),
        toCamelCase(key),
        boundAst,
    );
    return { binding, boundAst };
}
