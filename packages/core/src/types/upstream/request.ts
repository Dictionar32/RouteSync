import type { Expression } from './expression';
import type { ColumnName, PropertyName, RequestName, TableName, FormTypeName, VariableName } from './names';
import type { RouteMethod } from './route';
import type { RequestContentType } from './routeExecutionVocabulary';
import type { NumberValue, StringValue, StringValues } from './valueObjects';
import type { PropertyPath, PropertyPaths, RequestFields, ValidationRules } from './collections';
import type { SourceSpan } from './provenance';
import type { Presence } from './primitiveVocabulary';
import type { TypeExpression } from './typeVocabulary';
import type { PropertyReference } from './semanticReferences';

export type ValidationRuleName = { readonly kind: 'validation_rule_name'; readonly value: StringValue };
export type ValidationRuleSource = { readonly kind: 'validation_rule_source'; readonly source: SourceSpan };
export type ValidationRuleEntry = { readonly kind: 'validation_rule_entry'; readonly rule: ValidationRule; readonly provenance: ValidationRuleSource };
export type DateFormat = { readonly kind: 'date_format'; readonly value: StringValue };
export type ValidationParameter = { readonly kind: 'validation_parameter'; readonly value: StringValue };
export type ValidationConstraintValue = { readonly kind: 'validation_constraint_value'; readonly value: NumberValue };

export type FileValidationConstraint =
  | { readonly kind: 'image' }
  | { readonly kind: 'extensions'; readonly values: StringValues }
  | { readonly kind: 'mime_types'; readonly values: StringValues }
  | { readonly kind: 'max_bytes'; readonly value: NumberValue };
export type FileValidationConstraints = { readonly kind: 'file_validation_constraints'; readonly items: import('./collections').Sequence<FileValidationConstraint> };

export type ValidationDatabaseColumn =
  | { readonly kind: 'default_column' }
  | { readonly kind: 'explicit_column'; readonly column: ColumnName };

export type ValidationRule =
  | { readonly kind: 'required' } | { readonly kind: 'nullable' } | { readonly kind: 'optional' }
  | { readonly kind: 'sometimes_required' }
  | { readonly kind: 'bail' }
  | { readonly kind: 'required_with'; readonly fields: PropertyPaths }
  | { readonly kind: 'required_with_all'; readonly fields: PropertyPaths }
  | { readonly kind: 'required_without'; readonly fields: PropertyPaths }
  | { readonly kind: 'required_without_all'; readonly fields: PropertyPaths }
  | { readonly kind: 'required_if'; readonly field: PropertyPath; readonly values: StringValues }
  | { readonly kind: 'required_unless'; readonly field: PropertyPath; readonly values: StringValues }
  | { readonly kind: 'string' } | { readonly kind: 'integer' } | { readonly kind: 'numeric' }
  | { readonly kind: 'boolean' } | { readonly kind: 'array'; readonly element: TypeExpression | { readonly kind: 'unspecified' } } | { readonly kind: 'email' } | { readonly kind: 'url' } | { readonly kind: 'uuid' } | { readonly kind: 'date'; readonly format: DateFormat | { readonly kind: 'unspecified' } }
  | { readonly kind: 'confirmed' } | { readonly kind: 'min'; readonly value: NumberValue }
  | { readonly kind: 'max'; readonly value: NumberValue } | { readonly kind: 'between'; readonly min: ValidationConstraintValue; readonly max: ValidationConstraintValue } | { readonly kind: 'in'; readonly values: StringValues }
  | { readonly kind: 'exists'; readonly table: TableName; readonly column: ValidationDatabaseColumn }
  | { readonly kind: 'unique'; readonly table: TableName; readonly column: ValidationDatabaseColumn; readonly target: UniqueTarget }
  | { readonly kind: 'file' } | { readonly kind: 'image' }
  | { readonly kind: 'named'; readonly rule: ValidationRuleName; readonly parameters: import('./collections').Sequence<ValidationParameter> }
  | { readonly kind: 'rule_object'; readonly type: TypeExpression }
  | { readonly kind: 'closure'; readonly expression: Expression };


export type RequestHttpMethod =
  | { readonly kind: 'get' }
  | { readonly kind: 'post' }
  | { readonly kind: 'put' }
  | { readonly kind: 'patch' }
  | { readonly kind: 'delete' }
  | { readonly kind: 'options' }
  | { readonly kind: 'head' }
  | { readonly kind: 'trace' }
  | { readonly kind: 'connect' }
  | { readonly kind: 'custom'; readonly value: StringValue };

