import { toSnakeCase } from '../../utils/resource-naming';
import { stringValue as createStringValue, type StringValue, type StringValueFactoryInterface } from './valueObjects';

/** Canonical upstream text-ingestion factory; names.ts must not define a competing constructor. */
export const stringValue: StringValueFactoryInterface = createStringValue;
export interface ModelName { readonly kind: 'model_name'; readonly value: StringValue }
export interface EnumName { readonly kind: 'enum_name'; readonly value: StringValue }
export interface ServiceName { readonly kind: 'service_name'; readonly value: StringValue }
export interface ResourceName { readonly kind: 'resource_name'; readonly value: StringValue }
export interface PropertyName { readonly kind: 'property_name'; readonly value: StringValue }
export interface RouteParameterName { readonly kind: 'route_parameter_name'; readonly value: StringValue }
export interface VariableName { readonly kind: 'variable_name'; readonly value: StringValue }
export interface ClassName { readonly kind: 'class_name'; readonly value: StringValue }
export interface ColumnName { readonly kind: 'column_name'; readonly value: StringValue }
export interface RelationName { readonly kind: 'relation_name'; readonly value: StringValue }
export interface RouteName { readonly kind: 'route_name'; readonly value: StringValue }
export interface RoutePath { readonly kind: 'route_path'; readonly value: StringValue }
export interface ControllerName { readonly kind: 'controller_name'; readonly value: StringValue }
export interface RequestName { readonly kind: 'request_name'; readonly value: StringValue }
export interface FormTypeName { readonly kind: 'form_type_name'; readonly value: StringValue }
export interface ActionName { readonly kind: 'action_name'; readonly value: StringValue }
export interface ConstantName { readonly kind: 'constant_name'; readonly value: StringValue }
export interface IndexName { readonly kind: 'index_name'; readonly value: StringValue }
export interface ExceptionName { readonly kind: 'exception_name'; readonly value: StringValue }
export const createExceptionName = (value: string): ExceptionName => Object.freeze({ kind: 'exception_name' as const, value: stringValue.create(value) });
export interface MethodName { readonly kind: 'method_name'; readonly value: StringValue }
export interface FunctionName { readonly kind: 'function_name'; readonly value: StringValue }
export interface ResponseTypeName { readonly kind: 'response_type_name'; readonly value: StringValue }
export interface SourceFile { readonly kind: 'source_file'; readonly value: StringValue }

/** Domain-owned source-file identity constructor: runtime callers must provide typed source text. */
export interface SourceFileIdentityFactoryInterface {
  readonly create: (sourcePath: StringValue) => SourceFile;
}

export const sourceFileIdentityFactory: SourceFileIdentityFactoryInterface = Object.freeze({
  create: (sourcePath: StringValue): SourceFile => Object.freeze({ kind: 'source_file' as const, value: sourcePath }),
});

/** Domain-owned ordered source-file inventory; source identities are not represented as raw arrays. */
export interface SourceFileIdentityInventoryCardinalityHandlers<Result> {
  readonly onNoMatch: (cardinality: Extract<SourceFileIdentityInventoryCardinality, { readonly kind: 'source_file_identity_inventory_no_match' }>) => Result;
  readonly onOneMatch: (cardinality: Extract<SourceFileIdentityInventoryCardinality, { readonly kind: 'source_file_identity_inventory_one_match' }>) => Result;
  readonly onMultipleMatches: (cardinality: Extract<SourceFileIdentityInventoryCardinality, { readonly kind: 'source_file_identity_inventory_multiple_matches' }>) => Result;
}

export interface SourceFileIdentityInventoryCardinalityOperations {
  readonly includeRelation: (relation: SourceFileIdentityRelationJudgment) => SourceFileIdentityInventoryCardinality;
  readonly continueWith: <Result>(handlers: SourceFileIdentityInventoryCardinalityHandlers<Result>) => Result;
}

export type SourceFileIdentityInventoryCardinality =
  | (Readonly<{ readonly kind: 'source_file_identity_inventory_no_match' }> & SourceFileIdentityInventoryCardinalityOperations)
  | (Readonly<{ readonly kind: 'source_file_identity_inventory_one_match' }> & SourceFileIdentityInventoryCardinalityOperations)
  | (Readonly<{ readonly kind: 'source_file_identity_inventory_multiple_matches' }> & SourceFileIdentityInventoryCardinalityOperations);

