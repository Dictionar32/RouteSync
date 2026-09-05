import { describe, it, expect } from "vitest"
import {
  RouteManifest,
  ResourceGroupKind,
  RESOURCE_GROUP_REGISTRY,
  matchResourceGroup,
  ScannedRouteDescriptor,
  RouteParameterType,
  ScannedFullCrudResourceGroupDescriptor,
  ScannedReadOnlyCrudResourceGroupDescriptor,
  ScannedFlexibleCrudResourceGroupDescriptor,
  ScannedSingletonResourceGroupDescriptor,
  ScannedCustomResourceGroupDescriptor
} from "@routesync/core"
import {
  classifyDomainGraph,
  ClassifiedDomainGraph,
  ClassifiedRoute
} from "../../cli/src/generators/route-classifier"
import { QueryKeyGenerator } from "../../cli/src/generators/QueryKeyGenerator"
import { HookGenerator } from "../../cli/src/generators/HookGenerator"
import fs from "fs-extra"
import path from "path"
import os from "os"

describe("ADT Registry 33: ResourceGroupDescriptor & ClassifiedDomainGraph", () => {
  it("correctly classifies Full CRUD resource group when all 5 standard operations exist", () => {
    const routes = [
      ScannedRouteDescriptor.create({ method: "GET", path: "/api/v1/products", groupName: "products", crudRole: "index" }),
      ScannedRouteDescriptor.create({
        method: "GET",
        path: "/api/v1/products/{id}",
        groupName: "products",
        crudRole: "show",
        pathParameters: [{ name: "id", type: RouteParameterType.Integer, required: true }]
      }),
      ScannedRouteDescriptor.create({ method: "POST", path: "/api/v1/products", groupName: "products", crudRole: "create" }),
      ScannedRouteDescriptor.create({ method: "PUT", path: "/api/v1/products/{id}", groupName: "products", crudRole: "update" }),
      ScannedRouteDescriptor.create({ method: "DELETE", path: "/api/v1/products/{id}", groupName: "products", crudRole: "delete" })
    ]

    const manifest: RouteManifest = {
      routes,
      baseURL: "http://localhost/api",
      generatedAt: "2026-09-05T07:30:00.000Z"
    }

    const graph = classifyDomainGraph(manifest)
    expect(graph.resourceGroups).toHaveLength(1)

    const group = graph.resourceGroups[0]
    expect(group instanceof ScannedFullCrudResourceGroupDescriptor).toBe(true)
    expect(Object.isFrozen(group)).toBe(true)
    expect(group.kind).toBe(ResourceGroupKind.FullCrud)
    expect(group.isCrud).toBe(true)
    expect(group.listKeyFn).toBe("lists")
    expect(group.detailKeyFn).toBe("detail")
    expect(group.primaryKeyType).toBe("number")

    // FullCrud guarantees all 5 routes exist non-nullable (0 ?)
    const fg = group as ScannedFullCrudResourceGroupDescriptor
    expect(fg.index).toBeDefined()
    expect(fg.show).toBeDefined()
    expect(fg.create).toBeDefined()
    expect(fg.update).toBeDefined()
    expect(fg.delete).toBeDefined()

    // Origin Boundary guarantees complete frozen ResourceGroupTypeSignature
    expect(fg.types).toBeDefined()
    expect(Object.isFrozen(fg.types)).toBe(true)
    expect(fg.types.list).toBe("ProductsResourceTransformed")
    expect(fg.types.detail).toBe("ProductsResourceTransformed")
    expect(fg.types.create).toBe("void")
    expect(fg.types.update).toBe("void")
    expect(fg.types.error).toBe("LaravelValidationError")
    expect(fg.types.hasCustomError).toBe(true)

    // Test 0-if catamorphism for full_crud
    const result = matchResourceGroup(group, {
      full_crud: g => "FULL_CRUD:" + g.primaryKeyType + ":" + g.create.actionName,
      read_only_crud: () => "READ_ONLY",
      flexible_crud: () => "FLEXIBLE",
      singleton: () => "SINGLETON",
      custom: () => "CUSTOM"
    })
    expect(result).toBe("FULL_CRUD:number:create")
  })

  it("correctly classifies Read-Only CRUD resource group when only index and show exist", () => {
    const routes = [
      ScannedRouteDescriptor.create({ method: "GET", path: "/api/v1/categories", groupName: "categories", crudRole: "index" }),
      ScannedRouteDescriptor.create({
        method: "GET",
        path: "/api/v1/categories/{id}",
        groupName: "categories",
        crudRole: "show",
        pathParameters: [{ name: "id", type: RouteParameterType.String, required: true }]
      })
    ]

    const manifest: RouteManifest = {
      routes,
      baseURL: "http://localhost/api",
      generatedAt: "2026-09-05T07:30:00.000Z"
    }

    const graph = classifyDomainGraph(manifest)
    expect(graph.resourceGroups).toHaveLength(1)

    const group = graph.resourceGroups[0]
    expect(group instanceof ScannedReadOnlyCrudResourceGroupDescriptor).toBe(true)
    expect(group.kind).toBe(ResourceGroupKind.ReadOnlyCrud)
    expect(group.isCrud).toBe(true)
    expect(group.primaryKeyType).toBe("string")

    const rg = group as ScannedReadOnlyCrudResourceGroupDescriptor
    expect(rg.types).toBeDefined()
    expect(Object.isFrozen(rg.types)).toBe(true)
    expect(rg.types.create).toBe("never")
    expect(rg.types.update).toBe("never")

    const result = matchResourceGroup(group, {
      full_crud: () => "FULL",
      read_only_crud: g => "READ_ONLY:" + g.primaryKeyType,
      flexible_crud: () => "FLEXIBLE",
      singleton: () => "SINGLETON",
      custom: () => "CUSTOM"
    })
    expect(result).toBe("READ_ONLY:string")
  })

  it("correctly classifies Flexible CRUD resource group with explicit MutationCapabilities", () => {
    const routes = [
      ScannedRouteDescriptor.create({ method: "GET", path: "/api/v1/reviews", groupName: "reviews", crudRole: "index" }),
      ScannedRouteDescriptor.create({
        method: "GET",
        path: "/api/v1/reviews/{id}",
        groupName: "reviews",
        crudRole: "show",
        pathParameters: [{ name: "id", type: RouteParameterType.Integer, required: true }]
      }),
      ScannedRouteDescriptor.create({ method: "POST", path: "/api/v1/reviews", groupName: "reviews", crudRole: "create" })
    ]

    const manifest: RouteManifest = {
      routes,
      baseURL: "http://localhost/api",
      generatedAt: "2026-09-05T07:30:00.000Z"
    }

    const graph = classifyDomainGraph(manifest)
    const group = graph.resourceGroups[0] as ScannedFlexibleCrudResourceGroupDescriptor
    expect(group instanceof ScannedFlexibleCrudResourceGroupDescriptor).toBe(true)
    expect(group.kind).toBe(ResourceGroupKind.FlexibleCrud)
    expect(group.create.available).toBe(true)
    expect(group.update.available).toBe(false)
    expect(group.delete.available).toBe(false)
  })

  it("correctly classifies Singleton resource group without trailing item params", () => {
    const cartGet = ScannedRouteDescriptor.create({
      method: "GET",
      path: "/api/v1/cart",
      groupName: "cart",
      crudRole: "index"
    })

    const cartCheckout = ScannedRouteDescriptor.create({
      method: "POST",
      path: "/api/v1/cart/checkout",
      groupName: "cart",
      crudRole: "custom"
    })

    const manifest: RouteManifest = {
      routes: [cartGet, cartCheckout],
      baseURL: "http://localhost/api",
      generatedAt: "2026-09-05T07:30:00.000Z"
    }

    const graph = classifyDomainGraph(manifest)
    expect(graph.resourceGroups).toHaveLength(1)

    const group = graph.resourceGroups[0]
    expect(group instanceof ScannedSingletonResourceGroupDescriptor).toBe(true)
    expect(Object.isFrozen(group)).toBe(true)
    expect(group.kind).toBe(ResourceGroupKind.Singleton)
    expect(group.isCrud).toBe(false)
    expect(group.listKeyFn).toBe("list")
    expect(group.detailKeyFn).toBe("show")
    expect(group.primaryKeyType).toBe("string | number")

    const result = matchResourceGroup(group, {
      crud: () => "CRUD",
      singleton: g => "SINGLETON:" + g.listKeyFn + ":" + g.detailKeyFn,
      custom: () => "CUSTOM"
    })
    expect(result).toBe("SINGLETON:list:show")
  })

  it("guarantees QueryKeyGenerator and HookGenerator consume ClassifiedDomainGraph with 0 downstream if", async () => {
    const routes = [
      ScannedRouteDescriptor.create({
        method: "GET",
        path: "/api/v1/users",
        groupName: "users",
        crudRole: "index"
      }),
      ScannedRouteDescriptor.create({
        method: "GET",
        path: "/api/v1/users/{id}",
        groupName: "users",
        crudRole: "show",
        pathParameters: [{ name: "id", type: RouteParameterType.String, required: true }]
      }),
      ScannedRouteDescriptor.create({
        method: "POST",
        path: "/api/v1/users",
        groupName: "users",
        crudRole: "create"
      }),
      ScannedRouteDescriptor.create({
        method: "PUT",
        path: "/api/v1/users/{id}",
        groupName: "users",
        crudRole: "update"
      }),
      ScannedRouteDescriptor.create({
        method: "DELETE",
        path: "/api/v1/users/{id}",
        groupName: "users",
        crudRole: "delete"
      }),
      ScannedRouteDescriptor.create({
        method: "GET",
        path: "/api/v1/profile",
        groupName: "profile",
        crudRole: "index"
      })
    ]

    const manifest: RouteManifest = {
      routes,
      baseURL: "http://localhost/api",
      generatedAt: "2026-09-05T07:30:00.000Z"
    }

    const graph = classifyDomainGraph(manifest)
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "routesync-test-"))

    try {
      await QueryKeyGenerator.generate(manifest, tempDir, graph)
      const queryKeyCode = await fs.readFile(path.join(tempDir, "query-key.ts"), "utf-8")

      // Verifies typed key parameter for users (string)
      expect(queryKeyCode).toContain("createBaseQueryKey<typeof Entity.USERS, string>")
      // Verifies singleton profile query key
      expect(queryKeyCode).toContain("profile: {")
      expect(queryKeyCode).toContain("all: () => [Entity.PROFILE] as const")

      const hookCode = await HookGenerator.generate(manifest, tempDir, graph)
      expect(hookCode).toContain("QueryKey.users.lists")
      expect(hookCode).toContain("QueryKey.users.detail")
      expect(hookCode).toContain("create: {")
      expect(hookCode).toContain("update: {")
      expect(hookCode).toContain("remove: {")
      expect(hookCode).toContain("QueryKey.profile.list")
    } finally {
      await fs.remove(tempDir)
    }
  })

  it("resolves exact response, form, and error types at Origin Boundary with zero AST digging in HookGenerator", async () => {
    const productIndex = ScannedRouteDescriptor.create({
      method: "GET",
      path: "/api/v1/products",
      groupName: "products",
      crudRole: "index",
      response: {
        kind: "resource",
        resource: "ProductResource",
        shape: "collection",
        semantic: {
          kind: "resource",
          resource: "ProductResource",
          shape: "collection",
          readTypeName: "ProductResourceTransformed"
        }
      }
    })

    const productShow = ScannedRouteDescriptor.create({
      method: "GET",
      path: "/api/v1/products/{id}",
      groupName: "products",
      crudRole: "show",
      pathParameters: [{ name: "id", type: RouteParameterType.Integer, required: true }],
      response: {
        kind: "resource",
        resource: "ProductResource",
        shape: "single",
        semantic: {
          kind: "resource",
          resource: "ProductResource",
          shape: "single",
          readTypeName: "ProductResourceTransformed"
        }
      }
    })

    const productCreate = ScannedRouteDescriptor.create({
      method: "POST",
      path: "/api/v1/products",
      groupName: "products",
      crudRole: "create",
      schema: {
        rules: {
          name: ["required", "string"]
        }
      }
    })

    const productUpdate = ScannedRouteDescriptor.create({
      method: "PUT",
      path: "/api/v1/products/{id}",
      groupName: "products",
      crudRole: "update",
      pathParameters: [{ name: "id", type: RouteParameterType.Integer, required: true }],
      schema: {
        rules: {
          name: ["string"]
        }
      }
    })

    const productDelete = ScannedRouteDescriptor.create({
      method: "DELETE",
      path: "/api/v1/products/{id}",
      groupName: "products",
      crudRole: "delete",
      pathParameters: [{ name: "id", type: RouteParameterType.Integer, required: true }]
    })

    const manifest: RouteManifest = {
      routes: [productIndex, productShow, productCreate, productUpdate, productDelete],
      baseURL: "http://localhost/api",
      generatedAt: "2026-09-05T07:30:00.000Z"
    }

    const graph = classifyDomainGraph(manifest)
    const productGroup = graph.resourceGroups[0]

    // Verify types are resolved at Origin Boundary
    expect(productGroup.types.list).toBe("ProductResourceTransformed")
    expect(productGroup.types.detail).toBe("ProductResourceTransformed")
    expect(productGroup.types.create).toBe("ProductsForm['Create']")
    expect(productGroup.types.update).toBe("ProductsForm['Update']")
    expect(productGroup.types.importedTypes).toContain("ProductResourceTransformed")
    expect(productGroup.types.importedTypes).toContain("ProductsForm")

    // Verify HookGenerator emits exact types directly from productGroup.types
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "routesync-test-"))
    try {
      const hookCode = await HookGenerator.generate(manifest, tempDir, graph)
      expect(hookCode).toContain("list: typeOf<ProductResourceTransformed>()")
      expect(hookCode).toContain("detail: typeOf<ProductResourceTransformed>()")
      expect(hookCode).toContain("create: typeOf<ProductsForm['Create']>()")
      expect(hookCode).toContain("update: typeOf<ProductsForm['Update']>()")
      expect(hookCode).toContain("import type {")
      expect(hookCode).toContain("ProductResourceTransformed,")
      expect(hookCode).toContain("ProductsForm,")
    } finally {
      await fs.remove(tempDir)
    }
  })
})
