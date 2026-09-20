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
export interface DomainTypeName { readonly kind: 'domain_type_name'; readonly value: StringValue }
export interface TableName { readonly kind: 'table_name'; readonly value: StringValue }
export interface MiddlewareName { readonly kind: 'middleware_name'; readonly value: StringValue }
export interface TraitName { readonly kind: 'trait_name'; readonly value: StringValue }
export type Name = ModelName | ResourceName | PropertyName | RouteParameterName | VariableName | ClassName | ColumnName | RelationName | RouteName | RoutePath | ControllerName | RequestName | FormTypeName | ActionName | ConstantName | IndexName | ExceptionName | MethodName | FunctionName | ResponseTypeName | SourceFile | DomainTypeName | TableName | MiddlewareName | TraitName;


const stringValue = (value: string): StringValue =>
  Object.freeze({ kind: 'string_value' as const, value });

export const createPropertyName = (value: string): PropertyName =>
  Object.freeze({ kind: 'property_name' as const, value: stringValue(value) });

export const createRelationName = (value: string): RelationName =>
  Object.freeze({ kind: 'relation_name' as const, value: stringValue(value) });

export const createRequestName = (value: string): RequestName =>
  Object.freeze({ kind: 'request_name' as const, value: stringValue(value) });

export const createResponseTypeName = (value: string): ResponseTypeName =>
  Object.freeze({ kind: 'response_type_name' as const, value: stringValue(value) });