export interface SourceFileIdentityInventoryCardinalityFactoryInterface {
  readonly noMatch: () => Extract<SourceFileIdentityInventoryCardinality, { readonly kind: 'source_file_identity_inventory_no_match' }>;
  readonly oneMatch: () => Extract<SourceFileIdentityInventoryCardinality, { readonly kind: 'source_file_identity_inventory_one_match' }>;
  readonly multipleMatches: () => Extract<SourceFileIdentityInventoryCardinality, { readonly kind: 'source_file_identity_inventory_multiple_matches' }>;
}

export interface SourceFileInventoryHandlers<Result> {
  readonly onEmpty: () => Result;
  readonly onSource: (sourceFile: SourceFile, remaining: SourceFileInventory) => Result;
}

export interface SourceFileInventoryOperations {
  readonly include: (sourceFile: SourceFile) => SourceFileInventory;
  readonly continueWith: <Result>(handlers: SourceFileInventoryHandlers<Result>) => Result;
  /** Returns explicit domain cardinality using canonical source-file identity semantics. */
  readonly identityCardinalityAs: (sourceFile: SourceFile) => SourceFileIdentityInventoryCardinality;
  /** Returns only source entries whose canonical identity occurs more than once. */
  readonly duplicateIdentities: () => SourceFileInventory;
  readonly format: (separator: StringValue) => StringValue;
  /** Materializes ordered domain evidence for callers to compose their own typed operation. */
  readonly toSourceFiles: () => readonly SourceFile[];
}

export type SourceFileInventory =
  | (Readonly<{ readonly kind: 'source_file_inventory_empty' }> & SourceFileInventoryOperations)
  | (Readonly<{ readonly kind: 'source_file_inventory_entry'; readonly sourceFile: SourceFile; readonly remaining: SourceFileInventory }> & SourceFileInventoryOperations);

export interface SourceFileInventoryFactoryInterface {
  readonly empty: () => Extract<SourceFileInventory, { readonly kind: 'source_file_inventory_empty' }>;
  readonly entry: (sourceFile: SourceFile, remaining: SourceFileInventory) => Extract<SourceFileInventory, { readonly kind: 'source_file_inventory_entry' }>;
}

export const sourceFileIdentityInventoryCardinalityFactory: SourceFileIdentityInventoryCardinalityFactoryInterface = Object.freeze({
  noMatch: () => {
    let cardinality: Extract<SourceFileIdentityInventoryCardinality, { readonly kind: 'source_file_identity_inventory_no_match' }>;
    cardinality = Object.freeze({
      kind: 'source_file_identity_inventory_no_match',
      includeRelation: relation => relation.continueWith({
        onSame: () => sourceFileIdentityInventoryCardinalityFactory.oneMatch(),
        onDifferent: () => cardinality,
      }),
      continueWith: <Result>(handlers: SourceFileIdentityInventoryCardinalityHandlers<Result>): Result => handlers.onNoMatch(cardinality),
    });
    return cardinality;
  },
  oneMatch: () => {
    let cardinality: Extract<SourceFileIdentityInventoryCardinality, { readonly kind: 'source_file_identity_inventory_one_match' }>;
    cardinality = Object.freeze({
      kind: 'source_file_identity_inventory_one_match',
      includeRelation: relation => relation.continueWith({
        onSame: () => sourceFileIdentityInventoryCardinalityFactory.multipleMatches(),
        onDifferent: () => cardinality,
      }),
      continueWith: <Result>(handlers: SourceFileIdentityInventoryCardinalityHandlers<Result>): Result => handlers.onOneMatch(cardinality),
    });
    return cardinality;
  },
  multipleMatches: () => {
    let cardinality: Extract<SourceFileIdentityInventoryCardinality, { readonly kind: 'source_file_identity_inventory_multiple_matches' }>;
    cardinality = Object.freeze({
      kind: 'source_file_identity_inventory_multiple_matches',
      includeRelation: () => cardinality,
      continueWith: <Result>(handlers: SourceFileIdentityInventoryCardinalityHandlers<Result>): Result => handlers.onMultipleMatches(cardinality),
    });
    return cardinality;
  },
});

