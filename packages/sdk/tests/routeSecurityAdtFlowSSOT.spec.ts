import { describe, test, expect } from 'vitest'
import {
    matchRouteSecurity,
    SECURITY_SCHEME_REGISTRY,
    SecuritySchemeKind,
    RouteSecurityDescriptor,
    ScannedRouteSecurityDescriptor
} from '../../core/src'

describe('RouteSecurity ADT Flow SSOT (Zero-if Catamorphism Suite)', () => {
    test('1. matchRouteSecurity executes pure catamorphism for Sanctum scheme', () => {
        const security = ScannedRouteSecurityDescriptor.create({
            isProtected: true,
            scheme: SecuritySchemeKind.Sanctum,
            guards: ['sanctum'],
            abilities: ['read:orders', 'write:orders']
        })

        const headerConfig = matchRouteSecurity(security, {
            sanctum: (sec) => `SANCTUM:${sec.guards.join(',')}:${sec.abilities.join('|')}`,
            bearer: (sec) => `BEARER:${sec.guards.join(',')}`,
            cookie: () => 'COOKIE:withCredentials',
            public: () => 'PUBLIC'
        })

        expect(headerConfig).toBe('SANCTUM:sanctum:read:orders|write:orders')
    })

    test('2. matchRouteSecurity executes pure catamorphism for Bearer scheme', () => {
        const security = ScannedRouteSecurityDescriptor.create({
            isProtected: true,
            scheme: SecuritySchemeKind.Bearer,
            guards: ['api'],
            abilities: []
        })

        const headerConfig = matchRouteSecurity(security, {
            sanctum: () => 'SANCTUM',
            bearer: (sec) => `BEARER:${sec.guards[0]}`,
            cookie: () => 'COOKIE',
            public: () => 'PUBLIC'
        })

        expect(headerConfig).toBe('BEARER:api')
    })

    test('3. matchRouteSecurity executes pure catamorphism for Cookie scheme', () => {
        const security = ScannedRouteSecurityDescriptor.create({
            isProtected: true,
            scheme: SecuritySchemeKind.Cookie,
            guards: ['web'],
            abilities: []
        })

        const headerConfig = matchRouteSecurity(security, {
            sanctum: () => 'SANCTUM',
            bearer: () => 'BEARER',
            cookie: () => 'COOKIE:withCredentials',
            public: () => 'PUBLIC'
        })

        expect(headerConfig).toBe('COOKIE:withCredentials')
    })

    test('4. matchRouteSecurity executes pure catamorphism for Public scheme', () => {
        const security = ScannedRouteSecurityDescriptor.public()

        const headerConfig = matchRouteSecurity(security, {
            sanctum: () => 'AUTH:SANCTUM',
            bearer: () => 'AUTH:BEARER',
            cookie: () => 'AUTH:COOKIE',
            public: () => 'NO_AUTH'
        })

        expect(headerConfig).toBe('NO_AUTH')
    })

    test('5. SECURITY_SCHEME_REGISTRY enforces metadata specifications for all SecuritySchemeKinds', () => {
        expect(Object.isFrozen(SECURITY_SCHEME_REGISTRY)).toBe(true)

        expect(SECURITY_SCHEME_REGISTRY[SecuritySchemeKind.Sanctum]).toEqual({
            scheme: 'sanctum',
            isProtected: true,
            requiresAuthorizationHeader: true,
            defaultHeaderName: 'Authorization'
        })

        expect(SECURITY_SCHEME_REGISTRY[SecuritySchemeKind.Bearer]).toEqual({
            scheme: 'bearer',
            isProtected: true,
            requiresAuthorizationHeader: true,
            defaultHeaderName: 'Authorization'
        })

        expect(SECURITY_SCHEME_REGISTRY[SecuritySchemeKind.Cookie]).toEqual({
            scheme: 'cookie',
            isProtected: true,
            requiresAuthorizationHeader: false,
            defaultHeaderName: null
        })

        expect(SECURITY_SCHEME_REGISTRY[SecuritySchemeKind.Public]).toEqual({
            scheme: 'public',
            isProtected: false,
            requiresAuthorizationHeader: false,
            defaultHeaderName: null
        })
    })
})
