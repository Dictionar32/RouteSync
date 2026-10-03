import * as fs from 'node:fs';
import path from 'path';
import type { DeclaredResponseAttributeAst } from '../../lexer/controllerAstTypes';
import type { SourceProjectIdentity } from '../../../../types/upstream/highLevelSourceModel';
import type { PhpAstValue } from '../../lexer/phpAstTypes';
import type { ControllerReturnSet } from './controllerDataflowContract';
import type { ResponseDescriptor } from '../../../../types/route';
import { relationUnique } from '../../../../semantic/kernel/relationMembership';
import { InlineResponseDescriptor } from '../../../../types/route';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';
import { readResponseDtoAnalysis } from './responseDtoReader';
import type { ResponseContractField, ResponseValueContract } from '../../../../types/domain/responseContracts';
import { createResponseFieldName } from '../../../../types/domain/semanticValueFactories';
import { relationEqual, relationFold, relationGate, relationProject, relationSelect, relationOptionFold, relationSome, relationNone, relationFirstOption, type RelationOption } from '../../../../semantic/kernel/relationalSequence';

export interface ResponseAttributeResolution {
  readonly descriptor: ResponseDescriptor;
  readonly trace: readonly ResponseTraceEntry[];
}

export interface ResponseTraceEntry {
  readonly stage: string;
  readonly rule: string;
  readonly input: string;
  readonly output: string;
}

type ObservedField = readonly [string, readonly PhpAstValue[]];
type ContractField = readonly [string, ResponseContractField];

export function resolveResponseAttributeAst(attribute: DeclaredResponseAttributeAst, sourceProject: SourceProjectIdentity, returned: ControllerReturnSet): ResponseDescriptor {
  const className = attribute.className;
  const classFile = resolveClassFile(sourceProject, className);
  const analysis = readResponseDtoAnalysis(classFile);
  const fields = analysis.fields;
  const contractFields = resolveObservedFields(analysis.contractFields, returned);
  const observedReturn = relationEqual(returned.expressions.length > 0, true);
  const trace = relationProject(
    [
      { kind: 'class_resolution' as const, className: SemanticValueFactory.className(className), sourceFile: SemanticValueFactory.sourceFilePath(classFile) },
      { kind: 'property_extraction' as const, propertyCount: fields.length },
      { kind: 'semantic_resolution' as const, resolvedCount: contractFields.length },
      { kind: 'observed_return' as const, fieldCount: contractFields.length },
    ],
    (entry) => relationGate(relationEqual(entry.kind, 'observed_return'), () => relationGate(observedReturn, () => entry, () => ({ kind: 'observed_return' as const, fieldCount: -1 })), () => entry),
  );
  const visibleTrace = relationSelect(trace, entry => relationGate(relationEqual(entry.kind, 'observed_return'), () => entry.fieldCount >= 0, () => true));
  const responseTypeName = SemanticValueFactory.responseTypeName(className);
  const shape = relationGate(attribute.collection, () => 'collection' as const, () => 'single' as const);
  return InlineResponseDescriptor.create({
    domain: SemanticValueFactory.domainName(className),
    baseName: SemanticValueFactory.resourceName(className),
    typeName: responseTypeName,
    fields,
    shape,
    origin: { kind: 'attribute', className: SemanticValueFactory.className(className), sourceFile: SemanticValueFactory.sourceFilePath(classFile), trace: visibleTrace },
    semanticContract: { kind: 'object', name: responseTypeName, shape, fields: contractFields },
  });
}

function resolveClassFile(sourceProject: SourceProjectIdentity, className: string): string {
  const sourceRoot = sourceProject.root.value.value;
  const relative = className.replace(/^App\\/, '').replace(/\\/g, '/');
  const file = path.join(sourceRoot, 'app', `${relative}.php`);
  return relationGate(
    fs.existsSync(file),
    () => file,
    () => resolveFallbackClassFile(sourceRoot, className, file),
  );
}

function resolveFallbackClassFile(sourceRoot: string, className: string, fallback: string): string {
  const parts = className.split('\\');
  const shortName = parts[parts.length - 1];
  const matches = collectPhpMatches(path.join(sourceRoot, 'app'), shortName);
  const found = relationGate(matches.length > 1, () => matches.join(', '), () => fallback);
  return relationGate(relationEqual(matches.length, 1), () => matches[0], () => {
    throw Error(`Response boundary violation: ${className} resolved from attribute but source file was not found uniquely: ${found}`);
  });
}

function collectPhpMatches(directory: string, shortName: string): readonly string[] {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  return relationFold(entries, Object.freeze([] as string[]), (matches, entry) => {
    const candidate = path.join(directory, entry.name);
    const fileMatch = relationGate(entry.isFile(), () => relationGate(relationEqual(entry.name, `${shortName}.php`), () => [candidate], () => []), () => []);
    const nested = relationGate(entry.isDirectory(), () => collectPhpMatches(candidate, shortName), () => []);
    return Object.freeze([...matches, ...fileMatch, ...nested]);
  });
}

