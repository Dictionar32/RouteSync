import type { SourceSpan } from '../../../../types/upstream/provenance';
import type { ModelInheritance } from '../../../../types/upstream/model';
import type { ModelMethodFact, ModelConstantFact, ModelTraitFacts } from '../../../../types/upstream/modelSourceFacts';
import type { ClassName, ConstantName, MethodName, TraitName } from '../../../../types/upstream/names';
import type { Sequence } from '../../../../types/upstream/collections';
import type { ModelDeclarationAst } from '../../lexer';
import type { PhpAstValue } from '../../lexer/PhpAst';
import type { TypeExpression } from '../../../../types/upstream/typeVocabulary';
import type { StringValue } from '../../../../types/upstream/valueObjects';

const text = (value: string): StringValue => ({ kind: 'string_value', value });
const className = (value: string): ClassName => ({ kind: 'class_name', value: text(value) });
const methodName = (value: string): MethodName => ({ kind: 'method_name', value: text(value) });
const constantName = (value: string): ConstantName => ({ kind: 'constant_name', value: text(value) });
const traitName = (value: string): TraitName => ({ kind: 'trait_name', value: text(value) });
const sequence = <T>(items: readonly T[]): Sequence<T> => items.reduceRight<Sequence<T>>((tail, head) => ({ kind: 'cons', head, tail }), { kind: 'empty' });
const primitiveNames = { string: { kind: 'string' }, int: { kind: 'number' }, integer: { kind: 'number' }, float: { kind: 'number' }, bool: { kind: 'boolean' }, boolean: { kind: 'boolean' }, date: { kind: 'date_time' }, datetime: { kind: 'date_time' }, array: { kind: 'json' } } as const;
const primitiveType = (value: PhpAstValue): TypeExpression => {
  if (value.kind !== 'class_reference') return { kind: 'reference', value: { kind: 'class', name: className('mixed') } };
  const raw = value.className.value;
  const primitive = primitiveNames[raw.toLowerCase() as keyof typeof primitiveNames];
  return primitive ? { kind: 'primitive', value: primitive } : { kind: 'reference', value: { kind: 'class', name: className(raw) } };
};
const span = (file: SourceSpan['file'], start: number, end: number): SourceSpan => ({ kind: 'source_span', file, start: { kind: 'number_value', value: start }, end: { kind: 'number_value', value: end } });

export function parseModelSourceFacts(declaration: ModelDeclarationAst, source: SourceSpan) {
  const inheritance: ModelInheritance = declaration.inheritance.kind === 'eloquent_model'
    ? { kind: 'eloquent_model' }
    : declaration.inheritance.kind === 'authenticatable'
      ? { kind: 'authenticatable' }
      : { kind: 'class', name: className(declaration.inheritance.name.value) };
  const traits: ModelTraitFacts = { kind: 'model_traits', items: sequence(declaration.traits.map(item => traitName(item.value))) };
  const methods: ModelMethodFact[] = declaration.methods.map(item => ({
    kind: 'model_method', name: methodName(item.name.value), result: primitiveType(item.returnType),
    body: span(source.file, Number(item.bodyStart.value), Number(item.bodyEnd.value)),
    source: span(source.file, Number(item.startOffset.value), Number(item.endOffset.value))
  }));
  const constants: ModelConstantFact[] = declaration.constants.map(item => ({
    kind: 'model_constant', name: constantName(item.name.value),
    value: { kind: 'expression', value: item.value, source },
    source: span(source.file, Number(item.startOffset.value), Number(item.endOffset.value))
  }));
  return { inheritance, traits, methods, constants };
}
