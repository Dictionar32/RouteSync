/**
 * routeDescriptors.ts
 *
 * AST descriptors for routes, route parameters, policies, rate limits, and error responses.
 *
 * @module core/compiler/scanner/descriptors/routeDescriptors
 */

import {
    ParsedRoute,
    HttpMethod,
    HTTP_METHOD_REGISTRY,
    matchHttpMethod,
    RouteActionKind,
    CrudRole,
    RouteHookKind,
    RoutePayloadMode,
    RequestContentType,
    RouteParameter,
    PathParameterDescriptor,
    QueryParameterDescriptor,
    HeaderParameterDescriptor,
    RouteParameterLocation,
    RouteParameterType,
    RouteQueryParameter,
    ResponseDescriptor,
    ResourceResponseDescriptor,
    HttpErrorResponseDescriptor,
    HttpErrorKind,
    HTTP_ERROR_KIND_REGISTRY,
    HttpStatusCode,
    RateLimitDescriptor,
    RouteSecurityDescriptor,
    RouteSecurityClassifier,
    RoutePolicyDescriptor,
    RoutePolicyKind,
    RouteCacheInvalidationDescriptor,
    ScannedRouteCacheInvalidationDescriptor,
    RouteExecutionSignature,
    ScannedRouteExecutionSignature,
    ResourceAssignment,
    EndpointContract,
    ScannedEndpointContract,
    RouteSchemaPayload,
    ValidationRuleKind
} from "../../../types/route";
import { toCamelCase, toPascalCase } from "../../../utils/resource-naming";
import { ScannedRouteSchemaPayload } from "./validationDescriptors";

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
        this.in = params.in ?? "path";
        this.required = params.required ?? true;
        this.type = params.type ?? ((params.name === "id" || params.name.endsWith("_id") || params.name.endsWith("Id")) ? "number" : "string");
        Object.freeze(this);
    }

    public static create({
        name,
        propertyName = toCamelCase(name),
        bindingField = null,
        in: location = "path",
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
            ? (bField === "id" || bField.endsWith("_id") || bField.endsWith("Id"))
            : (name === "id" || name.endsWith("_id") || name.endsWith("Id"));
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
        const [rawName, bindingField] = rawSegment.split(":");
        const isOptional = rawName.endsWith("?");
        const name = isOptional ? rawName.slice(0, -1) : rawName;
        const isNumeric = bindingField
            ? (bindingField === "id" || bindingField.endsWith("_id") || bindingField.endsWith("Id"))
            : (name === "id" || name.endsWith("_id") || name.endsWith("Id"));
        return new ScannedRouteParameterDescriptor({
            name,
            propertyName: toCamelCase(name),
            bindingField: bindingField ?? null,
            in: "path",
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
            ? (bField === "id" || bField.endsWith("_id") || bField.endsWith("Id"))
            : (name === "id" || name.endsWith("_id") || name.endsWith("Id"));
        return new ScannedRouteParameterDescriptor({
            name,
            propertyName,
            bindingField: bField,
            in: "path",
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
            in: "query",
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
            in: "header",
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
    readonly modelParameter?: string | null;
    readonly kind?: RoutePolicyKind;
}

/**
 * Reusable Constructor: Scanned Route Policy Descriptor.
 */
export class ScannedRoutePolicyDescriptor implements RoutePolicyDescriptor {
    public readonly kind: RoutePolicyKind;
    public readonly ability: string;
    public readonly modelParameter: string | null;

    constructor({ ability, modelParameter = null, kind }: ScannedRoutePolicyParams) {
        this.ability = ability;
        this.modelParameter = modelParameter ?? null;
        this.kind = kind ?? (this.modelParameter ? RoutePolicyKind.AbilityModel : RoutePolicyKind.Gate);
        Object.freeze(this);
    }

    public static abilityModel(ability: string, modelParameter: string): ScannedRoutePolicyDescriptor {
        return new ScannedRoutePolicyDescriptor({
            ability,
            modelParameter,
            kind: RoutePolicyKind.AbilityModel
        });
    }

    public static gate(ability: string): ScannedRoutePolicyDescriptor {
        return new ScannedRoutePolicyDescriptor({
            ability,
            modelParameter: null,
            kind: RoutePolicyKind.Gate
        });
    }

    public static custom(ability: string, modelParameter: string | null = null): ScannedRoutePolicyDescriptor {
        return new ScannedRoutePolicyDescriptor({
            ability,
            modelParameter,
            kind: RoutePolicyKind.Custom
        });
    }

    public static create({
        ability,
        modelParameter = null,
        kind
    }: {
        readonly ability: string;
        readonly modelParameter?: string | null;
        readonly kind?: RoutePolicyKind;
    }): ScannedRoutePolicyDescriptor {
        return new ScannedRoutePolicyDescriptor({
            ability,
            modelParameter: modelParameter ?? null,
            kind
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
        if (typeof maxAttemptsOrOptions === "object") {
            return new ScannedRateLimitDescriptor({
                maxAttempts: maxAttemptsOrOptions.maxAttempts,
                decayMinutes: maxAttemptsOrOptions.decayMinutes ?? 1
            });
        }
        return new ScannedRateLimitDescriptor({ maxAttempts: maxAttemptsOrOptions, decayMinutes: decayMinutesArg });
    }
}

export interface ScannedHttpErrorResponseParams {
    readonly kind?: HttpErrorKind;
    readonly statusCode?: HttpStatusCode;
    readonly name?: string;
    readonly typeName?: string;
    readonly schema?: Record<string, unknown>;
}

/**
 * Reusable Constructor: Scanned HTTP Error Response Descriptor.
 */
export class ScannedHttpErrorResponseDescriptor implements HttpErrorResponseDescriptor {
    public readonly kind: HttpErrorKind;
    public readonly statusCode: HttpStatusCode;
    public readonly name: string;
    public readonly typeName: string;
    public readonly schema: Record<string, unknown>;

    constructor({ kind, statusCode, name, typeName, schema }: ScannedHttpErrorResponseParams) {
        const resolvedKind = kind ?? HttpErrorKind.Custom;
        const spec = HTTP_ERROR_KIND_REGISTRY[resolvedKind];
        this.kind = resolvedKind;
        this.statusCode = statusCode ?? spec.defaultStatusCode;
        this.name = name ?? spec.defaultName;
        this.typeName = typeName ?? spec.defaultTypeName;
        this.schema = Object.freeze({ ...(schema ?? {}) });
        Object.freeze(this);
    }

    public static create({
        kind = HttpErrorKind.Custom,
        statusCode,
        name,
        typeName,
        schema = {
            type: "object",
            properties: {
                message: { typeName: "string", nullable: false }
            }
        }
    }: {
        readonly kind?: HttpErrorKind;
        readonly statusCode?: HttpStatusCode;
        readonly name?: string;
        readonly typeName?: string;
        readonly schema?: Record<string, unknown>;
    }): ScannedHttpErrorResponseDescriptor {
        const spec = HTTP_ERROR_KIND_REGISTRY[kind];
        return new ScannedHttpErrorResponseDescriptor({
            kind,
            statusCode: statusCode ?? spec.defaultStatusCode,
            name: name ?? spec.defaultName,
            typeName: typeName ?? (name ? `${name}Error` : spec.defaultTypeName),
            schema
        });
    }

    public static validation(): ScannedHttpErrorResponseDescriptor {
        return new ScannedHttpErrorResponseDescriptor({
            kind: HttpErrorKind.Validation,
            statusCode: HttpStatusCode.UnprocessableEntity,
            name: "UnprocessableEntity",
            typeName: "LaravelValidationError",
            schema: {
                type: "object",
                properties: {
                    message: { typeName: "string", nullable: false },
                    errors: { typeName: "Record<string, string[]>", nullable: false }
                }
            }
        });
    }

    public static unprocessableEntity(): ScannedHttpErrorResponseDescriptor {
        return ScannedHttpErrorResponseDescriptor.validation();
    }

    public static unauthorized(): ScannedHttpErrorResponseDescriptor {
        return new ScannedHttpErrorResponseDescriptor({
            kind: HttpErrorKind.Unauthorized,
            statusCode: HttpStatusCode.Unauthorized,
            name: "Unauthorized",
            typeName: "LaravelUnauthorizedError",
            schema: {
                type: "object",
                properties: {
                    message: { typeName: "string", nullable: false }
                }
            }
        });
    }

    public static forbidden(): ScannedHttpErrorResponseDescriptor {
        return new ScannedHttpErrorResponseDescriptor({
            kind: HttpErrorKind.Forbidden,
            statusCode: HttpStatusCode.Forbidden,
            name: "Forbidden",
            typeName: "LaravelForbiddenError",
            schema: {
                type: "object",
                properties: {
                    message: { typeName: "string", nullable: false }
                }
            }
        });
    }

    public static notFound(): ScannedHttpErrorResponseDescriptor {
        return new ScannedHttpErrorResponseDescriptor({
            kind: HttpErrorKind.NotFound,
            statusCode: HttpStatusCode.NotFound,
            name: "NotFound",
            typeName: "LaravelNotFoundError",
            schema: {
                type: "object",
                properties: {
                    message: { typeName: "string", nullable: false }
                }
            }
        });
    }

    public static serverError(): ScannedHttpErrorResponseDescriptor {
        return new ScannedHttpErrorResponseDescriptor({
            kind: HttpErrorKind.ServerError,
            statusCode: HttpStatusCode.InternalServerError,
            name: "InternalServerError",
            typeName: "LaravelServerError",
            schema: {
                type: "object",
                properties: {
                    message: { typeName: "string", nullable: false }
                }
            }
        });
    }

    public static custom(
        statusCode: HttpStatusCode,
        name: string,
        typeName?: string,
        schema?: Record<string, unknown>
    ): ScannedHttpErrorResponseDescriptor {
        return new ScannedHttpErrorResponseDescriptor({
            kind: HttpErrorKind.Custom,
            statusCode,
            name,
            typeName: typeName ?? `${name}Error`,
            schema: schema ?? {
                type: "object",
                properties: {
                    message: { typeName: "string", nullable: false }
                }
            }
        });
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
    readonly controllerName?: string | null;
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
        sourceFile = "",
        sourceLine = 0,
        controllerName = null,
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
        readonly controllerName?: string | null;
        readonly schema?: RouteSchemaPayload;
    }): ScannedRouteDescriptor {
        const resolvedActionKind = actionKind ?? (method.toUpperCase() === "GET" ? "read" : "create");
        const resolvedIsMutating = isMutating ?? (method.toUpperCase() !== "GET" && method.toUpperCase() !== "HEAD");
        const resolvedActionName = actionName ?? (resolvedIsMutating ? "mutate" : "query");
        const fallbackResource = (resourceName && resourceName.length > 0)
            ? resourceName
            : (path.replace(/^\/(?:api\/)?(?:v\d+\/)?/, "").split("/")[0] || "app");
        const resolvedGroupName = groupName ?? toCamelCase(fallbackResource);
        const resolvedRuntimePath = runtimePath ?? path.replace(/\{([^}]+)\}/g, ":$1");
        const resolvedHookKind = hookKind ?? (resolvedIsMutating ? RouteHookKind.Mutation : RouteHookKind.Query);
        const resolvedInvalidation = invalidation ?? ScannedRouteCacheInvalidationDescriptor.none();
        const resolvedPathParams = pathParameters ?? (
            parameters.length > 0
                ? parameters.filter(p => p.in === "path")
                : [...path.matchAll(/\{([^}]+)\}/g)].map(m => ScannedRouteParameterDescriptor.fromPathSegment(m[1]))
        );
        const resolvedParameters = parameters.length > 0 ? parameters : resolvedPathParams;
        const resolvedHasPayload = resolvedIsMutating || resolvedHookKind === RouteHookKind.Mutation || (schema?.rules && schema.rules.length > 0);
        const resolvedSignature = executionSignature ?? ScannedRouteExecutionSignature.create(resolvedHookKind, resolvedParameters.length > 0, !!resolvedHasPayload);
        const resolvedResponse = response ?? new ResourceResponseDescriptor({ resourceName: `${fallbackResource.charAt(0).toUpperCase() + fallbackResource.slice(1)}Resource`, shape: "single" });

        const upperMethod = method.toUpperCase() as HttpMethod;
        let detectedContentType: RequestContentType = RequestContentType.Json;
        if (upperMethod === "GET" || upperMethod === "HEAD") {
            detectedContentType = RequestContentType.None;
        } else if (Array.isArray(schema?.rules) && schema.rules.some(r => {
            const ruleList = (r as any).rules || r.ast || [];
            return Array.isArray(ruleList) && ruleList.some((rule: any) => {
                const kind = typeof rule === "string" ? rule : rule?.kind;
                return kind === ValidationRuleKind.File || kind === ValidationRuleKind.Image || kind === "file" || kind === "image";
            });
        })) {
            detectedContentType = RequestContentType.Multipart;
        }
        const resolvedContentType = requestContentType ?? detectedContentType;

        let resolvedCrudRole = crudRole;
        if (!resolvedCrudRole) {
            const segments = path.replace(/^\//, "").split("/").filter(Boolean);
            const staticSegments = segments.filter(s => !s.startsWith("{") && !s.startsWith(":") && s !== "api" && s !== "v1");
            const hasTrailingParam = path.endsWith("}") || path.endsWith(":id") || /\{[^}]+\}$/.test(path);
            const paramCount = segments.filter(s => s.startsWith("{") || s.startsWith(":")).length;
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
            name: name ?? `${fallbackResource}.${resolvedActionName}`,
            method,
            path,
            resourceName: fallbackResource,
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
            controllerName,
            schema
        });
    }

    constructor(rawParams: ScannedRouteParams | any) {
        const params: ScannedRouteParams = (!rawParams || !rawParams.parameters || !rawParams.response || !rawParams.invalidation || !rawParams.executionSignature)
            ? (ScannedRouteDescriptor.create(rawParams ?? {}) as any)
            : rawParams;
        const resName = params.resourceName || "App";
        this.resourceName = resName;
        this.name = params.name ?? `${resName}.${params.actionName}`;
        this.method = params.method.toUpperCase() as HttpMethod;
        this.path = params.path;
        this.actionName = params.actionName;
        this.groupName = params.groupName;
        this.crudRole = params.crudRole;
        this.runtimePath = params.runtimePath;
        this.responseTypeName = `${toPascalCase(resName)}Response`;
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
            if (trimmed.startsWith("can:")) {
                const parts = trimmed.slice(4).split(",");
                const ability = parts[0]?.trim() || "";
                const modelParameter = parts[1]?.trim() ?? null;
                policies.push(
                    modelParameter
                        ? ScannedRoutePolicyDescriptor.abilityModel(ability, modelParameter)
                        : ScannedRoutePolicyDescriptor.gate(ability)
                );
            } else if (trimmed.toLowerCase().startsWith("throttle:")) {
                const parts = trimmed.slice(9).split(",");
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
        this.controllerName = params.controllerName ?? null;
        this.contract = ScannedEndpointContract.fromRoute(this);
        Object.freeze(this);
    }

    public withInvalidation(invalidation: RouteCacheInvalidationDescriptor): ScannedRouteDescriptor {
        const parts = this.name.split(".");
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