export type RequestHeaderName = { readonly kind: 'request_header_name'; readonly value: StringValue };
export type RequestServerVariableName = { readonly kind: 'request_server_variable_name'; readonly value: StringValue };
export type RequestCookieName = { readonly kind: 'request_cookie_name'; readonly value: StringValue };
export type RequestRouteParameterName = { readonly kind: 'request_route_parameter_name'; readonly value: StringValue };
export type RequestPathValue = { readonly kind: 'request_path_value'; readonly value: StringValue };
export type RequestUrlValue = { readonly kind: 'request_url_value'; readonly value: StringValue };
export type RequestUriValue = { readonly kind: 'request_uri_value'; readonly value: StringValue };
export type RequestFormatName = { readonly kind: 'request_format_name'; readonly value: StringValue };
export type RequestHostValue = { readonly kind: 'request_host_value'; readonly value: StringValue };
export type RequestIpAddress = { readonly kind: 'request_ip_address'; readonly value: StringValue };

export type RequestContentNegotiation =
  | { readonly kind: 'acceptable_content_types' }
  | { readonly kind: 'accepts'; readonly contentTypes: import('./collections').Sequence<RequestContentType> }
  | { readonly kind: 'prefers'; readonly contentTypes: import('./collections').Sequence<RequestContentType> }
  | { readonly kind: 'accepts_any_content_type' }
  | { readonly kind: 'accepts_json' }
  | { readonly kind: 'accepts_html' }
  | { readonly kind: 'expects_json' }
  | { readonly kind: 'wants_json' }
  | { readonly kind: 'wants_markdown' }
  | { readonly kind: 'accepts_markdown' }
  | { readonly kind: 'is_json' }
  | { readonly kind: 'format'; readonly name: RequestFormatName | { readonly kind: 'unspecified' } };

export type RequestPrecognitionAccess =
  | { readonly kind: 'attempting' }
  | { readonly kind: 'active' }
  | { readonly kind: 'filter_rules'; readonly rules: ValidationRules }
  | { readonly kind: 'should_validate_attribute'; readonly field: PropertyPath; readonly rules: ValidationRules };

export type RequestPathMatch =
  | { readonly kind: 'path_pattern'; readonly pattern: StringValue }
  | { readonly kind: 'route_pattern'; readonly pattern: StringValue }
  | { readonly kind: 'full_url_pattern'; readonly pattern: StringValue };

export type RequestSignatureAccess =
  | { readonly kind: 'valid_signature'; readonly absolute: Presence }
  | { readonly kind: 'valid_relative_signature' }
  | { readonly kind: 'valid_signature_while_ignoring'; readonly query: PropertyPaths; readonly absolute: Presence }
  | { readonly kind: 'valid_relative_signature_while_ignoring'; readonly query: PropertyPaths };

export type RequestHttpMetadataAccess =
  | { readonly kind: 'path' }
  | { readonly kind: 'decoded_path' }
  | { readonly kind: 'uri' }
  | { readonly kind: 'root' }
  | { readonly kind: 'path_match'; readonly match: RequestPathMatch }
  | { readonly kind: 'segment'; readonly index: NumberValue }
  | { readonly kind: 'segments' }
  | { readonly kind: 'url' }
  | { readonly kind: 'full_url' }
  | { readonly kind: 'full_url_with_query'; readonly query: PropertyPaths }
  | { readonly kind: 'full_url_without_query'; readonly query: PropertyPaths }
  | { readonly kind: 'host' }
  | { readonly kind: 'http_host' }
  | { readonly kind: 'scheme_and_http_host' }
  | { readonly kind: 'method' }
  | { readonly kind: 'method_match'; readonly method: RequestHttpMethod }
  | { readonly kind: 'ip' }
  | { readonly kind: 'ips' }
  | { readonly kind: 'user_agent' }
  | { readonly kind: 'secure' }
  | { readonly kind: 'ajax' }
  | { readonly kind: 'pjax' }
  | { readonly kind: 'prefetch' }
  | { readonly kind: 'content_negotiation'; readonly negotiation: RequestContentNegotiation }
  | { readonly kind: 'precognition'; readonly access: RequestPrecognitionAccess }
  | { readonly kind: 'server' }
  | { readonly kind: 'json' }
  | { readonly kind: 'input_source' }
  | { readonly kind: 'to_array' }
  | { readonly kind: 'route'; readonly parameter: PropertyPath | { readonly kind: 'all' }; readonly default: RequestDefault }
  | { readonly kind: 'authenticated_user'; readonly guard: StringValue | { readonly kind: 'default' } }
  | { readonly kind: 'fingerprint' }
  | { readonly kind: 'signature'; readonly access: RequestSignatureAccess }
  | { readonly kind: 'session' }
  | { readonly kind: 'has_session' };

