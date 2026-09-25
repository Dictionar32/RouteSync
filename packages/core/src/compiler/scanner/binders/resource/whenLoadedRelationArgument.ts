import type { PhpArgument, PhpAstValue } from "../../lexer/PhpAst";
import { matchPhpAstValue } from "../../lexer/PhpAst";
import { createRelationName } from "../../../../types/upstream/names";
import type { RelationName } from "../../../../types/upstream/names";
import { matchLookup, type Lookup } from "../../../../types/upstream/collections";

export function readWhenLoadedRelation(argumentsAst: readonly PhpArgument[]): Lookup<RelationName> {
    return argumentsAst.reduce<Lookup<RelationName>>(
        (result, argument) => matchLookup(result, {
            missing: () => readRelationArgument(argument),
            found: () => result,
        }),
        { kind: 'missing' },
    );
}

const literalRelationReaders: {
    readonly string: (value: Extract<PhpAstValue, { kind: 'literal'; literalType: 'string' }>) => Lookup<RelationName>;
    readonly number: (value: Extract<PhpAstValue, { kind: 'literal'; literalType: 'number' }>) => Lookup<RelationName>;
    readonly boolean: (value: Extract<PhpAstValue, { kind: 'literal'; literalType: 'boolean' }>) => Lookup<RelationName>;
    readonly null: (value: Extract<PhpAstValue, { kind: 'literal'; literalType: 'null' }>) => Lookup<RelationName>;
} = {
    string: (value) => ({ kind: 'found', value: createRelationName(value.value) }),
    number: missingLiteral,
    boolean: missingLiteral,
    null: missingLiteral,
};

function missingLiteral(_: Extract<PhpAstValue, { kind: 'literal' }>): Lookup<RelationName> {
    return { kind: 'missing' };
}

function readRelationArgument(argument: PhpArgument): Lookup<RelationName> {
    return matchPhpAstValue(argument.value, {
        literal: (value) => literalRelationReaders[value.literalType](value),
        resourceSingle: missingArgument, resourceCollection: missingArgument, methodChain: missingArgument,
        propertyAccess: missingArgument, arrayAccess: missingArgument, functionCall: missingArgument,
        variableReference: missingArgument, shortTernary: missingArgument, nullCoalesce: missingArgument,
        binaryExpression: missingArgument, unaryExpression: missingArgument, castExpression: missingArgument,
        ternaryExpression: missingArgument, nestedArray: missingArgument, staticCall: missingArgument,
        classConstant: missingArgument,
        classReference: missingArgument, construct: missingArgument, dynamicConstruct: missingArgument, instanceOf: missingArgument,
        closure: missingArgument, arrowFunction: missingArgument, matchExpression: missingArgument, unsupported: missingArgument,
    });
}

function missingArgument(_: PhpAstValue): Lookup<RelationName> {
    return { kind: 'missing' };
}
