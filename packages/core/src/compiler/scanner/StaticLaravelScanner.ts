/**
 * StaticLaravelScanner.ts
 *
 * Zero-Dependency Pure TypeScript Static Project Scanner for Laravel.
 * Directly integrated with @routesync/core Semantic Type System, TypeInterner, and SymbolTable.
 * Scans routes, Eloquent models, JsonResources, and FormRequests into a complete RouteManifest.
 *
 * @module core/compiler/scanner
 */

import path from 'path';
import fs from 'fs-extra';
import { RouteManifest, ParsedRoute, ParsedResource, ParsedModel, ResourceFieldDescriptor, ResourceFieldExpressionFactory, RouteParameter, PathParameterDescriptor, QueryParameterDescriptor, HeaderParameterDescriptor, RouteParameterLocation, RouteParameterType, ResponseDescriptor, ResourceResponseDescriptor, ModelResponseDescriptor, InlineResponseDescriptor, ResourceFieldExpression, ResourceRouteGroup, ParsedColumn, ParsedCast, EloquentCastKind, EloquentCastMapper, ParsedAccessor, ParsedRelation, SingleRelationDescriptor, CollectionRelationDescriptor, EloquentRelationClassifier, EloquentRelationType, EloquentRelationCardinality, RouteSchemaPayload, RouteValidationRuleEntry, RouteMessageEntry, RouteAttributeEntry, ValidationRuleKind, ValidationRuleNode, ValidationRuleParser, ValidationRuleNodeFactory, HttpMethod, HTTP_METHOD_REGISTRY, matchHttpMethod, RouteActionKind, ResponseShape, DatabaseColumnTypeMapper, SecuritySchemeKind, RouteSecurityDescriptor, RouteSecurityClassifier, ScannedRouteSecurityDescriptor, ModelKeyType, ModelKeyTypeMapper, MODEL_KEY_TYPE_REGISTRY, RequestContentType, RouteQueryParameter, HttpErrorResponseDescriptor, ValidationFieldNode, CrudRole, RoutePolicyDescriptor, DatabaseColumnKind, HttpStatusCode, RateLimitDescriptor, PaginatedEnvelopeDescriptor, ScannedPaginatedEnvelopeDescriptor, PolymorphicRelationDescriptor, ScannedPolymorphicRelationDescriptor, BroadcastChannelKind, BroadcastChannelDescriptor, PublicBroadcastChannelDescriptor, PrivateBroadcastChannelDescriptor, PresenceBroadcastChannelDescriptor, ParsedChannel, RouteHookKind, RoutePayloadMode, SdkResponseKind, InvalidationTarget, ScannedInvalidationTarget, RouteCacheInvalidationDescriptor, ScannedRouteCacheInvalidationDescriptor, ScannedRouteInvalidationPayload, RouteExecutionSignature, ScannedRouteExecutionSignature, SdkResponseResolution, ScannedSdkResponseResolution, ResourceAssignment, FrontendConfig, PageConfig, ActionDefinition, EndpointContract, ScannedEndpointContract } from '../../types/route';
import { RequestType, FormAction, RequestField, ResponseData, FileValidationConstraints } from '../artifacts/RequestTypesArtifact';
import { ObjectType, ObjectProperty, ScannedObjectProperty, PrimitiveType, PrimitiveKind, NullableType, ReadonlyCollectionType, CollectionKind, ReferenceType, SemanticType } from '../types/SemanticType';
import { TypeInterner } from '../types/TypeInterner';
import { ImmutableMap, ImmutableSet } from '../utils/ImmutableCollections';
import { LaravelSourceLexer, PhpArrayEntry, TokenDescriptor, PhpAstValue } from './LaravelSourceLexer';
import { toCamelCase, toPascalCase, extractClassBasename, inferLaravelTableName, ResourceNamingConvention } from '../../utils/resource-naming';

export const LaravelValidationType = Object.freeze({
    String: 'string',
    Number: 'number',
    Boolean: 'boolean',
    Array: 'array',
    File: 'file',
    Date: 'date'
} as const);

export type LaravelValidationType = typeof LaravelValidationType[keyof typeof LaravelValidationType];

export interface LaravelValidationConstraint {
    readonly required: boolean;
    readonly nullable: boolean;
    readonly type: LaravelValidationType;
    readonly rules: readonly string[];
}

export type ResourceExpressionDescriptor =
    | { readonly kind: 'resource'; readonly resource: string; readonly collection: boolean }
    | { readonly kind: 'primitive'; readonly type: 'string' | 'int' | 'boolean' }
    | { readonly kind: 'raw'; readonly raw: string };

export interface StaticLaravelScannerOptions {
    readonly projectRoot: string;
    readonly baseURL: string;
    readonly version: string;
}

export interface ControllerActionInfo {
    readonly response: ResponseDescriptor;
    readonly sourceFile: string;
    readonly sourceLine: number;
    readonly formRequestName: string | null;
    readonly schemaRules: readonly RouteValidationRuleEntry[];
}

export interface ScannedControllerActionParams {
    readonly sourceFile: string;
    readonly sourceLine: number;
    readonly response: ResponseDescriptor;
    readonly formRequestName: string | null;
    readonly schemaRules: readonly RouteValidationRuleEntry[];
}

/**
 * Reusable Constructor: Scanned Controller Action Descriptor.
 */
export class ScannedControllerActionDescriptor implements ControllerActionInfo {
    public readonly sourceFile: string;
    public readonly sourceLine: number;
    public readonly response: ResponseDescriptor;
    public readonly formRequestName: string | null;
    public readonly schemaRules: readonly RouteValidationRuleEntry[];

    constructor({ sourceFile, sourceLine, response, formRequestName, schemaRules }: ScannedControllerActionParams) {
        this.sourceFile = sourceFile;
        this.sourceLine = sourceLine;
        this.response = response;
        this.formRequestName = formRequestName;
        this.schemaRules = Object.freeze([...schemaRules]);
        Object.freeze(this);
    }

    public static create({
        sourceFile,
        sourceLine = 0,
        response,
        formRequestName = null,
        schemaRules = []
    }: {
        readonly sourceFile: string;
        readonly sourceLine?: number;
        readonly response?: ResponseDescriptor;
        readonly formRequestName?: string | null;
        readonly schemaRules?: readonly RouteValidationRuleEntry[];
    }): ScannedControllerActionDescriptor {
        const resolvedResponse = response ?? new ResourceResponseDescriptor({ resourceName: 'GeneralResource', shape: 'single' });
        return new ScannedControllerActionDescriptor({
            sourceFile,
            sourceLine,
            response: resolvedResponse,
            formRequestName: formRequestName ?? null,
            schemaRules: schemaRules ?? []
        });
    }
}

export interface ScannedRouteValidationRuleParams {
    readonly fieldName: string;
    readonly propertyName: string;
    readonly rules: readonly string[];
    readonly ast: readonly ValidationRuleNode[];
}

/**
 * Reusable Constructor: Scanned Route Validation Rule Entry.
 */
export class ScannedRouteValidationRuleEntry implements RouteValidationRuleEntry {
    public readonly fieldName: string;
    public readonly propertyName: string;
    public readonly rules: readonly string[];
    public readonly ast: readonly ValidationRuleNode[];

    constructor({ fieldName, propertyName, rules, ast }: ScannedRouteValidationRuleParams) {
        this.fieldName = fieldName;
        this.propertyName = propertyName;
        this.rules = Object.freeze([...rules]);
        this.ast = Object.freeze([...ast]);
        Object.freeze(this);
    }

    public static create(
        fieldName: string,
        rules: readonly string[],
        propertyName: string = toCamelCase(fieldName),
        ast?: readonly ValidationRuleNode[]
    ): ScannedRouteValidationRuleEntry {
        return new ScannedRouteValidationRuleEntry({
            fieldName,
            propertyName,
            rules,
            ast: ast ? Object.freeze([...ast]) : ValidationRuleParser.parseAll(rules)
        });
    }
}

export interface ScannedRouteSchemaParams {
    readonly rules: readonly RouteValidationRuleEntry[];
    readonly messages: readonly RouteMessageEntry[];
    readonly attributes: readonly RouteAttributeEntry[];
}

/**
 * Reusable Constructor: Scanned Route Schema Payload.
 */
export class ScannedRouteSchemaPayload implements RouteSchemaPayload {
    public readonly rules: readonly RouteValidationRuleEntry[];
    public readonly messages: readonly RouteMessageEntry[];
    public readonly attributes: readonly RouteAttributeEntry[];

    constructor({ rules, messages, attributes }: ScannedRouteSchemaParams) {
        this.rules = Object.freeze([...rules]);
        this.messages = Object.freeze([...messages]);
        this.attributes = Object.freeze([...attributes]);
        Object.freeze(this);
    }

    public static empty(): ScannedRouteSchemaPayload {
        return new ScannedRouteSchemaPayload({
            rules: [],
            messages: [],
            attributes: []
        });
    }

    public static fromRules(
        rules: readonly RouteValidationRuleEntry[],
        messages: readonly RouteMessageEntry[] = [],
        attributes: readonly RouteAttributeEntry[] = []
    ): ScannedRouteSchemaPayload {
        return new ScannedRouteSchemaPayload({
            rules,
            messages,
            attributes
        });
    }
}

export interface ScannedScalarFieldParams {
    readonly fieldName: string;
    readonly propertyName: string;
    readonly rules: readonly ValidationRuleNode[];
}

export class ScannedScalarFieldNode {
    public readonly kind = 'scalar' as const;
    public readonly fieldName: string;
    public readonly propertyName: string;
    public readonly rules: readonly ValidationRuleNode[];

    constructor(params: ScannedScalarFieldParams) {
        this.fieldName = params.fieldName;
        this.propertyName = params.propertyName;
        this.rules = Object.freeze([...params.rules]);
        Object.freeze(this);
    }

    public static create(
        fieldName: string,
        rules: readonly ValidationRuleNode[] = [],
        propertyName: string = toCamelCase(fieldName)
    ): ScannedScalarFieldNode {
        return new ScannedScalarFieldNode({
            fieldName,
            propertyName,
            rules
        });
    }
}

export interface ScannedObjectFieldParams {
    readonly fieldName: string;
    readonly propertyName: string;
    readonly fields: readonly ValidationFieldNode[];
}

export class ScannedObjectFieldNode {
    public readonly kind = 'object' as const;
    public readonly fieldName: string;
    public readonly propertyName: string;
    public readonly fields: readonly ValidationFieldNode[];

    constructor(params: ScannedObjectFieldParams) {
        this.fieldName = params.fieldName;
        this.propertyName = params.propertyName;
        this.fields = Object.freeze([...params.fields]);
        Object.freeze(this);
    }

    public static create(
        fieldName: string,
        fields: readonly ValidationFieldNode[] = [],
        propertyName: string = toCamelCase(fieldName)
    ): ScannedObjectFieldNode {
        return new ScannedObjectFieldNode({
            fieldName,
            propertyName,
            fields
        });
    }
}

export interface ScannedArrayFieldParams {
    readonly fieldName: string;
    readonly propertyName: string;
    readonly rules: readonly ValidationRuleNode[];
    readonly element: ValidationFieldNode;
}

export class ScannedArrayFieldNode {
    public readonly kind = 'array' as const;
    public readonly fieldName: string;
    public readonly propertyName: string;
    public readonly rules: readonly ValidationRuleNode[];
    public readonly element: ValidationFieldNode;

    constructor(params: ScannedArrayFieldParams) {
        this.fieldName = params.fieldName;
        this.propertyName = params.propertyName;
        this.rules = Object.freeze([...params.rules]);
        this.element = params.element;
        Object.freeze(this);
    }

    public static create(
        fieldName: string,
        element: ValidationFieldNode,
        rules: readonly ValidationRuleNode[] = [],
        propertyName: string = toCamelCase(fieldName)
    ): ScannedArrayFieldNode {
        return new ScannedArrayFieldNode({
            fieldName,
            propertyName,
            rules,
            element
        });
    }
}

export class ValidationTreeBuilder {
    public static buildTree(rules: readonly RouteValidationRuleEntry[]): readonly ValidationFieldNode[] {
        const rootFields: Map<string, ValidationFieldNode> = new Map();

        for (const entry of rules) {
            const ruleNodes: readonly ValidationRuleNode[] = entry.ast ?? [];
            if (entry.fieldName.includes('.*.')) {
                const parts = entry.fieldName.split('.*.');
                const parentName = parts[0];
                const childName = parts[1];
                const parentProp = toCamelCase(parentName);
                const childProp = toCamelCase(childName);

                let existing = rootFields.get(parentName);
                if (!existing || existing.kind !== 'array') {
                    const scalarChild = new ScannedScalarFieldNode({
                        fieldName: childName,
                        propertyName: childProp,
                        rules: ruleNodes
                    });
                    const objectElement = new ScannedObjectFieldNode({
                        fieldName: parentName,
                        propertyName: parentProp,
                        fields: [scalarChild]
                    });
                    const arrayNode = new ScannedArrayFieldNode({
                        fieldName: parentName,
                        propertyName: parentProp,
                        rules: [],
                        element: objectElement
                    });
                    rootFields.set(parentName, arrayNode);
                } else if (existing.element.kind === 'object') {
                    const currentFields = [...existing.element.fields];
                    currentFields.push(new ScannedScalarFieldNode({
                        fieldName: childName,
                        propertyName: childProp,
                        rules: ruleNodes
                    }));
                    rootFields.set(parentName, new ScannedArrayFieldNode({
                        fieldName: parentName,
                        propertyName: parentProp,
                        rules: existing.rules,
                        element: new ScannedObjectFieldNode({
                            fieldName: parentName,
                            propertyName: parentProp,
                            fields: currentFields
                        })
                    }));
                }
            } else {
                rootFields.set(entry.fieldName, new ScannedScalarFieldNode({
                    fieldName: entry.fieldName,
                    propertyName: toCamelCase(entry.fieldName),
                    rules: ruleNodes
                }));
            }
        }

        return Object.freeze(Array.from(rootFields.values()));
    }
}

export interface ScannedRouteParams {
    readonly name: string;
    readonly method: HttpMethod;
    readonly path: string;
    readonly resourceName: string;
    readonly actionName: string;
    readonly actionKind: RouteActionKind;
    readonly isMutating: boolean;
    readonly groupName: string;
    readonly crudRole: CrudRole;
    readonly runtimePath: string;
    readonly hookKind: RouteHookKind;
    readonly invalidation: RouteCacheInvalidationDescriptor;
    readonly executionSignature: RouteExecutionSignature;
    readonly requestContentType: RequestContentType;
    readonly auth: boolean;
    readonly middleware: readonly string[];
    readonly parameters: readonly RouteParameter[];
    readonly pathParameters: readonly RouteParameter[];
    readonly queryParameters: readonly RouteQueryParameter[];
    readonly response: ResponseDescriptor;
    readonly errorResponses: readonly HttpErrorResponseDescriptor[];
    readonly sourceFile: string;
    readonly sourceLine: number;
    readonly schema: RouteSchemaPayload;
}

/**
 * Reusable Constructor: Scanned Route Descriptor.
 */
export class ScannedRouteDescriptor implements ParsedRoute {
    public readonly name: string;
    public readonly method: HttpMethod;
    public readonly path: string;
    public readonly resourceName: string;
    public readonly actionName: string;
    public readonly groupName: string;
    public readonly crudRole: CrudRole;
    public readonly runtimePath: string;
    public readonly responseTypeName: string;
    public readonly actionKind: RouteActionKind;
    public readonly isMutating: boolean;
    public readonly hookKind: RouteHookKind;
    public readonly invalidation: RouteCacheInvalidationDescriptor;
    public readonly executionSignature: RouteExecutionSignature;
    public readonly requestContentType: RequestContentType;
    public readonly auth: boolean;
    public readonly security: RouteSecurityDescriptor;
    public readonly middleware: readonly string[];
    public readonly policies: readonly RoutePolicyDescriptor[];
    public readonly rateLimit: RateLimitDescriptor | null;
    public readonly parameters: readonly RouteParameter[];
    public readonly pathParameters: readonly RouteParameter[];
    public readonly queryParameters: readonly RouteQueryParameter[];
    public readonly response: ResponseDescriptor;
    public readonly errorResponses: readonly HttpErrorResponseDescriptor[];
    public readonly sourceFile: string;
    public readonly sourceLine: number;
    public readonly schema: RouteSchemaPayload;
    public readonly assignments: readonly ResourceAssignment[];
    public readonly uri: string;
    public readonly controllerName: string | null;
    public readonly contract: EndpointContract;