function resolveObservedFields(declared: readonly ResponseContractField[], returned: ControllerReturnSet): readonly ResponseContractField[] {
  const observedByField = collectObservedFields(returned);
  const declaredByName = relationProject(declared, field => [field.name.value, field] as ContractField);
  const names = relationProject(relationUnique([...relationProject(declaredByName, entry => entry[0]), ...relationProject(observedByField, entry => entry[0])]), name => name);
  return Object.freeze(relationProject(names, name => {
    const declaredField = relationOptionFold(relationFirstOption(declaredByName, entry => relationEqual(entry[0], name)), () => relationNone<ResponseContractField>(), entry => relationSome(entry[1]));
    const observed = relationOptionFold(relationFirstOption(observedByField, entry => relationEqual(entry[0], name)), () => relationNone<readonly PhpAstValue[]>(), entry => relationSome(entry[1]));
    return relationOptionFold(declaredField, () => ({ name: createObservedFieldName(name), value: relationOptionFold(observed, () => ({ kind: 'unresolved_declaration' as const, reason: 'mixed_declaration' as const }), inferObservedValue), nullability: { kind: 'required' as const }, evidence: { kind: 'observed' as const } }), field => relationOptionFold(observed, () => field, values => Object.freeze({ ...field, value: mergeObservedValues(field.value, values), evidence: { kind: 'declared_and_observed' as const } })));
  }));
}

function collectObservedFields(returned: ControllerReturnSet): readonly ObservedField[] {
  const observed = relationProject(returned.expressions, item => relationGate(relationEqual(item.kind, 'present'), () => relationGate(relationEqual(item.value.kind, 'nested_array'), () => item.value.entries, () => []), () => []));
  return relationFold(observed, Object.freeze([] as ObservedField[]), (fields, entries) => relationFold(entries, fields, (accumulator, entry) => relationGate(relationEqual(entry.kind, 'keyed'), () => relationGate(relationEqual(entry.key.kind, 'string'), () => appendObserved(accumulator, entry.key.value, entry.value), () => accumulator), () => accumulator)));
}

function appendObserved(fields: readonly ObservedField[], name: string, value: PhpAstValue): readonly ObservedField[] {
  const current = relationOptionFold(relationFirstOption(fields, entry => relationEqual(entry[0], name)), () => relationNone<ObservedField>(), entry => relationSome(entry));
  return relationOptionFold(current, () => Object.freeze([...fields, [name, Object.freeze([value])] as const]), entry => Object.freeze(relationProject(fields, item => relationGate(relationEqual(item[0], name), () => [name, Object.freeze([...item[1], value])] as const, () => item))));
}

function createObservedFieldName(name: string): ResponseContractField['name'] { return createResponseFieldName(name); }

function inferObservedValue(values: readonly PhpAstValue[]): ResponseValueContract {
  const contracts = relationProject(values, inferPhpAstValue);
  const resolved = relationSelect(contracts, (value): value is { readonly kind: 'some'; readonly value: ResponseValueContract } => relationEqual(value.kind, 'some'));
  return relationGate(relationEqual(resolved.length, 0), () => ({ kind: 'unresolved_declaration' as const, reason: 'mixed_declaration' as const }), () => mergeContracts(relationProject(resolved, value => value.value)));
}

type InferredValue = RelationOption<ResponseValueContract>;

function inferPhpAstValue(value: PhpAstValue): InferredValue {
  return relationGate(relationEqual(value.kind, 'literal'), () => relationGate(relationEqual(value.literalType, 'null'), () => relationSome({ kind: 'null' as const }), () => relationGate(relationEqual(value.literalType, 'string'), () => relationSome({ kind: 'scalar' as const, value: { kind: 'textual' as const } }), () => relationGate(relationEqual(value.literalType, 'number'), () => relationSome({ kind: 'scalar' as const, value: { kind: 'decimal_number' as const } }), () => relationSome({ kind: 'scalar' as const, value: { kind: 'boolean_flag' as const } })))), () => relationGate(relationEqual(value.kind, 'nested_array'), () => relationSome(inferNestedArray(value.entries)), () => relationNone<ResponseValueContract>()));
}

function inferNestedArray(entries: Extract<PhpAstValue, { kind: 'nested_array' }>['entries']): ResponseValueContract {
  const keyed = relationSelect(entries, (entry): entry is Extract<typeof entry, { kind: 'keyed' }> => relationEqual(entry.kind, 'keyed'));
  return relationGate(relationEqual(keyed.length, entries.length), () => ({ kind: 'object' as const, fields: Object.freeze(relationProject(keyed, entry => ({ name: createResponseFieldName(entry.key.value), value: inferObservedValue([entry.value]), nullability: { kind: 'required' as const }, evidence: { kind: 'observed' as const } }))) }), () => ({ kind: 'collection' as const, element: inferObservedValue(relationProject(entries, entry => entry.value)) }));
}

function mergeObservedValues(declared: ResponseValueContract, observed: readonly PhpAstValue[]): ResponseValueContract {
  const inferred = relationSelect(relationProject(observed, inferPhpAstValue), value => relationEqual(value.kind, 'some'));
  return relationGate(relationEqual(inferred.length, 0), () => declared, () => mergeContracts([declared, ...relationProject(inferred, value => value.value)]));
}

function mergeContracts(values: readonly ResponseValueContract[]): ResponseValueContract {
  const unique = relationFold(values, Object.freeze([] as ResponseValueContract[]), (members, value) => relationGate(relationAnyEqual(members, value), () => members, () => Object.freeze([...members, value])));
  return relationGate(relationEqual(unique.length, 1), () => unique[0], () => ({ kind: 'union', members: Object.freeze(unique) }));
}

function relationAnyEqual(values: readonly ResponseValueContract[], value: ResponseValueContract): boolean {
  const encoded = JSON.stringify(value);
  return relationSelect(values, member => relationEqual(JSON.stringify(member), encoded)).length > 0;
}
