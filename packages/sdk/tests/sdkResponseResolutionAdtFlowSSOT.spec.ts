import { describe, test, expect } from 'vitest'
import {
  matchSdkResponseResolution,
  matchSdkResponse,
  SDK_RESPONSE_KIND_REGISTRY,
  SdkResponseKind,
  VoidSdkResponseResolution,
  RawSdkResponseResolution,
  ValidatedSdkResponseResolution,
  MappedSdkResponseResolution,
  ValidatedAndMappedSdkResponseResolution,
  ScannedSdkResponseResolution
} from '../../core/src'

describe('SdkResponseResolution ADT Flow SSOT (Zero-if Catamorphism Suite)', () => {
  test('1. matchSdkResponseResolution executes pure catamorphism for Void response', () => {
    const res: VoidSdkResponseResolution = ScannedSdkResponseResolution.voidResponse()

    const output = matchSdkResponse(res, {
      void: () => 'PROMISE<VOID>',
      raw: (r) => `PROMISE<${r.type}>`,
      validated: (r) => `PROMISE<VALIDATED:${r.type}>`,
      mapped: (r) => `PROMISE<MAPPED:${r.type}>`,
      validated_and_mapped: (r) => `PROMISE<VALIDATED_AND_MAPPED:${r.type}>`
    })

    expect(output).toBe('PROMISE<VOID>')
    expect(res.kind).toBe('void')
    expect(res.hasSchema).toBe(false)
    expect(res.hasMapper).toBe(false)
  })

  test('2. matchSdkResponseResolution executes pure catamorphism for Raw response', () => {
    const res: RawSdkResponseResolution = ScannedSdkResponseResolution.raw('OrderRawResponse')

    const output = matchSdkResponse(res, {
      void: () => 'PROMISE<VOID>',
      raw: (r) => `PROMISE<${r.type}>`,
      validated: (r) => `PROMISE<VALIDATED:${r.type}>`,
      mapped: (r) => `PROMISE<MAPPED:${r.type}>`,
      validated_and_mapped: (r) => `PROMISE<VALIDATED_AND_MAPPED:${r.type}>`
    })

    expect(output).toBe('PROMISE<OrderRawResponse>')
    expect(res.kind).toBe('raw')
    expect(res.type).toBe('OrderRawResponse')
    expect(res.hasSchema).toBe(false)
    expect(res.hasMapper).toBe(false)
  })

  test('3. matchSdkResponseResolution executes pure catamorphism for Validated response', () => {
    const res: ValidatedSdkResponseResolution = ScannedSdkResponseResolution.validated(
      'UserApiResponse',
      'UserApiResponseSchema'
    )

    const output = matchSdkResponse(res, {
      void: () => 'PROMISE<VOID>',
      raw: (r) => `PROMISE<${r.type}>`,
      validated: (r) => `PROMISE<VALIDATED:${r.type}:${r.schemaExpression}>`,
      mapped: (r) => `PROMISE<MAPPED:${r.type}>`,
      validated_and_mapped: (r) => `PROMISE<VALIDATED_AND_MAPPED:${r.type}>`
    })

    expect(output).toBe('PROMISE<VALIDATED:UserApiResponse:UserApiResponseSchema>')
    expect(res.kind).toBe('validated')
    expect(res.hasSchema).toBe(true)
    expect(res.hasMapper).toBe(false)
  })

  test('4. matchSdkResponseResolution executes pure catamorphism for Mapped response', () => {
    const res: MappedSdkResponseResolution = ScannedSdkResponseResolution.mapped(
      'ProductTransformed',
      'toProductRead'
    )

    const output = matchSdkResponse(res, {
      void: () => 'PROMISE<VOID>',
      raw: (r) => `PROMISE<${r.type}>`,
      validated: (r) => `PROMISE<VALIDATED:${r.type}>`,
      mapped: (r) => `PROMISE<MAPPED:${r.type}:${r.mapperExpression}>`,
      validated_and_mapped: (r) => `PROMISE<VALIDATED_AND_MAPPED:${r.type}>`
    })

    expect(output).toBe('PROMISE<MAPPED:ProductTransformed:toProductRead>')
    expect(res.kind).toBe('mapped')
    expect(res.hasSchema).toBe(false)
    expect(res.hasMapper).toBe(true)
  })

  test('5. matchSdkResponseResolution executes pure catamorphism for ValidatedAndMapped response', () => {
    const res: ValidatedAndMappedSdkResponseResolution = ScannedSdkResponseResolution.validatedAndMapped(
      'OrderTransformed',
      'OrderApiResponseSchema',
      'toOrderRead'
    )

    const output = matchSdkResponse(res, {
      void: () => 'PROMISE<VOID>',
      raw: (r) => `PROMISE<${r.type}>`,
      validated: (r) => `PROMISE<VALIDATED:${r.type}>`,
      mapped: (r) => `PROMISE<MAPPED:${r.type}>`,
      validated_and_mapped: (r) => `PROMISE<VALIDATED_AND_MAPPED:${r.type}:${r.schemaExpression}:${r.mapperExpression}>`
    })

    expect(output).toBe('PROMISE<VALIDATED_AND_MAPPED:OrderTransformed:OrderApiResponseSchema:toOrderRead>')
    expect(res.kind).toBe('validated_and_mapped')
    expect(res.hasSchema).toBe(true)
    expect(res.hasMapper).toBe(true)
  })

  test('6. SDK_RESPONSE_KIND_REGISTRY enforces frozen O(1) specifications across all 5 kinds', () => {
    expect(Object.isFrozen(SDK_RESPONSE_KIND_REGISTRY)).toBe(true)

    expect(SDK_RESPONSE_KIND_REGISTRY[SdkResponseKind.Void]).toEqual({
      kind: SdkResponseKind.Void,
      hasSchema: false,
      hasMapper: false,
      isTransformed: false
    })

    expect(SDK_RESPONSE_KIND_REGISTRY[SdkResponseKind.Raw]).toEqual({
      kind: SdkResponseKind.Raw,
      hasSchema: false,
      hasMapper: false,
      isTransformed: false
    })

    expect(SDK_RESPONSE_KIND_REGISTRY[SdkResponseKind.Validated]).toEqual({
      kind: SdkResponseKind.Validated,
      hasSchema: true,
      hasMapper: false,
      isTransformed: false
    })

    expect(SDK_RESPONSE_KIND_REGISTRY[SdkResponseKind.Mapped]).toEqual({
      kind: SdkResponseKind.Mapped,
      hasSchema: false,
      hasMapper: true,
      isTransformed: true
    })

    expect(SDK_RESPONSE_KIND_REGISTRY[SdkResponseKind.ValidatedAndMapped]).toEqual({
      kind: SdkResponseKind.ValidatedAndMapped,
      hasSchema: true,
      hasMapper: true,
      isTransformed: true
    })
  })

  test('7. ScannedSdkResponseResolution produces frozen and complete contract instances', () => {
    const v = ScannedSdkResponseResolution.voidResponse()
    const r = ScannedSdkResponseResolution.raw('string')
    const val = ScannedSdkResponseResolution.validated('User', 'UserSchema')
    const map = ScannedSdkResponseResolution.mapped('UserRead', 'toUserRead')
    const both = ScannedSdkResponseResolution.validatedAndMapped('UserRead', 'UserSchema', 'toUserRead')

    expect(Object.isFrozen(v)).toBe(true)
    expect(Object.isFrozen(r)).toBe(true)
    expect(Object.isFrozen(val)).toBe(true)
    expect(Object.isFrozen(map)).toBe(true)
    expect(Object.isFrozen(both)).toBe(true)
  })

  test('8. Pure functional pipeline transforms response resolutions into SDK return expressions without branching', () => {
    const resolutions = [
      ScannedSdkResponseResolution.voidResponse(),
      ScannedSdkResponseResolution.raw('HealthCheckResponse'),
      ScannedSdkResponseResolution.validated('ConfigResponse', 'ConfigSchema'),
      ScannedSdkResponseResolution.mapped('ProfileTransformed', 'toProfileRead'),
      ScannedSdkResponseResolution.validatedAndMapped('OrderTransformed', 'OrderSchema', 'toOrderRead')
    ]

    const clientCallSignatures = resolutions.map(res => matchSdkResponseResolution(res, {
      void: () => 'executeVoid()',
      raw: (r) => `executeRaw<${r.type}>()`,
      validated: (r) => `executeValidated<${r.type}>(${r.schemaExpression})`,
      mapped: (r) => `executeMapped<${r.type}>(${r.mapperExpression})`,
      validated_and_mapped: (r) => `executeValidatedAndMapped<${r.type}>(${r.schemaExpression}, ${r.mapperExpression})`
    }))

    expect(clientCallSignatures).toEqual([
      'executeVoid()',
      'executeRaw<HealthCheckResponse>()',
      'executeValidated<ConfigResponse>(ConfigSchema)',
      'executeMapped<ProfileTransformed>(toProfileRead)',
      'executeValidatedAndMapped<OrderTransformed>(OrderSchema, toOrderRead)'
    ])
  })
})
