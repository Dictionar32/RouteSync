import * as fs from 'node:fs';
import path from 'path';
import type { DeclaredResponseAttributeAst } from '../../lexer/controllerAstTypes';
import type { PhpAstValue } from '../../lexer/phpAstTypes';
import type { ControllerReturnSet } from './controllerDataflowContract';
import type { ResponseDescriptor } from '../../../../types/route';
import { InlineResponseDescriptor } from '../../../../types/route';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';
import { readResponseDtoAnalysis } from './responseDtoReader';
import type { ResponseContractField, ResponseValueContract } from '../../../../types/domain/responseContracts';
import { createResponseFieldName } from '../../../../types/domain/semanticValueFactories';

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

export function resolveResponseAttributeAst(attribute: DeclaredResponseAttributeAst, projectRoot: string, returned: ControllerReturnSet): ResponseDescriptor {
  const className = attribute.className;
  const classFile = resolveClassFile(projectRoot, className);
  const analysis = readResponseDtoAnalysis(classFile);
  const fields = analysis.fields;
  const contractFields = resolveObservedFields(analysis.contractFields, returned);
  const trace = [
    { kind: 'class_resolution' as const, className: SemanticValueFactory.className(className), sourceFile: SemanticValueFactory.sourceFilePath(classFile) },
    { kind: 'property_extraction' as const, propertyCount: fields.length },
    { kind: 'semantic_resolution' as const, resolvedCount: contractFields.length },
    ...(returned.expressions.length > 0 ? [{ kind: 'observed_return' as const, fieldCount: contractFields.length }] : [])
  ];
  const responseTypeName = SemanticValueFactory.responseTypeName(className);
  return new InlineResponseDescriptor({
    domain: SemanticValueFactory.domainName(className),
    baseName: SemanticValueFactory.resourceName(className),
    typeName: responseTypeName,
    fields,
    shape: attribute.collection ? 'collection' : 'single',
    origin: { kind: 'attribute', className: SemanticValueFactory.className(className), sourceFile: SemanticValueFactory.sourceFilePath(classFile), trace },
    semanticContract: {
      kind: 'object',
      name: responseTypeName,
      shape: attribute.collection ? 'collection' : 'single',
      fields: contractFields
    }
  });
}

function resolveClassFile(projectRoot: string, className: string): string {
  const relative = className.replace(/^App\\/, '').replace(/\\/g, '/');
  const file = path.join(projectRoot, 'app', `${relative}.php`);
  if (fs.existsSync(file)) return file;

  const shortName = className.split('\\').pop() ?? className;
  const matches: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const candidate = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(candidate);
      else if (entry.isFile() && entry.name === `${shortName}.php`) matches.push(candidate);
    }
  };
  visit(path.join(projectRoot, 'app'));
  if (matches.length === 1) return matches[0];
  const found = matches.length > 1 ? matches.join(', ') : file;
  throw new Error(`Response boundary violation: ${className} resolved from attribute but source file was not found uniquely: ${found}`);
}



function resolveObservedFields(
  declared: readonly ResponseContractField[],
  returned: ControllerReturnSet
): readonly ResponseContractField[] {
  const observedByField = collectObservedFields(returned);
  const declaredByName = new Map(declared.map(field => [field.name.value, field]));
  const names = new Set([...declaredByName.keys(), ...observedByField.keys()]);
  return Object.freeze([...names].map(name => {
    const declaredField = declaredByName.get(name);
    const observed = observedByField.get(name);
    if (declaredField && observed) {
      return Object.freeze({
        ...declaredField,
        value: mergeObservedValues(declaredField.value, observed),
        evidence: { kind: 'declared_and_observed' as const }
      });
    }
    if (declaredField) return declaredField;
    return Object.freeze({
      name: createObservedFieldName(name),
      value: inferObservedValue(observed ?? []),
      nullability: { kind: 'required' as const },
      evidence: { kind: 'observed' as const }
    });
  }));
}

function collectObservedFields(returned: ControllerReturnSet): Map<string, PhpAstValue[]> {
  const fields = new Map<string, PhpAstValue[]>();
  for (const item of returned.expressions) {
    if (item.kind !== 'present' || item.value.kind !== 'nested_array') continue;
    for (const entry of item.value.entries) {
      if (entry.kind !== 'keyed' || entry.key.kind !== 'string') continue;
      const values = fields.get(entry.key.value) ?? [];
      values.push(entry.value);
      fields.set(entry.key.value, values);
    }
  }
  return fields;
}

function createObservedFieldName(name: string): ResponseContractField['name'] {
  return createResponseFieldName(name);
}

function inferObservedValue(values: readonly PhpAstValue[]): ResponseValueContract {
  const contracts = values.map(inferPhpAstValue).filter((value): value is ResponseValueContract => value !== undefined);
  if (contracts.length === 0) return { kind: 'unresolved_declaration', reason: 'mixed_declaration' };
  return mergeContracts(contracts);
}

function inferPhpAstValue(value: PhpAstValue): ResponseValueContract | undefined {
  if (value.kind === 'literal') {
    switch (value.literalType) {
      case 'null': return { kind: 'null' };
      case 'string': return { kind: 'scalar', value: { kind: 'textual' } };
      case 'number': return { kind: 'scalar', value: { kind: 'decimal_number' } };
      case 'boolean': return { kind: 'scalar', value: { kind: 'boolean_flag' } };
    }
  }
  if (value.kind === 'nested_array') return inferNestedArray(value.entries);
  return undefined;
}

function inferNestedArray(entries: Extract<PhpAstValue, { kind: 'nested_array' }>['entries']): ResponseValueContract {
  const keyed = entries.filter((entry): entry is Extract<typeof entry, { kind: 'keyed' }> => entry.kind === 'keyed');
  if (keyed.length === entries.length) {
    const fields = keyed.map(entry => ({
      name: createResponseFieldName(entry.key.value),
      value: inferObservedValue([entry.value]),
      nullability: { kind: 'required' as const },
      evidence: { kind: 'observed' as const }
    }));
    return { kind: 'object', fields: Object.freeze(fields) };
  }
  const values = entries.map(entry => inferPhpAstValue(entry.value)).filter((value): value is ResponseValueContract => value !== undefined);
  return { kind: 'collection', element: values.length === 0 ? { kind: 'unresolved_declaration', reason: 'mixed_declaration' } : mergeContracts(values) };
}

function mergeObservedValues(declared: ResponseValueContract, observed: readonly PhpAstValue[]): ResponseValueContract {
  const inferred = observed.map(inferPhpAstValue).filter((value): value is ResponseValueContract => value !== undefined);
  if (inferred.length === 0) return declared;
  return mergeContracts([declared, ...inferred]);
}

function mergeContracts(values: readonly ResponseValueContract[]): ResponseValueContract {
  const unique = new Map(values.map(value => [JSON.stringify(value), value]));
  const members = [...unique.values()];
  if (members.length === 1) return members[0];
  return { kind: 'union', members: Object.freeze(members) };
}
