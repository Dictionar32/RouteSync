import type {
  ModelName, ResourceName, PropertyName, VariableName, ClassName, ColumnName,
  RelationName, RouteName, RoutePath, RouteParameterName, ControllerName, ActionName, MethodName,
  ResponseTypeName, FormTypeName, TableName, SourceFile, DomainTypeName
} from '../upstream/names';
import type { NumberValue, StringValue } from '../upstream/valueObjects';
import type { PhpFunctionName as UpstreamPhpFunctionName } from '../upstream/modelVocabulary';

/**
 * Closed semantic value objects for the domain IR.
 *
 * A primitive JavaScript value is not a semantic contract by itself. These
 * wrappers attach meaning at the boundary so downstream code never has to
 * guess whether a string is a model, column, relation, method, or source
 * expression.
 */

export type {
  ModelName, ResourceName, PropertyName, VariableName, ClassName, ColumnName,
  RelationName, RouteName, RoutePath, RouteParameterName, ControllerName, ActionName, MethodName,
  ResponseTypeName, FormTypeName, TableName, SourceFile, DomainTypeName
};

export type DomainName = DomainTypeName;


export interface RequestFieldName {
  readonly kind: 'request_field_name';
  readonly value: string;
}

export type SourceFilePath = SourceFile;

export interface HttpErrorName {
  readonly kind: 'http_error_name';
  readonly value: string;
}

export interface AbilityName {
  readonly kind: 'ability_name';
  readonly value: string;
}

export interface ResponseFieldName {
  readonly kind: 'response_field_name';
  readonly value: string;
}

export type SourceLineNumber = NumberValue;

export type PhpFunctionName = UpstreamPhpFunctionName;

export interface PhpOperator {
  readonly kind: 'php_operator';
  readonly value: string;
}

export interface ConditionExpression {
  readonly kind: 'condition_expression';
  readonly value: string;
}

export interface DatabaseTypeName {
  readonly kind: 'database_type_name';
  readonly value: string;
}

export interface CastTypeName {
  readonly kind: 'cast_type_name';
  readonly value: string;
}

export interface ResponseDataKey {
  readonly kind: 'response_data_key';
  readonly value: string;
}

export interface ResponseMetaKey {
  readonly kind: 'response_meta_key';
  readonly value: string;
}

export interface ResponseLinksKey {
  readonly kind: 'response_links_key';
  readonly value: string;
}

export interface EnvelopeTypeName {
  readonly kind: 'envelope_type_name';
  readonly value: string;
}

export interface HttpStatusCode {
  readonly kind: 'http_status_code';
  readonly value: number;
}

export interface SemanticOperator {
  readonly kind: 'semantic_operator';
  readonly value:
    | 'add'
    | 'subtract'
    | 'multiply'
    | 'divide'
    | 'modulo'
    | 'equal'
    | 'not_equal'
    | 'less_than'
    | 'less_than_or_equal'
    | 'greater_than'
    | 'greater_than_or_equal'
    | 'and'
    | 'or'
    | 'concat'
    | 'null_coalesce';
}

export type BoundLiteralValue =
  | { readonly kind: 'string'; readonly value: string }
  | { readonly kind: 'number'; readonly value: number }
  | { readonly kind: 'boolean'; readonly value: boolean }
  | { readonly kind: 'null' };

export interface ValidationRuleName {
  readonly kind: 'validation_rule_name';
  readonly value: string;
}

export interface DateFormat {
  readonly kind: 'date_format';
  readonly value: string;
}

export interface ValidationParameter {
  readonly kind: 'validation_parameter';
  readonly value: string;
}

export interface ValidationConstraintValue {
  readonly kind: 'validation_constraint_value';
  readonly value: number;
}
export type ResponseWrapperKey =
  | { readonly kind: 'no_wrapper' }
  | { readonly kind: 'data_wrapper'; readonly key: ResponseDataKey };

export type ResponseLinksKeySpecification =
  | { readonly kind: 'no_links_key' }
  | { readonly kind: 'links_key'; readonly key: ResponseLinksKey };

export type BoundCastType =
  | { readonly kind: 'no_cast' }
  | { readonly kind: 'cast'; readonly type: CastTypeName };

export type BoundTargetModel =
  | { readonly kind: 'unbound' }
  | { readonly kind: 'model'; readonly name: ModelName };


const stringValue = (value: string): StringValue => Object.freeze({ kind: 'string_value', value });

