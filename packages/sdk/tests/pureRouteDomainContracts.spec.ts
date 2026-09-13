/**
 * pureRouteDomainContracts.spec.ts
 *
 * Exhaustive Type Contract & Upstream Invariant Suite for Holistic Route Domain Contracts:
 * - RouteIdentityContract
 * - RouteBindingContract
 * - RouteCapabilityContract
 * - RouteProvenanceContract
 * - RouteParameterSpecification
 * - Upstream Complete Constructor Data Aggregation & Pure Dataflow Stream Projection
 *
 * Rules: 8, 10, 11, 12, 13 RouteSync
 */

import { describe, it, expect } from "vitest";
import {
  ScannedRouteDescriptor,
  ScannedRouteParameterDescriptor,
  RouteParameterType,
  CrudRole,
  RouteHookKind,
  RouteActionKind,
  RequestContentType,
  RouteHandlerKind,
  ScannedRouteCacheInvalidationDescriptor,
  ResourceResponseDescriptor,
  ScannedHttpErrorResponseDescriptor,
  ScannedEndpointContract,
  RouteDomainResolver,
  RouteCrudClassifier,
  RouteSecurityResolver,
  RouteBoundaryAdapter,
  type RouteIdentityContract,
  type RouteBindingContract,
  type RouteCapabilityContract,
  type RouteProvenanceContract,
  type RouteParameterSpecification,
  type ParsedRoute
} from "@routesync/core";

