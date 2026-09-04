import { describe, test, expect } from 'vitest'
import {
  matchRouteExecutionSignature,
  matchRoutePayloadMode,
  ROUTE_PAYLOAD_MODE_REGISTRY,
  RoutePayloadMode,
  NoPayloadExecutionSignature,
  RequiredPayloadExecutionSignature,
  OptionalPayloadExecutionSignature,
  ScannedRouteExecutionSignature,
  RouteHookKind
} from '../../core/src'

describe('RouteExecutionSignature ADT Flow SSOT (Zero-if Catamorphism Suite)', () => {
  test('1. matchRouteExecutionSignature executes pure catamorphism for NoPayload signature', () => {
    const sig: NoPayloadExecutionSignature = ScannedRouteExecutionSignature.noPayload()

    const result = matchRouteExecutionSignature(sig, {
      none: (s) => `NONE:${s.parameterDeclaration}:${s.hasPayload}:${s.isOptional}`,
      required: (s) => `REQUIRED:${s.parameterDeclaration}`,
      optional: (s) => `OPTIONAL:${s.parameterDeclaration}`
    })

    expect(result).toBe('NONE::false:true')
    expect(sig.payloadMode).toBe('none')
    expect(sig.hasPayload).toBe(false)
    expect(sig.isOptional).toBe(true)
    expect(sig.parameterDeclaration).toBe('')
    expect(sig.callArgumentsExpression).toBe('')
  })

  test('2. matchRouteExecutionSignature executes pure catamorphism for RequiredPayload signature', () => {
    const sig: RequiredPayloadExecutionSignature = ScannedRouteExecutionSignature.requiredPayload('CreateOrderPayload')

    const result = matchRouteExecutionSignature(sig, {
      none: () => 'NONE',
      required: (s) => `REQUIRED:${s.parameterDeclaration}:${s.callArgumentsExpression}:${s.hasPayload}:${s.isOptional}`,
      optional: () => 'OPTIONAL'
    })

    expect(result).toBe('REQUIRED:payload: CreateOrderPayload:payload:true:false')
    expect(sig.payloadMode).toBe('required')
    expect(sig.hasPayload).toBe(true)
    expect(sig.isOptional).toBe(false)
    expect(sig.parameterDeclaration).toBe('payload: CreateOrderPayload')
    expect(sig.callArgumentsExpression).toBe('payload')
  })

  test('3. matchRouteExecutionSignature executes pure catamorphism for OptionalPayload signature', () => {
    const sig: OptionalPayloadExecutionSignature = ScannedRouteExecutionSignature.optionalPayload('FilterOptions')

    const result = matchRoutePayloadMode(sig, {
      none: () => 'NONE',
      required: () => 'REQUIRED',
      optional: (s) => `OPTIONAL:${s.parameterDeclaration}:${s.callArgumentsExpression}:${s.hasPayload}:${s.isOptional}`
    })

    expect(result).toBe('OPTIONAL:payload: FilterOptions = {}:payload:true:true')
    expect(sig.payloadMode).toBe('optional')
    expect(sig.hasPayload).toBe(true)
    expect(sig.isOptional).toBe(true)
    expect(sig.parameterDeclaration).toBe('payload: FilterOptions = {}')
    expect(sig.callArgumentsExpression).toBe('payload')
  })

  test('4. ROUTE_PAYLOAD_MODE_REGISTRY enforces frozen specifications for all 3 payload modes', () => {
    expect(Object.isFrozen(ROUTE_PAYLOAD_MODE_REGISTRY)).toBe(true)

    const noneSpec = ROUTE_PAYLOAD_MODE_REGISTRY[RoutePayloadMode.None]
    expect(noneSpec.mode).toBe('none')
    expect(noneSpec.hasPayload).toBe(false)
    expect(noneSpec.isOptional).toBe(true)
    expect(noneSpec.defaultCallArguments).toBe('')
    expect(noneSpec.formatDeclaration('UserForm')).toBe('')

    const reqSpec = ROUTE_PAYLOAD_MODE_REGISTRY[RoutePayloadMode.Required]
    expect(reqSpec.mode).toBe('required')
    expect(reqSpec.hasPayload).toBe(true)
    expect(reqSpec.isOptional).toBe(false)
    expect(reqSpec.defaultCallArguments).toBe('payload')
    expect(reqSpec.formatDeclaration('UserForm')).toBe('payload: UserForm')

    const optSpec = ROUTE_PAYLOAD_MODE_REGISTRY[RoutePayloadMode.Optional]
    expect(optSpec.mode).toBe('optional')
    expect(optSpec.hasPayload).toBe(true)
    expect(optSpec.isOptional).toBe(true)
    expect(optSpec.defaultCallArguments).toBe('payload')
    expect(optSpec.formatDeclaration('UserForm')).toBe('payload: UserForm = {}')
  })

  test('5. ScannedRouteExecutionSignature semantic factories produce frozen and complete instances', () => {
    const noP = ScannedRouteExecutionSignature.noPayload()
    const req = ScannedRouteExecutionSignature.requiredPayload('OrderForm')
    const opt = ScannedRouteExecutionSignature.optionalPayload('OrderForm')
    const fromM = ScannedRouteExecutionSignature.fromMode(RoutePayloadMode.Required, 'ProfileForm')

    expect(Object.isFrozen(noP)).toBe(true)
    expect(Object.isFrozen(req)).toBe(true)
    expect(Object.isFrozen(opt)).toBe(true)
    expect(Object.isFrozen(fromM)).toBe(true)
  })

  test('6. ScannedRouteExecutionSignature.create correctly maps boolean hasPayload', () => {
    const withoutPayload = ScannedRouteExecutionSignature.create(RouteHookKind.Query, false, false)
    const withPayload = ScannedRouteExecutionSignature.create(RouteHookKind.Mutation, false, true, 'CreateUserForm')

    expect(withoutPayload.payloadMode).toBe(RoutePayloadMode.None)
    expect(withoutPayload.parameterDeclaration).toBe('')

    expect(withPayload.payloadMode).toBe(RoutePayloadMode.Required)
    expect(withPayload.parameterDeclaration).toBe('payload: CreateUserForm')
  })

  test('7. Pure functional signature builder folds declarations into TypeScript hook definition without branching', () => {
    const signatures = [
      ScannedRouteExecutionSignature.noPayload(),
      ScannedRouteExecutionSignature.requiredPayload('CreateProductForm'),
      ScannedRouteExecutionSignature.optionalPayload('SearchFilters')
    ]

    const hookSignatures = signatures.map(sig => matchRouteExecutionSignature(sig, {
      none: () => '() => void',
      required: (s) => `(${s.parameterDeclaration}) => void`,
      optional: (s) => `(${s.parameterDeclaration}) => void`
    }))

    expect(hookSignatures).toEqual([
      '() => void',
      '(payload: CreateProductForm) => void',
      '(payload: SearchFilters = {}) => void'
    ])
  })
})
