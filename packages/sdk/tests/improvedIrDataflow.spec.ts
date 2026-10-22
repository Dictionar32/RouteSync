import { describe, it, expect } from 'vitest';
import { hasExplicitValidationType } from '../../core/src/compiler/scanner/subscanners/validationRuleChecker';
import { ValidationRuleFieldLowerer } from '../../core/src/compiler/scanner/subscanners/ValidationRuleFieldLowerer';
import { detectActionError } from '../../core/src/compiler/scanner/subscanners/controller/controllerErrorDetector';
import { RouteSecurityResolver } from '../../core/src/compiler/scanner/resolvers/RouteSecurityResolver';
import { createMiddlewareName } from '../../core/src/types/upstream/names';
import type { RouteMiddleware } from '../../core/src/types/upstream/route';
import type { RouteMiddlewares, Sequence } from '../../core/src/types/upstream/collections';
import { buildRouteCapabilityContract } from '../../core/src/compiler/scanner/resolvers/boundary/capabilityBuilder';
import { IntermediateRouteBoundaryBasics } from '../../core/src/compiler/scanner/resolvers/boundary/boundaryBasics';
import { LaravelSourceLexer } from '../../core/src/compiler/scanner/LaravelSourceLexer';
import {
    HttpMethod,
    RouteHookKind,
    SecuritySchemeKind,
    RoutePolicyKind,
    HttpStatusCode,
    RouteActionKind
} from '../../core/src/types/route';

const routeMiddlewareFlow = (names: readonly string[]): RouteMiddlewares => ({
    kind: 'route_middlewares',
    items: names.reduceRight<Sequence<RouteMiddleware>>(
        (tail, name) => ({ kind: 'cons', head: { kind: 'direct', name: createMiddlewareName(name) }, tail }),
        { kind: 'empty' },
    ),
});

const sequenceValues = <T>(sequence: Sequence<T>, output: readonly T[] = []): readonly T[] =>
    sequence.kind === 'empty' ? output : sequenceValues(sequence.tail, [...output, sequence.head]);

