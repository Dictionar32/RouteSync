import type { StringValue } from './valueObjects';
export interface ModelName { readonly kind: 'model_name'; readonly value: StringValue }
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
export interface MethodName { readonly kind: 'method_name'; readonly value: StringValue }
export interface FunctionName { readonly kind: 'function_name'; readonly value: StringValue }
export interface ResponseTypeName { readonly kind: 'response_type_name'; readonly value: StringValue }
export interface SourceFile { readonly kind: 'source_file'; readonly value: StringValue }
export interface ChannelName { readonly kind: 'channel_name'; readonly value: StringValue }
export interface DomainTypeName { readonly kind: 'domain_type_name'; readonly value: StringValue }
export interface TableName { readonly kind: 'table_name'; readonly value: StringValue }
export interface MiddlewareName { readonly kind: 'middleware_name'; readonly value: StringValue }
export interface TraitName { readonly kind: 'trait_name'; readonly value: StringValue }

export const createModelName = (value: string): ModelName => Object.freeze({ kind: 'model_name', value: { kind: 'string_value', value } });
export const classNameEquals = (left: ClassName, right: ClassName): boolean => left.value.value === right.value.value;
export const modelNameMatchesClassName = (model: ModelName, className: ClassName): boolean => model.value.value === className.value.value;
export const createTableName = (value: string): TableName => Object.freeze({ kind: 'table_name', value: { kind: 'string_value', value } });
export const createColumnName = (value: string): ColumnName => Object.freeze({ kind: 'column_name', value: { kind: 'string_value', value } });
export const createPropertyName = (value: string): PropertyName => Object.freeze({ kind: 'property_name', value: { kind: 'string_value', value } });
export type Name = ChannelName | ModelName | ResourceName | PropertyName | RouteParameterName | VariableName | ClassName | ColumnName | RelationName | RouteName | RoutePath | ControllerName | RequestName | FormTypeName | ActionName | ConstantName | IndexName | ExceptionName | MethodName | FunctionName | ResponseTypeName | SourceFile | DomainTypeName | TableName | MiddlewareName | TraitName;


const stringValue = (value: string): StringValue =>
  Object.freeze({ kind: 'string_value' as const, value });

export const createResourceName = (value: string): ResourceName => Object.freeze({ kind: 'resource_name', value: stringValue(value) });
export const createControllerName = (value: string): ControllerName => Object.freeze({ kind: 'controller_name', value: stringValue(value) });
export const createActionName = (value: string): ActionName => Object.freeze({ kind: 'action_name', value: stringValue(value) });
export const createSourceFile = (value: string): SourceFile => Object.freeze({ kind: 'source_file', value: stringValue(value) });
export const createChannelName = (value: string): ChannelName => Object.freeze({ kind: 'channel_name', value: stringValue(value) });

export const createPropertyName = (value: string): PropertyName =>
  Object.freeze({ kind: 'property_name' as const, value: stringValue(value) });

export const createRelationName = (value: string): RelationName =>
  Object.freeze({ kind: 'relation_name' as const, value: stringValue(value) });

export const createRequestName = (value: string): RequestName =>
  Object.freeze({ kind: 'request_name' as const, value: stringValue(value) });

export const createResponseTypeName = (value: string): ResponseTypeName =>
  Object.freeze({ kind: 'response_type_name' as const, value: stringValue(value) });

export const createRoutePath = (value: string): RoutePath => Object.freeze({ kind: 'route_path' as const, value: stringValue(value) });
export interface AbilityName { readonly kind: 'ability_name'; readonly value: StringValue }
export interface HttpErrorName { readonly kind: 'http_error_name'; readonly value: StringValue }
export interface GuardName { readonly kind: 'guard_name'; readonly value: StringValue }
