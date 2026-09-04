import { describe, it, expect } from 'vitest'
import {
  RoutePolicyKind,
  ROUTE_POLICY_REGISTRY,
  matchRoutePolicy,
  RoutePolicyDescriptor,
  PageEndpointKind,
  PAGE_ENDPOINT_REGISTRY,
  matchPageEndpoint,
  PageEndpointDescriptor,
  ScannedRoutePolicyDescriptor,
  RouteManifest
} from '@routesync/core'
import { ScannedPageEndpointDescriptor, RoutesGenerator } from '@routesync/cli/src/generators/RoutesGenerator'
import path from 'path'
import fsExtra from 'fs-extra'

describe('Policy and Page Endpoint ADT Flow SSOT (Zero-if Catamorphism Suite)', () => {
  it('1. ROUTE_POLICY_REGISTRY should enforce metadata specifications for all RoutePolicyKinds', () => {
    expect(ROUTE_POLICY_REGISTRY[RoutePolicyKind.AbilityModel]).toEqual({
      kind: RoutePolicyKind.AbilityModel,
      requiresModel: true,
      description: 'Laravel Model Policy checking ability against a model parameter'
    })

    expect(ROUTE_POLICY_REGISTRY[RoutePolicyKind.Gate]).toEqual({
      kind: RoutePolicyKind.Gate,
      requiresModel: false,
      description: 'Laravel Gate authorization checking ability without model parameter'
    })

    expect(ROUTE_POLICY_REGISTRY[RoutePolicyKind.Custom]).toEqual({
      kind: RoutePolicyKind.Custom,
      requiresModel: false,
      description: 'Custom authorization policy or middleware rule'
    })

    for (const kind of Object.values(RoutePolicyKind)) {
      const spec = ROUTE_POLICY_REGISTRY[kind]
      expect(spec).toBeDefined()
      expect(spec.kind).toBe(kind)
      expect(typeof spec.requiresModel).toBe('boolean')
      expect(typeof spec.description).toBe('string')
    }
  })

  it('2. matchRoutePolicy should execute pure catamorphism without if/switch', () => {
    const abilityModel = ScannedRoutePolicyDescriptor.abilityModel('update', 'order')
    const gate = ScannedRoutePolicyDescriptor.gate('manage_users')
    const custom = ScannedRoutePolicyDescriptor.custom('isAdmin')

    const visitor = {
      ability_model: (p: RoutePolicyDescriptor) => `MODEL:${p.ability}:${p.modelParameter}`,
      gate: (p: RoutePolicyDescriptor) => `GATE:${p.ability}`,
      custom: (p: RoutePolicyDescriptor) => `CUSTOM:${p.ability}`
    }

    expect(matchRoutePolicy(abilityModel, visitor)).toBe('MODEL:update:order')
    expect(matchRoutePolicy(gate, visitor)).toBe('GATE:manage_users')
    expect(matchRoutePolicy(custom, visitor)).toBe('CUSTOM:isAdmin')

    // Also supports kind string with synthesized default contract
    expect(matchRoutePolicy(RoutePolicyKind.AbilityModel, visitor)).toBe('MODEL::model')
    expect(matchRoutePolicy(RoutePolicyKind.Gate, visitor)).toBe('GATE:')
  })

  it('3. ScannedRoutePolicyDescriptor semantic factories should return frozen complete contracts', () => {
    const abilityModel = ScannedRoutePolicyDescriptor.abilityModel('view', 'product')
    expect(abilityModel.kind).toBe(RoutePolicyKind.AbilityModel)
    expect(abilityModel.ability).toBe('view')
    expect(abilityModel.modelParameter).toBe('product')
    expect(Object.isFrozen(abilityModel)).toBe(true)

    const gate = ScannedRoutePolicyDescriptor.gate('access_panel')
    expect(gate.kind).toBe(RoutePolicyKind.Gate)
    expect(gate.ability).toBe('access_panel')
    expect(gate.modelParameter).toBeNull()
    expect(Object.isFrozen(gate)).toBe(true)

    const custom = ScannedRoutePolicyDescriptor.custom('superadmin')
    expect(custom.kind).toBe(RoutePolicyKind.Custom)
    expect(custom.ability).toBe('superadmin')
    expect(custom.modelParameter).toBeNull()
    expect(Object.isFrozen(custom)).toBe(true)

    // Backward compatible create()
    const legacyModel = ScannedRoutePolicyDescriptor.create({ ability: 'edit', modelParameter: 'post' })
    expect(legacyModel.kind).toBe(RoutePolicyKind.AbilityModel)
    const legacyGate = ScannedRoutePolicyDescriptor.create({ ability: 'view' })
    expect(legacyGate.kind).toBe(RoutePolicyKind.Gate)
  })

  it('4. PAGE_ENDPOINT_REGISTRY should enforce metadata specifications for all PageEndpointKinds', () => {
    expect(PAGE_ENDPOINT_REGISTRY[PageEndpointKind.Static]).toEqual({
      kind: PageEndpointKind.Static,
      isCallable: false,
      description: 'Static page route without path or query parameters'
    })

    expect(PAGE_ENDPOINT_REGISTRY[PageEndpointKind.Parameterized]).toEqual({
      kind: PageEndpointKind.Parameterized,
      isCallable: true,
      description: 'Parameterized page route with required path parameters'
    })

    expect(PAGE_ENDPOINT_REGISTRY[PageEndpointKind.QueryFiltered]).toEqual({
      kind: PageEndpointKind.QueryFiltered,
      isCallable: true,
      description: 'Page route with optional query parameters and optional/required path parameters'
    })

    for (const kind of Object.values(PageEndpointKind)) {
      const spec = PAGE_ENDPOINT_REGISTRY[kind]
      expect(spec).toBeDefined()
      expect(spec.kind).toBe(kind)
      expect(typeof spec.isCallable).toBe('boolean')
      expect(typeof spec.description).toBe('string')
    }
  })

  it('5. matchPageEndpoint should execute pure catamorphism on descriptors and kind strings', () => {
    const staticEp = ScannedPageEndpointDescriptor.static('/dashboard')
    const paramEp = ScannedPageEndpointDescriptor.parameterized('/users/{id}', ['id'])
    const queryEp = ScannedPageEndpointDescriptor.queryFiltered('/search', ['q'])

    const visitor = {
      static: (p: PageEndpointDescriptor) => `STATIC:${p.path}`,
      parameterized: (p: PageEndpointDescriptor) => `PARAM:${p.path}:${p.params.join(',')}`,
      query_filtered: (p: PageEndpointDescriptor) => `QUERY:${p.path}:${p.query.join(',')}`
    }

    expect(matchPageEndpoint(staticEp, visitor)).toBe('STATIC:/dashboard')
    expect(matchPageEndpoint(paramEp, visitor)).toBe('PARAM:/users/{id}:id')
    expect(matchPageEndpoint(queryEp, visitor)).toBe('QUERY:/search:q')

    // Kind string resolution
    expect(matchPageEndpoint(PageEndpointKind.Static, visitor)).toBe('STATIC:/')
    expect(matchPageEndpoint(PageEndpointKind.Parameterized, visitor)).toBe('PARAM:/:id')
    expect(matchPageEndpoint(PageEndpointKind.QueryFiltered, visitor)).toBe('QUERY:/:filter')
  })

  it('6. ScannedPageEndpointDescriptor semantic factories should return frozen complete contracts', () => {
    const stat = ScannedPageEndpointDescriptor.static('/about')
    expect(stat.kind).toBe(PageEndpointKind.Static)
    expect(stat.path).toBe('/about')
    expect(stat.query).toEqual([])
    expect(stat.params).toEqual([])
    expect(Object.isFrozen(stat)).toBe(true)

    const param = ScannedPageEndpointDescriptor.parameterized('/posts/{post}/comments/{comment}', ['post', 'comment'])
    expect(param.kind).toBe(PageEndpointKind.Parameterized)
    expect(param.params).toEqual(['post', 'comment'])
    expect(Object.isFrozen(param)).toBe(true)

    const query = ScannedPageEndpointDescriptor.queryFiltered('/articles', ['tag', 'page'])
    expect(query.kind).toBe(PageEndpointKind.QueryFiltered)
    expect(query.query).toEqual(['tag', 'page'])
    expect(Object.isFrozen(query)).toBe(true)
  })

  it('7. RoutesGenerator should generate valid route file tree using matchPageEndpoint', async () => {
    const tempDir = path.join(__dirname, 'temp_routes_gen')
    await fsExtra.ensureDir(tempDir)

    try {
      const mockManifest = {
        pages: {
          'home': '/',
          'users.show': '/users/{id}',
          'search.articles': {
            path: '/articles',
            query: ['q', 'page']
          }
        }
      } as unknown as RouteManifest

      const success = await RoutesGenerator.generate(mockManifest, tempDir)
      expect(success).toBe(true)

      const jsPath = path.join(tempDir, 'routes.js')
      const dtsPath = path.join(tempDir, 'routes.d.ts')

      expect(fsExtra.existsSync(jsPath)).toBe(true)
      expect(fsExtra.existsSync(dtsPath)).toBe(true)

      const jsContent = fsExtra.readFileSync(jsPath, 'utf8')
      const dtsContent = fsExtra.readFileSync(dtsPath, 'utf8')

      expect(jsContent).toContain("home: '/',")
      expect(jsContent).toContain("show: (params) => PathResolver.resolveUrl('/users/{id}', params),")
      expect(jsContent).toContain("articles: (params) => PathResolver.resolveUrl('/articles', params),")

      expect(dtsContent).toContain("readonly home: '/';")
      expect(dtsContent).toContain("readonly show: (params: { id: string | number | null }) => string;")
      expect(dtsContent).toContain("readonly articles: (params: { q?: string | number | null; page?: string | number | null }) => string;")
    } finally {
      await fsExtra.remove(tempDir)
    }
  })
})