describe('Improved IR Dataflow & Semantic Rule Resolution Suite', () => {
    describe('1. Semantic Validation Rule Recognizer', () => {
        it('should recognize email, url, uuid, in:, exists: as explicit types without warnings', () => {
            expect(hasExplicitValidationType('required|email')).toBe(true);
            expect(hasExplicitValidationType('nullable|url|max:2048')).toBe(true);
            expect(hasExplicitValidationType('required|uuid')).toBe(true);
            expect(hasExplicitValidationType('required|in:google,github')).toBe(true);
            expect(hasExplicitValidationType('required|exists:categories,id')).toBe(false);
            expect(hasExplicitValidationType('required|integer|exists:categories,id')).toBe(true);
            expect(hasExplicitValidationType('required|digits:6')).toBe(true);
            expect(hasExplicitValidationType('accepted')).toBe(true);
            expect(hasExplicitValidationType('required|date')).toBe(true);
        });

        it('should lower url rule into string field with nullable flag', () => {
            const route: any = {
                path: '/api/oauth/redirect',
                action: 'AuthController@oauthRedirect',
                schema: {
                    rules: [
                        { fieldName: 'redirect_to', rules: ['nullable', 'url', 'max:2048'] }
                    ]
                }
            };
            const fields = ValidationRuleFieldLowerer.lower(route);
            expect(fields).toHaveLength(1);
            expect(fields[0].originalName).toBe('redirect_to');
            expect(fields[0].nullable).toBe(true);
            expect(fields[0].type.kind).toBe('primitive');
        });
    });

    describe('2. Strongly-Typed Execution Signature', () => {
        it('should resolve parameterDeclaration with FormRequest type name instead of any', () => {
            const params: any = {
                method: 'POST' as HttpMethod,
                path: '/api/checkout',
                formRequests: [{ name: 'StoreOrderRequest' }],
                schema: { rules: [] }
            };
            const basics: IntermediateRouteBoundaryBasics = {
                resolvedDomain: 'Order',
                resolvedActionKind: RouteActionKind.Create,
                resolvedIsMutating: true
            };

            const capability = buildRouteCapabilityContract(params, basics, 0);
            expect(capability.executionSignature.payloadMode).toBe('required');
            expect(capability.executionSignature.parameterDeclaration).toBe('payload: StoreOrderRequest');
            expect(capability.executionSignature.hasPayload).toBe(true);
        });

        it('should resolve parameterDeclaration with derived domain payload when schema rules exist without FormRequest', () => {
            const params: any = {
                method: 'POST' as HttpMethod,
                path: '/api/cart/promo',
                schema: {
                    rules: [{ fieldName: 'code', rules: ['required', 'string'] }]
                }
            };
            const basics: IntermediateRouteBoundaryBasics = {
                resolvedDomain: 'Cart',
                resolvedActionKind: RouteActionKind.Create,
                resolvedIsMutating: true
            };

            const capability = buildRouteCapabilityContract(params, basics, 0);
            expect(capability.executionSignature.payloadMode).toBe('required');
            expect(capability.executionSignature.parameterDeclaration).toBe('payload: CartCreatePayload');
        });
    });

    describe('3. Controller abort() and HTTP Error Status Code Extraction', () => {
        it('should detect abort(401, "Invalid credentials") from AST tokens', () => {
            const source = `if (! $user) { abort(401, 'Invalid credentials'); }`;
            const tokens = LaravelSourceLexer.tokenize(source);
            const abortIdx = tokens.findIndex(t => t.value === 'abort');

            const error = detectActionError(tokens, abortIdx);
            expect(error).toBeDefined();
            expect(error?.statusCode).toBe(HttpStatusCode.Unauthorized);
        });

        it('should detect abort(403) from AST tokens', () => {
            const source = `abort(403);`;
            const tokens = LaravelSourceLexer.tokenize(source);
            const error = detectActionError(tokens, 0);
            expect(error).toBeDefined();
            expect(error?.statusCode).toBe(HttpStatusCode.Forbidden);
        });

        it('should detect response()->json(..., 422) in catch blocks', () => {
            const source = `return response()->json(['message' => 'Error'], 422);`;
            const tokens = LaravelSourceLexer.tokenize(source);
            const jsonIdx = tokens.findIndex(t => t.value === 'json');

            const error = detectActionError(tokens, jsonIdx);
            expect(error).toBeDefined();
            expect(error?.statusCode).toBe(HttpStatusCode.UnprocessableEntity);
        });
    });

    describe('4. Custom Role Middleware Resolution', () => {
        it('should resolve admin middleware into security abilities and gate policy', () => {
            const authMiddleware = createMiddlewareName('auth:sanctum');
            const resolution = RouteSecurityResolver.resolve({
                kind: 'route_security_authority_input',
                middleware: routeMiddlewareFlow(['auth:sanctum', 'admin']),
                authorization: { kind: 'laravel_route_authorization_middleware_present', middleware: Object.freeze([authMiddleware]) },
            });
            const abilities = sequenceValues(resolution.security.abilities);
            const policies = sequenceValues(resolution.policies);
            expect(resolution.auth.value).toBe(true);
            expect(resolution.security.scheme).toBe(SecuritySchemeKind.Sanctum);
            expect(abilities.map(ability => ability.value.value)).toContain('role:admin');
            expect(policies).toHaveLength(1);
            expect(policies[0].ability.value.value).toBe('role:admin');
            expect(policies[0].kind).toBe(RoutePolicyKind.Gate);
        });

        it('should resolve role:manager middleware into security abilities and gate policy', () => {
            const authMiddleware = createMiddlewareName('auth:sanctum');
            const resolution = RouteSecurityResolver.resolve({
                kind: 'route_security_authority_input',
                middleware: routeMiddlewareFlow(['auth:sanctum', 'role:manager,editor']),
                authorization: { kind: 'laravel_route_authorization_middleware_present', middleware: Object.freeze([authMiddleware]) },
            });
            const abilities = sequenceValues(resolution.security.abilities);
            const policies = sequenceValues(resolution.policies);
            expect(abilities.map(ability => ability.value.value)).toContain('role:manager');
            expect(abilities.map(ability => ability.value.value)).toContain('role:editor');
            expect(policies).toHaveLength(2);
            expect(policies[0].ability.value.value).toBe('role:manager');
            expect(policies[1].ability.value.value).toBe('role:editor');
        });
    });
});
