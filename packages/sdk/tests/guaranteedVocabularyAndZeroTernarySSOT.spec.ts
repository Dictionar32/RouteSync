import { describe, it, expect } from 'vitest'
import {
  ScannedRouteSchemaPayload,
  ScannedModelDescriptor,
  ScannedControllerActionDescriptor,
  ScannedRouteManifestDescriptor,
  RouteSchemaPayload,
  ParsedModel,
  ControllerActionInfo,
  RouteManifest,
  PrimitiveKind
} from '@routesync/core'

describe('Guaranteed Vocabulary & Zero Defensive Ternary SSOT', () => {
  it('1. ScannedRouteSchemaPayload provides guaranteed frozen arrays without ternaries', () => {
    const payload = ScannedRouteSchemaPayload.empty()

    // Guaranteed non-undefined arrays
    expect(Array.isArray(payload.rules)).toBe(true)
    expect(Array.isArray(payload.messages)).toBe(true)
    expect(Array.isArray(payload.attributes)).toBe(true)
    expect(payload.rules.length).toBe(0)
    expect(payload.messages.length).toBe(0)
    expect(payload.attributes.length).toBe(0)
    expect(Object.isFrozen(payload.rules)).toBe(true)
    expect(Object.isFrozen(payload.messages)).toBe(true)
    expect(Object.isFrozen(payload.attributes)).toBe(true)
  })

  it('2. ScannedModelDescriptor provides guaranteed frozen model collections without ternaries', () => {
    const model = ScannedModelDescriptor.create({
      name: 'Category',
      columns: []
    })

    expect(Array.isArray(model.fillable)).toBe(true)
    expect(Array.isArray(model.guarded)).toBe(true)
    expect(Array.isArray(model.hidden)).toBe(true)
    expect(Array.isArray(model.appends)).toBe(true)
    expect(Array.isArray(model.casts)).toBe(true)
    expect(Array.isArray(model.accessors)).toBe(true)
    expect(Array.isArray(model.relations)).toBe(true)

    expect(model.keySemanticType).toBe(PrimitiveKind.NUMBER)
    expect(Object.isFrozen(model.casts)).toBe(true)
    expect(Object.isFrozen(model.accessors)).toBe(true)
    expect(Object.isFrozen(model.relations)).toBe(true)
  })

  it('3. ScannedControllerActionDescriptor guarantees schemaRules array without ternaries', () => {
    const action = ScannedControllerActionDescriptor.create({
      sourceFile: 'app/Http/Controllers/OrderController.php',
      sourceLine: 42
    })

    expect(Array.isArray(action.schemaRules)).toBe(true)
    expect(action.schemaRules.length).toBe(0)
    expect(Object.isFrozen(action.schemaRules)).toBe(true)
  })

  it('4. ScannedRouteManifestDescriptor guarantees channels array without ternaries', () => {
    const manifest = ScannedRouteManifestDescriptor.empty()

    expect(Array.isArray(manifest.channels)).toBe(true)
    expect(manifest.channels.length).toBe(0)
    expect(Object.isFrozen(manifest.channels)).toBe(true)
  })
})
