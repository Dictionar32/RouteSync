import { describe, it, expect } from "vitest"
import {
  RouteManifest,
  ResourceGroupKind,
  RESOURCE_GROUP_REGISTRY,
  matchResourceGroup,
  ScannedRouteDescriptor,
  RouteParameterType
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
  it("correctly classifies CRUD resource group with authoritative primaryKeyType from path parameters", () => {
    const indexRoute = ScannedRouteDescriptor.create({
      method: "GET",
      path: "/api/v1/products",
      groupName: "products",
      crudRole: "index"
    })

    const showRoute = ScannedRouteDescriptor.create({
      method: "GET",
      path: "/api/v1/products/{id}",
      groupName: "products",
      crudRole: "show",
      pathParameters: [
        {
          name: "id",
          type: RouteParameterType.Integer,
          required: true
        }
      ]
    })

    const manifest: RouteManifest = {
      routes: [indexRoute, showRoute],
      baseURL: "http://localhost/api",
      generatedAt: "2026-09-05T07:30:00.000Z"
    }

    const graph = classifyDomainGraph(manifest)
    expect(graph.resourceGroups).toHaveLength(1)

    const group = graph.resourceGroups[0]
    expect(group.kind).toBe(ResourceGroupKind.Crud)
    expect(group.isCrud).toBe(true)
    expect(group.listKeyFn).toBe("lists")
    expect(group.detailKeyFn).toBe("detail")
    expect(group.primaryKeyType).toBe("number")
    expect(group.groupName).toBe("products")
    expect(group.keyName).toBe("PRODUCTS")
    expect(group.titleName).toBe("Products")

    // Test 0-if catamorphism
    const result = matchResourceGroup(group, {
      crud: g => "CRUD:" + g.primaryKeyType + ":" + g.listKeyFn,
      singleton: g => "SINGLETON:" + g.groupName,
      custom: g => "CUSTOM:" + g.groupName
    })
    expect(result).toBe("CRUD:number:lists")
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
      expect(hookCode).toContain("QueryKey.profile.list")
    } finally {
      await fs.remove(tempDir)
    }
  })
})
