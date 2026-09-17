import type { ArrayEntryAstNode, BinaryAstNode, LiteralAstNode, PhpAstNode, VariableAstNode } from '../packages/core/src/types/domain/phpAst/nodes';
import type { PhpBinaryOperator, PhpCastType, PhpVariableName, ArrayKey } from '../packages/core/src/types/domain/phpAst/astValues';

const binaryOperator: PhpBinaryOperator = 'addition';
const castType: PhpCastType = 'string';
const variableName: PhpVariableName = { kind: 'variable_name', value: 'user' };
const implicitKey: ArrayKey = { kind: 'implicit' };

const literal: LiteralAstNode = {
    kind: 'literal',
    originalCode: 'null',
    source: { kind: 'absent' },
    value: { kind: 'null' }
};

const variable: VariableAstNode = {
    kind: 'variable',
    originalCode: '$user',
    source: { kind: 'absent' },
    name: variableName
};

const binary: BinaryAstNode = {
    kind: 'binary',
    originalCode: '$a + $b',
    source: { kind: 'absent' },
    operator: binaryOperator,
    left: variable,
    right: literal
};

const entry: ArrayEntryAstNode = { key: implicitKey, value: binary };
const ast: PhpAstNode = entry.value;
void ast;
void castType;
