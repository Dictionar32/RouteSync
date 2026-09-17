import type { PhpBinaryOperator, PhpUnaryOperator, PhpCastType, ArrayKey } from '../packages/core/src/types/domain/phpAst/astValues';

const binary: PhpBinaryOperator = { kind: 'addition' };
const unary: PhpUnaryOperator = { kind: 'negative' };
const cast: PhpCastType = { kind: 'string' };
const implicit: ArrayKey = { kind: 'implicit' };

if (binary.kind !== 'addition') throw new Error('binary operator ADT lost');
if (unary.kind !== 'negative') throw new Error('unary operator ADT lost');
if (cast.kind !== 'string') throw new Error('cast type ADT lost');
if (implicit.kind !== 'implicit') throw new Error('array key ADT lost');