    public static create({
        name,
        method,
        path,
        resourceName,
        actionName,
        actionKind,
        isMutating,
        groupName,
        crudRole,
        runtimePath,
        hookKind,
        invalidation,
        executionSignature,
        requestContentType,
        auth = false,
        middleware = [],
        parameters = [],
        pathParameters,
        queryParameters = [],
        response,
        errorResponses,
        sourceFile = '',
        sourceLine = 0,
        schema = ScannedRouteSchemaPayload.empty()
    }: {
        readonly name?: string;
        readonly method: HttpMethod;
        readonly path: string;
        readonly resourceName: string;
        readonly actionName?: string;
        readonly actionKind?: RouteActionKind;
        readonly isMutating?: boolean;
        readonly groupName?: string;
        readonly crudRole?: CrudRole;
        readonly runtimePath?: string;
        readonly hookKind?: RouteHookKind;
        readonly invalidation?: RouteCacheInvalidationDescriptor;
        readonly executionSignature?: RouteExecutionSignature;
        readonly requestContentType?: RequestContentType;
        readonly auth?: boolean;
        readonly middleware?: readonly string[];
        readonly parameters?: readonly RouteParameter[];
        readonly pathParameters?: readonly RouteParameter[];
        readonly queryParameters?: readonly RouteQueryParameter[];
        readonly response?: ResponseDescriptor;
        readonly errorResponses?: readonly HttpErrorResponseDescriptor[];
        readonly sourceFile?: string;
        readonly sourceLine?: number;
        readonly schema?: RouteSchemaPayload;
    }): ScannedRouteDescriptor {
        const resolvedActionKind = actionKind ?? (method.toUpperCase() === 'GET' ? 'read' : 'create');
        const resolvedIsMutating = isMutating ?? (method.toUpperCase() !== 'GET' && method.toUpperCase() !== 'HEAD');
        const resolvedActionName = actionName ?? (resolvedIsMutating ? 'mutate' : 'query');
        const resolvedGroupName = groupName ?? toCamelCase(resourceName);
        const resolvedRuntimePath = runtimePath ?? path.replace(/\{([^}]+)\}/g, ':$1');
        const resolvedHookKind = hookKind ?? (resolvedIsMutating ? RouteHookKind.Mutation : RouteHookKind.Query);
        const resolvedInvalidation = invalidation ?? ScannedRouteCacheInvalidationDescriptor.none();
        const resolvedPathParams = pathParameters ?? (
            parameters.length > 0
                ? parameters.filter(p => p.in === 'path')
                : [...path.matchAll(/\{([^}]+)\}/g)].map(m => ScannedRouteParameterDescriptor.fromPathSegment(m[1]))
        );
        const resolvedParameters = parameters.length > 0 ? parameters : resolvedPathParams;
        const resolvedHasPayload = resolvedIsMutating || resolvedHookKind === RouteHookKind.Mutation || (schema?.rules && schema.rules.length > 0);
        const resolvedSignature = executionSignature ?? ScannedRouteExecutionSignature.create(resolvedHookKind, resolvedParameters.length > 0, !!resolvedHasPayload);
        const resolvedResponse = response ?? new ResourceResponseDescriptor({ resourceName: `${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)}Resource`, shape: 'single' });

        const upperMethod = method.toUpperCase() as HttpMethod;
        let detectedContentType: RequestContentType = RequestContentType.Json;
        if (upperMethod === 'GET' || upperMethod === 'HEAD') {
            detectedContentType = RequestContentType.None;
        } else if (schema?.rules?.some(r => {
            const ruleList = (r as any).rules || r.ast || [];
            return Array.isArray(ruleList) && ruleList.some((rule: any) => {
                const kind = typeof rule === 'string' ? rule : rule?.kind;
                return kind === ValidationRuleKind.File || kind === ValidationRuleKind.Image || kind === 'file' || kind === 'image';
            });
        })) {
            detectedContentType = RequestContentType.Multipart;
        }
        const resolvedContentType = requestContentType ?? detectedContentType;

        let resolvedCrudRole = crudRole;
        if (!resolvedCrudRole) {
            const segments = path.replace(/^\//, '').split('/').filter(Boolean);
            const staticSegments = segments.filter(s => !s.startsWith('{') && !s.startsWith(':') && s !== 'api' && s !== 'v1');
            const hasTrailingParam = path.endsWith('}') || path.endsWith(':id') || /\{[^}]+\}$/.test(path);
            const paramCount = segments.filter(s => s.startsWith('{') || s.startsWith(':')).length;
            const isSimpleResourcePath = staticSegments.length <= 1;

            let computedRole: CrudRole = CrudRole.Custom;
            if (isSimpleResourcePath) {
                computedRole = matchHttpMethod(upperMethod, {
                    GET: () => (hasTrailingParam && paramCount === 1) ? CrudRole.Show : (!hasTrailingParam && paramCount === 0) ? CrudRole.Index : CrudRole.Custom,
                    POST: () => (!hasTrailingParam && paramCount === 0) ? CrudRole.Create : CrudRole.Custom,
                    PUT: () => (hasTrailingParam && paramCount === 1) ? CrudRole.Update : CrudRole.Custom,
                    PATCH: () => (hasTrailingParam && paramCount === 1) ? CrudRole.Update : CrudRole.Custom,
                    DELETE: () => (hasTrailingParam && paramCount === 1) ? CrudRole.Delete : CrudRole.Custom,
                    OPTIONS: () => CrudRole.Custom,
                    HEAD: () => CrudRole.Custom,
                });
            }
            resolvedCrudRole = computedRole;
        }

        return new ScannedRouteDescriptor({
            name: name ?? `${resourceName}.${resolvedActionName}`,
            method,
            path,
            resourceName,
            actionName: resolvedActionName,
            actionKind: resolvedActionKind,
            isMutating: resolvedIsMutating,
            groupName: resolvedGroupName,
            crudRole: resolvedCrudRole,
            runtimePath: resolvedRuntimePath,
            hookKind: resolvedHookKind,
            invalidation: resolvedInvalidation,
            executionSignature: resolvedSignature,
            requestContentType: resolvedContentType,
            auth,
            middleware,
            parameters: resolvedParameters,
            pathParameters: resolvedPathParams,
            queryParameters,
            response: resolvedResponse,
            errorResponses: errorResponses ?? (
                (resolvedIsMutating || (schema && schema.rules && schema.rules.length > 0) ? [ScannedHttpErrorResponseDescriptor.unprocessableEntity()] : []).concat(
                    auth ? [ScannedHttpErrorResponseDescriptor.unauthorized()] : []
                )
            ),
            sourceFile,
            sourceLine,
            schema
        });
    }

    constructor(rawParams: ScannedRouteParams | any) {
        const params: ScannedRouteParams = (!rawParams || !rawParams.parameters || !rawParams.response || !rawParams.invalidation || !rawParams.executionSignature)
            ? (ScannedRouteDescriptor.create(rawParams ?? {}) as any)
            : rawParams;
        this.name = params.name ?? `${params.resourceName}.${params.actionName}`;
        this.method = params.method.toUpperCase() as HttpMethod;
        this.path = params.path;
        this.resourceName = params.resourceName;
        this.actionName = params.actionName;
        this.groupName = params.groupName;
        this.crudRole = params.crudRole;
        this.runtimePath = params.runtimePath;
        this.responseTypeName = `${toPascalCase(params.resourceName)}Response`;
        this.actionKind = params.actionKind;
        this.isMutating = params.isMutating;
        this.hookKind = params.hookKind;
        this.invalidation = params.invalidation;
        this.executionSignature = params.executionSignature;
        this.requestContentType = params.requestContentType;

        const securityDesc = RouteSecurityClassifier.classify(params.middleware);
        this.security = securityDesc;
        this.auth = params.auth || securityDesc.isProtected;
        this.middleware = Object.freeze([...params.middleware]);

        const policies: RoutePolicyDescriptor[] = [];
        let rateLimit: RateLimitDescriptor | null = null;
        for (const m of params.middleware) {
            const trimmed = m.trim();
            if (trimmed.startsWith('can:')) {
                const parts = trimmed.slice(4).split(',');
                policies.push(new ScannedRoutePolicyDescriptor({
                    ability: parts[0]?.trim() || '',
                    modelParameter: parts[1]?.trim() ?? null
                }));
            } else if (trimmed.toLowerCase().startsWith('throttle:')) {
                const parts = trimmed.slice(9).split(',');
                const maxAttempts = parseInt(parts[0], 10);
                const decayMinutes = parts[1] ? parseFloat(parts[1]) : 1;
                if (!isNaN(maxAttempts)) {
                    rateLimit = ScannedRateLimitDescriptor.create(maxAttempts, decayMinutes);
                }
            }
        }
        this.policies = Object.freeze(policies);
        this.rateLimit = rateLimit;

        this.parameters = Object.freeze([...params.parameters]);
        this.pathParameters = Object.freeze([...params.pathParameters]);
        this.queryParameters = Object.freeze([...params.queryParameters]);
        this.response = params.response;
        this.errorResponses = Object.freeze([...params.errorResponses]);
        this.sourceFile = params.sourceFile;
        this.sourceLine = params.sourceLine;
        this.schema = params.schema;
        this.assignments = Object.freeze([]);
        this.uri = params.path;
        this.controllerName = null;
        this.contract = ScannedEndpointContract.fromRoute(this);
        Object.freeze(this);
    }

    public withInvalidation(invalidation: RouteCacheInvalidationDescriptor): ScannedRouteDescriptor {
        const parts = this.name.split('.');
        let actionName = this.name;
        switch (parts.length > 1) {
            case true:
                actionName = parts[1];
                break;
            case false:
                break;
        }
        return new ScannedRouteDescriptor({
            method: this.method,
            path: this.path,
            resourceName: this.resourceName,
            actionName,
            actionKind: this.actionKind,
            isMutating: this.isMutating,
            groupName: this.groupName,
            crudRole: this.crudRole,
            runtimePath: this.runtimePath,
            hookKind: this.hookKind,
            invalidation,
            executionSignature: this.executionSignature,
            requestContentType: this.requestContentType,
            auth: this.auth,
            middleware: this.middleware,
            parameters: this.parameters,
            pathParameters: this.pathParameters,
            queryParameters: this.queryParameters,
            response: this.response,
            errorResponses: this.errorResponses,
            sourceFile: this.sourceFile,
            sourceLine: this.sourceLine,
            schema: this.schema
        });
    }
}

export interface ScannedResourceFieldParams {
    readonly name: string;
    readonly propertyName: string;
    readonly expression: ResourceFieldExpression;
    readonly semanticType: PrimitiveKind;
    readonly nullable: boolean;
}

/**
 * Reusable Constructor: Scanned Resource Field Descriptor.
 */
export class ScannedResourceFieldDescriptor implements ResourceFieldDescriptor {
    public readonly name: string;
    public readonly propertyName: string;
    public readonly expression: ResourceFieldExpression;
    public readonly semanticType: PrimitiveKind;
    public readonly nullable: boolean;

    constructor({
        name,
        propertyName,
        expression,
        semanticType,
        nullable
    }: ScannedResourceFieldParams) {
        this.name = name;
        this.propertyName = propertyName;
        this.expression = expression;
        this.semanticType = semanticType;
        this.nullable = nullable;
        Object.freeze(this);
    }

    public static fromExpression(
        name: string,
        expression: ResourceFieldExpression,
        nullable: boolean = false,
        propertyName: string = toCamelCase(name),
        semanticType?: PrimitiveKind
    ): ScannedResourceFieldDescriptor {
        const resolvedSemanticType = semanticType ?? (
            expression.kind === 'primitive' && (Object.values(PrimitiveKind) as string[]).includes(expression.type)
                ? (expression.type as PrimitiveKind)
                : PrimitiveKind.STRING
        );
        return new ScannedResourceFieldDescriptor({
            name,
            propertyName,
            expression,
            semanticType: resolvedSemanticType,
            nullable
        });
    }

    public static create({
        name,
        expression,
        nullable = false,
        propertyName = toCamelCase(name),
        semanticType
    }: {
        readonly name: string;
        readonly expression: ResourceFieldExpression;
        readonly nullable?: boolean;
        readonly propertyName?: string;
        readonly semanticType?: PrimitiveKind;
    }): ScannedResourceFieldDescriptor {
        return ScannedResourceFieldDescriptor.fromExpression(name, expression, nullable, propertyName, semanticType);
    }
}

export interface ScannedResourceParams {
    readonly name: string;
    readonly baseName: string;
    readonly typeName: string;
    readonly baseModel: string | null;
    readonly fields: readonly ResourceFieldDescriptor[];
    readonly assignments: readonly ResourceAssignment[];
    readonly sourceFile: string;
    readonly sourceLine: number;
    readonly isSynthetic: boolean;
}

/**
 * Reusable Constructor: Scanned Resource Descriptor.
 */
export class ScannedResourceDescriptor implements ParsedResource {
    public readonly name: string;
    public readonly baseName: string;
    public readonly typeName: string;
    public readonly sanitizedName: string;
    public readonly baseModel: string | null;
    public readonly actions: readonly ActionDefinition[];
    public readonly endpoints: readonly string[];
    public readonly fields: readonly ResourceFieldDescriptor[];
    public readonly assignments: readonly ResourceAssignment[];
    public readonly sourceFile: string;
    public readonly sourceLine: number;
    public readonly isSynthetic: boolean;

    constructor({
        name,
        baseName,
        typeName,
        baseModel,
        fields,
        assignments,
        sourceFile,
        sourceLine,
        isSynthetic
    }: ScannedResourceParams) {
        this.name = name;
        this.baseName = baseName;
        this.typeName = typeName;
        this.sanitizedName = toCamelCase(name);
        this.baseModel = baseModel;
        this.actions = Object.freeze([]);
        this.endpoints = Object.freeze([]);
        this.fields = Object.freeze(fields);
        this.assignments = Object.freeze(assignments);
        this.sourceFile = sourceFile;
        this.sourceLine = sourceLine;
        this.isSynthetic = isSynthetic;
        Object.freeze(this);
    }

    public static create({
        name,
        fields,
        sourceFile = '',
        sourceLine = 0,
        assignments = []
    }: {
        readonly name: string;
        readonly fields: readonly ResourceFieldDescriptor[];
        readonly sourceFile?: string;
        readonly sourceLine?: number;
        readonly assignments?: readonly ResourceAssignment[];
    }): ScannedResourceDescriptor {
        const baseName = ResourceNamingConvention.stripSuffix(name);
        return new ScannedResourceDescriptor({
            name,
            baseName,
            typeName: ResourceNamingConvention.toTransformedName(baseName),
            baseModel: baseName,
            fields,
            assignments,
            sourceFile,
            sourceLine,
            isSynthetic: false
        });
    }
}

export interface ScannedRouteParameterParams {
    readonly name: string;
    readonly propertyName: string;
    readonly bindingField: string | null;
    readonly in: RouteParameterLocation;
    readonly required: boolean;
    readonly type: RouteParameterType;
}

/**
 * Reusable Constructor: Scanned Route Parameter Descriptor.
 */
export class ScannedRouteParameterDescriptor implements RouteParameter {
    public readonly name: string;
    public readonly propertyName: string;
    public readonly bindingField: string | null;
    public readonly in: RouteParameterLocation;
    public readonly required: boolean;
    public readonly type: RouteParameterType;

    constructor(params: ScannedRouteParameterParams) {
        this.name = params.name;
        this.propertyName = params.propertyName ?? toCamelCase(params.name);
        this.bindingField = params.bindingField ?? null;
        this.in = params.in ?? 'path';
        this.required = params.required ?? true;
        this.type = params.type ?? ((params.name === 'id' || params.name.endsWith('_id') || params.name.endsWith('Id')) ? 'number' : 'string');
        Object.freeze(this);
    }

    public static create({
        name,
        propertyName = toCamelCase(name),
        bindingField = null,
        in: location = 'path',
        required = true,
        type
    }: {
        readonly name: string;
        readonly propertyName?: string;
        readonly bindingField?: string | null;
        readonly in?: RouteParameterLocation;
        readonly required?: boolean;
        readonly type?: RouteParameterType;
    }): ScannedRouteParameterDescriptor {
        const bField = bindingField ?? null;
        const isNumeric = bField
            ? (bField === 'id' || bField.endsWith('_id') || bField.endsWith('Id'))
            : (name === 'id' || name.endsWith('_id') || name.endsWith('Id'));
        return new ScannedRouteParameterDescriptor({
            name,
            propertyName,
            bindingField: bField,
            in: location,
            required,
            type: type ?? (isNumeric ? RouteParameterType.Number : RouteParameterType.String)
        });
    }

    public static fromPathSegment(rawSegment: string): PathParameterDescriptor {
        const [rawName, bindingField] = rawSegment.split(':');
        const isOptional = rawName.endsWith('?');
        const name = isOptional ? rawName.slice(0, -1) : rawName;
        const isNumeric = bindingField
            ? (bindingField === 'id' || bindingField.endsWith('_id') || bindingField.endsWith('Id'))
            : (name === 'id' || name.endsWith('_id') || name.endsWith('Id'));
        return new ScannedRouteParameterDescriptor({
            name,
            propertyName: toCamelCase(name),
            bindingField: bindingField ?? null,
            in: 'path',
            required: !isOptional,
            type: isNumeric ? RouteParameterType.Number : RouteParameterType.String
        }) as PathParameterDescriptor;
    }

    public static path({
        name,
        propertyName = toCamelCase(name),
        bindingField = null,
        required = true,
        type
    }: {
        readonly name: string;
        readonly propertyName?: string;
        readonly bindingField?: string | null;
        readonly required?: boolean;
        readonly type?: RouteParameterType;
    }): PathParameterDescriptor {
        const bField = bindingField ?? null;
        const isNumeric = bField
            ? (bField === 'id' || bField.endsWith('_id') || bField.endsWith('Id'))
            : (name === 'id' || name.endsWith('_id') || name.endsWith('Id'));
        return new ScannedRouteParameterDescriptor({
            name,
            propertyName,
            bindingField: bField,
            in: 'path',
            required,
            type: type ?? (isNumeric ? RouteParameterType.Number : RouteParameterType.String)
        }) as PathParameterDescriptor;
    }

    public static query({
        name,
        propertyName = toCamelCase(name),
        required = false,
        type = RouteParameterType.String
    }: {
        readonly name: string;
        readonly propertyName?: string;
        readonly required?: boolean;
        readonly type?: RouteParameterType;
    }): QueryParameterDescriptor {
        return new ScannedRouteParameterDescriptor({
            name,
            propertyName,
            bindingField: null,
            in: 'query',
            required,
            type
        }) as QueryParameterDescriptor;
    }

    public static header({
        name,
        propertyName = toCamelCase(name),
        required = true,
        type = RouteParameterType.String
    }: {
        readonly name: string;
        readonly propertyName?: string;
        readonly required?: boolean;
        readonly type?: RouteParameterType;
    }): HeaderParameterDescriptor {
        return new ScannedRouteParameterDescriptor({
            name,
            propertyName,
            bindingField: null,
            in: 'header',
            required,
            type
        }) as HeaderParameterDescriptor;
    }
}

export interface ScannedRouteQueryParameterParams {
    readonly name: string;
    readonly propertyName: string;
    readonly required: boolean;
    readonly type: RouteParameterType;
    readonly isArray: boolean;
    readonly default: unknown;
}

/**
 * Reusable Constructor: Scanned Route Query Parameter Descriptor.
 */
export class ScannedRouteQueryParameterDescriptor implements RouteQueryParameter {
    public readonly name: string;
    public readonly propertyName: string;
    public readonly required: boolean;
    public readonly type: RouteParameterType;
    public readonly isArray: boolean;
    public readonly default: unknown;

    constructor(params: ScannedRouteQueryParameterParams) {
        this.name = params.name;
        this.propertyName = params.propertyName;
        this.required = params.required;
        this.type = params.type;
        this.isArray = params.isArray;
        this.default = params.default;
        Object.freeze(this);
    }

    public static create({
        name,
        propertyName = toCamelCase(name),
        required = false,
        type = RouteParameterType.String,
        isArray = false,
        default: defaultValue = null
    }: {
        readonly name: string;
        readonly propertyName?: string;
        readonly required?: boolean;
        readonly type?: RouteParameterType;
        readonly isArray?: boolean;
        readonly default?: unknown;
    }): ScannedRouteQueryParameterDescriptor {
        return new ScannedRouteQueryParameterDescriptor({
            name,
            propertyName,
            required,
            type,
            isArray,
            default: defaultValue
        });
    }
}

export interface ScannedRoutePolicyParams {
    readonly ability: string;
    readonly modelParameter: string | null;
}

/**
 * Reusable Constructor: Scanned Route Policy Descriptor.
 */
export class ScannedRoutePolicyDescriptor implements RoutePolicyDescriptor {
    public readonly ability: string;
    public readonly modelParameter: string | null;