export type RequestInputSource =
  | { readonly kind: 'input' }
  | { readonly kind: 'post' }
  | { readonly kind: 'query' }
  | { readonly kind: 'route' }
  | { readonly kind: 'header' }
  | { readonly kind: 'cookie' }
  | { readonly kind: 'file' }
  | { readonly kind: 'old_input' };

export type RequestInputReadMode =
  | { readonly kind: 'raw' }
  | { readonly kind: 'string' }
  | { readonly kind: 'integer' }
  | { readonly kind: 'boolean' }
  | { readonly kind: 'array' }
  | { readonly kind: 'float' }
  | { readonly kind: 'stringable' }
  | { readonly kind: 'clamp'; readonly minimum: Expression; readonly maximum: Expression; readonly default: RequestDefault }
  | { readonly kind: 'date' }
  | { readonly kind: 'interval' }
  | { readonly kind: 'enum'; readonly type: TypeExpression }
  | { readonly kind: 'enums'; readonly type: TypeExpression };

export type RequestInputRead = {
  readonly kind: 'request_input_read';
  readonly source: RequestInputSource;
  readonly field: PropertyPath | { readonly kind: 'all' };
  readonly mode: RequestInputReadMode;
  readonly default: RequestDefault;
  readonly sourceSpan: SourceSpan;
};

export type RequestDataAccess =
  | { readonly kind: 'data_read'; readonly field: PropertyPath | { readonly kind: 'all' }; readonly default: RequestDefault }
  | { readonly kind: 'exists'; readonly field: PropertyPath }
  | { readonly kind: 'when_enum'; readonly field: PropertyPath; readonly type: TypeExpression; readonly onMatch: import('./collections').SourceStatements; readonly onElse: import('./collections').SourceStatements | { readonly kind: 'absent' } }
  | { readonly kind: 'is_empty_string'; readonly field: PropertyPath };

export type RequestInputSelection =
  | { readonly kind: 'all' }
  | { readonly kind: 'keys' }
  | { readonly kind: 'only'; readonly fields: PropertyPaths }
  | { readonly kind: 'except'; readonly fields: PropertyPaths }
  | { readonly kind: 'collect'; readonly field: PropertyPath | { readonly kind: 'all' } }
  | { readonly kind: 'fluent'; readonly field: PropertyPath | { readonly kind: 'all' } };

export type RequestInputPresence =
  | { readonly kind: 'has'; readonly field: PropertyPath }
  | { readonly kind: 'has_any'; readonly fields: PropertyPaths }
  | { readonly kind: 'filled'; readonly field: PropertyPath }
  | { readonly kind: 'missing'; readonly field: PropertyPath }
  | { readonly kind: 'present'; readonly field: PropertyPath }
  | { readonly kind: 'empty'; readonly field: PropertyPath }
  | { readonly kind: 'is_not_filled'; readonly field: PropertyPath }
  | { readonly kind: 'is_not_filled_all'; readonly fields: PropertyPaths }
  | { readonly kind: 'any_filled'; readonly fields: PropertyPaths };

export type RequestInputMutation =
  | { readonly kind: 'merge'; readonly value: Expression }
  | { readonly kind: 'merge_if_missing'; readonly value: Expression }
  | { readonly kind: 'replace'; readonly value: Expression };

export type RequestInputFlash =
  | { readonly kind: 'old'; readonly field: PropertyPath | { readonly kind: 'all' }; readonly default: RequestDefault }
  | { readonly kind: 'flash' }
  | { readonly kind: 'flash_only'; readonly fields: PropertyPaths }
  | { readonly kind: 'flash_except'; readonly fields: PropertyPaths }
  | { readonly kind: 'flush' };

export type RequestInputConditionalCallback = {
  readonly kind: 'request_input_conditional_callback';
  readonly when: RequestInputConditionalKind;
  readonly field: PropertyPath;
  readonly matchedInput: RequestInputCallbackParameter | { readonly kind: 'absent' };
  readonly onMatch: import('./collections').SourceStatements;
  readonly onElse: import('./collections').SourceStatements | { readonly kind: 'absent' };
  readonly source: SourceSpan;
};