export const sourceFileInventoryFactory: SourceFileInventoryFactoryInterface = Object.freeze({
  empty: () => {
    const evidence = Object.freeze({ kind: 'source_file_inventory_empty' as const });
    return Object.freeze({
      ...evidence,
      include: (sourceFile: SourceFile): SourceFileInventory => sourceFileInventoryFactory.entry(sourceFile, sourceFileInventoryFactory.empty()),
      continueWith: <Result>(handlers: SourceFileInventoryHandlers<Result>): Result => handlers.onEmpty(),
      identityCardinalityAs: (_sourceFile: SourceFile): SourceFileIdentityInventoryCardinality => sourceFileIdentityInventoryCardinalityFactory.noMatch(),
      duplicateIdentities: (): SourceFileInventory => sourceFileInventoryFactory.empty(),
      format: (_separator: StringValue): StringValue => createStringValue(''),
      toSourceFiles: (): readonly SourceFile[] => Object.freeze([]),
    });
  },
  entry: (sourceFile: SourceFile, remaining: SourceFileInventory): Extract<SourceFileInventory, { readonly kind: 'source_file_inventory_entry' }> => {
    const evidence = Object.freeze({ kind: 'source_file_inventory_entry' as const, sourceFile, remaining });
    return Object.freeze({
      ...evidence,
      include: (nextSource: SourceFile): SourceFileInventory => sourceFileInventoryFactory.entry(sourceFile, remaining.include(nextSource)),
      continueWith: <Result>(handlers: SourceFileInventoryHandlers<Result>): Result => handlers.onSource(sourceFile, remaining),
      identityCardinalityAs: (candidate: SourceFile): SourceFileIdentityInventoryCardinality => remaining.identityCardinalityAs(candidate).includeRelation(laravelSourceIdentitySemantics.relateSourceFiles(sourceFile, candidate)),
      duplicateIdentities: (): SourceFileInventory => {
        const duplicatesInRemaining = remaining.duplicateIdentities();
        return sourceFileInventoryFactory.entry(sourceFile, remaining).identityCardinalityAs(sourceFile).continueWith({
          onNoMatch: () => duplicatesInRemaining,
          onOneMatch: () => duplicatesInRemaining,
          onMultipleMatches: () => duplicatesInRemaining.include(sourceFile),
        });
      },
      format: (separator: StringValue): StringValue => createStringValue(
        sourceFileInventoryFactory.entry(sourceFile, remaining).toSourceFiles().map(candidate => candidate.value.value).join(separator.value),
      ),
      toSourceFiles: (): readonly SourceFile[] => Object.freeze([sourceFile, ...remaining.toSourceFiles()]),
    });
  },
});


import type { SourceProjectIdentity } from './highLevelSourceModel';
import type { LaravelControllerInvocationSemanticJudgmentInterface } from './laravelControllerInvocationSemanticJudgmentInterface';
import { LARAVEL_SOURCE_IDENTITY_SEMANTICS_CONTRACT, laravelSourceIdentitySemantics, type LaravelSourceIdentitySemanticsContract, type LaravelSourceIdentitySemanticsInterface, type SourceFileIdentityRelationJudgment } from './sourceProjectIdentity';


export interface ChannelName { readonly kind: 'channel_name'; readonly value: StringValue }
export interface DomainTypeName { readonly kind: 'domain_type_name'; readonly value: StringValue }
export interface TableName { readonly kind: 'table_name'; readonly value: StringValue }
export interface MiddlewareName { readonly kind: 'middleware_name'; readonly value: StringValue }
export interface TraitName { readonly kind: 'trait_name'; readonly value: StringValue }

export const createModelName = (value: string): ModelName => Object.freeze({ kind: 'model_name' as const, value: stringValue.create(value) });
export const createEnumName = (value: string): EnumName => Object.freeze({ kind: 'enum_name' as const, value: stringValue.create(value) });
export const createClassName = (value: string): ClassName => Object.freeze({ kind: 'class_name' as const, value: stringValue.create(value) });
export const classNameEquals = (left: ClassName, right: ClassName): boolean => Object.is(left.value.value, right.value.value);
export const variableNameEquals = (left: VariableName, right: VariableName): boolean => Object.is(left.value.value, right.value.value);
export const modelNameMatchesClassName = (model: ModelName, className: ClassName): boolean => Object.is(model.value.value, className.value.value);
export const createTableName = (value: string): TableName => Object.freeze({ kind: 'table_name' as const, value: stringValue.create(value) });
export const createColumnName = (value: string): ColumnName => Object.freeze({ kind: 'column_name' as const, value: stringValue.create(value) });
export type Name = ChannelName | ServiceName | ModelName | EnumName | ResourceName | PropertyName | RouteParameterName | VariableName | ClassName | ColumnName | RelationName | RouteName | RoutePath | ControllerName | RequestName | FormTypeName | ActionName | ConstantName | IndexName | ExceptionName | MethodName | FunctionName | ResponseTypeName | SourceFile | DomainTypeName | TableName | MiddlewareName | TraitName;