    constructor({ ability, modelParameter }: ScannedRoutePolicyParams) {
        this.ability = ability;
        this.modelParameter = modelParameter;
        Object.freeze(this);
    }

    public static create({
        ability,
        modelParameter = null
    }: {
        readonly ability: string;
        readonly modelParameter?: string | null;
    }): ScannedRoutePolicyDescriptor {
        return new ScannedRoutePolicyDescriptor({
            ability,
            modelParameter: modelParameter ?? null
        });
    }
}

export interface ScannedRateLimitParams {
    readonly maxAttempts: number;
    readonly decayMinutes: number;
}

/**
 * Reusable Constructor: Scanned Rate Limit Descriptor.
 */
export class ScannedRateLimitDescriptor implements RateLimitDescriptor {
    public readonly maxAttempts: number;
    public readonly decayMinutes: number;

    constructor({ maxAttempts, decayMinutes }: ScannedRateLimitParams) {
        this.maxAttempts = maxAttempts;
        this.decayMinutes = decayMinutes;
        Object.freeze(this);
    }

    public static create(
        maxAttemptsOrOptions: number | { readonly maxAttempts: number; readonly decayMinutes?: number },
        decayMinutesArg: number = 1
    ): ScannedRateLimitDescriptor {
        if (typeof maxAttemptsOrOptions === 'object') {
            return new ScannedRateLimitDescriptor({
                maxAttempts: maxAttemptsOrOptions.maxAttempts,
                decayMinutes: maxAttemptsOrOptions.decayMinutes ?? 1
            });
        }
        return new ScannedRateLimitDescriptor({ maxAttempts: maxAttemptsOrOptions, decayMinutes: decayMinutesArg });
    }
}

export interface ScannedHttpErrorResponseParams {
    readonly statusCode: HttpStatusCode;
    readonly name: string;
    readonly typeName: string;
    readonly schema: Record<string, unknown>;
}

/**
 * Reusable Constructor: Scanned HTTP Error Response Descriptor.
 */
export class ScannedHttpErrorResponseDescriptor implements HttpErrorResponseDescriptor {
    public readonly statusCode: HttpStatusCode;
    public readonly name: string;
    public readonly typeName: string;
    public readonly schema: Record<string, unknown>;

    constructor({ statusCode, name, typeName, schema }: ScannedHttpErrorResponseParams) {
        this.statusCode = statusCode;
        this.name = name;
        this.typeName = typeName;
        this.schema = schema;
        Object.freeze(this);
    }

    public static create({
        statusCode,
        name,
        typeName = `${name}Error`,
        schema = {
            type: 'object',
            properties: {
                message: { typeName: 'string', nullable: false }
            }
        }
    }: {
        readonly statusCode: HttpStatusCode;
        readonly name: string;
        readonly typeName?: string;
        readonly schema?: Record<string, unknown>;
    }): ScannedHttpErrorResponseDescriptor {
        return new ScannedHttpErrorResponseDescriptor({
            statusCode,
            name,
            typeName,
            schema
        });
    }

    public static unprocessableEntity(): ScannedHttpErrorResponseDescriptor {
        return new ScannedHttpErrorResponseDescriptor({
            statusCode: HttpStatusCode.UnprocessableEntity,
            name: 'UnprocessableEntity',
            typeName: 'LaravelValidationError',
            schema: {
                type: 'object',
                properties: {
                    message: { typeName: 'string', nullable: false },
                    errors: { typeName: 'Record<string, string[]>', nullable: false }
                }
            }
        });
    }

    public static unauthorized(): ScannedHttpErrorResponseDescriptor {
        return new ScannedHttpErrorResponseDescriptor({
            statusCode: HttpStatusCode.Unauthorized,
            name: 'Unauthorized',
            typeName: 'LaravelUnauthorizedError',
            schema: {
                type: 'object',
                properties: {
                    message: { typeName: 'string', nullable: false }
                }
            }
        });
    }
}

export interface ScannedModelCastParams {
    readonly column: string;
    readonly targetType: string;
    readonly castKind: EloquentCastKind;
    readonly semanticType: PrimitiveKind;
}

/**
 * Reusable Constructor: Scanned Model Cast Descriptor.
 */
export class ScannedModelCastDescriptor implements ParsedCast {
    public readonly column: string;
    public readonly targetType: string;
    public readonly castKind: EloquentCastKind;
    public readonly semanticType: PrimitiveKind;

    constructor({ column, targetType, castKind, semanticType }: ScannedModelCastParams) {
        this.column = column;
        this.targetType = targetType;
        this.castKind = castKind;
        this.semanticType = semanticType;
        Object.freeze(this);
    }

    public static create({ column, targetType }: { readonly column: string; readonly targetType: string }): ScannedModelCastDescriptor {
        const mapped = EloquentCastMapper.map(targetType);
        return new ScannedModelCastDescriptor({
            column,
            targetType,
            castKind: mapped.castKind,
            semanticType: mapped.semanticType
        });
    }
}

export interface ScannedModelRelationParams {
    readonly name: string;
    readonly type: EloquentRelationType;
    readonly modelName: string;
    readonly targetModel: string;
    readonly cardinality: EloquentRelationCardinality;
    readonly isCollection: boolean;
    readonly foreignKey: string | null;
}

/**
 * Reusable Constructor: Scanned Model Relation Descriptor.
 */
export class ScannedModelRelationDescriptor implements ParsedRelation {
    public readonly name: string;
    public readonly type: EloquentRelationType;
    public readonly modelName: string;
    public readonly targetModel: string;
    public readonly cardinality: EloquentRelationCardinality;
    public readonly isCollection: boolean;
    public readonly foreignKey: string | null;

    constructor(params: ScannedModelRelationParams) {
        this.name = params.name;
        this.type = params.type;
        this.modelName = params.modelName;
        this.targetModel = params.targetModel;
        this.cardinality = params.cardinality;
        this.isCollection = params.isCollection;
        this.foreignKey = params.foreignKey;
        Object.freeze(this);
    }

    public static create({
        name,
        type,
        modelName,
        targetModel = modelName,
        cardinality,
        isCollection,
        foreignKey = null
    }: {
        readonly name: string;
        readonly type: EloquentRelationType;
        readonly modelName: string;
        readonly targetModel?: string;
        readonly cardinality?: EloquentRelationCardinality;
        readonly isCollection?: boolean;
        readonly foreignKey?: string | null;
    }): ScannedModelRelationDescriptor {
        const desc = EloquentRelationClassifier.getDescriptor(type);
        return new ScannedModelRelationDescriptor({
            name,
            type,
            modelName,
            targetModel,
            cardinality: cardinality ?? desc.cardinality,
            isCollection: isCollection ?? desc.isCollection,
            foreignKey
        });
    }

    public static single({
        name,
        type,
        modelName,
        targetModel = modelName,
        foreignKey = null
    }: {
        readonly name: string;
        readonly type: EloquentRelationType;
        readonly modelName: string;
        readonly targetModel?: string;
        readonly foreignKey?: string | null;
    }): SingleRelationDescriptor {
        return new ScannedModelRelationDescriptor({
            name,
            type,
            modelName,
            targetModel,
            cardinality: 'one',
            isCollection: false,
            foreignKey
        }) as SingleRelationDescriptor;
    }

    public static collection({
        name,
        type,
        modelName,
        targetModel = modelName,
        foreignKey = null
    }: {
        readonly name: string;
        readonly type: EloquentRelationType;
        readonly modelName: string;
        readonly targetModel?: string;
        readonly foreignKey?: string | null;
    }): CollectionRelationDescriptor {
        return new ScannedModelRelationDescriptor({
            name,
            type,
            modelName,
            targetModel,
            cardinality: 'many',
            isCollection: true,
            foreignKey
        }) as CollectionRelationDescriptor;
    }
}

export interface ScannedBroadcastChannelParams {
    readonly name: string;
    readonly kind: BroadcastChannelKind;
    readonly pattern: string;
    readonly runtimePattern: string;
    readonly parameters: readonly RouteParameter[];
    readonly isPrivate: boolean;
    readonly isPresence: boolean;
}

/**
 * Reusable Constructor: Scanned Broadcast Channel Descriptor.
 */
export class ScannedBroadcastChannelDescriptor implements BroadcastChannelDescriptor {
    public readonly name: string;
    public readonly kind: BroadcastChannelKind;
    public readonly pattern: string;
    public readonly runtimePattern: string;
    public readonly parameters: readonly RouteParameter[];
    public readonly isPrivate: boolean;
    public readonly isPresence: boolean;

    constructor({ name, kind, pattern, runtimePattern, parameters, isPrivate, isPresence }: ScannedBroadcastChannelParams) {
        this.name = name;
        this.kind = kind;
        this.pattern = pattern;
        this.runtimePattern = runtimePattern;
        this.parameters = Object.freeze(parameters);
        this.isPrivate = isPrivate;
        this.isPresence = isPresence;
        Object.freeze(this);
    }

    public static create({
        name,
        pattern,
        kind,
        parameters = [],
        isPrivate,
        isPresence
    }: {
        readonly name: string;
        readonly pattern?: string;
        readonly kind?: BroadcastChannelKind;
        readonly parameters?: readonly RouteParameter[];
        readonly isPrivate?: boolean;
        readonly isPresence?: boolean;
    }): ScannedBroadcastChannelDescriptor {
        const resolvedPattern = pattern ?? name;
        const runtimePattern = resolvedPattern.replace(/\{([^}]+)\}/g, (_, pName) => {
            const cleanName = pName.split(':')[0];
            const matched = parameters.find(p => p.name === cleanName);
            return `\${${matched?.propertyName || cleanName}}`;
        });
        const presence = isPresence ?? (kind === BroadcastChannelKind.Presence || resolvedPattern.includes('presence') || resolvedPattern.includes('chat'));
        const priv = isPrivate ?? (kind === BroadcastChannelKind.Private || (!resolvedPattern.startsWith('public.') && !presence));
        const resolvedKind = kind ?? (presence ? BroadcastChannelKind.Presence : priv ? BroadcastChannelKind.Private : BroadcastChannelKind.Public);
        return new ScannedBroadcastChannelDescriptor({
            name,
            kind: resolvedKind,
            pattern: resolvedPattern,
            runtimePattern,
            parameters,
            isPrivate: priv,
            isPresence: presence
        });
    }

    public static fromPattern({
        name,
        pattern,
        kind,
        parameters = []
    }: {
        readonly name: string;
        readonly pattern?: string;
        readonly kind?: BroadcastChannelKind;
        readonly parameters?: readonly RouteParameter[];
    }): ScannedBroadcastChannelDescriptor {
        return ScannedBroadcastChannelDescriptor.create({ name, pattern, kind, parameters });
    }

    public static public({
        name,
        pattern,
        parameters = []
    }: {
        readonly name: string;
        readonly pattern?: string;
        readonly parameters?: readonly RouteParameter[];
    }): PublicBroadcastChannelDescriptor {
        const resolvedPattern = pattern ?? name;
        const runtimePattern = resolvedPattern.replace(/\{([^}]+)\}/g, (_, pName) => {
            const cleanName = pName.split(':')[0];
            const matched = parameters.find(p => p.name === cleanName);
            return `\${${matched?.propertyName || cleanName}}`;
        });
        return Object.freeze({
            name,
            kind: BroadcastChannelKind.Public,
            pattern: resolvedPattern,
            runtimePattern,
            parameters: Object.freeze([...parameters]),
            isPrivate: false as const,
            isPresence: false as const
        });
    }

    public static private({
        name,
        pattern,
        parameters = []
    }: {
        readonly name: string;
        readonly pattern?: string;
        readonly parameters?: readonly RouteParameter[];
    }): PrivateBroadcastChannelDescriptor {
        const resolvedPattern = pattern ?? name;
        const runtimePattern = resolvedPattern.replace(/\{([^}]+)\}/g, (_, pName) => {
            const cleanName = pName.split(':')[0];
            const matched = parameters.find(p => p.name === cleanName);
            return `\${${matched?.propertyName || cleanName}}`;
        });
        return Object.freeze({
            name,
            kind: BroadcastChannelKind.Private,
            pattern: resolvedPattern,
            runtimePattern,
            parameters: Object.freeze([...parameters]),
            isPrivate: true as const,
            isPresence: false as const
        });
    }

    public static presence({
        name,
        pattern,
        parameters = []
    }: {
        readonly name: string;
        readonly pattern?: string;
        readonly parameters?: readonly RouteParameter[];
    }): PresenceBroadcastChannelDescriptor {
        const resolvedPattern = pattern ?? name;
        const runtimePattern = resolvedPattern.replace(/\{([^}]+)\}/g, (_, pName) => {
            const cleanName = pName.split(':')[0];
            const matched = parameters.find(p => p.name === cleanName);
            return `\${${matched?.propertyName || cleanName}}`;
        });
        return Object.freeze({
            name,
            kind: BroadcastChannelKind.Presence,
            pattern: resolvedPattern,
            runtimePattern,
            parameters: Object.freeze([...parameters]),
            isPrivate: true as const,
            isPresence: true as const
        });
    }
}

export interface ScannedFormFieldParams {
    readonly name: string;
    readonly originalName: string;
    readonly type: SemanticType;
    readonly required: boolean;
    readonly nullable: boolean;
    readonly validationAst: readonly ValidationRuleNode[];
    readonly fileConstraints: FileValidationConstraints | null;
}

/**
 * Reusable Constructor: Scanned Form Field Descriptor.
 */
export class ScannedFormFieldDescriptor implements RequestField {
    public readonly transformedName: string;
    public readonly originalName: string;
    public readonly type: SemanticType;
    public readonly required: boolean;
    public readonly nullable: boolean;
    public readonly validationAst?: readonly ValidationRuleNode[];
    public readonly fileConstraints?: FileValidationConstraints;

    constructor({ name, originalName, type, required, nullable, validationAst, fileConstraints }: ScannedFormFieldParams) {
        this.transformedName = name;
        this.originalName = originalName;
        this.type = type;
        this.required = required;
        this.nullable = nullable;
        this.validationAst = validationAst.length > 0 ? Object.freeze([...validationAst]) : undefined;
        this.fileConstraints = fileConstraints ?? undefined;
        Object.freeze(this);
    }

    public static create({
        name,
        transformedName,
        originalName = name,
        type,
        required = false,
        nullable = false,
        validationAst = [],
        fileConstraints = null
    }: {
        readonly name: string;
        readonly transformedName?: string;
        readonly originalName?: string;
        readonly type: SemanticType;
        readonly required?: boolean;
        readonly nullable?: boolean;
        readonly validationAst?: readonly ValidationRuleNode[];
        readonly fileConstraints?: FileValidationConstraints | null;
    }): ScannedFormFieldDescriptor {
        return new ScannedFormFieldDescriptor({
            name: transformedName ?? originalName,
            originalName,
            type,
            required,
            nullable,
            validationAst,
            fileConstraints
        });
    }
}

export interface ScannedFormActionParams {
    readonly name: string;
    readonly fields: readonly RequestField[];
}

/**
 * Reusable Constructor: Scanned Form Action Descriptor.
 */
export class ScannedFormActionDescriptor implements FormAction {
    public readonly name: string;
    public readonly fields: readonly RequestField[];

    constructor({ name, fields }: ScannedFormActionParams) {
        this.name = name;
        this.fields = Object.freeze(fields);
        Object.freeze(this);
    }
}

export interface ScannedRequestTypeParams {
    readonly resourceName: string;
    readonly formTypeName: string;
    readonly actions: readonly FormAction[];
    readonly responseData: ResponseData | null;
}

/**
 * Reusable Constructor: Scanned Request Type Descriptor.
 */
export class ScannedRequestTypeDescriptor implements RequestType {
    public readonly resourceName: string;
    public readonly formTypeName: string;
    public readonly actions: readonly FormAction[];
    public readonly responseData?: ResponseData;

    constructor({ resourceName, formTypeName, actions, responseData }: ScannedRequestTypeParams) {
        this.resourceName = resourceName;
        this.formTypeName = formTypeName;
        this.actions = Object.freeze(actions);
        this.responseData = responseData ? Object.freeze(responseData) : undefined;
        Object.freeze(this);
    }

    public static create({
        resourceName,
        formTypeName = `${toPascalCase(resourceName)}Form`,
        actions = [],
        responseData = null
    }: {
        readonly resourceName: string;
        readonly formTypeName?: string;
        readonly actions?: readonly FormAction[];
        readonly responseData?: ResponseData | null;
    }): ScannedRequestTypeDescriptor {
        return new ScannedRequestTypeDescriptor({
            resourceName,
            formTypeName,
            actions,
            responseData
        });
    }
}

export interface ScannedModelColumnParams {
    readonly name: string;
    readonly propertyName: string;
    readonly type: string;
    readonly columnKind: DatabaseColumnKind;
    readonly nullable: boolean;
    readonly semanticType: PrimitiveKind;
    readonly enumValues: readonly string[];
}

/**
 * Reusable Constructor: Scanned Model Column Descriptor.
 */
export class ScannedModelColumnDescriptor implements ParsedColumn {
    public readonly name: string;
    public readonly propertyName: string;
    public readonly type: string;
    public readonly columnKind: DatabaseColumnKind;
    public readonly nullable: boolean;
    public readonly semanticType: PrimitiveKind;
    public readonly enumValues: readonly string[];

    constructor({ name, propertyName, type, columnKind, nullable, semanticType, enumValues }: ScannedModelColumnParams) {
        this.name = name;
        this.propertyName = propertyName;
        this.type = type;
        this.columnKind = columnKind;
        this.nullable = nullable;
        this.semanticType = semanticType;
        this.enumValues = Object.freeze([...enumValues]);
        Object.freeze(this);
    }

    public static fromSchema({
        name,
        propertyName,
        type = 'varchar',
        columnKind,
        nullable = true,
        semanticType,
        enumValues = []
    }: {
        readonly name: string;
        readonly propertyName?: string;
        readonly type?: string;
        readonly columnKind?: DatabaseColumnKind;
        readonly nullable?: boolean;
        readonly semanticType?: PrimitiveKind;
        readonly enumValues?: readonly string[];
    }): ScannedModelColumnDescriptor {
        return new ScannedModelColumnDescriptor({
            name,
            propertyName: propertyName ?? toCamelCase(name),
            type,
            columnKind: columnKind ?? (type.toLowerCase().startsWith('tinyint(1)') ? DatabaseColumnKind.Boolean : DatabaseColumnTypeMapper.toColumnKind(type)),
            nullable,
            semanticType: semanticType ?? DatabaseColumnTypeMapper.toPrimitiveKind(type),
            enumValues
        });
    }

    public static create(params: Parameters<typeof ScannedModelColumnDescriptor.fromSchema>[0]): ScannedModelColumnDescriptor {
        return ScannedModelColumnDescriptor.fromSchema(params);
    }
}