export type RequestInputCallbackParameter = {
  readonly kind: 'request_input_callback_parameter';
  readonly variable: VariableName;
  readonly field: PropertyPath;
};

export type RequestInputConditionalKind =
  | { readonly kind: 'has' }
  | { readonly kind: 'filled' }
  | { readonly kind: 'missing' };

export type RequestValidationField = {
  readonly kind: 'request_validation_field';
  readonly name: PropertyPath;
  readonly rules: ValidationRules;
  readonly source: SourceSpan;
};

export type RequestValidationFields = {
  readonly kind: 'request_validation_fields';
  readonly items: import('./collections').Sequence<RequestValidationField>;
};

export type RequestValidationInvocation = {
  readonly kind: 'request_validation_invocation';
  readonly fields: RequestValidationFields;
  readonly errorBag: RequestErrorBag | { readonly kind: 'default' };
  readonly source: SourceSpan;
};

export type RequestInputAccess =
  | RequestInputRead
  | { readonly kind: 'request_data_access'; readonly access: RequestDataAccess; readonly source: SourceSpan }
  | { readonly kind: 'request_input_selection'; readonly selection: RequestInputSelection; readonly source: SourceSpan }
  | { readonly kind: 'request_input_presence'; readonly presence: RequestInputPresence; readonly source: SourceSpan }
  | { readonly kind: 'request_input_mutation'; readonly mutation: RequestInputMutation; readonly source: SourceSpan }
  | RequestInputConditionalCallback
  | { readonly kind: 'request_input_flash'; readonly flash: RequestInputFlash; readonly source: SourceSpan }
  | { readonly kind: 'request_server_read'; readonly key: RequestServerVariableName; readonly default: RequestDefault; readonly source: SourceSpan }
  | { readonly kind: 'request_dynamic_property_read'; readonly field: PropertyPath; readonly source: SourceSpan }
  | { readonly kind: 'request_header_read'; readonly name: RequestHeaderName; readonly default: RequestDefault; readonly source: SourceSpan }
  | { readonly kind: 'request_header_presence'; readonly name: RequestHeaderName; readonly source: SourceSpan }
  | { readonly kind: 'request_cookie_read'; readonly name: RequestCookieName; readonly default: RequestDefault; readonly source: SourceSpan }
  | { readonly kind: 'request_cookie_presence'; readonly name: RequestCookieName; readonly source: SourceSpan }
  | { readonly kind: 'request_all_files_read'; readonly source: SourceSpan }
  | { readonly kind: 'request_file_read'; readonly field: PropertyPath; readonly source: SourceSpan }
  | { readonly kind: 'request_file_presence'; readonly field: PropertyPath; readonly source: SourceSpan }
  | { readonly kind: 'request_image_read'; readonly field: PropertyPath; readonly source: SourceSpan }
  | { readonly kind: 'request_route_parameter_read'; readonly field: PropertyPath; readonly source: SourceSpan }
  | { readonly kind: 'request_metadata_read'; readonly metadata: RequestHttpMetadataAccess; readonly source: SourceSpan }
  | { readonly kind: 'request_bearer_token_read'; readonly source: SourceSpan }
  | { readonly kind: 'request_validation'; readonly invocation: RequestValidationInvocation };

export type RequestInputAccesses = {
  readonly kind: 'request_input_accesses';
  readonly items: import('./collections').Sequence<RequestInputAccess>;
};

export type RequestHttpContext = {
  readonly kind: 'request_http_context';
  readonly method: RequestHttpMethod | { readonly kind: 'unspecified' };
  readonly routeMethod: RouteMethod | { readonly kind: 'unspecified' };
  readonly path: RequestPathValue | { readonly kind: 'unspecified' };
  readonly url: RequestUrlValue | { readonly kind: 'unspecified' };
  readonly host: RequestHostValue | { readonly kind: 'unspecified' };
  readonly httpHost: RequestHostValue | { readonly kind: 'unspecified' };
  readonly schemeAndHttpHost: RequestUrlValue | { readonly kind: 'unspecified' };
  readonly inputAccesses: RequestInputAccesses;
};

export type RequestRuleCondition =
  | { readonly kind: 'always' }
  | { readonly kind: 'expression'; readonly expression: Expression };

export type ValidationRuleArguments =
  | { readonly kind: 'none' }
  | { readonly kind: 'values'; readonly values: StringValues }
  | { readonly kind: 'parameters'; readonly parameters: import('./collections').Sequence<ValidationParameter> }
  | { readonly kind: 'expressions'; readonly expressions: import('./collections').Sequence<Expression> };

