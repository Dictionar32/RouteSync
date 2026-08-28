import { describe, test, expect, expectTypeOf } from 'vitest'
import type { Artifact, ArtifactMetadata } from '../ArtifactContract'

// Specific RouteSync artifact type definitions built using shared Artifact<TKind, TData>
type ApiFieldArtifact = Artifact<'GeneratedApiField', { readonly code: string }>
type ContractArtifact = Artifact<'GeneratedContract', { readonly code: string }>
type FormArtifact = Artifact<'GeneratedForm', { readonly code: string }>
type MapperArtifact = Artifact<'GeneratedMapper', { readonly code: string }>
type ApiReadArtifact = Artifact<'GeneratedApiRead', { readonly code: string }>

function createSampleMetadata(producer: string): ArtifactMetadata {
    return {
        hash: 'hash-123',
        producer,
        dependencies: ['RequestTypes'],
        timestamp: Date.now(),
        revision: '1.0.0'
    }
}

describe('Cross-Flow Shared Artifact Contract Type Assertions', () => {
    test('Artifact<TKind, TData> should create type-safe contracts for GeneratedApiField', () => {
        const artifact: ApiFieldArtifact = {
            typeId: 'GeneratedApiField',
            data: { code: 'export const ApiApiField = {} as const\n' },
            metadata: createSampleMetadata('ApiFieldGenerator')
        }

        expect(artifact.typeId).toBe('GeneratedApiField')
        expect(artifact.data.code).toContain('ApiApiField')
        expectTypeOf(artifact).toMatchTypeOf<Artifact<'GeneratedApiField', { readonly code: string }>>()
    })

    test('Artifact<TKind, TData> should create type-safe contracts for GeneratedContract', () => {
        const artifact: ContractArtifact = {
            typeId: 'GeneratedContract',
            data: { code: 'export const loginContractSchema = z.object({})\n' },
            metadata: createSampleMetadata('ContractGenerator')
        }

        expect(artifact.typeId).toBe('GeneratedContract')
        expectTypeOf(artifact).toMatchTypeOf<Artifact<'GeneratedContract', { readonly code: string }>>()
    })

    test('Artifact<TKind, TData> should create type-safe contracts for Form and Mapper artifacts', () => {
        const formArtifact: FormArtifact = {
            typeId: 'GeneratedForm',
            data: { code: 'export type RegisterForm = {}\n' },
            metadata: createSampleMetadata('FormGenerator')
        }

        const mapperArtifact: MapperArtifact = {
            typeId: 'GeneratedMapper',
            data: { code: 'export function toOrderRead() {}\n' },
            metadata: createSampleMetadata('MapperGenerator')
        }

        expect(formArtifact.typeId).toBe('GeneratedForm')
        expect(mapperArtifact.typeId).toBe('GeneratedMapper')
        expectTypeOf(formArtifact).toMatchTypeOf<FormArtifact>()
        expectTypeOf(mapperArtifact).toMatchTypeOf<MapperArtifact>()
    })

    test('Union Artifact Type: Discriminated union by typeId across compiler passes', () => {
        type CompilerArtifact = ApiFieldArtifact | ContractArtifact | FormArtifact | MapperArtifact | ApiReadArtifact

        const artifacts: CompilerArtifact[] = [
            {
                typeId: 'GeneratedApiField',
                data: { code: 'field' },
                metadata: createSampleMetadata('ApiFieldGenerator')
            },
            {
                typeId: 'GeneratedContract',
                data: { code: 'contract' },
                metadata: createSampleMetadata('ContractGenerator')
            }
        ]

        // Type narrowing check using discriminated union key `typeId`
        const first = artifacts[0]
        if (first.typeId === 'GeneratedApiField') {
            expect(first.data.code).toBe('field')
        }
    })
})