export const SemanticValueFactory = Object.freeze({
  modelName(value: string): ModelName { return Object.freeze({ kind: 'model_name', value: stringValue(value) }); },
  tableName(value: string): TableName { return Object.freeze({ kind: 'table_name', value: stringValue(value) }); },
  routeName(value: string): RouteName { return Object.freeze({ kind: 'route_name', value: stringValue(value) }); },
  responseTypeName(value: string): ResponseTypeName { return Object.freeze({ kind: 'response_type_name', value: stringValue(value) }); },
  httpErrorName(value: string): HttpErrorName { return Object.freeze({ kind: 'http_error_name', value }); },
  abilityName(value: string): AbilityName { return Object.freeze({ kind: 'ability_name', value }); },
  className(value: string): ClassName { return Object.freeze({ kind: 'class_name', value: stringValue(value) }); },
  domainName(value: string): DomainName { return Object.freeze({ kind: 'domain_type_name', value: stringValue(value) }); },
  resourceName(value: string): ResourceName { return Object.freeze({ kind: 'resource_name', value: stringValue(value) }); },
  columnName(value: string): ColumnName { return Object.freeze({ kind: 'column_name', value: stringValue(value) }); },
  propertyName(value: string): PropertyName { return Object.freeze({ kind: 'property_name', value: stringValue(value) }); },
  relationName(value: string): RelationName { return Object.freeze({ kind: 'relation_name', value: stringValue(value) }); },
  methodName(value: string): MethodName { return Object.freeze({ kind: 'method_name', value: stringValue(value) }); },
  actionName(value: string): ActionName { return Object.freeze({ kind: 'action_name', value: stringValue(value) }); },
  controllerName(value: string): ControllerName { return Object.freeze({ kind: 'controller_name', value: stringValue(value) }); },
  routePath(value: string): RoutePath { return Object.freeze({ kind: 'route_path', value: stringValue(value) }); },
  routeParameterName(value: string): RouteParameterName { return Object.freeze({ kind: 'route_parameter_name', value: stringValue(value) }); },
  sourceFilePath(value: string): SourceFilePath { return Object.freeze({ kind: 'source_file', value: stringValue(value) }); },
  sourceLineNumber(value: number): SourceLineNumber { return Object.freeze({ kind: 'number_value', value }); },
  variableName(value: string): VariableName { return Object.freeze({ kind: 'variable_name', value: stringValue(value) }); },
  responseFieldName(value: string): ResponseFieldName { return Object.freeze({ kind: 'response_field_name', value }); },
  requestFieldName(value: string): RequestFieldName { return Object.freeze({ kind: 'request_field_name', value }); },
  formTypeName(value: string): FormTypeName {
    return Object.freeze({
      kind: 'form_type_name' as const,
      value: stringValue(value),
    });
  },
  formTypeNameFromRequestClass(value: ClassName): FormTypeName {
    const name = value.value.value;
    if (!name.endsWith('Request')) {
      throw new Error(`Invalid FormRequest class name: ${name}`);
    }
    return Object.freeze({
      kind: 'form_type_name' as const,
      value: stringValue(`${name.slice(0, -'Request'.length)}Form`),
    });
  },
  responseDataKey(value: string): ResponseDataKey { return Object.freeze({ kind: 'response_data_key', value }); },
  responseMetaKey(value: string): ResponseMetaKey { return Object.freeze({ kind: 'response_meta_key', value }); },
  responseLinksKey(value: string): ResponseLinksKey { return Object.freeze({ kind: 'response_links_key', value }); },
  envelopeTypeName(value: string): EnvelopeTypeName { return Object.freeze({ kind: 'envelope_type_name', value }); },
  databaseTypeName(value: string): DatabaseTypeName { return Object.freeze({ kind: 'database_type_name', value }); },
  castTypeName(value: string): CastTypeName { return Object.freeze({ kind: 'cast_type_name', value }); },
  conditionExpression(value: string): ConditionExpression { return Object.freeze({ kind: 'condition_expression', value }); },
  semanticOperator(value: SemanticOperator['value']): SemanticOperator { return Object.freeze({ kind: 'semantic_operator', value }); },
  phpFunctionName(value: string): PhpFunctionName { return Object.freeze({ kind: 'php_function_name', value: stringValue(value) }); },
  literalValue(value: BoundLiteralValue): BoundLiteralValue { return Object.freeze(value); },
});