export type ValidationRuleDefinition = {
  readonly kind: 'validation_rule_definition';
  readonly name: ValidationRuleName;
  readonly arguments: ValidationRuleArguments;
  readonly condition: RequestRuleCondition;
  readonly source: SourceSpan;
};

export type RequestValidatorReference =
  | { readonly kind: 'validator_parameter'; readonly name: StringValue }
  | { readonly kind: 'validator_expression'; readonly expression: Expression };

export type RequestValidationCallback = {
  readonly kind: 'request_validation_callback';
  readonly validator: RequestValidatorReference;
  readonly statements: import('./collections').SourceStatements;
  readonly source: SourceSpan;
};

export type RequestValidationLifecycle =
  | { readonly kind: 'authorize'; readonly expression: Expression }
  | { readonly kind: 'prepare_for_validation'; readonly statements: import('./collections').SourceStatements }
  | { readonly kind: 'after_validation'; readonly callbacks: import('./collections').Sequence<RequestValidationCallback> }
  | { readonly kind: 'after_validation_source'; readonly statements: import('./collections').SourceStatements }
  | { readonly kind: 'with_validator_source'; readonly statements: import('./collections').SourceStatements }
  | { readonly kind: 'with_validator'; readonly callback: RequestValidationCallback }
  | { readonly kind: 'passed_validation'; readonly statements: import('./collections').SourceStatements }
  | { readonly kind: 'failed_authorization'; readonly statements: import('./collections').SourceStatements }
  | { readonly kind: 'failed_validation'; readonly callback: RequestValidationCallback };

export type RequestValidationLifecycles = {
  readonly kind: 'request_validation_lifecycles';
  readonly items: import('./collections').Sequence<RequestValidationLifecycle>;
};

export type RequestValidationMessage = {
  readonly kind: 'validation_message';
  readonly field: PropertyPath;
  readonly rule: ValidationRuleName;
  readonly message: StringValue;
  readonly source: SourceSpan;
};

export type RequestValidationMessages = {
  readonly kind: 'validation_messages';
  readonly items: import('./collections').Sequence<RequestValidationMessage>;
};

export type RequestValidationAttribute = {
  readonly kind: 'validation_attribute';
  readonly field: PropertyPath;
  readonly label: StringValue;
  readonly source: SourceSpan;
};

export type RequestValidationAttributes = {
  readonly kind: 'validation_attributes';
  readonly items: import('./collections').Sequence<RequestValidationAttribute>;
};

export type RequestValidationFailurePolicy =
  | { readonly kind: 'continue' }
  | { readonly kind: 'stop_on_first_failure' };

export type RequestUnknownFieldPolicyOrigin =
  | { readonly kind: 'laravel_default' }
  | { readonly kind: 'source_explicit' };

export type RequestUnknownFieldPolicy =
  | { readonly kind: 'accepted'; readonly origin: RequestUnknownFieldPolicyOrigin }
  | { readonly kind: 'rejected'; readonly origin: RequestUnknownFieldPolicyOrigin };

export type RequestValidationPolicy = {
  readonly kind: 'request_validation_policy';
  readonly failure: RequestValidationFailurePolicy;
  readonly unknownFields: RequestUnknownFieldPolicy;
};

export type RequestRedirectTarget =
  | { readonly kind: 'url'; readonly value: StringValue }
  | { readonly kind: 'route'; readonly name: StringValue }
  | { readonly kind: 'action'; readonly name: StringValue };

export type RequestErrorBag = { readonly kind: 'error_bag'; readonly name: StringValue };

export type RequestFailureResponseConfiguration = {
  readonly kind: 'request_failure_response_configuration';
  readonly redirect: RequestRedirectTarget | { readonly kind: 'default' };
  readonly errorBag: RequestErrorBag | { readonly kind: 'default' };
};

export type ValidatedInputSelection =
  | { readonly kind: 'all_validated' }
  | { readonly kind: 'validated_only'; readonly fields: PropertyPaths }
  | { readonly kind: 'validated_except'; readonly fields: PropertyPaths }
  | { readonly kind: 'safe_all' }
  | { readonly kind: 'safe_only'; readonly fields: PropertyPaths }
  | { readonly kind: 'safe_except'; readonly fields: PropertyPaths }
  | { readonly kind: 'safe_collect'; readonly field: PropertyPath | { readonly kind: 'all' } };

