import type { TokenDescriptor } from '../../LaravelSourceLexer';
import type { SourceSpan } from '../../../../types/upstream/provenance';
import type { ModelInheritance } from '../../../../types/upstream/model';
import type { ModelMethodFact, ModelConstantFact, ModelTraitFacts } from '../../../../types/upstream/modelSourceFacts';
import type { TypeExpression } from '../../../../types/upstream/typeVocabulary';
import type { Sequence } from '../../../../types/upstream/collections';
import type { ClassName, ConstantName, MethodName, TraitName } from '../../../../types/upstream/names';
import type { StringValue } from '../../../../types/upstream/valueObjects';

const text = (value: string): StringValue => ({ kind: 'string_value', value });
const className = (value: string): ClassName => ({ kind: 'class_name', value: text(value) });
const methodName = (value: string): MethodName => ({ kind: 'method_name', value: text(value) });
const constantName = (value: string): ConstantName => ({ kind: 'constant_name', value: text(value) });
const traitName = (value: string): TraitName => ({ kind: 'trait_name', value: text(value) });
const primitiveNames = { string: { kind: 'string' }, int: { kind: 'number' }, integer: { kind: 'number' }, float: { kind: 'number' }, bool: { kind: 'boolean' }, boolean: { kind: 'boolean' }, date: { kind: 'date_time' }, datetime: { kind: 'date_time' }, array: { kind: 'json' } } as const;
const primitiveType = (value: string): TypeExpression => primitiveNames[value.toLowerCase() as keyof typeof primitiveNames] ? { kind: 'primitive', value: primitiveNames[value.toLowerCase() as keyof typeof primitiveNames] } : { kind: 'reference', value: { kind: 'class', name: className(value) } };
const span = (file: SourceSpan['file'], start: number, end: number): SourceSpan => ({ kind: 'source_span', file, start: { kind: 'number_value', value: start }, end: { kind: 'number_value', value: end } });
const token = (tokens: readonly TokenDescriptor[], index: number): TokenDescriptor => tokens[Math.min(index, tokens.length - 1)];
const sequence = <T>(items: readonly T[]): Sequence<T> => items.reduceRight<Sequence<T>>((tail, head) => ({ kind: 'cons', head, tail }), { kind: 'empty' });

function matching(tokens: readonly TokenDescriptor[], start: number): number {
    const walk = (index: number, depth: number): number => index >= tokens.length ? tokens.length - 1 : Object.is(tokens[index].value, '{') ? walk(index + 1, depth + 1) : Object.is(tokens[index].value, '}') ? (Object.is(depth, 1) ? index : walk(index + 1, depth - 1)) : walk(index + 1, depth);
    return walk(start, 0);
}

function inheritance(tokens: readonly TokenDescriptor[]): ModelInheritance {
    const index = tokens.findIndex(item => Object.is(item.value, 'extends'));
    const value = token(tokens, index + 1).value;
    return Object.is(value, 'Authenticatable') ? { kind: 'authenticatable' } : index >= 0 ? { kind: 'class', name: className(value) } : { kind: 'eloquent_model' };
}
function traits(tokens: readonly TokenDescriptor[], classIndex: number): ModelTraitFacts {
    const start = tokens.findIndex((item, index) => index > classIndex && Object.is(item.value, '{'));
    const items = tokens.slice(start + 1).reduce((found, item) => Object.is(item.value, ';') ? found : Object.is(item.value, 'use') ? found : found, [] as TraitName[]);
    const uses = tokens.slice(start + 1).reduce((found, item, index, all) => Object.is(item.value, 'use') ? found.concat(all.slice(index + 1).filter(value => Object.is(value.type, 'IDENTIFIER')).map(value => traitName(value.value)).slice(0, all.slice(index + 1).findIndex(value => Object.is(value.value, ';')))) : found, items);
    return { kind: 'model_traits', items: sequence(uses) };
}
function methods(tokens: readonly TokenDescriptor[], source: SourceSpan): ModelMethodFact[] {
    return tokens.reduce((result, item, index) => {
        if (!Object.is(item.value, 'function')) return result;
        const name = token(tokens, index + 1);
        if (!Object.is(name.type, 'IDENTIFIER')) return result;
        const brace = tokens.findIndex((value, cursor) => cursor > index + 1 && Object.is(value.value, '{'));
        if (brace < 0) return result;
        const close = matching(tokens, brace);
        const colon = tokens.slice(index + 2, brace).findIndex(value => Object.is(value.value, ':'));
        const returnToken = token(tokens, index + 2 + colon + 1);
        return result.concat({ kind: 'model_method', name: methodName(name.value), result: colon >= 0 ? primitiveType(returnToken.value) : { kind: 'mixed' }, body: span(source.file, Number(token(tokens, brace).startOffset), Number(token(tokens, close).endOffset)), source: span(source.file, Number(item.startOffset), Number(token(tokens, close).endOffset)) });
    }, [] as ModelMethodFact[]);
}
function constants(tokens: readonly TokenDescriptor[], source: SourceSpan): ModelConstantFact[] {
    return tokens.reduce((result, item, index) => {
        const name = token(tokens, index + 1);
        const value = token(tokens, index + 3);
        const literal = Object.is(value.type, 'STRING') ? { kind: 'string_literal' as const, value: text(value.value) } : Object.is(value.type, 'NUMBER') ? { kind: 'number_literal' as const, value: { kind: 'number_value' as const, value: Number(value.value) } } : Object.is(value.value, 'true') || Object.is(value.value, 'false') ? { kind: 'boolean_literal' as const, value: { kind: 'truth_value' as const, value: Object.is(value.value, 'true') } } : { kind: 'absent' as const };
        const valid = Object.is(item.value, 'const') && Object.is(name.type, 'IDENTIFIER') && !Object.is(literal.kind, 'absent');
        return valid ? result.concat({ kind: 'model_constant', name: constantName(name.value), value: { kind: 'literal', value: literal as Exclude<typeof literal, { readonly kind: 'absent' }>, source }, source }) : result;
    }, [] as ModelConstantFact[]);
}
export function parseModelSourceFacts(tokens: readonly TokenDescriptor[], source: SourceSpan) {
    return { inheritance: inheritance(tokens), traits: traits(tokens, tokens.findIndex(item => Object.is(item.value, 'class'))), methods: methods(tokens, source), constants: constants(tokens, source) };
}
