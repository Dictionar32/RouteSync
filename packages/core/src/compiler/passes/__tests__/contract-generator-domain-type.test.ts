import { describe, test, expectTypeOf } from 'vitest'
import type {
    ContractActionGeneratorLike,
    ContractCodeBuilderLike,
    ResponseActionBuilderLike,
    ContractGeneratorDependencies,
    ResourceContract,
    ResourceContractCollection,
    ActionResponseSchemaCollection,
    GeneratedContractCode,
    ResponseFieldConversionResult,
    ExtractedResponseSchemaResult
} from '../contract-generator-domain'
import type { FieldCollection } from '../../domain/common/FieldCollection'
import type { GeneratedContractArtifact } from '../../artifacts/GeneratedContractArtifact'

describe('ContractGenerator Domain Type Contract Assertions', () => {
    test('1. ResourceContractCollection extends generic FieldCollection<ResourceContract>', () => {
        expectTypeOf<ResourceContractCollection>().toMatchTypeOf<FieldCollection<ResourceContract>>()
    })

    test('2. ActionResponseSchemaCollection extends generic FieldCollection<ActionResponseSchema>', () => {
        expectTypeOf<ActionResponseSchemaCollection>().toMatchTypeOf<FieldCollection<import('../../generators/contract-generation/ResponseActionBuilder').ActionResponseSchema>>()
    })

    test('3. Capability Interfaces decouple pass from concrete classes', () => {
        expectTypeOf<ContractActionGeneratorLike>().toHaveProperty('generateAction')
        expectTypeOf<ContractCodeBuilderLike>().toHaveProperty('buildContractFile')
        expectTypeOf<ResponseActionBuilderLike>().toHaveProperty('buildShowSchema')
        expectTypeOf<ResponseActionBuilderLike>().toHaveProperty('buildIndexSchema')
    })

    test('4. Complete ContractGeneratorDependencies requires all 4 capabilities', () => {
        expectTypeOf<ContractGeneratorDependencies>().toHaveProperty('schemaMapper')
        expectTypeOf<ContractGeneratorDependencies>().toHaveProperty('actionGenerator')
        expectTypeOf<ContractGeneratorDependencies>().toHaveProperty('codeBuilder')
        expectTypeOf<ContractGeneratorDependencies>().toHaveProperty('responseActionBuilder')

        expectTypeOf<ContractGeneratorDependencies['schemaMapper']>().not.toEqualTypeOf<undefined>()
        expectTypeOf<ContractGeneratorDependencies['actionGenerator']>().not.toEqualTypeOf<undefined>()
        expectTypeOf<ContractGeneratorDependencies['codeBuilder']>().not.toEqualTypeOf<undefined>()
        expectTypeOf<ContractGeneratorDependencies['responseActionBuilder']>().not.toEqualTypeOf<undefined>()
    })

    test('5. Observable Result Containers guarantee explicit fields and warnings', () => {
        expectTypeOf<ResponseFieldConversionResult>().toHaveProperty('fields')
        expectTypeOf<ResponseFieldConversionResult>().toHaveProperty('warnings')

        expectTypeOf<ExtractedResponseSchemaResult>().toHaveProperty('fields')
        expectTypeOf<ExtractedResponseSchemaResult>().toHaveProperty('warnings')
    })
})
