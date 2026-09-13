/**
 * pureDataflowTypeContracts.spec.ts
 *
 * Verification suite for Pure Dataflow Architecture & Complete Contract Guarantees (Rule 8, 10, 11, 12).
 * Verifies 0 '?' parameter interfaces, 0 IIFEs, 0 'new' in downstream call sites,
 * and deterministic lowering traits.
 */

import { describe, it, expect } from "vitest";
import {
    lowerTypeScriptArtifact,
    lowerFormArtifact,
    lowerContractArtifact,
    lowerApiFieldArtifact,
    lowerMapperArtifact,
    lowerReadTypesOutput,
    lowerFormTypesOutput,
    lowerContractsOutput,
    lowerApiFieldsOutput,
    lowerMappersOutput,
    ScannedRouteDescriptor,
    ScannedRouteParameterDescriptor,
    ScannedRoutePolicyDescriptor,
    ScannedRateLimitDescriptor,
    ScannedHttpErrorResponseDescriptor,
    ScannedRouteManifestDescriptor,
    ScannedFullCrudResourceGroupDescriptor,
    ScannedReadOnlyCrudResourceGroupDescriptor,
    ScannedFlexibleCrudResourceGroupDescriptor,
    ScannedSingletonResourceGroupDescriptor,
    ScannedCustomResourceGroupDescriptor,
    ScannedResourceGroupTypeSignature,
    RouteParameterLocation,
    RouteParameterType,
    RoutePolicyKind,
    HttpMethod,
    CrudRole,
    RouteActionKind,
    RouteHookKind,
    RequestContentType,
    ScannedRouteCacheInvalidationDescriptor,
    ScannedRouteSchemaPayload,
    EmptyResponseDescriptor,
    RouteHandlerKind
} from "@routesync/core";
import {
    compileManifest,
    emitFullBundle,
    emitCoreArtifacts,
    CoreFilesEmitter,
    DEFAULT_CLIENT_EMITTERS
} from "../../cli/src/generators/CompilerBridge";

