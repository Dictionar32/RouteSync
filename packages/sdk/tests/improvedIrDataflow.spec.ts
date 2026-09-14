import { describe, it, expect } from 'vitest';
import { hasExplicitValidationType } from '../../core/src/compiler/scanner/subscanners/validationRuleChecker';
import { ValidationRuleFieldLowerer } from '../../core/src/compiler/scanner/subscanners/ValidationRuleFieldLowerer';
import { detectActionError } from '../../core/src/compiler/scanner/subscanners/controller/controllerErrorDetector';
import { RouteSecurityResolver } from '../../core/src/compiler/scanner/resolvers/RouteSecurityResolver';
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
            const resolution = RouteSecurityResolver.resolve(['auth:sanctum', 'admin']);
            expect(resolution.auth).toBe(true);
            expect(resolution.security.scheme).toBe(SecuritySchemeKind.Sanctum);
            expect(resolution.security.abilities).toContain('role:admin');
            expect(resolution.policies).toHaveLength(1);
            expect(resolution.policies[0].ability).toBe('role:admin');
            expect(resolution.policies[0].kind).toBe(RoutePolicyKind.Gate);
        });

        it('should resolve role:manager middleware into security abilities and gate policy', () => {
            const resolution = RouteSecurityResolver.resolve(['auth:sanctum', 'role:manager,editor']);
            expect(resolution.security.abilities).toContain('role:manager');
            expect(resolution.security.abilities).toContain('role:editor');
            expect(resolution.policies).toHaveLength(2);
            expect(resolution.policies[0].ability).toBe('role:manager');
            expect(resolution.policies[1].ability).toBe('role:editor');
        });
    });
});