export const createServiceName = (value: string): ServiceName => Object.freeze({ kind: 'service_name', value: stringValue.create(value) });

export const createResourceName = (value: string): ResourceName => Object.freeze({ kind: 'resource_name', value: stringValue.create(value) });
export const createRouteName = (value: string): RouteName => Object.freeze({ kind: 'route_name', value: stringValue.create(value) });
export const createControllerName = (value: string): ControllerName => Object.freeze({ kind: 'controller_name', value: stringValue.create(value) });
export const createActionName = (value: string): ActionName => Object.freeze({ kind: 'action_name', value: stringValue.create(value) });
export const createConstantName = (value: string): ConstantName => Object.freeze({ kind: 'constant_name', value: stringValue.create(value) });
export const createChannelName = (value: string): ChannelName => Object.freeze({ kind: 'channel_name', value: stringValue.create(value) });
export const createMiddlewareName = (value: string): MiddlewareName => Object.freeze({ kind: 'middleware_name' as const, value: stringValue.create(value) });

export const createMethodName = (value: string): MethodName => Object.freeze({ kind: 'method_name' as const, value: stringValue.create(value) });
export const methodNameEquals = (left: MethodName, right: MethodName): boolean => Object.is(left.value.value, right.value.value);

export const createPropertyName = (value: string): PropertyName =>
  Object.freeze({ kind: 'property_name' as const, value: stringValue.create(value) });

export const createRelationName = (value: string): RelationName =>
  Object.freeze({ kind: 'relation_name' as const, value: stringValue.create(value) });

export const createRequestName = (value: string): RequestName =>
  Object.freeze({ kind: 'request_name' as const, value: stringValue.create(value) });

export const createResponseTypeName = (value: string): ResponseTypeName =>
  Object.freeze({ kind: 'response_type_name' as const, value: stringValue.create(value) });

export const createRoutePath = (value: string): RoutePath => Object.freeze({ kind: 'route_path' as const, value: stringValue.create(value) });
export const createRouteParameterName = (value: string): RouteParameterName => Object.freeze({ kind: 'route_parameter_name' as const, value: stringValue.create(value) });
export const createDomainTypeName = (value: string): DomainTypeName => Object.freeze({ kind: 'domain_type_name' as const, value: stringValue.create(value) });
export interface AbilityName { readonly kind: 'ability_name'; readonly value: StringValue }
export const createAbilityName = (value: string): AbilityName => Object.freeze({ kind: 'ability_name', value: stringValue.create(value) });
export interface HttpErrorName { readonly kind: 'http_error_name'; readonly value: StringValue }
export const createHttpErrorName = (value: string): HttpErrorName => Object.freeze({ kind: 'http_error_name' as const, value: stringValue.create(value) });
export interface GuardName { readonly kind: 'guard_name'; readonly value: StringValue }


/** Canonical target constant-key projection for a typed route path. */
export const deriveRouteConstantKey = (routePath: RoutePath): string => {
  const segments = routePath.value.value.replace(/^\/+|\/+$/g, '').split('/').filter(segment => segment.length > 0);
  const keys: string[] = [];
  for (const segment of segments) {
    const braceParameter = segment.startsWith('{') && segment.endsWith('}');
    const colonParameter = segment.startsWith(':');
    if (braceParameter || colonParameter) {
      const parameterName = colonParameter ? segment.slice(1) : segment.slice(1, -1);
      if (parameterName.toLowerCase() === 'id') {
        keys.push('DETAIL');
      } else {
        const previous = keys.at(-1) ?? '';
        const cleanParameter = toSnakeCase(parameterName).toUpperCase();
        if (previous.endsWith('S')) {
          keys[keys.length - 1] = previous.slice(0, -1);
        }
        keys.push(cleanParameter);
      }
    } else {
      keys.push(toSnakeCase(segment).toUpperCase());
    }
  }
  return keys.join('_');
};
