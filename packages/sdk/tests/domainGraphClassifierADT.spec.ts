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
})
