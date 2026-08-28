import { describe, test, expect } from 'vitest'
import { createArtifact, isArtifactOfKind } from '../ArtifactContract'
import type { Artifact, ArtifactMetadata } from '../ArtifactContract'

function sampleMetadata(producer: string): ArtifactMetadata {
    return {
        hash: 'hash-abc',
        producer,
        dependencies: ['RequestTypes'],
        timestamp: 1000,
        revision: '1.0.0'
    }
}

describe('Cross-Flow Shared Artifact Contract Flow Operations', () => {
    test('createArtifact should construct valid generic Artifact instance', () => {
        const artifact = createArtifact(
            'GeneratedApiField',
            { code: 'export const ApiApiField = {} as const\n' },
            sampleMetadata('ApiFieldGenerator')
        )

        expect(artifact.typeId).toBe('GeneratedApiField')
        expect(artifact.data.code).toContain('ApiApiField')
        expect(artifact.metadata.producer).toBe('ApiFieldGenerator')
    })

    test('isArtifactOfKind should act as a type guard for filtering artifacts across pipeline passes', () => {
        const artifacts: Artifact<string, { readonly code: string }>[] = [
            createArtifact('GeneratedApiField', { code: 'field' }, sampleMetadata('ApiFieldPass')),
            createArtifact('GeneratedContract', { code: 'contract' }, sampleMetadata('ContractPass')),
            createArtifact('GeneratedForm', { code: 'form' }, sampleMetadata('FormPass'))
        ]

        // Filter artifacts by kind using isArtifactOfKind type guard
        const apiFieldArtifacts = artifacts.filter((art) => isArtifactOfKind(art, 'GeneratedApiField'))
        const contractArtifacts = artifacts.filter((art) => isArtifactOfKind(art, 'GeneratedContract'))

        expect(apiFieldArtifacts).toHaveLength(1)
        expect(apiFieldArtifacts[0].data.code).toBe('field')

        expect(contractArtifacts).toHaveLength(1)
        expect(contractArtifacts[0].data.code).toBe('contract')
    })
})