export interface ScannedModelAccessorParams {
    readonly name: string;
    readonly propertyName: string;
    readonly type: string;
    readonly nullable: boolean;
    readonly semanticType: PrimitiveKind;
}

/**
 * Reusable Constructor: Scanned Model Accessor Descriptor.
 */
export class ScannedModelAccessorDescriptor implements ParsedAccessor {
    public readonly name: string;
    public readonly propertyName: string;
    public readonly type: string;
    public readonly nullable: boolean;
    public readonly semanticType: PrimitiveKind;

    constructor({
        name,
        propertyName,
        type,
        nullable,
        semanticType
    }: ScannedModelAccessorParams) {
        this.name = name;
        this.propertyName = propertyName;
        this.type = type;
        this.nullable = nullable;
        this.semanticType = semanticType;
        Object.freeze(this);
    }

    public static fromReturnType({
        name,
        propertyName,
        type,
        nullable = false,
        semanticType
    }: {
        readonly name: string;
        readonly propertyName?: string;
        readonly type: string;
        readonly nullable?: boolean;
        readonly semanticType?: PrimitiveKind;
    }): ScannedModelAccessorDescriptor {
        let resolvedSemanticType = semanticType;
        if (!resolvedSemanticType) {
            if (type === 'number' || type === 'int' || type === 'float') {
                resolvedSemanticType = PrimitiveKind.NUMBER;
            } else if (type === 'boolean' || type === 'bool') {
                resolvedSemanticType = PrimitiveKind.BOOLEAN;
            } else {
                resolvedSemanticType = PrimitiveKind.STRING;
            }
        }
        return new ScannedModelAccessorDescriptor({
            name,
            propertyName: propertyName ?? toCamelCase(name),
            type,
            nullable,
            semanticType: resolvedSemanticType
        });
    }

    public static create(params: Parameters<typeof ScannedModelAccessorDescriptor.fromReturnType>[0]): ScannedModelAccessorDescriptor {
        return ScannedModelAccessorDescriptor.fromReturnType(params);
    }
}

export interface ScannedModelParams {
    readonly name: string;
    readonly shortName: string;
    readonly table: string;
    readonly primaryKey: string;
    readonly keyType: ModelKeyType;
    readonly keySemanticType: PrimitiveKind;
    readonly incrementing: boolean;
    readonly softDeletes: boolean;
    readonly timestamps: boolean;
    readonly columns: readonly ParsedColumn[];
    readonly fillable: readonly string[];
    readonly guarded: readonly string[];
    readonly hidden: readonly string[];
    readonly appends: readonly string[];
    readonly casts: readonly ParsedCast[];
    readonly accessors: readonly ParsedAccessor[];
    readonly relations: readonly ParsedRelation[];
}

/**
 * Reusable Constructor: Scanned Model Descriptor.
 */
export class ScannedModelDescriptor implements ParsedModel {
    public readonly name: string;
    public readonly shortName: string;
    public readonly table: string;
    public readonly primaryKey: string;
    public readonly keyType: ModelKeyType;
    public readonly keySemanticType: PrimitiveKind;
    public readonly incrementing: boolean;
    public readonly softDeletes: boolean;
    public readonly timestamps: boolean;
    public readonly columns: readonly ParsedColumn[];
    public readonly fillable: readonly string[];
    public readonly guarded: readonly string[];
    public readonly hidden: readonly string[];
    public readonly appends: readonly string[];
    public readonly casts: readonly ParsedCast[];
    public readonly accessors: readonly ParsedAccessor[];
    public readonly relations: readonly ParsedRelation[];

    constructor({
        name,
        shortName,
        table,
        primaryKey,
        keyType,
        keySemanticType,
        incrementing,
        softDeletes,
        timestamps,
        columns,
        fillable,
        guarded,
        hidden,
        appends,
        casts,
        accessors,
        relations
    }: ScannedModelParams) {
        this.name = name;
        this.shortName = shortName;
        this.table = table;
        this.primaryKey = primaryKey;
        this.keyType = keyType;
        this.keySemanticType = keySemanticType;
        this.incrementing = incrementing;
        this.softDeletes = softDeletes;
        this.timestamps = timestamps;
        this.columns = Object.freeze(columns);
        this.fillable = Object.freeze(fillable);
        this.guarded = Object.freeze(guarded);
        this.hidden = Object.freeze(hidden);
        this.appends = Object.freeze(appends);
        this.casts = Object.freeze(casts);
        this.accessors = Object.freeze(accessors);
        this.relations = Object.freeze(relations);
        Object.freeze(this);
    }

    public static create({
        name,
        shortName,
        table,
        primaryKey = 'id',
        keyType = 'int',
        keySemanticType,
        incrementing = true,
        softDeletes,
        timestamps,
        columns,
        fillable = [],
        guarded = ['*'],
        hidden = [],
        appends = [],
        casts = [],
        accessors = [],
        relations = []
    }: {
        readonly name: string;
        readonly shortName?: string;
        readonly table?: string;
        readonly primaryKey?: string;
        readonly keyType?: ModelKeyType | string;
        readonly keySemanticType?: PrimitiveKind;
        readonly incrementing?: boolean;
        readonly softDeletes?: boolean;
        readonly timestamps?: boolean;
        readonly columns: readonly ParsedColumn[];
        readonly fillable?: readonly string[];
        readonly guarded?: readonly string[];
        readonly hidden?: readonly string[];
        readonly appends?: readonly string[];
        readonly casts?: readonly ParsedCast[];
        readonly accessors?: readonly ParsedAccessor[];
        readonly relations?: readonly ParsedRelation[];
    }): ScannedModelDescriptor {
        const defaultShortName = extractClassBasename(name);
        const resolvedShortName = shortName ?? defaultShortName;
        const resolvedTable = table ?? inferLaravelTableName(defaultShortName);
        const normalizedKeyType: ModelKeyType = ModelKeyTypeMapper.normalize(keyType);
        const resolvedKeySemantic: PrimitiveKind = keySemanticType ?? MODEL_KEY_TYPE_REGISTRY[normalizedKeyType].primitiveKind;

        return new ScannedModelDescriptor({
            name,
            shortName: resolvedShortName,
            table: resolvedTable,
            primaryKey,
            keyType: normalizedKeyType,
            keySemanticType: resolvedKeySemantic,
            incrementing,
            softDeletes: softDeletes ?? columns.some(c => c.name === 'deleted_at'),
            timestamps: timestamps ?? (columns.some(c => c.name === 'created_at') && columns.some(c => c.name === 'updated_at')),
            columns,
            fillable,
            guarded,
            hidden,
            appends,
            casts,
            accessors,
            relations
        });
    }
}

export interface ScannedResourceRouteGroupParams {
    readonly resourceName: string;
    readonly formTypeName: string;
    readonly routes: readonly ParsedRoute[];
    readonly formActions: readonly FormAction[];
}

/**
 * Reusable Constructor: Scanned Resource Route Group Descriptor.
 */
export class ScannedResourceRouteGroupDescriptor implements ResourceRouteGroup {
    public readonly resourceName: string;
    public readonly formTypeName: string;
    public readonly routes: readonly ParsedRoute[];
    public readonly formActions: readonly FormAction[];

    constructor({ resourceName, formTypeName, routes, formActions }: ScannedResourceRouteGroupParams) {
        this.resourceName = resourceName;
        this.formTypeName = formTypeName;
        this.routes = Object.freeze([...routes]);
        this.formActions = Object.freeze([...formActions]);
        Object.freeze(this);
    }

    public static create({
        resourceName,
        formTypeName = `${resourceName}Form`,
        routes = [],
        formActions = []
    }: {
        readonly resourceName: string;
        readonly formTypeName?: string;
        readonly routes?: readonly ParsedRoute[];
        readonly formActions?: readonly FormAction[];
    }): ScannedResourceRouteGroupDescriptor {
        return new ScannedResourceRouteGroupDescriptor({
            resourceName,
            formTypeName,
            routes,
            formActions
        });
    }
}

export interface ScannedRouteManifestParams {
    readonly version: string;
    readonly baseURL: string;
    readonly routes: readonly ParsedRoute[];
    readonly resources: readonly ParsedResource[];
    readonly models: readonly ParsedModel[];
    readonly routeGroups: readonly ResourceRouteGroup[];
    readonly requestTypes: readonly RequestType[];
    readonly semanticTypes: readonly ObjectType[];
    readonly generatedAt: string;
    readonly channels: readonly BroadcastChannelDescriptor[];
    readonly frontend: FrontendConfig | null;
    readonly pages: readonly PageConfig[];
}

/**
 * Reusable Constructor: Scanned Route Manifest Descriptor.
 */
export class ScannedRouteManifestDescriptor implements RouteManifest {
    public readonly version: string;
    public readonly baseURL: string;
    public readonly routes: readonly ParsedRoute[];
    public readonly resources: readonly ParsedResource[];
    public readonly models: readonly ParsedModel[];
    public readonly routeGroups: readonly ResourceRouteGroup[];
    public readonly requestTypes: readonly RequestType[];
    public readonly semanticTypes: readonly ObjectType[];
    public readonly generatedAt: string;
    public readonly channels: readonly BroadcastChannelDescriptor[];
    public readonly frontend: FrontendConfig | null;
    public readonly pages: readonly PageConfig[];

    constructor(params: ScannedRouteManifestParams) {
        this.version = params.version;
        this.baseURL = params.baseURL;
        this.routes = Object.freeze(params.routes);
        this.resources = Object.freeze(params.resources);
        this.models = Object.freeze(params.models);
        this.routeGroups = Object.freeze(params.routeGroups);
        this.requestTypes = Object.freeze(params.requestTypes);
        this.semanticTypes = Object.freeze(params.semanticTypes);
        this.generatedAt = params.generatedAt;
        this.channels = Object.freeze(params.channels);
        this.frontend = params.frontend;
        this.pages = Object.freeze([...params.pages]);
        Object.freeze(this);
    }

    public static create({
        version = '6.0.0',
        baseURL = 'http://localhost/api',
        routes = [],
        resources = [],
        models = [],
        routeGroups = [],
        requestTypes = [],
        semanticTypes = [],
        generatedAt = new Date().toISOString(),
        channels = [],
        frontend = null,
        pages = []
    }: {
        readonly version?: string;
        readonly baseURL?: string;
        readonly routes?: readonly ParsedRoute[];
        readonly resources?: readonly ParsedResource[];
        readonly models?: readonly ParsedModel[];
        readonly routeGroups?: readonly ResourceRouteGroup[];
        readonly requestTypes?: readonly RequestType[];
        readonly semanticTypes?: readonly ObjectType[];
        readonly generatedAt?: string;
        readonly channels?: readonly BroadcastChannelDescriptor[];
        readonly frontend?: FrontendConfig | null;
        readonly pages?: readonly PageConfig[];
    } = {}): ScannedRouteManifestDescriptor {
        const interner = new TypeInterner();
        const resolvedRequests = (requestTypes.length > 0)
            ? requestTypes
            : StaticLaravelScanner.deriveRequestTypes(routes, resources, interner, models);
        const resolvedSemantics = (semanticTypes.length > 0)
            ? semanticTypes
            : StaticLaravelScanner.deriveSemanticTypes(resources, models, interner, routes);

        return new ScannedRouteManifestDescriptor({
            version,
            baseURL,
            routes,
            resources,
            models,
            routeGroups,
            requestTypes: resolvedRequests,
            semanticTypes: resolvedSemantics,
            generatedAt,
            channels,
            frontend,
            pages
        });
    }

    public static empty(baseURL = 'http://localhost/api', version = '6.0.0'): ScannedRouteManifestDescriptor {
        return new ScannedRouteManifestDescriptor({
            version,
            baseURL,
            routes: [],
            resources: [],
            models: [],
            routeGroups: [],
            requestTypes: [],
            semanticTypes: [],
            generatedAt: new Date().toISOString(),
            channels: [],
            frontend: null,
            pages: []
        });
    }
}

export class StaticLaravelScanner {
    public readonly projectRoot: string;
    public readonly baseURL: string;
    public readonly version: string;
    private readonly interner: TypeInterner;

    /**
     * Reusable Constructor: Scanner Instance with Core Interner.
     */
    constructor({ projectRoot, baseURL, version }: StaticLaravelScannerOptions) {
        this.projectRoot = projectRoot;
        this.baseURL = baseURL;
        this.version = version;
        this.interner = new TypeInterner();
        Object.freeze(this);
    }

    public static create({
        projectRoot,
        baseURL = 'http://localhost/api',
        version = '6.0.0'
    }: {
        readonly projectRoot: string;
        readonly baseURL?: string;
        readonly version?: string;
    }): StaticLaravelScanner {
        return new StaticLaravelScanner({ projectRoot, baseURL, version });
    }

    /**
     * Static Helper for 1-Line Execution.
     */
    static async scan(
        projectRoot: string,
        options: { readonly baseURL?: string; readonly version?: string } = {}
    ): Promise<RouteManifest> {
        const scanner = StaticLaravelScanner.create({
            projectRoot,
            baseURL: options.baseURL,
            version: options.version
        });
        return scanner.execute();
    }

    /**
     * Resolves cache invalidations directly on routes at the Origin Boundary (0 new Map, 0 wrapper, 0 if).
     */
    public static resolveRouteInvalidations(
        routes: readonly ParsedRoute[],
        models: readonly ParsedModel[],
        routeGroups: readonly ResourceRouteGroup[]
    ): readonly ParsedRoute[] {
        return routes.map(route => {
            switch (route.hookKind) {
                case RouteHookKind.Query:
                case RouteHookKind.InfiniteQuery:
                    return route;

                case RouteHookKind.Mutation: {
                    const targets: InvalidationTarget[] = [];

                    // A. Self Invalidation (resource group rute sendiri)
                    targets.push(ScannedInvalidationTarget.selfList(route.groupName));

                    // B. Database Relations Traversal langsung pada models (0 new Map, 0 wrapper)
                    let responseModelName = '';
                    if (route.response instanceof ResourceResponseDescriptor) {
                        responseModelName = route.response.resourceName;
                    } else if (route.response instanceof ModelResponseDescriptor) {
                        responseModelName = route.response.modelName;
                    } else if ('resourceName' in route.response && typeof (route.response as { resourceName?: string }).resourceName === 'string') {
                        responseModelName = (route.response as { resourceName: string }).resourceName;
                    } else if ('modelName' in route.response && typeof (route.response as { modelName?: string }).modelName === 'string') {
                        responseModelName = (route.response as { modelName: string }).modelName;
                    }
                    const matchedModel = models.find(m => m.name === responseModelName);
                    switch (matchedModel !== undefined) {
                        case true:
                            for (const rel of (matchedModel as ParsedModel).relations) {
                                switch (rel.type) {
                                    case EloquentRelationType.BelongsTo: {
                                        targets.push(ScannedInvalidationTarget.parentList(rel.modelName));
                                        targets.push(ScannedInvalidationTarget.parentDetail(rel.modelName));
                                        break;
                                    }
                                    case EloquentRelationType.HasMany:
                                    case EloquentRelationType.HasOne: {
                                        targets.push(ScannedInvalidationTarget.resourceItem(rel.modelName));
                                        break;
                                    }
                                    case EloquentRelationType.BelongsToMany: {
                                        targets.push(ScannedInvalidationTarget.resourceList(rel.modelName));
                                        targets.push(ScannedInvalidationTarget.resourceItem(rel.modelName));
                                        break;
                                    }
                                }
                            }
                            break;
                        case false:
                            break;
                    }

                    // C. Cascade / Parent Group Invalidation (0 if)
                    const normalizedGroup = route.groupName.toLowerCase();
                    const matchedGroup = routeGroups.find(g => g.resourceName.toLowerCase() === normalizedGroup);
                    switch (matchedGroup !== undefined) {
                        case true: {
                            const groupNameStr = (matchedGroup as ResourceRouteGroup).resourceName;
                            for (const g of routeGroups) {
                                const isChild = g.resourceName.toLowerCase().startsWith(groupNameStr.toLowerCase()) && g.resourceName !== groupNameStr;
                                switch (isChild) {
                                    case true:
                                        targets.push(ScannedInvalidationTarget.resourceList(g.resourceName));
                                        break;
                                    case false:
                                        break;
                                }
                            }
                            break;
                        }
                        case false:
                            break;
                    }

                    // D. Auth / Logout Invalidation
                    if (route.actionName === 'logout' || route.path.includes('/logout')) {
                        const authGroups = new Set<string>();
                        for (const r of routes) {
                            if (r.auth && r.groupName) {
                                authGroups.add(r.groupName);
                            }
                        }
                        for (const grp of authGroups) {
                            targets.push(ScannedInvalidationTarget.authResource(grp));
                        }
                    }

                    // Complete Contract Invalidation Payload
                    const invalidation = new ScannedRouteInvalidationPayload({
                        targets: Object.freeze(targets)
                    });

                    switch (route instanceof ScannedRouteDescriptor) {
                        case true:
                            return (route as ScannedRouteDescriptor).withInvalidation(invalidation);
                        case false:
                            return Object.freeze({ ...route, invalidation });
                    }
                }
            }
        });
    }

    /**
     * Executes the complete scanning pipeline leveraging Core subsystems.
     */
    public async execute(): Promise<RouteManifest> {
        const resources = await this.scanResources();
        const models = await this.scanModels();
        const formRequests = await this.scanFormRequests();
        const routes = await this.scanRoutes(formRequests);
        const channels = await this.scanChannels();
        const derivedRequests = StaticLaravelScanner.deriveRequestTypes(routes, resources, this.interner);
        const requestTypes = formRequests.length > 0 ? formRequests : derivedRequests;
        const semanticTypes = StaticLaravelScanner.deriveSemanticTypes(resources, models, this.interner, routes);

        const groupMap = new Map<string, ParsedRoute[]>();
        for (const route of routes) {
            const list = groupMap.get(route.resourceName) || [];
            list.push(route);
            groupMap.set(route.resourceName, list);
        }
        const routeGroups: ResourceRouteGroup[] = Array.from(groupMap.entries()).map(([resName, rList]) =>
            ScannedResourceRouteGroupDescriptor.create({
                resourceName: resName,
                routes: rList,
                formTypeName: requestTypes.find(rt => rt.resourceName.toLowerCase() === resName.toLowerCase())?.formTypeName,
                formActions: requestTypes.find(rt => rt.resourceName.toLowerCase() === resName.toLowerCase())?.actions
            })
        );

        const resolvedRoutes = StaticLaravelScanner.resolveRouteInvalidations(routes, models, routeGroups);

        return new ScannedRouteManifestDescriptor({
            version: this.version,
            baseURL: this.baseURL,
            routes: resolvedRoutes,
            resources,
            models,
            routeGroups,
            requestTypes,
            semanticTypes,
            generatedAt: new Date().toISOString(),
            channels,
            frontend: null,
            pages: []
        });
    }