describe("Holistic Route Domain Contracts (Point A & B SSOT Suite)", () => {
  it("1. ScannedRouteDescriptor.create() aggregates 4 frozen non-nullable sub-contracts at Origin Boundary", () => {
    const route = ScannedRouteDescriptor.create({
      name: "orders.show",
      method: "GET",
      path: "/api/orders/{id}",
      domain: "Order",
      resourceName: "orders",
      actionName: "show",
      sourceFile: "routes/api.php",
      sourceLine: 42,
      auth: true,
      middleware: ["auth:sanctum", "can:view,order", "throttle:60,1"]
    });

    // 1. Holistic Sub-Contracts Exist and are Frozen
    expect(route.identity).toBeDefined();
    expect(route.binding).toBeDefined();
    expect(route.capability).toBeDefined();
    expect(route.provenance).toBeDefined();

    expect(Object.isFrozen(route.identity)).toBe(true);
    expect(Object.isFrozen(route.binding)).toBe(true);
    expect(Object.isFrozen(route.capability)).toBe(true);
    expect(Object.isFrozen(route.provenance)).toBe(true);
    expect(Object.isFrozen(route)).toBe(true);

    // 2. Identity Contract Verification
    expect(route.identity.name).toBe("orders.show");
    expect(route.identity.method).toBe("GET");
    expect(route.identity.path).toBe("/api/orders/{id}");
    expect(route.identity.runtimePath).toBe("/api/orders/:id");
    expect(route.identity.domain).toBe("Order");
    expect(route.identity.resourceName).toBe("orders");
    expect(route.identity.groupName).toBe("orders");
    expect(route.identity.parameters.all.length).toBe(1);
    expect(route.identity.parameters.path.length).toBe(1);
    expect(route.identity.parameters.query.length).toBe(0);

    // 3. Binding Contract Verification
    expect(route.binding.actionName).toBe("show");
    expect(route.binding.handler.kind).toBe(RouteHandlerKind.Closure);
    expect(route.binding.response).toBeDefined();
    expect(route.binding.responseTypeName).toBe("OrdersResponse");
    expect(Array.isArray(route.binding.formRequests)).toBe(true);
    expect(Array.isArray(route.binding.assignments)).toBe(true);

    // 4. Capability Contract Verification
    expect(route.capability.auth).toBe(true);
    expect(route.capability.security.isProtected).toBe(true);
    expect(route.capability.crudRole).toBe(CrudRole.Show);
    expect(route.capability.hookKind).toBe(RouteHookKind.Query);
    expect(route.capability.actionKind).toBe("read");
    expect(route.capability.isMutating).toBe(false);
    expect(route.capability.requestContentType).toBe(RequestContentType.None);
    expect(route.capability.policies.length).toBe(1);
    expect(route.capability.rateLimit).toBeDefined();
    expect(route.capability.rateLimit?.maxAttempts).toBe(60);

    // 5. Provenance Contract Verification
    expect(route.provenance.sourceFile).toBe("routes/api.php");
    expect(route.provenance.sourceLine).toBe(42);
    expect(route.provenance.uri).toBe("/api/orders/{id}");

    // 6. Flat Facades 100% Synchronized for Backward Compatibility
    expect(route.name).toBe(route.identity.name);
    expect(route.path).toBe(route.identity.path);
    expect(route.method).toBe(route.identity.method);
    expect(route.domain).toBe(route.identity.domain);
    expect(route.resourceName).toBe(route.identity.resourceName);
    expect(route.actionName).toBe(route.binding.actionName);
    expect(route.crudRole).toBe(route.capability.crudRole);
    expect(route.hookKind).toBe(route.capability.hookKind);
    expect(route.auth).toBe(route.capability.auth);
    expect(route.sourceFile).toBe(route.provenance.sourceFile);
  });

  it("2. Complete Constructor accepts closed sub-contracts directly (0 '?', 0 discovery)", () => {
    const identity: RouteIdentityContract = Object.freeze({
      name: "products.index",
      method: "GET",
      path: "/api/products",
      runtimePath: "/api/products",
      resourceName: "products",
      domain: "Product",
      groupName: "products",
      parameters: Object.freeze({
        all: [],
        path: [],
        query: []
      })
    });

    const binding: RouteBindingContract = Object.freeze({
      handler: Object.freeze({
        kind: RouteHandlerKind.ControllerAction,
        controllerName: "ProductController",
        actionName: "index",
        target: "ProductController@index"
      }),
      action: "ProductController@index",
      actionName: "index",
      controllerName: "ProductController",
      schema: { rules: [], messages: [], attributes: [] },
      response: new ResourceResponseDescriptor({ resourceName: "ProductResource", shape: "collection" }),
      responseTypeName: "ProductResource",
      formRequests: [],
      assignments: []
    });

    const capability: RouteCapabilityContract = Object.freeze({
      auth: false,
      security: Object.freeze({ isProtected: false, scheme: "public" as any, scopes: [] }),
      middleware: [],
      policies: [],
      rateLimit: null,
      invalidation: ScannedRouteCacheInvalidationDescriptor.none(),
      crudRole: CrudRole.Index,
      hookKind: RouteHookKind.Query,
      actionKind: "read" as RouteActionKind,
      isMutating: false,
      requestContentType: RequestContentType.None,
      executionSignature: Object.freeze({
        hookKind: RouteHookKind.Query,
        hasPathParameters: false,
        hasPayload: false,
        payloadMode: "none" as any,
        signatureString: "()"
      }),
      errorResponses: []
    });

    const provenance: RouteProvenanceContract = Object.freeze({
      sourceFile: "app/Http/Controllers/ProductController.php",
      sourceLine: 15,
      uri: "/api/products"
    });

    const contract = ScannedEndpointContract.fromSubcontracts({
      identity,
      binding,
      capability,
      provenance
    });

    const route = ScannedRouteDescriptor.fromScanned({
      identity,
      binding,
      capability,
      provenance,
      contract
    });

    const routeFromParts = ScannedRouteDescriptor.fromSubcontracts({
      identity,
      binding,
      capability,
      provenance
    });

    expect(route.identity).toBe(identity);
    expect(route.binding).toBe(binding);
    expect(route.capability).toBe(capability);
    expect(route.provenance).toBe(provenance);
    expect(route.contract).toBe(contract);

    expect(routeFromParts.identity).toBe(identity);
    expect(routeFromParts.binding).toBe(binding);
    expect(routeFromParts.capability).toBe(capability);
    expect(routeFromParts.provenance).toBe(provenance);
    expect(routeFromParts.contract).toBeDefined();

    expect(route.name).toBe("products.index");
    expect(route.controllerName).toBe("ProductController");
    expect(route.actionName).toBe("index");
    expect(route.crudRole).toBe(CrudRole.Index);
    expect(route.isMutating).toBe(false);
  });

  it("3. withInvalidation() preserves identity, binding, and provenance while updating capability immutably", () => {
    const route = ScannedRouteDescriptor.create({
      method: "POST",
      path: "/api/orders",
      domain: "Order",
      resourceName: "orders",
      actionName: "store"
    });

    const customInvalidation = ScannedRouteCacheInvalidationDescriptor.none();
    const updatedRoute = route.withInvalidation(customInvalidation);

    // References to other subcontracts are strictly preserved
    expect(updatedRoute.identity).toBe(route.identity);
    expect(updatedRoute.binding).toBe(route.binding);
    expect(updatedRoute.provenance).toBe(route.provenance);

    // Capability is new frozen object with updated invalidation
    expect(updatedRoute.capability).not.toBe(route.capability);
    expect(updatedRoute.capability.invalidation).toBe(customInvalidation);
    expect(Object.isFrozen(updatedRoute.capability)).toBe(true);
    expect(Object.isFrozen(updatedRoute)).toBe(true);
  });

  it("4. Pure Dataflow Generator *projectToHookSource() streams lines without intermediate buffers", () => {
    const route = ScannedRouteDescriptor.create({
      method: "GET",
      path: "/api/users",
      domain: "User",
      resourceName: "users",
      actionName: "index"
    });

    const lines: string[] = [];
    for (const line of route.projectToHookSource()) {
      lines.push(line);
    }

    expect(lines.length).toBe(2);
    expect(lines[0]).toContain("Hook for users.index (GET /api/users)");
    expect(lines[1]).toContain("Group: users, Role: index, Kind: query");
  });

  it("5. RouteDomainResolver deterministically resolves canonical domain at Origin Boundary", () => {
    // Explicit override
    expect(RouteDomainResolver.resolve({ domain: "Billing", path: "/invoices" })).toBe("Billing");
    // From controller name
    expect(RouteDomainResolver.resolve({ controllerName: "PaymentController", path: "/payments" })).toBe("Payment");
    // From resource name
    expect(RouteDomainResolver.resolve({ resourceName: "CustomerResource", path: "/customers" })).toBe("Customer");
    // Register special case
    expect(RouteDomainResolver.resolve({ path: "/register" })).toBe("Register");
    expect(RouteDomainResolver.resolve({ path: "/auth/register", actionName: "register" })).toBe("Register");
    // From path segment
    expect(RouteDomainResolver.resolve({ path: "/api/v1/order-items" })).toBe("orderItems");
    // Fallback default
    expect(RouteDomainResolver.resolve({})).toBe("App");
  });

  it("6. RouteCrudClassifier maps (HttpMethod, PathShape) to CrudRole without branching", () => {
    expect(RouteCrudClassifier.classify("GET", "/api/products")).toBe(CrudRole.Index);
    expect(RouteCrudClassifier.classify("GET", "/api/products/{id}")).toBe(CrudRole.Show);
    expect(RouteCrudClassifier.classify("POST", "/api/products")).toBe(CrudRole.Create);
    expect(RouteCrudClassifier.classify("PUT", "/api/products/{id}")).toBe(CrudRole.Update);
    expect(RouteCrudClassifier.classify("PATCH", "/api/products/{id}")).toBe(CrudRole.Update);
    expect(RouteCrudClassifier.classify("DELETE", "/api/products/{id}")).toBe(CrudRole.Delete);
    // Non-standard paths map to Custom
    expect(RouteCrudClassifier.classify("POST", "/api/products/{id}/publish")).toBe(CrudRole.Custom);
  });

  it("7. RouteSecurityResolver extracts security, auth, policies, and rate limits at Origin Boundary", () => {
    const res = RouteSecurityResolver.resolve(
      ["auth:sanctum", "can:update,post", "throttle:120,2"],
      false
    );

    expect(res.auth).toBe(true);
    expect(res.security.isProtected).toBe(true);
    expect(res.policies.length).toBe(1);
    expect(res.policies[0].ability).toBe("update");
    expect(res.policies[0].modelParameter).toBe("post");
    expect(res.rateLimit).toBeDefined();
    expect(res.rateLimit?.maxAttempts).toBe(120);
    expect(res.rateLimit?.decayMinutes).toBe(2);
    expect(Object.isFrozen(res)).toBe(true);
  });

  it("8. RouteBoundaryAdapter synthesizes 4 Complete Sub-Contracts and is consumed by ScannedRouteDescriptor", () => {
    const contracts = RouteBoundaryAdapter.toSubcontracts({
      method: "POST",
      path: "/api/articles",
      controllerName: "ArticleController",
      actionName: "store",
      auth: true
    });

    expect(contracts.identity).toBeDefined();
    expect(contracts.binding).toBeDefined();
    expect(contracts.capability).toBeDefined();
    expect(contracts.provenance).toBeDefined();
    expect(contracts.contract).toBeDefined();

    expect(contracts.identity.domain).toBe("Article");
    expect(contracts.capability.crudRole).toBe(CrudRole.Create);
    expect(contracts.capability.auth).toBe(true);

    const route = ScannedRouteDescriptor.create(contracts);
    expect(route.identity).toBe(contracts.identity);
    expect(route.binding).toBe(contracts.binding);
    expect(route.capability).toBe(contracts.capability);
    expect(route.provenance).toBe(contracts.provenance);
    expect(route.contract).toBe(contracts.contract);
  });
});