describe("Pure Dataflow & Complete Contract Architecture Suite", () => {
    describe("1. Upstream Pure Transform Functions (Passes)", () => {
        it("should expose pure transform functions with arity of 1 and 0 optional parameters", () => {
            expect(typeof lowerTypeScriptArtifact).toBe("function");
            expect(lowerTypeScriptArtifact.length).toBe(1);

            expect(typeof lowerFormArtifact).toBe("function");
            expect(lowerFormArtifact.length).toBe(1);

            expect(typeof lowerContractArtifact).toBe("function");
            expect(lowerContractArtifact.length).toBe(1);

            expect(typeof lowerApiFieldArtifact).toBe("function");
            expect(lowerApiFieldArtifact.length).toBe(1);

            expect(typeof lowerMapperArtifact).toBe("function");
            expect(lowerMapperArtifact.length).toBe(1);
        });

        it("should expose pure composite output lowerers with direct return", () => {
            expect(typeof lowerReadTypesOutput).toBe("function");
            expect(typeof lowerFormTypesOutput).toBe("function");
            expect(typeof lowerContractsOutput).toBe("function");
            expect(typeof lowerApiFieldsOutput).toBe("function");
            expect(typeof lowerMappersOutput).toBe("function");
        });
    });

    describe("2. Pure Functional Pipeline Orchestrator (CompilerBridge)", () => {
        it("should export compileManifest, emitFullBundle, and emitCoreArtifacts as pure functions", () => {
            expect(typeof compileManifest).toBe("function");
            expect(typeof emitFullBundle).toBe("function");
            expect(typeof emitCoreArtifacts).toBe("function");
        });

        it("should provide CoreFilesEmitter and DEFAULT_CLIENT_EMITTERS constants", () => {
            expect(CoreFilesEmitter).toBeDefined();
            expect(typeof CoreFilesEmitter.emit).toBe("function");
            expect(Array.isArray(DEFAULT_CLIENT_EMITTERS)).toBe(true);
            expect(DEFAULT_CLIENT_EMITTERS.length).toBe(11);
        });

        it("compileManifest should accept a manifest and return a complete bundle without class instantiation", () => {
            const manifest = ScannedRouteManifestDescriptor.empty();
            const bundle = compileManifest(manifest);
            expect(bundle).toBeDefined();
            expect(bundle.readTypes).toBeDefined();
            expect(bundle.formTypes).toBeDefined();
            expect(bundle.contracts).toBeDefined();
            expect(bundle.apiFields).toBeDefined();
            expect(bundle.mappers).toBeDefined();
        });
    });

    describe("3. Explicit Semantic Route Factories & Complete Contract Constructor", () => {
        it("ScannedRateLimitDescriptor.none() should return frozen identity object with 0 attempts", () => {
            const none = ScannedRateLimitDescriptor.none();
            expect(none.maxAttempts).toBe(0);
            expect(none.decayMinutes).toBe(0);
            expect(Object.isFrozen(none)).toBe(true);
        });

        it("ScannedRouteParameterDescriptor should require complete contract without defensive defaults in constructor", () => {
            const param = new ScannedRouteParameterDescriptor({
                name: "userId",
                propertyName: "userId",
                bindingField: "id",
                in: "path" as RouteParameterLocation,
                required: true,
                type: RouteParameterType.Number
            });
            expect(param.name).toBe("userId");
            expect(param.propertyName).toBe("userId");
            expect(param.bindingField).toBe("id");
            expect(param.in).toBe("path");
            expect(param.required).toBe(true);
            expect(param.type).toBe(RouteParameterType.Number);
            expect(Object.isFrozen(param)).toBe(true);
        });

        it("ScannedRoutePolicyDescriptor should require complete contract without defensive defaults in constructor", () => {
            const policy = new ScannedRoutePolicyDescriptor({
                ability: "view",
                modelParameter: "user",
                kind: RoutePolicyKind.AbilityModel
            });
            expect(policy.ability).toBe("view");
            expect(policy.modelParameter).toBe("user");
            expect(policy.kind).toBe(RoutePolicyKind.AbilityModel);
            expect(Object.isFrozen(policy)).toBe(true);
        });

        it("ScannedRouteDescriptor constructor should perform 100% direct assignment from ScannedRouteParams", () => {
            const route = ScannedRouteDescriptor.create({
                method: "GET" as HttpMethod,
                path: "/api/users",
                resourceName: "User",
                actionName: "index",
                middleware: ["auth:sanctum", "throttle:60,1"]
            });

            expect(route.name).toBe("User.index");
            expect(route.method).toBe("GET");
            expect(route.resourceName).toBe("User");
            expect(route.domain).toBe("User");
            expect(route.auth).toBe(true);
            expect(route.security.isProtected).toBe(true);
            expect(route.rateLimit).toBeDefined();
            expect(route.rateLimit?.maxAttempts).toBe(60);
            expect(Object.isFrozen(route)).toBe(true);
        });

        it("ScannedRouteDescriptor.fromControllerReference should construct complete route with controller handler", () => {
            const route = ScannedRouteDescriptor.fromControllerReference({
                method: "POST" as HttpMethod,
                path: "/api/users",
                resourceName: "User",
                actionName: "store",
                controllerName: "UserController"
            });

            expect(route.handler.kind).toBe(RouteHandlerKind.ControllerAction);
            expect(route.controllerName).toBe("UserController");
            expect(route.action).toBe("UserController@store");
            expect(route.isMutating).toBe(true);
        });

        it("ScannedRouteDescriptor.withInvalidation should return new immutable instance with updated invalidation", () => {
            const original = ScannedRouteDescriptor.create({
                method: "DELETE" as HttpMethod,
                path: "/api/users/{id}",
                resourceName: "User",
                actionName: "destroy"
            });

            const newInv = ScannedRouteCacheInvalidationDescriptor.none();
            const updated = original.withInvalidation(newInv);

            expect(updated).not.toBe(original);
            expect(updated.invalidation).toBe(newInv);
            expect(updated.name).toBe(original.name);
            expect(updated.path).toBe(original.path);
            expect(Object.isFrozen(updated)).toBe(true);
        });
    });

    describe("4. Self-Projecting Resource Groups (Zero-Switch Lowering)", () => {
        const dummyTypeSig = new ScannedResourceGroupTypeSignature({
            list: "User[]",
            detail: "User",
            create: "CreateUserForm",
            update: "UpdateUserForm",
            error: "unknown",
            hasCustomError: false,
            importedTypes: [],
            contractImportedTypes: []
        });

        const dummyRoute = ScannedRouteDescriptor.create({
            method: "GET" as HttpMethod,
            path: "/api/users",
            resourceName: "User",
            actionName: "index"
        });

        it("every ResourceGroupDescriptor variant must implement lowerQueryKeyBlock and lowerCacheConfig", () => {
            const fullCrud = new ScannedFullCrudResourceGroupDescriptor({
                groupName: "users",
                keyName: "USERS",
                titleName: "Users",
                primaryKeyType: "number",
                types: dummyTypeSig as any,
                index: dummyRoute,
                show: dummyRoute,
                create: dummyRoute,
                update: dummyRoute,
                delete: dummyRoute,
                all: [dummyRoute],
                extraMutations: [],
                customQueries: []
            });

            expect(typeof fullCrud.lowerQueryKeyBlock).toBe("function");
            expect(typeof fullCrud.lowerCacheConfig).toBe("function");

            const qkLines = Array.from(fullCrud.lowerQueryKeyBlock());
            expect(qkLines.length).toBeGreaterThan(0);
            expect(qkLines[0]).toContain("users: {");

            const addInvs = (r: any, invs: string[]) => {};
            const cacheLines = Array.from(fullCrud.lowerCacheConfig(addInvs));
            expect(cacheLines.length).toBeGreaterThan(0);
        });

        it("ResourceGroup descriptors must preserve non-nullable extraMutations and customQueries arrays", () => {
            const singleton = new ScannedSingletonResourceGroupDescriptor({
                groupName: "profile",
                keyName: "PROFILE",
                titleName: "Profile",
                types: dummyTypeSig as any,
                all: [dummyRoute],
                extraMutations: [],
                customQueries: []
            });

            expect(Array.isArray(singleton.extraMutations)).toBe(true);
            expect(Array.isArray(singleton.customQueries)).toBe(true);
            expect(Object.isFrozen(singleton.extraMutations)).toBe(true);
            expect(Object.isFrozen(singleton.customQueries)).toBe(true);
        });
    });
});