    /**
     * Scans routes/channels.php for Broadcast::channel('pattern', ...) declarations.
     */
    private async scanChannels(): Promise<readonly BroadcastChannelDescriptor[]> {
        const channelsFile = path.join(this.projectRoot, 'routes', 'channels.php');
        if (!fs.existsSync(channelsFile)) return [];

        const source = await fs.readFile(channelsFile, 'utf-8');
        const tokens = LaravelSourceLexer.tokenize(source);
        const channels: BroadcastChannelDescriptor[] = [];

        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i].value === 'channel' && tokens[i - 1]?.value === '::' && tokens[i - 2]?.value === 'Broadcast') {
                let pIdx = i + 1;
                if (tokens[pIdx]?.value === '(' && tokens[pIdx + 1]?.type === 'STRING') {
                    const pattern = tokens[pIdx + 1].value;
                    const parameters = this.extractPathParams(pattern);

                    channels.push(ScannedBroadcastChannelDescriptor.fromPattern({
                        name: pattern,
                        pattern,
                        parameters
                    }));
                }
            }
        }

        return channels;
    }

    /**
     * 1. Scans routes/api.php for Route::get/post/put/delete/apiResource declarations and route groups.
     */
    private async scanRoutes(requestTypes: readonly RequestType[] = []): Promise<readonly ParsedRoute[]> {
        const routesFile = path.join(this.projectRoot, 'routes', 'api.php');
        if (!fs.existsSync(routesFile)) return [];

        const source = await fs.readFile(routesFile, 'utf-8');
        const tokens = LaravelSourceLexer.tokenize(source);
        const routes: ParsedRoute[] = [];
        let currentPrefix = '';
        const middlewareStack: string[][] = [];
        let pendingMiddleware: string[] = [];

        const controllerMap = await this.scanControllers();

        const mapMethodDetails = (method: string): { method: HttpMethod; actionKind: RouteActionKind; isMutating: boolean } => {
            const m = method.toUpperCase() as HttpMethod;
            const spec = HTTP_METHOD_REGISTRY[m] ?? HTTP_METHOD_REGISTRY.GET;
            return { method: spec.method, actionKind: spec.actionKind, isMutating: spec.isMutating };
        };

        for (let i = 0; i < tokens.length; i++) {
            // Track Route::prefix('v1')->group(...)
            if (tokens[i].value === 'prefix' && tokens[i + 1]?.value === '(' && tokens[i + 2]?.type === 'STRING') {
                currentPrefix = tokens[i + 2].value.replace(/^\/+|\/+$/g, '');
            }

            // Track Route::middleware(...)
            if (tokens[i].value === 'middleware' && tokens[i + 1]?.value === '(') {
                pendingMiddleware = [];
                let mIdx = i + 2;
                if (tokens[mIdx]?.type === 'STRING') {
                    pendingMiddleware.push(tokens[mIdx].value);
                } else if (tokens[mIdx]?.value === '[') {
                    mIdx++;
                    while (mIdx < tokens.length && tokens[mIdx].value !== ']') {
                        if (tokens[mIdx].type === 'STRING') {
                            pendingMiddleware.push(tokens[mIdx].value);
                        }
                        mIdx++;
                    }
                }
            }

            // Group open/close for middleware stack
            if (tokens[i].value === 'group' && tokens[i + 1]?.value === '(') {
                middlewareStack.push([...pendingMiddleware]);
                pendingMiddleware = [];
            }
            if (tokens[i].value === '}' && middlewareStack.length > 0) {
                middlewareStack.pop();
            }

            if (tokens[i].value === 'Route' && tokens[i + 1]?.value === '::') {
                const methodToken = tokens[i + 2];
                if (!methodToken) continue;

                const httpMethod = methodToken.value.toLowerCase();
                if (['get', 'post', 'put', 'patch', 'delete', 'apiresource', 'match', 'any'].includes(httpMethod)) {
                    let j = i + 3;
                    while (j < tokens.length && tokens[j].value !== '(') j++;
                    j++; // Skip '('

                    let targetMethods: string[] = [httpMethod];
                    let pathIndex = j;

                    if (httpMethod === 'match') {
                        targetMethods = [];
                        while (j < tokens.length && tokens[j].value !== '[') j++;
                        if (j < tokens.length && tokens[j].value === '[') j++;
                        while (j < tokens.length && tokens[j].value !== ']') {
                            if (tokens[j].type === 'STRING') {
                                targetMethods.push(tokens[j].value.toLowerCase());
                            }
                            j++;
                        }
                        if (j < tokens.length && tokens[j].value === ']') j++;
                        while (j < tokens.length && tokens[j].value !== ',') j++;
                        if (j < tokens.length && tokens[j].value === ',') j++;
                        pathIndex = j;
                    } else if (httpMethod === 'any') {
                        targetMethods = ['get', 'post', 'put', 'patch', 'delete'];
                    }

                    while (pathIndex < tokens.length && tokens[pathIndex].type !== 'STRING') {
                        pathIndex++;
                    }

                    const pathToken = tokens[pathIndex];
                    if (pathToken && pathToken.type === 'STRING') {
                        const rawPath = pathToken.value.replace(/^\/+|\/+$/g, '');
                        const fullPath = currentPrefix ? `/${currentPrefix}/${rawPath}` : `/${rawPath}`;
                        const normalizedPath = fullPath.startsWith('/api') ? fullPath : `/api${fullPath}`;

                        const segments = normalizedPath.split('/').filter(s => s && s !== 'api' && !s.startsWith('{'));
                        const resourceName = segments[0] || 'general';

                        // Extract controller and action
                        let controllerName: string | undefined;
                        let actionName: string | undefined;
                        let hIdx = pathIndex + 1;
                        while (hIdx < tokens.length && tokens[hIdx].value !== ',' && tokens[hIdx].value !== ')') hIdx++;
                        if (tokens[hIdx]?.value === ',') {
                            hIdx++;
                            while (hIdx < tokens.length && (tokens[hIdx].value === '[' || tokens[hIdx].value === '(')) {
                                hIdx++;
                            }
                            if (tokens[hIdx]?.type === 'IDENTIFIER') {
                                controllerName = tokens[hIdx].value;
                                if (tokens[hIdx + 1]?.value === '::' && tokens[hIdx + 2]?.value === 'class') {
                                    if (tokens[hIdx + 3]?.value === ',' && tokens[hIdx + 4]?.type === 'STRING') {
                                        actionName = tokens[hIdx + 4].value;
                                    }
                                }
                            }
                        }

                        const currentMiddlewares = middlewareStack.flat();
                        const isAuth = currentMiddlewares.some(m => m.startsWith('auth'));
                        const actionInfo = controllerName && actionName ? controllerMap.get(controllerName)?.get(actionName) : undefined;
                        const resolvedResponse = actionInfo?.response
                            || new ResourceResponseDescriptor({ resourceName: `${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)}Resource`, shape: 'single' });

                        // Build route schema
                        let routeSchema: RouteSchemaPayload | undefined;
                        if (actionInfo?.formRequestName) {
                            const matchedReq = requestTypes.find(r => r.formTypeName === actionInfo.formRequestName);
                            if (matchedReq && matchedReq.actions[0]?.fields.length > 0) {
                                routeSchema = ScannedRouteSchemaPayload.fromRules(
                                    matchedReq.actions[0].fields.map(f => ScannedRouteValidationRuleEntry.create(
                                        f.originalName,
                                        [f.required ? 'required' : 'nullable'],
                                        f.transformedName
                                    ))
                                );
                            }
                        }
                        if (!routeSchema && actionInfo?.schemaRules && actionInfo.schemaRules.length > 0) {
                            routeSchema = ScannedRouteSchemaPayload.fromRules(actionInfo.schemaRules);
                        }

                        if (httpMethod === 'apiresource') {
                            routes.push(
                                ScannedRouteDescriptor.create({ method: 'GET', path: normalizedPath, resourceName, actionName: 'index', actionKind: 'read', isMutating: false, parameters: this.extractPathParams(normalizedPath), auth: isAuth, middleware: currentMiddlewares, response: resolvedResponse, sourceFile: actionInfo?.sourceFile, sourceLine: actionInfo?.sourceLine, schema: routeSchema }),
                                ScannedRouteDescriptor.create({ method: 'POST', path: normalizedPath, resourceName, actionName: 'store', actionKind: 'create', isMutating: true, parameters: this.extractPathParams(normalizedPath), auth: isAuth, middleware: currentMiddlewares, response: resolvedResponse, sourceFile: actionInfo?.sourceFile, sourceLine: actionInfo?.sourceLine, schema: routeSchema }),
                                ScannedRouteDescriptor.create({ method: 'GET', path: `${normalizedPath}/{id}`, resourceName, actionName: 'show', actionKind: 'read', isMutating: false, parameters: this.extractPathParams(`${normalizedPath}/{id}`), auth: isAuth, middleware: currentMiddlewares, response: resolvedResponse, sourceFile: actionInfo?.sourceFile, sourceLine: actionInfo?.sourceLine, schema: routeSchema }),
                                ScannedRouteDescriptor.create({ method: 'PUT', path: `${normalizedPath}/{id}`, resourceName, actionName: 'update', actionKind: 'update', isMutating: true, parameters: this.extractPathParams(`${normalizedPath}/{id}`), auth: isAuth, middleware: currentMiddlewares, response: resolvedResponse, sourceFile: actionInfo?.sourceFile, sourceLine: actionInfo?.sourceLine, schema: routeSchema }),
                                ScannedRouteDescriptor.create({ method: 'DELETE', path: `${normalizedPath}/{id}`, resourceName, actionName: 'destroy', actionKind: 'delete', isMutating: true, parameters: this.extractPathParams(`${normalizedPath}/{id}`), auth: isAuth, middleware: currentMiddlewares, response: resolvedResponse, sourceFile: actionInfo?.sourceFile, sourceLine: actionInfo?.sourceLine, schema: routeSchema })
                            );
                        } else {
                            for (const method of targetMethods) {
                                const { method: canonicalMethod, actionKind, isMutating } = mapMethodDetails(method);
                                routes.push(ScannedRouteDescriptor.create({
                                    method: canonicalMethod,
                                    path: normalizedPath,
                                    resourceName,
                                    actionName: actionName || actionKind,
                                    actionKind,
                                    isMutating,
                                    parameters: this.extractPathParams(normalizedPath),
                                    auth: isAuth,
                                    middleware: currentMiddlewares,
                                    response: resolvedResponse,
                                    sourceFile: actionInfo?.sourceFile,
                                    sourceLine: actionInfo?.sourceLine,
                                    schema: routeSchema
                                }));
                            }
                        }
                    }
                }
            }
        }

        return routes;
    }

    private async scanControllers(): Promise<Map<string, Map<string, ControllerActionInfo>>> {
        const controllerMap = new Map<string, Map<string, ControllerActionInfo>>();
        const controllerDir = path.join(this.projectRoot, 'app', 'Http', 'Controllers');
        const files = await this.collectPhpFiles(controllerDir);

        for (const fullPath of files) {
            const controllerName = path.basename(fullPath, '.php');
            const source = await fs.readFile(fullPath, 'utf-8');
            const tokens = LaravelSourceLexer.tokenize(source);
            const actionMap = new Map<string, ControllerActionInfo>();

            for (let i = 0; i < tokens.length; i++) {
                if (tokens[i].value === 'function' && tokens[i + 1]?.type === 'IDENTIFIER') {
                    const actionName = tokens[i + 1].value;
                    const sourceLine = source.slice(0, tokens[i].startOffset).split('\n').length;
                    let formRequestName: string | undefined;

                    // Scan parameters for FormRequest type hint
                    let pIdx = i + 2;
                    while (pIdx < tokens.length && tokens[pIdx].value !== '{' && tokens[pIdx].value !== ';') {
                        if (tokens[pIdx].type === 'IDENTIFIER' && tokens[pIdx].value.endsWith('Request') && tokens[pIdx].value !== 'Request' && tokens[pIdx + 1]?.type === 'VARIABLE') {
                            formRequestName = tokens[pIdx].value;
                        }
                        pIdx++;
                    }

                    let k = pIdx;
                    let responseDesc: ResponseDescriptor | undefined;
                    let schemaRules: RouteValidationRuleEntry[] | undefined;

                    if (tokens[k]?.value === '{') {
                        let depth = 1;
                        k++;
                        while (k < tokens.length && depth > 0) {
                            if (tokens[k].value === '{') depth++;
                            else if (tokens[k].value === '}') depth--;

                            // Inline validation: $request->validate([ ... ])
                            if (tokens[k].value === 'validate' && tokens[k + 1]?.value === '(') {
                                const parsedVal = LaravelSourceLexer.parseArray(source, tokens, k + 1);
                                if (parsedVal.entries.length > 0) {
                                    schemaRules = parsedVal.entries.map(e => {
                                        const rawRule = e.value.kind === 'literal' && e.value.literalType === 'string' ? String(e.value.value) : e.rawExpression;
                                        const rulesList = rawRule.includes('|') ? rawRule.split('|').map(r => r.trim()).filter(Boolean) : [rawRule];
                                        return ScannedRouteValidationRuleEntry.create(e.key, rulesList);
                                    });
                                }
                                k = Math.max(k, parsedVal.endIndex - 1);
                            }

                            if (!responseDesc) {
                                if (tokens[k].value === 'return' && tokens[k + 1]?.type === 'IDENTIFIER' && tokens[k + 2]?.value === '::' && tokens[k + 3]?.value === 'collection') {
                                    responseDesc = new ResourceResponseDescriptor({
                                        resourceName: tokens[k + 1].value,
                                        shape: 'collection'
                                    });
                                } else if (tokens[k].value === 'return' && tokens[k + 1]?.value === 'new' && tokens[k + 2]?.type === 'IDENTIFIER') {
                                    const resName = tokens[k + 2].value;
                                    if (resName.endsWith('Resource')) {
                                        responseDesc = new ResourceResponseDescriptor({
                                            resourceName: resName,
                                            shape: 'single'
                                        });
                                    }
                                } else if (tokens[k].value === 'return' && tokens[k + 1]?.type === 'IDENTIFIER' && tokens[k + 2]?.value === '::' && tokens[k + 3]?.value === 'make') {
                                    responseDesc = new ResourceResponseDescriptor({
                                        resourceName: tokens[k + 1].value,
                                        shape: 'single'
                                    });
                                } else if (tokens[k].value === 'return' && tokens[k + 1]?.value === 'response' && tokens[k + 2]?.value === '(') {
                                    let jIdx = k + 3;
                                    while (jIdx < tokens.length && tokens[jIdx].value !== ';') {
                                        if (tokens[jIdx].value === 'json' && tokens[jIdx + 1]?.value === '(') {
                                            const parsedArray = LaravelSourceLexer.parseArray(source, tokens, jIdx + 1);
                                            if (parsedArray.entries.length > 0) {
                                                let cleanDomain = actionName || 'Inline';
                                                if (['index', 'show', 'store', 'update', 'destroy'].includes(actionName || '')) {
                                                    const baseCtrl = controllerName.replace(/Controller$/, '');
                                                    cleanDomain = baseCtrl === 'Category' ? 'Categories' : baseCtrl === 'ProductReview' ? 'ProdukReviews' : baseCtrl === 'Order' ? 'Orders' : baseCtrl;
                                                } else if (actionName) {
                                                    cleanDomain = actionName.charAt(0).toUpperCase() + actionName.slice(1);
                                                }
                                                const rawDomain = cleanDomain;
                                                const fields: ResourceFieldDescriptor[] = parsedArray.entries.map(e => {
                                                    const mapped = this.mapAstValueToExpression(e.value, e.rawExpression);
                                                    return ScannedResourceFieldDescriptor.fromExpression(
                                                        e.key,
                                                        mapped.expression,
                                                        mapped.nullable
                                                    );
                                                });
                                                responseDesc = new InlineResponseDescriptor({
                                                    domain: rawDomain,
                                                    baseName: toPascalCase(rawDomain),
                                                    typeName: `${toPascalCase(rawDomain)}Transformed`,
                                                    fields,
                                                    shape: 'single'
                                                });
                                            }
                                            break;
                                        }
                                        jIdx++;
                                    }
                                }
                            }

                            k++;
                        }
                    }

                    actionMap.set(actionName, ScannedControllerActionDescriptor.create({
                        response: responseDesc,
                        sourceFile: fullPath,
                        sourceLine,
                        formRequestName,
                        schemaRules
                    }));
                }
            }
            controllerMap.set(controllerName, actionMap);
        }

        return controllerMap;
    }

    private extractPathParams(routePath: string): readonly RouteParameter[] {
        const matches = [...routePath.matchAll(/\{([^}]+)\}/g)];
        return matches.map(m => ScannedRouteParameterDescriptor.fromPathSegment(m[1]));
    }

    private async collectPhpFiles(dir: string): Promise<string[]> {
        if (!fs.existsSync(dir)) return [];
        let results: string[] = [];
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                results = results.concat(await this.collectPhpFiles(fullPath));
            } else if (entry.isFile() && entry.name.endsWith('.php')) {
                results.push(fullPath);
            }
        }
        return results;
    }

    /**
     * 2. Scans app/Http/Resources/*.php for JsonResource class definitions and toArray mappings.
     */
    private async scanResources(): Promise<readonly ParsedResource[]> {
        const resDir = path.join(this.projectRoot, 'app', 'Http', 'Resources');
        const files = await this.collectPhpFiles(resDir);
        const resources: ParsedResource[] = [];

        for (const fullPath of files) {
            const source = await fs.readFile(fullPath, 'utf-8');
            const tokens = LaravelSourceLexer.tokenize(source);

            const resourceName = path.basename(fullPath, '.php');
            let returnIndex = 0;
            const toArrayIdx = tokens.findIndex((t, idx) => t.value === 'toArray' && tokens[idx - 1]?.value === 'function');
            if (toArrayIdx !== -1) {
                const retIdx = tokens.findIndex((t, idx) => idx > toArrayIdx && t.value === 'return');
                if (retIdx !== -1) {
                    returnIndex = retIdx;
                }
            } else {
                const retIdx = tokens.findIndex(t => t.value === 'return');
                if (retIdx !== -1) {
                    returnIndex = retIdx;
                }
            }
            const parsedArray = LaravelSourceLexer.parseArray(source, tokens, returnIndex);

            const fields: ResourceFieldDescriptor[] = [];
            for (const entry of parsedArray.entries) {
                const mapped = this.mapAstValueToExpression(entry.value, entry.rawExpression);
                fields.push(ScannedResourceFieldDescriptor.fromExpression(
                    entry.key,
                    mapped.expression,
                    mapped.nullable
                ));
            }

            resources.push(ScannedResourceDescriptor.create({
                name: resourceName,
                fields,
                sourceFile: fullPath
            }));
        }

        return resources;
    }

    private mapAstValueToExpression(value: PhpAstValue, raw: string): { expression: ResourceFieldExpression; nullable: boolean } {
        switch (value.kind) {
            case 'resource_collection':
                return { expression: ResourceFieldExpressionFactory.resource(value.resourceName, true), nullable: false };
            case 'resource_single':
                return { expression: ResourceFieldExpressionFactory.resource(value.resourceName, false), nullable: false };
            case 'nested_array': {
                const childFields: ResourceFieldDescriptor[] = value.entries.map(e => {
                    const mappedChild = this.mapAstValueToExpression(e.value, e.rawExpression);
                    return ScannedResourceFieldDescriptor.fromExpression(
                        e.key,
                        mappedChild.expression,
                        mappedChild.nullable
                    );
                });
                return { expression: ResourceFieldExpressionFactory.object(childFields), nullable: false };
            }
            case 'method_chain':
            case 'property_access': {
                const prop = value.property.toLowerCase();
                const isNumeric = prop.endsWith('_id') || prop === 'id' || prop.endsWith('_count') || prop.endsWith('_amount') || prop.endsWith('_minor') || prop === 'qty' || prop === 'harga' || prop === 'subtotal';
                const isBool = prop.startsWith('is_') || prop.startsWith('has_');
                let primitiveType = 'string';
                if (isNumeric) {
                    primitiveType = 'int';
                } else if (isBool) {
                    primitiveType = 'boolean';
                }
                return { expression: ResourceFieldExpressionFactory.primitive(primitiveType), nullable: value.nullsafe };
            }
            case 'literal': {
                let primitiveType = 'string';
                if (value.literalType === 'number') {
                    primitiveType = 'int';
                } else if (value.literalType === 'boolean') {
                    primitiveType = 'boolean';
                }
                return { expression: ResourceFieldExpressionFactory.primitive(primitiveType), nullable: value.literalType === 'null' };
            }
            case 'variable_reference': {
                const varName = value.name.toLowerCase();
                const isNumeric = varName.endsWith('_id') || varName === 'id' || varName.endsWith('_minor') || varName === 'qty' || varName === 'harga' || varName === 'subtotal';
                return { expression: ResourceFieldExpressionFactory.primitive(isNumeric ? 'int' : 'string'), nullable: false };
            }
            case 'ternary_expression':
                return { expression: ResourceFieldExpressionFactory.primitive('string'), nullable: true };
            default: {
                const cleanRaw = (raw || '').trim();
                if (cleanRaw.includes("['") || cleanRaw.includes('["') || cleanRaw.includes('$detail[') || cleanRaw.includes('$gateway[')) {
                    return { expression: ResourceFieldExpressionFactory.unknown(), nullable: true };
                }
                if (cleanRaw.startsWith('(int)') || cleanRaw.startsWith('(float)') || /\b(int|float)\b/.test(cleanRaw) || /[+\-*\/]/.test(cleanRaw)) {
                    return { expression: ResourceFieldExpressionFactory.primitive('int'), nullable: cleanRaw.includes('null') };
                }
                if (cleanRaw.startsWith('(bool)')) {
                    return { expression: ResourceFieldExpressionFactory.primitive('boolean'), nullable: false };
                }
                return { expression: ResourceFieldExpressionFactory.primitive('string'), nullable: false };
            }
        }
    }

    /**
     * 3. Scans app/Http/Requests/*.php for FormRequest validation rules.
     */
    private async scanFormRequests(): Promise<readonly RequestType[]> {
        const reqDir = path.join(this.projectRoot, 'app', 'Http', 'Requests');
        const files = await this.collectPhpFiles(reqDir);
        const groups = new Map<string, RequestType>();

        for (const fullPath of files) {
            const source = await fs.readFile(fullPath, 'utf-8');
            const tokens = LaravelSourceLexer.tokenize(source);
            const reqName = path.basename(fullPath, '.php');

            let rulesIndex = 0;
            const rulesIdx = tokens.findIndex((t, idx) => t.value === 'rules' && tokens[idx - 1]?.value === 'function');
            if (rulesIdx !== -1) {
                const retIdx = tokens.findIndex((t, idx) => idx > rulesIdx && t.value === 'return');
                if (retIdx !== -1) {
                    rulesIndex = retIdx;
                }
            }
            const parsedArray = LaravelSourceLexer.parseArray(source, tokens, rulesIndex);
            const fields: RequestField[] = [];

            const arrayProps = new Map<string, ObjectProperty[]>();
            const primitiveArrayProps = new Map<string, SemanticType>();
            const regularRules: Array<{ key: string; ruleStr: string; validationAst: readonly ValidationRuleNode[]; isRequired: boolean; isNullable: boolean }> = [];

            for (const entry of parsedArray.entries) {
                const ruleStr = entry.value.kind === 'literal' && entry.value.literalType === 'string'
                    ? entry.value.value
                    : (entry.value.kind === 'nested_array'
                        ? entry.value.entries.map(e => e.rawExpression).join('|')
                        : entry.rawExpression);

                const rulesList = (ruleStr || '').split('|').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
                const validationAst = ValidationRuleParser.parseAll(rulesList);

                const isNum = ruleStr.includes('numeric') || ruleStr.includes('integer') || ruleStr.includes('decimal');
                const isBool = ruleStr.includes('boolean');
                const isRequired = ruleStr.includes('required') || !ruleStr.includes('sometimes');
                const isNullable = ruleStr.includes('nullable');

                if (entry.key.includes('.*.')) {
                    const [parentKey, childKey] = entry.key.split('.*.');
                    if (!arrayProps.has(parentKey)) {
                        arrayProps.set(parentKey, []);
                    }
                    let primKind = PrimitiveKind.STRING;
                    if (isNum) {
                        primKind = PrimitiveKind.NUMBER;
                    } else if (isBool) {
                        primKind = PrimitiveKind.BOOLEAN;
                    }
                    const semanticType = this.interner.intern(new PrimitiveType(primKind));

                    arrayProps.get(parentKey)!.push(ScannedObjectProperty.create({
                        name: childKey,
                        type: semanticType,
                        required: isRequired,
                        nullable: isNullable
                    }));
                } else if (entry.key.endsWith('.*')) {
                    const baseKey = entry.key.slice(0, -2);
                    let primKind = PrimitiveKind.STRING;
                    if (isNum) {
                        primKind = PrimitiveKind.NUMBER;
                    } else if (isBool) {
                        primKind = PrimitiveKind.BOOLEAN;
                    }
                    const semanticType = this.interner.intern(new PrimitiveType(primKind));
                    const arrayType = this.interner.intern(new ReadonlyCollectionType(CollectionKind.ARRAY, semanticType));
                    primitiveArrayProps.set(baseKey, arrayType);
                } else {
                    regularRules.push({ key: entry.key, ruleStr, validationAst, isRequired, isNullable });
                }
            }

            const processedKeys = new Set<string>();
            for (const { key, ruleStr, validationAst, isRequired, isNullable } of regularRules) {
                processedKeys.add(key);
                if (arrayProps.has(key)) {
                    const childProperties = arrayProps.get(key)!;
                    const childObjectType = new ObjectType({ name: key, baseName: key, properties: childProperties });
                    const arrayType = this.interner.intern(new ReadonlyCollectionType(CollectionKind.ARRAY, childObjectType));

                    fields.push(ScannedFormFieldDescriptor.create({
                        name: key,
                        originalName: key,
                        type: arrayType,
                        required: isRequired,
                        nullable: isNullable,
                        validationAst
                    }));
                } else if (primitiveArrayProps.has(key)) {
                    fields.push(ScannedFormFieldDescriptor.create({
                        name: key,
                        originalName: key,
                        type: primitiveArrayProps.get(key)!,
                        required: isRequired,
                        nullable: isNullable,
                        validationAst
                    }));
                } else {
                    const isArrayRule = ruleStr.includes('array');
                    const isNum = ruleStr.includes('numeric') || ruleStr.includes('integer') || ruleStr.includes('decimal');
                    const isBool = ruleStr.includes('boolean');
                    let semanticType: SemanticType;
                    if (isArrayRule) {
                        const unknownType = this.interner.intern(new PrimitiveType(PrimitiveKind.UNKNOWN));
                        semanticType = this.interner.intern(new ReadonlyCollectionType(CollectionKind.ARRAY, unknownType));
                    } else {
                        let primKind = PrimitiveKind.STRING;
                        if (isNum) {
                            primKind = PrimitiveKind.NUMBER;
                        } else if (isBool) {
                            primKind = PrimitiveKind.BOOLEAN;
                        }
                        semanticType = this.interner.intern(new PrimitiveType(primKind));
                    }

                    fields.push(ScannedFormFieldDescriptor.create({
                        name: key,
                        originalName: key,
                        type: semanticType,
                        required: isRequired,
                        nullable: isNullable,
                        validationAst
                    }));
                }
            }

            for (const [parentKey, childProperties] of arrayProps.entries()) {
                if (!processedKeys.has(parentKey)) {
                    const childObjectType = new ObjectType({ name: toCamelCase(parentKey), baseName: toCamelCase(parentKey), properties: childProperties });
                    const arrayType = this.interner.intern(new ReadonlyCollectionType(CollectionKind.ARRAY, childObjectType));
                    fields.push(ScannedFormFieldDescriptor.create({
                        name: parentKey,
                        originalName: parentKey,
                        type: arrayType,
                        required: false,
                        nullable: false
                    }));
                }
            }

            const rawResource = reqName.replace(/Request$/, '').replace(/^(Store|Update|Create)/, '');
            const resKey = toCamelCase(rawResource);
            const actionName: 'create' | 'update' = (reqName.startsWith('Store') || reqName.startsWith('Create')) ? 'create' : 'update';
            const action = new ScannedFormActionDescriptor({
                name: actionName,
                fields
            });

            if (groups.has(resKey)) {
                const existing = groups.get(resKey)!;
                groups.set(resKey, ScannedRequestTypeDescriptor.create({
                    resourceName: existing.resourceName,
                    formTypeName: existing.formTypeName,
                    actions: [...existing.actions, action],
                    responseData: existing.responseData
                }));
            } else {
                groups.set(resKey, ScannedRequestTypeDescriptor.create({
                    resourceName: resKey,
                    formTypeName: `${toPascalCase(rawResource)}Form`,
                    actions: [action]
                }));
            }
        }

        return Array.from(groups.values());
    }

    /**
     * 4. Scans app/Models/*.php and database/migrations/*.php for Eloquent Models with explicit metadata.
     */
    private async scanModels(): Promise<readonly ParsedModel[]> {
        const modelDir = path.join(this.projectRoot, 'app', 'Models');
        const files = await this.collectPhpFiles(modelDir);
        const migrationMap = await this.scanMigrations();
        const models: ParsedModel[] = [];

        for (const fullPath of files) {
            const modelName = path.basename(fullPath, '.php');
            const source = await fs.readFile(fullPath, 'utf-8');
            models.push(this.parseModelFile(source, modelName, migrationMap));
        }

        return models;
    }

    private async scanMigrations(): Promise<Map<string, ParsedColumn[]>> {
        const migrationMap = new Map<string, ParsedColumn[]>();
        const migrationDir = path.join(this.projectRoot, 'database', 'migrations');
        const files = await this.collectPhpFiles(migrationDir);

        for (const fullPath of files) {
            const source = await fs.readFile(fullPath, 'utf-8');
            const tokens = LaravelSourceLexer.tokenize(source);

            for (let i = 0; i < tokens.length; i++) {
                if (tokens[i].value === 'Schema' && tokens[i + 1]?.value === '::' && (tokens[i + 2]?.value === 'create' || tokens[i + 2]?.value === 'table') && tokens[i + 3]?.value === '(') {
                    const tableToken = tokens[i + 4];
                    if (!tableToken || tableToken.type !== 'STRING') continue;
                    const tableName = tableToken.value;

                    let k = i + 5;
                    while (k < tokens.length && tokens[k].value !== '{') k++;
                    if (tokens[k]?.value === '{') {
                        const cols: ParsedColumn[] = migrationMap.get(tableName) || [];
                        let depth = 1;
                        k++;
                        while (k < tokens.length && depth > 0) {
                            if (tokens[k].value === '{') depth++;
                            else if (tokens[k].value === '}') depth--;

                            if (tokens[k].value === '$table' && (tokens[k + 1]?.value === '->' || tokens[k + 1]?.value === '?->')) {
                                const typeMethod = tokens[k + 2]?.value;
                                if (typeMethod && tokens[k + 3]?.value === '(') {
                                    if (typeMethod === 'id') {
                                        const colName = tokens[k + 4]?.type === 'STRING' ? tokens[k + 4].value : 'id';
                                        cols.push(ScannedModelColumnDescriptor.fromSchema({ name: colName, type: 'bigint unsigned', nullable: false }));
                                    } else if (typeMethod === 'timestamps') {
                                        cols.push(
                                            ScannedModelColumnDescriptor.fromSchema({ name: 'created_at', type: 'timestamp', nullable: true }),
                                            ScannedModelColumnDescriptor.fromSchema({ name: 'updated_at', type: 'timestamp', nullable: true })
                                        );
                                    } else if (typeMethod === 'softDeletes') {
                                        cols.push(ScannedModelColumnDescriptor.fromSchema({ name: 'deleted_at', type: 'timestamp', nullable: true }));
                                    } else if (tokens[k + 4]?.type === 'STRING') {
                                        const colName = tokens[k + 4].value;
                                        let isNullable = false;
                                        let look = k + 5;
                                        while (look < tokens.length && tokens[look].value !== ';') {
                                            if (tokens[look].value === 'nullable') {
                                                isNullable = true;
                                                break;
                                            }
                                            look++;
                                        }

                                        let colType = 'varchar';
                                        let enumValues: string[] | undefined = undefined;
                                        switch (typeMethod) {
                                            case 'string': colType = 'varchar'; break;
                                            case 'text':
                                            case 'longText':
                                            case 'mediumText': colType = 'text'; break;
                                            case 'integer':
                                            case 'unsignedInteger':
                                            case 'tinyInteger':
                                            case 'smallInteger': colType = 'int'; break;
                                            case 'bigInteger':
                                            case 'unsignedBigInteger':
                                            case 'foreignId': colType = 'bigint unsigned'; break;
                                            case 'decimal':
                                            case 'float':
                                            case 'double': colType = 'decimal'; break;
                                            case 'boolean': colType = 'boolean'; break;
                                            case 'timestamp':
                                            case 'dateTime':
                                            case 'date': colType = 'timestamp'; break;
                                            case 'json':
                                            case 'jsonb': colType = 'json'; break;
                                            case 'enum': {
                                                colType = 'enum';
                                                enumValues = [];
                                                let p = k + 5;
                                                while (p < tokens.length && tokens[p].value !== '[' && tokens[p].value !== ';') p++;
                                                if (tokens[p]?.value === '[') {
                                                    p++;
                                                    while (p < tokens.length && tokens[p].value !== ']' && tokens[p].value !== ';') {
                                                        if (tokens[p].type === 'STRING') {
                                                            enumValues.push(tokens[p].value);
                                                        }
                                                        p++;
                                                    }
                                                }
                                                break;
                                            }
                                            default: colType = 'varchar'; break;
                                        }

                                        cols.push(ScannedModelColumnDescriptor.fromSchema({ name: colName, type: colType, nullable: isNullable, enumValues }));
                                    }
                                }
                            }
                            k++;
                        }
                        migrationMap.set(tableName, cols);
                    }
                }
            }
        }

        return migrationMap;
    }

    private parseModelFile(source: string, modelName: string, migrationMap?: Map<string, ParsedColumn[]>): ParsedModel {
        const tokens = LaravelSourceLexer.tokenize(source);
        let table = inferLaravelTableName(modelName);
        let primaryKey = 'id';
        let keyType = 'int';
        let incrementing = true;
        let fillable: string[] = [];
        let guarded: string[] = ['*'];
        let hidden: string[] = [];
        let appends: string[] = [];
        const castsMap: Record<string, string> = {};
        const casts: ParsedCast[] = [];
        const accessors: ParsedAccessor[] = [];
        const relations: ParsedRelation[] = [];

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            // $table = 'custom_table';
            if (token.value === '$table' && tokens[i + 1]?.value === '=' && tokens[i + 2]?.type === 'STRING') {
                table = tokens[i + 2].value;
            }

            // $primaryKey = 'custom_id';
            if (token.value === '$primaryKey' && tokens[i + 1]?.value === '=' && tokens[i + 2]?.type === 'STRING') {
                primaryKey = tokens[i + 2].value;
            }

            // $keyType = 'string';
            if (token.value === '$keyType' && tokens[i + 1]?.value === '=' && tokens[i + 2]?.type === 'STRING') {
                keyType = tokens[i + 2].value;
            }

            // $incrementing = false;
            if (token.value === '$incrementing' && tokens[i + 1]?.value === '=') {
                incrementing = tokens[i + 2]?.type === 'TRUE';
            }

            // $fillable = [ ... ];
            if (token.value === '$fillable' && tokens[i + 1]?.value === '=') {
                const parsed = LaravelSourceLexer.parseArray(source, tokens, i + 2);
                fillable = parsed.entries.map(e => e.value.kind === 'literal' && e.value.literalType === 'string' ? String(e.value.value) : e.key);
            }

            // $guarded = [ ... ];
            if (token.value === '$guarded' && tokens[i + 1]?.value === '=') {
                const parsed = LaravelSourceLexer.parseArray(source, tokens, i + 2);
                guarded = parsed.entries.map(e => e.value.kind === 'literal' && e.value.literalType === 'string' ? String(e.value.value) : e.key);
            }

            // $hidden = [ ... ];
            if (token.value === '$hidden' && tokens[i + 1]?.value === '=') {
                const parsed = LaravelSourceLexer.parseArray(source, tokens, i + 2);
                hidden = parsed.entries.map(e => e.value.kind === 'literal' && e.value.literalType === 'string' ? String(e.value.value) : e.key);
            }

            // $appends = [ ... ];
            if (token.value === '$appends' && tokens[i + 1]?.value === '=') {
                const parsed = LaravelSourceLexer.parseArray(source, tokens, i + 2);
                appends = parsed.entries.map(e => e.value.kind === 'literal' && e.value.literalType === 'string' ? String(e.value.value) : e.key);
            }

            // $casts = [ ... ];
            if (token.value === '$casts' && tokens[i + 1]?.value === '=') {
                const parsed = LaravelSourceLexer.parseArray(source, tokens, i + 2);
                for (const entry of parsed.entries) {
                    const castVal = entry.value.kind === 'literal' && entry.value.literalType === 'string' ? String(entry.value.value) : 'string';
                    castsMap[entry.key] = castVal;
                    casts.push(ScannedModelCastDescriptor.create({
                        column: entry.key,
                        targetType: castVal
                    }));
                }
            }

            // Accessors:
            // 1. Legacy style: public function getSubtotalAttribute(): float { ... }
            if (token.value === 'function' && tokens[i + 1]?.type === 'IDENTIFIER' && tokens[i + 1].value.startsWith('get') && tokens[i + 1].value.endsWith('Attribute')) {
                const fnName = tokens[i + 1].value;
                const rawName = fnName.slice(3, -9);
                const accName = rawName.charAt(0).toLowerCase() + rawName.slice(1);
                let accType = 'string';
                let k = i + 2;
                while (k < tokens.length && tokens[k].value !== '{' && tokens[k].value !== ';') {
                    if (tokens[k].value === ':') {
                        const hint = tokens[k + 1]?.value?.toLowerCase();
                        if (hint === 'float' || hint === 'int' || hint === 'integer' || hint === 'number') accType = 'number';
                        else if (hint === 'bool' || hint === 'boolean') accType = 'boolean';
                        else if (hint === 'array') accType = 'array';
                        else accType = 'string';
                    }
                    k++;
                }
                accessors.push(ScannedModelAccessorDescriptor.fromReturnType({ name: accName, type: accType, nullable: false }));
            }

            // 2. Modern style: protected function amountMinor(): Attribute { return Attribute::make(get: fn () => ...); }
            if (token.value === 'function' && tokens[i + 1]?.type === 'IDENTIFIER') {
                const fnName = tokens[i + 1].value;
                let k = i + 2;
                let isAttribute = false;
                while (k < tokens.length && tokens[k].value !== '{' && tokens[k].value !== ';') {
                    if (tokens[k].value === ':' && tokens[k + 1]?.value === 'Attribute') {
                        isAttribute = true;
                    }
                    k++;
                }

                if (isAttribute && tokens[k]?.value === '{') {
                    let depth = 1;
                    k++;
                    let accType = 'string';
                    while (k < tokens.length && depth > 0) {
                        if (tokens[k].value === '{') depth++;
                        else if (tokens[k].value === '}') depth--;

                        if (tokens[k].value === '(' && (tokens[k + 1]?.value === 'int' || tokens[k + 1]?.value === 'integer' || tokens[k + 1]?.value === 'float') && tokens[k + 2]?.value === ')') {
                            accType = 'number';
                        }
                        k++;
                    }
                    accessors.push(ScannedModelAccessorDescriptor.fromReturnType({ name: fnName, type: accType, nullable: false }));
                }
            }

            // Relations: public function orderDetails(): HasMany { return $this->hasMany(OrderDetail::class); }
            if (token.value === 'function' && tokens[i + 1]?.type === 'IDENTIFIER') {
                const relName = tokens[i + 1].value;
                let k = i + 2;
                while (k < tokens.length && tokens[k].value !== '{' && tokens[k].value !== ';') k++;
                if (tokens[k]?.value === '{') {
                    while (k < tokens.length && tokens[k].value !== '}') {
                        if (tokens[k].value === '$this' && (tokens[k + 1]?.value === '->' || tokens[k + 1]?.value === '?->')) {
                            const relMethod = tokens[k + 2]?.value;
                            if (EloquentRelationClassifier.isRelationMethod(relMethod)) {
                                const descriptor = EloquentRelationClassifier.getDescriptor(relMethod);
                                if (tokens[k + 3]?.value === '(' && tokens[k + 4]?.type === 'IDENTIFIER') {
                                    const relatedModel = tokens[k + 4].value;
                                    const modelName = extractClassBasename(relatedModel);
                                    relations.push(ScannedModelRelationDescriptor.create({
                                        name: relName,
                                        type: descriptor.type,
                                        modelName,
                                        targetModel: relatedModel,
                                        cardinality: descriptor.cardinality,
                                        isCollection: descriptor.isCollection
                                    }));
                                }
                            }
                        }
                        k++;
                    }
                }
            }
        }

        const migrationCols = migrationMap?.get(table);
        const columns = migrationCols && migrationCols.length > 0
            ? migrationCols
            : Array.from(new Set(['id', ...fillable, 'created_at', 'updated_at'])).map(col => {
                const castEntry = casts.find(c => c.column === col);
                let primKind: PrimitiveKind = PrimitiveKind.STRING;
                if (castEntry) {
                    primKind = castEntry.semanticType;
                } else if (col === 'id' || col.endsWith('_id') || col.endsWith('Id')) {
                    primKind = PrimitiveKind.NUMBER;
                } else if (col.endsWith('_at')) {
                    primKind = PrimitiveKind.DATETIME;
                }

                let colType = 'varchar';
                if (primKind === PrimitiveKind.NUMBER) {
                    colType = 'int';
                } else if (primKind === PrimitiveKind.BOOLEAN) {
                    colType = 'boolean';
                } else if (primKind === PrimitiveKind.DATETIME) {
                    colType = 'timestamp';
                }

                return ScannedModelColumnDescriptor.fromSchema({
                    name: col,
                    type: colType,
                    nullable: col !== 'id',
                    semanticType: primKind
                });
            });

        return ScannedModelDescriptor.create({
            name: modelName,
            shortName: modelName,
            table,
            primaryKey,
            keyType,
            incrementing,
            columns,
            fillable,
            guarded,
            hidden,
            appends,
            casts,
            accessors,
            relations
        });
    }

    /**
     * 5. Derives Canonical RequestType[] AST streams from parsed routes and resources.
     */
    public static deriveRequestTypes(
        routes: readonly ParsedRoute[] = [],
        resources: readonly ParsedResource[] = [],
        interner: TypeInterner = new TypeInterner(),
        models: readonly any[] = []
    ): readonly RequestType[] {
        const resourceIndex = new Map<string, ParsedResource>();
        for (const res of resources) {
            resourceIndex.set(res.name, res);
            resourceIndex.set(res.name.toLowerCase(), res);
            const bare = res.name.replace(/Resource$/, '').toLowerCase();
            resourceIndex.set(bare, res);
        }

        const modelIndex = new Map<string, any>();
        for (const m of models) {
            modelIndex.set(m.name, m);
            modelIndex.set(m.name.toLowerCase(), m);
        }

        const toSemanticType = (raw: any): SemanticType => {
            if (!raw) return interner.intern(new PrimitiveType(PrimitiveKind.STRING));
            if (raw.kind === 'primitive') {
                const pType = String(raw.type || '').toLowerCase();
                const isNum = pType === 'int' || pType === 'float' || pType.includes('number') || pType.includes('decimal');
                const isBool = pType === 'bool' || pType === 'boolean';
                const primKind = isNum ? PrimitiveKind.NUMBER : (isBool ? PrimitiveKind.BOOLEAN : PrimitiveKind.STRING);
                return interner.intern(new PrimitiveType(primKind));
            }
            if (raw.kind === 'model') {
                const m = modelIndex.get(raw.model) || modelIndex.get(String(raw.model).toLowerCase());
                if (m && m.columns) {
                    const propMap = new Map<string, SemanticType>();
                    for (const col of m.columns) {
                        const primKind = col.semanticType ?? DatabaseColumnTypeMapper.toPrimitiveKind(col.type);
                        propMap.set(col.name, interner.intern(new PrimitiveType(primKind)));
                    }
                    return new ObjectType(new ImmutableMap(propMap), new ImmutableSet(new Set()));
                }
                return new ReferenceType('App\\Models', raw.model);
            }
            if (raw.kind === 'static_method_call' || raw.kind === 'resource' || (raw.resolved && (raw.resolved.type === 'resource' || raw.resolved.resource))) {
                const resInfo = raw.resolved || raw;
                const resName = resInfo.resource || raw.className || resInfo.model;
                const isCollection = resInfo.collection === true || raw.name === 'collection';
                if (resName) {
                    const refType = new ReferenceType('App\\Http\\Resources', resName);
                    if (isCollection) {
                        return interner.intern(new ReadonlyCollectionType(CollectionKind.ARRAY, refType));
                    }
                    return refType;
                }
            }
            if (raw.kind === 'array') {
                const elemType = toSemanticType(raw.element);
                return new ReadonlyCollectionType(CollectionKind.ARRAY, elemType);
            }
            if (raw.kind === 'object' || raw.fields) {
                const childFields = raw.fields || {};
                const propMap = new Map<string, SemanticType>();
                for (const [k, v] of Object.entries(childFields)) {
                    propMap.set(k, toSemanticType(v));
                }
                return new ObjectType(new ImmutableMap(propMap), new ImmutableSet(new Set()));
            }
            return interner.intern(new PrimitiveType(PrimitiveKind.STRING));
        };

        const groups = new Map<string, RequestType>();
        for (const route of routes) {
            let rawDomain = route.resourceName;
            if (rawDomain) {
                rawDomain = ResourceNamingConvention.stripSuffix(rawDomain);
            }
            if (!rawDomain && (route.path === '/register' || route.actionName?.endsWith('register'))) {
                rawDomain = 'Register';
            }
            if (!rawDomain && route.name) {
                const nameParts = route.name.split('.');
                rawDomain = nameParts.length > 1
                    ? nameParts.slice(0, -1).map((p, i) => i === 0 ? toCamelCase(p) : toPascalCase(p)).join('')
                    : route.name;
            }
            const rawSegments = (route.path || '').replace(/^\//, '').split('/')
                .filter(segment => segment && segment !== 'api' && segment !== 'v1' && !segment.startsWith('{') && !segment.startsWith(':'));
            if (!rawDomain && rawSegments.length > 1) {
                const camelSegments = rawSegments.map((seg, idx) => {
                    const clean = toCamelCase(seg);
                    return idx === 0 ? clean : toPascalCase(clean);
                });
                rawDomain = camelSegments.join('');
            }
            if (!rawDomain && (route as any).domain) {
                rawDomain = (route as any).domain;
            }
            const routeAction = (route as any).action || route.actionName;
            if (!rawDomain && routeAction) {
                const ctrlMatch = String(routeAction).match(/([A-Z][a-zA-Z0-9_]*?)Controller/);
                if (ctrlMatch) {
                    rawDomain = ctrlMatch[1];
                }
            }
            if (!rawDomain && (route as any).schema?.formTypeName) {
                rawDomain = (route as any).schema.formTypeName.replace(/Form$/, '');
            }
            if (!rawDomain && (route as any).schema?.resourceName) {
                rawDomain = ResourceNamingConvention.stripSuffix((route as any).schema.resourceName);
            }
            if (!rawDomain && route.groupName) {
                rawDomain = route.groupName;
            }
            if (!rawDomain && rawSegments.length > 0) {
                const camelSegments = rawSegments.map((seg, idx) => {
                    const clean = toCamelCase(seg);
                    return idx === 0 ? clean : toPascalCase(clean);
                });
                rawDomain = camelSegments.join('');
            }
            if (!rawDomain) {
                rawDomain = 'App';
            }
            const bareDomain = rawDomain.replace(/Resource$/, '').toLowerCase();

            const actionName = route.actionName || 'action';
            let actionKind = route.actionKind;
            const schemaAction = (route.schema as any)?.action;
            if (schemaAction === 'update' || schemaAction === 'create') {
                actionKind = schemaAction;
            } else if (route.method === 'PUT' || route.method === 'PATCH' || route.name?.endsWith('.update') || route.actionName === 'update') {
                actionKind = 'update';
            } else if (route.method === 'POST' || route.name?.endsWith('.store') || route.actionName === 'store' || route.actionName === 'create') {
                actionKind = 'create';
            } else {
                actionKind = route.isMutating ? 'create' : 'read';
            }

            let fields: RequestField[] = [];
            if (route.schema?.rules) {
                const arrayProps = new Map<string, ObjectProperty[]>();
                const primitiveArrayProps = new Map<string, SemanticType>();
                const regularRules: [string, string][] = [];

                const routeActionDesc = (route as any).action || route.actionName || route.resourceName || (route as any).controllerAction || '';
                const rawRules = route.schema.rules;
                const ruleEntries: readonly [string, string][] = Array.isArray(rawRules)
                    ? (rawRules as readonly RouteValidationRuleEntry[]).map(r => [r.fieldName, Array.isArray(r.rules) ? r.rules.join('|') : String(r.rules)])
                    : Object.entries((rawRules as any) || {}).map(([key, val]) => [key, Array.isArray(val) ? val.join('|') : String(val)]);

                for (const [key, ruleStr] of ruleEntries) {
                    if (key.includes('.*')) {
                        const hasExplicitType = ruleStr.includes('string') || ruleStr.includes('integer') || ruleStr.includes('numeric') || ruleStr.includes('boolean') || ruleStr.includes('file') || ruleStr.includes('image');
                        if (!hasExplicitType) {
                            console.warn(`[RouteSync Compiler Warning] Tipe elemen untuk wildcard '${key}' pada route ${route.path} (${routeActionDesc}) belum eksplisit.`);
                        }
                    } else {
                        const hasExplicitType = ruleStr.includes('string') || ruleStr.includes('integer') || ruleStr.includes('numeric') || ruleStr.includes('boolean') || ruleStr.includes('array') || ruleStr.includes('file') || ruleStr.includes('image');
                        if (!hasExplicitType) {
                            console.warn(`[RouteSync Compiler Warning] Tipe field untuk '${key}' pada route ${route.path} (${routeActionDesc}) belum eksplisit.`);
                        }
                    }

                    if (key.includes('.*.')) {
                        const [parentKey, childKey] = key.split('.*.');
                        if (!arrayProps.has(parentKey)) {
                            arrayProps.set(parentKey, []);
                        }
                        const isNum = ruleStr.includes('numeric') || ruleStr.includes('integer') || ruleStr.includes('decimal');
                        const isBool = ruleStr.includes('boolean');
                        let primKind = PrimitiveKind.STRING;
                        if (isNum) {
                            primKind = PrimitiveKind.NUMBER;
                        } else if (isBool) {
                            primKind = PrimitiveKind.BOOLEAN;
                        }
                        const semanticType = interner.intern(new PrimitiveType(primKind));

                        arrayProps.get(parentKey)!.push(ScannedObjectProperty.create({
                            name: childKey,
                            type: semanticType,
                            required: ruleStr.includes('required'),
                            nullable: ruleStr.includes('nullable')
                        }));
                    } else if (key.endsWith('.*')) {
                        const baseKey = key.slice(0, -2);
                        const isNum = ruleStr.includes('numeric') || ruleStr.includes('integer') || ruleStr.includes('decimal');
                        const isBool = ruleStr.includes('boolean');
                        let primKind = PrimitiveKind.STRING;
                        if (isNum) {
                            primKind = PrimitiveKind.NUMBER;
                        } else if (isBool) {
                            primKind = PrimitiveKind.BOOLEAN;
                        }
                        const semanticType = interner.intern(new PrimitiveType(primKind));
                        const arrayType = interner.intern(new ReadonlyCollectionType(CollectionKind.ARRAY, semanticType));
                        primitiveArrayProps.set(baseKey, arrayType);
                    } else {
                        regularRules.push([key, ruleStr]);
                    }
                }

                const processedKeys = new Set<string>();
                for (const [key, ruleStr] of regularRules) {
                    processedKeys.add(key);
                    if (arrayProps.has(key)) {
                        const childProperties = arrayProps.get(key)!;
                        const childObjectType = new ObjectType({ name: key, baseName: key, properties: childProperties });
                        const arrayType = interner.intern(new ReadonlyCollectionType(CollectionKind.ARRAY, childObjectType));

                        fields.push(ScannedFormFieldDescriptor.create({
                            name: key,
                            originalName: key,
                            type: arrayType,
                            required: ruleStr.includes('required') || !ruleStr.includes('sometimes'),
                            nullable: ruleStr.includes('nullable')
                        }));
                    } else if (primitiveArrayProps.has(key)) {
                        fields.push(ScannedFormFieldDescriptor.create({
                            name: key,
                            originalName: key,
                            type: primitiveArrayProps.get(key)!,
                            required: ruleStr.includes('required') || !ruleStr.includes('sometimes'),
                            nullable: ruleStr.includes('nullable')
                        }));
                    } else {
                        const isNum = ruleStr.includes('numeric') || ruleStr.includes('integer') || ruleStr.includes('decimal');
                        const isBool = ruleStr.includes('boolean');
                        let primKind = PrimitiveKind.STRING;
                        if (isNum) {
                            primKind = PrimitiveKind.NUMBER;
                        } else if (isBool) {
                            primKind = PrimitiveKind.BOOLEAN;
                        }
                        const semanticType = interner.intern(new PrimitiveType(primKind));

                        fields.push(ScannedFormFieldDescriptor.create({
                            name: key,
                            originalName: key,
                            type: semanticType,
                            required: ruleStr.includes('required') || !ruleStr.includes('sometimes'),
                            nullable: ruleStr.includes('nullable')
                        }));
                    }
                }

                for (const [parentKey, childProperties] of arrayProps.entries()) {
                    if (!processedKeys.has(parentKey)) {
                        processedKeys.add(parentKey);
                        const childObjectType = new ObjectType({ name: toCamelCase(parentKey), baseName: toCamelCase(parentKey), properties: childProperties });
                        const arrayType = interner.intern(new ReadonlyCollectionType(CollectionKind.ARRAY, childObjectType));

                        fields.push(ScannedFormFieldDescriptor.create({
                            name: parentKey,
                            originalName: parentKey,
                            type: arrayType,
                            required: true,
                            nullable: false
                        }));
                    }
                }

                for (const [baseKey, arrayType] of primitiveArrayProps.entries()) {
                    if (!processedKeys.has(baseKey)) {
                        processedKeys.add(baseKey);
                        fields.push(ScannedFormFieldDescriptor.create({
                            name: baseKey,
                            originalName: baseKey,
                            type: arrayType,
                            required: false,
                            nullable: false
                        }));
                    }
                }
            }

            let formActionName = route.actionName;
            if (formActionName === 'update' || actionKind === 'update' || route.method === 'PUT' || route.method === 'PATCH' || route.name?.endsWith('.update')) {
                formActionName = 'update';
            } else if (!formActionName || formActionName === 'store' || formActionName === 'create' || actionKind === 'create') {
                formActionName = 'create';
            }
            const actionObj: FormAction = new ScannedFormActionDescriptor({
                name: formActionName,
                fields
            });

            let actionRespData: ResponseData | undefined = undefined;
            if (route.response) {
                let respFields: Record<string, SemanticType> = {};
                const resName = (route.response as any)?.resourceName || (route.response as any)?.resource;
                if (route.response.kind === 'resource' && resName) {
                    const foundRes = resourceIndex.get(resName) || resourceIndex.get(resName.toLowerCase());
                    if (foundRes && foundRes.fields) {
                        const rawFields = Array.isArray(foundRes.fields)
                            ? Object.fromEntries(foundRes.fields.map(f => [f.name, f.expression ?? f]))
                            : foundRes.fields;
                        for (const [k, v] of Object.entries(rawFields)) {
                            respFields[k] = toSemanticType(v);
                        }
                    }
                } else if ('fields' in route.response) {
                    const rawFields = Array.isArray((route.response as any).fields)
                        ? Object.fromEntries(((route.response as any).fields as any[]).map(f => [f.name, f.expression ?? f]))
                        : (route.response as any).fields;
                    for (const [k, v] of Object.entries(rawFields || {})) {
                        respFields[k] = toSemanticType(v);
                    }
                }

                const defaultResName = resName || rawDomain;

                actionRespData = {
                    resourceName: defaultResName,
                    fields: respFields,
                    collection: 'collection' in route.response ? !!(route.response as any).collection : false,
                    wrapped: 'wrapped' in route.response ? !!(route.response as any).wrapped : false
                };
            }

            const isReadRouteWithoutFields = fields.length === 0 && !route.actionName && !route.schema?.rules && (route.method === 'GET' || route.method === 'HEAD');

            if (groups.has(bareDomain)) {
                const existing = groups.get(bareDomain)!;
                const newActions = [...existing.actions];
                const existingIdx = newActions.findIndex(a => a.name === formActionName);
                if (!isReadRouteWithoutFields) {
                    if (existingIdx >= 0) {
                        if (fields.length > 0 || newActions[existingIdx].fields.length === 0) {
                            newActions[existingIdx] = actionObj;
                        }
                    } else {
                        newActions.push(actionObj);
                    }
                }

                let newRespData = existing.responseData;
                if (actionRespData && (!existing.responseData || !existing.responseData.fields || Object.keys(existing.responseData.fields).length === 0)) {
                    newRespData = actionRespData;
                }

                groups.set(bareDomain, ScannedRequestTypeDescriptor.create({
                    resourceName: existing.resourceName,
                    formTypeName: existing.formTypeName,
                    actions: newActions,
                    responseData: newRespData
                }));
            } else {
                let respData: ResponseData | undefined = actionRespData;
                if (!respData) {
                    const foundRes = resourceIndex.get(rawDomain) || resourceIndex.get(bareDomain);
                    if (foundRes && foundRes.fields) {
                        const respFields: Record<string, SemanticType> = {};
                        const rawFields = Array.isArray(foundRes.fields)
                            ? Object.fromEntries(foundRes.fields.map(f => [f.name, f.expression ?? f]))
                            : foundRes.fields;
                        for (const [k, v] of Object.entries(rawFields)) {
                            respFields[k] = toSemanticType(v);
                        }
                        respData = {
                            resourceName: `${rawDomain}Resource`,
                            fields: respFields,
                            collection: false,
                            wrapped: false
                        };
                    }
                }

                groups.set(bareDomain, ScannedRequestTypeDescriptor.create({
                    resourceName: toCamelCase(rawDomain),
                    formTypeName: `${toPascalCase(rawDomain)}Form`,
                    actions: isReadRouteWithoutFields ? [] : [actionObj],
                    responseData: respData
                }));
            }
        }

        for (const res of resources) {
            const cleanKey = res.name.replace(/Resource$/, '').toLowerCase();
            const respFields: Record<string, SemanticType> = {};
            const rawFields = Array.isArray(res.fields)
                ? Object.fromEntries(res.fields.map(f => [f.name, f.expression ?? f]))
                : (res.fields || {});
            for (const [k, v] of Object.entries(rawFields)) {
                respFields[k] = toSemanticType(v);
            }

            if (!groups.has(cleanKey)) {
                groups.set(cleanKey, ScannedRequestTypeDescriptor.create({
                    resourceName: res.name,
                    formTypeName: `${res.name}Form`,
                    actions: [],
                    responseData: {
                        resourceName: res.name,
                        fields: respFields,
                        collection: false,
                        wrapped: false
                    }
                }));
            } else {
                const existing = groups.get(cleanKey)!;
                if (!existing.responseData || !existing.responseData.fields || Object.keys(existing.responseData.fields).length === 0) {
                    groups.set(cleanKey, ScannedRequestTypeDescriptor.create({
                        resourceName: existing.resourceName,
                        formTypeName: existing.formTypeName,
                        actions: existing.actions,
                        responseData: {
                            resourceName: res.name,
                            fields: respFields,
                            collection: false,
                            wrapped: false
                        }
                    }));
                }
            }
        }

        return Array.from(groups.values());
    }

    /**
     * 6. Derives Canonical ObjectType[] AST streams leveraging Core TypeInterner and SymbolTable.
     */
    public static deriveSemanticTypes(
        resources: readonly ParsedResource[] = [],
        models: readonly ParsedModel[] = [],
        interner: TypeInterner = new TypeInterner(),
        routes: readonly ParsedRoute[] = []
    ): readonly ObjectType[] {
        const types: ObjectType[] = [];
        const seenNames = new Set<string>();

        for (const res of resources) {
            const rawFields: readonly ResourceFieldDescriptor[] = Array.isArray(res.fields)
                ? res.fields
                : Object.entries((res.fields as any) || {}).map(([name, val]: [string, any]) => {
                    const isNull = !!(val?.nullable ?? val?.expression?.nullable ?? val?.resolved?.nullable ?? (typeof val?.resolved?.type === 'string' && val.resolved.type.includes('null')));
                    const expr = val?.expression ?? (val?.kind ? val : ResourceFieldExpressionFactory.primitive(val?.type));
                    const resolvedType = String(val?.resolved?.type ?? expr?.resolved?.type ?? expr?.type ?? '').toLowerCase();
                    const isNum = resolvedType === 'number' || resolvedType === 'int' || resolvedType.includes('int') || resolvedType.includes('decimal') || resolvedType.includes('float') || resolvedType.includes('numeric');
                    const isBool = resolvedType === 'boolean' || resolvedType === 'bool';
                    let semType = PrimitiveKind.STRING;
                    if (isNum) semType = PrimitiveKind.NUMBER;
                    else if (isBool) semType = PrimitiveKind.BOOLEAN;

                    return ScannedResourceFieldDescriptor.create({
                        name,
                        propertyName: toCamelCase(name),
                        expression: expr,
                        semanticType: semType,
                        nullable: isNull
                    });
                });

            const properties: ObjectProperty[] = [];

            const processField = (field: ResourceFieldDescriptor, prefix = '', isNullable = false) => {
                const camelKey = toCamelCase(field.name);
                const propName = prefix ? `${prefix}${camelKey.charAt(0).toUpperCase()}${camelKey.slice(1)}` : camelKey;
                const fKind = field.expression as any;

                if (fKind && typeof fKind === 'object' && (fKind.kind === 'object' || fKind.fields)) {
                    const rawChild = Array.isArray(fKind.fields) ? fKind.fields : Object.entries(fKind.fields || {});
                    for (const cf of rawChild) {
                        const cName = Array.isArray(cf) ? cf[0] : cf.name;
                        const cVal = Array.isArray(cf) ? cf[1] : cf;
                        const childTypeStr = String(cVal?.type ?? cVal?.resolved?.type ?? cVal?.expression?.type ?? '').toLowerCase();
                        const isChildNum = childTypeStr === 'number' || childTypeStr === 'integer' || childTypeStr === 'int' || childTypeStr.includes('int') || childTypeStr.includes('decimal') || childTypeStr.includes('float') || childTypeStr.includes('numeric');
                        const isChildBool = childTypeStr === 'boolean' || childTypeStr === 'bool';
                        let childSemType = PrimitiveKind.STRING;
                        if (isChildNum) childSemType = PrimitiveKind.NUMBER;
                        else if (isChildBool) childSemType = PrimitiveKind.BOOLEAN;

                        const childDesc: ResourceFieldDescriptor = (cVal && typeof cVal === 'object' && 'expression' in cVal)
                            ? (cVal as ResourceFieldDescriptor)
                            : ScannedResourceFieldDescriptor.create({
                                name: cName,
                                propertyName: toCamelCase(cName),
                                expression: cVal?.expression ?? (cVal?.kind ? cVal : ResourceFieldExpressionFactory.primitive(cVal?.type)),
                                semanticType: childSemType,
                                nullable: isNullable || !!fKind.nullable
                            });
                        processField(childDesc, propName, isNullable || !!fKind.nullable);
                    }
                    return;
                }

                let propType: SemanticType = new PrimitiveType(PrimitiveKind.STRING);
                const resolvedType = String(field.semanticType ?? fKind?.resolved?.type ?? fKind?.type ?? '').toLowerCase();
                const isNum = field.semanticType === PrimitiveKind.NUMBER || resolvedType === 'number' || resolvedType === 'int' || resolvedType.includes('int') || resolvedType.includes('decimal') || resolvedType.includes('float') || resolvedType.includes('numeric');
                const isBool = field.semanticType === PrimitiveKind.BOOLEAN || resolvedType === 'boolean' || resolvedType === 'bool';
                const fieldNullable = isNullable || field.nullable || fKind?.nullable || resolvedType.includes('null');

                if (isNum) {
                    propType = new PrimitiveType(PrimitiveKind.NUMBER);
                } else if (isBool) {
                    propType = new PrimitiveType(PrimitiveKind.BOOLEAN);
                } else if (fKind && (fKind.kind === 'array' || fKind.collection)) {
                    const targetRes = fKind.resolved?.resource ?? fKind.resource;
                    const elemType = targetRes 
                        ? new ReferenceType('', `${toPascalCase(targetRes)}Transformed`)
                        : new PrimitiveType(PrimitiveKind.STRING);
                    propType = new ReadonlyCollectionType(CollectionKind.ARRAY, elemType);
                }

                if (fieldNullable) {
                    propType = new NullableType(propType);
                }
                const internedType = interner.intern(propType);

                properties.push(ScannedObjectProperty.create({
                    name: propName,
                    type: internedType,
                    required: true,
                    nullable: !!fieldNullable
                }));
            };

            for (const f of rawFields) {
                processField(f, '', !!f.nullable);
            }
            const baseName = res.name.endsWith('Transformed') ? res.name.replace(/Transformed$/, '') : res.name;
            const typeName = res.typeName ?? (res.name.endsWith('Transformed') ? res.name : `${res.name}Transformed`);
            seenNames.add(typeName);
            const objType = new ObjectType({ name: typeName, baseName, properties });
            types.push(interner.intern(objType) as ObjectType);
        }

        for (const route of routes) {
            let typeName = '';
            let baseName = '';
            let rawFields: any[] = [];

            if (route.response && route.response.kind === 'inline') {
                const inlineResp = route.response as InlineResponseDescriptor;
                typeName = inlineResp.typeName;
                baseName = inlineResp.baseName;
                rawFields = Array.isArray(inlineResp.fields) ? inlineResp.fields : Object.entries(inlineResp.fields || {});
            } else if (route.response && 'fields' in route.response && (route.response as any).fields) {
                const rawDomain = (route as any).domain || route.resourceName || (route.actionName ? route.actionName.replace(/Controller$/, '') : '') || 'Inline';
                typeName = `${toPascalCase(rawDomain)}Transformed`;
                baseName = toPascalCase(rawDomain);
                rawFields = Array.isArray((route.response as any).fields) ? (route.response as any).fields : Object.entries((route.response as any).fields);
            } else if (route.response && (route.response.kind === 'resource' || (route.response as any).resourceName)) {
                const rawDomain = (route as any).domain || route.resourceName || '';
                if (rawDomain && !rawDomain.endsWith('Resource')) {
                    const pascalDomain = toPascalCase(rawDomain);
                    typeName = `${pascalDomain}Transformed`;
                    baseName = pascalDomain;
                    const resName = (route.response as any).resourceName;
                    const targetRes = resName ? `${toPascalCase(resName)}Transformed` : 'unknown';
                    rawFields = [{
                        name: 'data',
                        kind: 'collection',
                        elementType: { kind: 'reference', name: targetRes }
                    }];
                }
            }

            if (typeName && !seenNames.has(typeName)) {
                seenNames.add(typeName);
                const properties: ObjectProperty[] = [];
                const processEntries = (entries: any[], prefix = '') => {
                    for (const item of entries) {
                        const name = Array.isArray(item) ? item[0] : item.name;
                        const val = Array.isArray(item) ? item[1] : item;
                        const camelKey = toCamelCase(name);
                        const propName = prefix ? `${prefix}${camelKey.charAt(0).toUpperCase()}${camelKey.slice(1)}` : camelKey;

                        const valExpr = val?.expression ?? val;

                        if (valExpr && typeof valExpr === 'object' && (valExpr.kind === 'object' || valExpr.fields)) {
                            const childEntries = Array.isArray(valExpr.fields) ? valExpr.fields : Object.entries(valExpr.fields || {});
                            processEntries(childEntries, propName);
                        } else if (valExpr && (valExpr.kind === 'collection' || valExpr.kind === 'array' || valExpr.collection || valExpr.elementType)) {
                            const elem = valExpr.elementType ?? valExpr.element;
                            let elemType: SemanticType = new PrimitiveType(PrimitiveKind.STRING);
                            if (elem?.model) {
                                const foundModel = models.find(m => m.name === elem.model || m.name.toLowerCase() === elem.model.toLowerCase());
                                if (foundModel && foundModel.columns) {
                                    const modelProps: ObjectProperty[] = foundModel.columns.map(c => {
                                        const primKind = c.semanticType ?? DatabaseColumnTypeMapper.toPrimitiveKind(c.type);
                                        let pType: SemanticType = new PrimitiveType(primKind);
                                        if (c.nullable) {
                                            pType = new NullableType(pType);
                                        }
                                        return ScannedObjectProperty.create({
                                            name: toCamelCase(c.name),
                                            type: interner.intern(pType),
                                            nullable: !!c.nullable,
                                            required: true
                                        });
                                    });
                                    const modelBaseName = extractClassBasename(elem.model);
                                    elemType = new ObjectType({ name: toCamelCase(elem.model), baseName: modelBaseName, properties: modelProps });
                                } else {
                                    elemType = new ReferenceType('', `${toPascalCase(elem.model)}Transformed`);
                                }
                            } else if (elem?.name) {
                                elemType = new ReferenceType('', elem.name);
                            }
                            properties.push(ScannedObjectProperty.create({
                                name: propName,
                                type: interner.intern(new ReadonlyCollectionType(CollectionKind.ARRAY, elemType)),
                                nullable: false,
                                required: true
                            }));
                        } else {
                            const vType = String(valExpr?.type ?? val?.type ?? val?.resolved?.type ?? '').toLowerCase();
                            const isUnknown = valExpr?.kind === 'unknown' || vType === 'unknown';
                            const isNum = !isUnknown && (val?.semanticType === PrimitiveKind.NUMBER || vType === 'number' || vType === 'int' || vType.includes('int') || vType.includes('decimal') || vType.includes('float') || vType.includes('numeric'));
                            const isBool = !isUnknown && (val?.semanticType === PrimitiveKind.BOOLEAN || vType === 'boolean' || vType === 'bool');
                            const isNull = !!(val?.nullable || valExpr?.nullable || val?.resolved?.nullable || vType.includes('null'));
                            let prim = PrimitiveKind.STRING;
                            if (isUnknown) {
                                prim = PrimitiveKind.UNKNOWN;
                            } else if (isNum) {
                                prim = PrimitiveKind.NUMBER;
                            } else if (isBool) {
                                prim = PrimitiveKind.BOOLEAN;
                            }
                            let propType: SemanticType = new PrimitiveType(prim);
                            if (isNull) {
                                propType = new NullableType(propType);
                            }
                            properties.push(ScannedObjectProperty.create({
                                name: propName,
                                type: interner.intern(propType),
                                nullable: isNull,
                                required: true
                            }));
                        }
                    }
                };

                processEntries(rawFields);
                types.push(interner.intern(new ObjectType({ name: typeName, baseName, properties })) as ObjectType);
            }
        }

        for (const model of models) {
            const modelTypeName = `${toPascalCase(model.name)}Transformed`;
            const modelBaseName = toPascalCase(model.name);
            if (!seenNames.has(modelTypeName)) {
                seenNames.add(modelTypeName);
                const properties: ObjectProperty[] = [];
                const seenPropNames = new Set<string>();

                for (const col of (model.columns || [])) {
                    if (model.hidden && model.hidden.includes(col.name)) continue;
                    const propName = toCamelCase(col.name);
                    seenPropNames.add(propName);

                    const cast = model.casts ? (model.casts as any)[col.name] : undefined;
                    const colTypeStr = String(cast ?? col.semanticType ?? col.type ?? '').toLowerCase();
                    const isNum = colTypeStr === 'number' || colTypeStr === 'int' || colTypeStr === 'integer' || colTypeStr === 'float' || colTypeStr === 'double' || colTypeStr === 'real' || colTypeStr.includes('int') || colTypeStr.includes('decimal') || colTypeStr.includes('float') || colTypeStr.includes('numeric');
                    const isBool = colTypeStr === 'boolean' || colTypeStr === 'bool';
                    let primKind = PrimitiveKind.STRING;
                    if (isNum) primKind = PrimitiveKind.NUMBER;
                    else if (isBool) primKind = PrimitiveKind.BOOLEAN;

                    let propType: SemanticType = new PrimitiveType(primKind);
                    if (col.nullable) {
                        propType = new NullableType(propType);
                    }
                    properties.push(ScannedObjectProperty.create({
                        name: propName,
                        type: interner.intern(propType),
                        nullable: !!col.nullable,
                        required: true
                    }));
                }

                const appendKeys = new Set<string>([
                    ...(model.appends || []),
                    ...Object.keys(model.accessors || {})
                ]);
                for (const key of appendKeys) {
                    const propName = toCamelCase(key);
                    if (seenPropNames.has(propName)) continue;
                    seenPropNames.add(propName);

                    const accessor = model.accessors ? (model.accessors as any)[key] : undefined;
                    const accType = String(accessor?.semantic?.type ?? 'string').toLowerCase();
                    const isNum = accType === 'number' || accType === 'int' || accType === 'float';
                    const isBool = accType === 'boolean' || accType === 'bool';
                    let primKind = PrimitiveKind.STRING;
                    if (isNum) primKind = PrimitiveKind.NUMBER;
                    else if (isBool) primKind = PrimitiveKind.BOOLEAN;

                    properties.push(ScannedObjectProperty.create({
                        name: propName,
                        type: interner.intern(new PrimitiveType(primKind)),
                        nullable: false,
                        required: true
                    }));
                }

                types.push(interner.intern(new ObjectType({
                    name: modelTypeName,
                    baseName: modelBaseName,
                    properties
                })) as ObjectType);
            }
        }

        return types;
    }
}