export type ValidatedInputOperation = {
  readonly kind: 'validated_input_operation';
  readonly selection: ValidatedInputSelection;
  readonly source: SourceSpan;
};

export type UniqueTarget =
  | { readonly kind: 'all' }
  | { readonly kind: 'ignore'; readonly value: RequestUniqueIgnoreTarget };

export type RequestUniqueIgnoreTarget =
  | { readonly kind: 'expression'; readonly expression: Expression }
  | { readonly kind: 'authenticated_user_key'; readonly property: PropertyReference };

export type RequestDefault = { readonly kind: 'none' } | { readonly kind: 'expression'; readonly expression: Expression };
export type RequestAuthorizationOrigin =
  | { readonly kind: 'laravel_default' }
  | { readonly kind: 'source_explicit' };

export type RequestAuthorization =
  | { readonly kind: 'authorized'; readonly origin: RequestAuthorizationOrigin }
  | { readonly kind: 'denied'; readonly origin: RequestAuthorizationOrigin }
  | { readonly kind: 'expression'; readonly expression: Expression; readonly origin: RequestAuthorizationOrigin };
export type RequestFieldRequirement =
  | { readonly kind: 'unconditional' }
  | { readonly kind: 'required_with'; readonly fields: PropertyPaths }
  | { readonly kind: 'required_with_all'; readonly fields: PropertyPaths }
  | { readonly kind: 'required_without'; readonly fields: PropertyPaths }
  | { readonly kind: 'required_without_all'; readonly fields: PropertyPaths }
  | { readonly kind: 'required_if'; readonly field: PropertyPath; readonly values: StringValues }
  | { readonly kind: 'required_unless'; readonly field: PropertyPath; readonly values: StringValues };
export type RequestFieldTarget =
  | { readonly kind: 'input_property'; readonly property: PropertyReference }
  | { readonly kind: 'input_collection'; readonly property: PropertyReference; readonly element: PropertyReference };

export type RequestField = { readonly kind: 'request_field'; readonly name: PropertyPath; readonly target: RequestFieldTarget; readonly type: TypeExpression; readonly presence: Presence; readonly requirement: RequestFieldRequirement; readonly rules: ValidationRules; readonly fileConstraints: FileValidationConstraints; readonly default: RequestDefault; readonly source: SourceSpan };
export type RequestSourceIdentity =
  | { readonly kind: 'http_request_identity'; readonly request: RequestName }
  | { readonly kind: 'form_request_identity'; readonly request: RequestName; readonly formType: FormTypeName };

export type RequestSchema = {
  readonly kind: 'request_schema';
  readonly fields: RequestFields;
  readonly policy: RequestValidationPolicy;
  readonly messages: RequestValidationMessages;
  readonly attributes: RequestValidationAttributes;
};

export type RequestValidationCapability =
  | { readonly kind: 'no_form_request_validation' }
  | {
      readonly kind: 'form_request_validation';
      readonly authorization: RequestAuthorization;
      readonly schema: RequestSchema;
      readonly lifecycle: RequestValidationLifecycles;
      readonly failureResponse: RequestFailureResponseConfiguration;
      readonly validatedInput: import('./collections').Sequence<ValidatedInputOperation>;
    };

export type RequestValidationCapabilityVisitor<T> = {
  readonly no_form_request_validation: () => T;
  readonly form_request_validation: (value: Extract<RequestValidationCapability, { readonly kind: 'form_request_validation' }>) => T;
};

export function matchRequestValidationCapability<T>(
  value: RequestValidationCapability,
  visitor: RequestValidationCapabilityVisitor<T>
): T {
  switch (value.kind) {
    case 'no_form_request_validation':
      return visitor.no_form_request_validation();
    case 'form_request_validation':
      return visitor.form_request_validation(value);
  }
}

export type RequestFacts = {
  readonly kind: 'request_facts';
  readonly identity: RequestSourceIdentity;
  readonly http: RequestHttpContext;
  readonly validation: RequestValidationCapability;
  readonly source: SourceSpan;
};

/**
 * High-level request model. HTTP request semantics are owned by the HTTP
 * identity/context; FormRequest-only authorization, schema and lifecycle are
 * represented as a separate capability instead of being forced onto every
 * request.
 */
export type RequestDefinition = {
  readonly kind: 'request';
  readonly identity: RequestSourceIdentity;
  readonly http: RequestHttpContext;
  readonly validation: RequestValidationCapability;
  readonly source: SourceSpan;
};
