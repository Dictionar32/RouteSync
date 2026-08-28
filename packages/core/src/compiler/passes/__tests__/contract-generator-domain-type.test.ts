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

    test('6. ContractField vocabulary interface defines explicit field input contract', () => {
        expectTypeOf<import('../contract-generator-domain').ContractField>().toHaveProperty('name')
        expectTypeOf<import('../contract-generator-domain').ContractField>().toHaveProperty('type')
        expectTypeOf<import('../contract-generator-domain').ContractField>().toHaveProperty('required')
        expectTypeOf<import('../contract-generator-domain').ContractField>().toHaveProperty('nullable')
    })

    test('7. ResourceResponseSchemasResult guarantees tuple schemas and warnings', () => {
        expectTypeOf<import('../contract-generator-domain').ResourceResponseSchemasResult>().toHaveProperty('schemas')
        expectTypeOf<import('../contract-generator-domain').ResourceResponseSchemasResult>().toHaveProperty('warnings')
    })

    test('8. ConversionResult<T> generic SSOT vocabulary container guarantees fields array and warnings array', () => {
        expectTypeOf<import('../contract-generator-domain').ConversionResult<string>>().toHaveProperty('fields')
        expectTypeOf<import('../contract-generator-domain').ConversionResult<string>>().toHaveProperty('warnings')
        expectTypeOf<import('../contract-generator-domain').ConversionResult<string>['fields']>().toEqualTypeOf<readonly string[]>()
        expectTypeOf<import('../contract-generator-domain').ConversionResult<string>['warnings']>().toEqualTypeOf<readonly string[]>()
    })

    test('9. partitionResults maps generic ConversionResult<T>[] -> ConversionResult<T>', () => {
        expectTypeOf<typeof import('../contract-generator-domain').partitionResults>().toEqualTypeOf<<T>(results: readonly import('../contract-generator-domain').ConversionResult<T>[]) => import('../contract-generator-domain').ConversionResult<T>>()
    })

    test('10. ConversionResult<T>.fields[0] naturally resolves to T | undefined without helper functions', () => {
        expectTypeOf<import('../contract-generator-domain').ConversionResult<import('../../generators/contract-generation/ResponseFieldParser').ParsedResponseField>['fields'][0]>()
            .toEqualTypeOf<import('../../generators/contract-generation/ResponseFieldParser').ParsedResponseField | undefined>()
    })

    test('11. NullableWrapperResult is a discriminated union of isNullableWrapper true and false', () => {
        expectTypeOf<import('../contract-generator-domain').NullableWrapperResult>().toHaveProperty('isNullableWrapper')
    })

    test('12. resolveNullableWrapper and convertObjectType signatures match pure boundary contracts', () => {
        expectTypeOf<typeof import('../contract-generator-domain').resolveNullableWrapper>().toEqualTypeOf<(fieldName: string, objectType: import('../../types/SemanticType').ObjectType) => import('../contract-generator-domain').NullableWrapperResult>()
        expectTypeOf<typeof import('../contract-generator-domain').convertObjectType>().toEqualTypeOf<(fieldName: string, objectType: import('../../types/SemanticType').ObjectType) => import('../contract-generator-domain').ConversionResult<import('../../generators/contract-generation/ResponseFieldParser').ParsedResponseField>>()
    })

    test('13. ObjectType.annotations is guaranteed required ImmutableMap at Origin Boundary', () => {
        expectTypeOf<import('../../types/SemanticType').ObjectType>().toHaveProperty('annotations')
        expectTypeOf<import('../../types/SemanticType').ObjectType['annotations']>().toEqualTypeOf<import('../../utils/ImmutableCollections').ImmutableMap<string, string>>()
    })

    test('14. extractRequestTypeResponseSchemas returns generic ConversionResult<ActionResponseSchema>', () => {
        expectTypeOf<typeof import('../contract-generator-domain').extractRequestTypeResponseSchemas>().toEqualTypeOf<(requestType: import('../../artifacts/RequestTypesArtifact').RequestType, responseActionBuilder: import('../contract-generator-domain').ResponseActionBuilderLike) => import('../contract-generator-domain').ConversionResult<import('../../generators/contract-generation/ResponseActionBuilder').ActionResponseSchema>>()
    })

    test('15. extractResponseDataSchemas signature accepts ResponseData | undefined without !== comparison', () => {
        expectTypeOf<typeof import('../contract-generator-domain').extractResponseDataSchemas>().toEqualTypeOf<(responseData: import('../../artifacts/RequestTypesArtifact').ResponseData | undefined, responseActionBuilder: import('../contract-generator-domain').ResponseActionBuilderLike) => import('../contract-generator-domain').ConversionResult<import('../../generators/contract-generation/ResponseActionBuilder').ActionResponseSchema>>()
    })

    test('16. EMPTY_WARNINGS and EMPTY_FIELDS are frozen immutable singletons', () => {
        expectTypeOf<typeof import('../contract-generator-domain').EMPTY_WARNINGS>().toEqualTypeOf<readonly string[]>()
        expectTypeOf<typeof import('../contract-generator-domain').EMPTY_FIELDS>().toEqualTypeOf<readonly never[]>()
        expect(Object.isFrozen(import('../contract-generator-domain').EMPTY_WARNINGS)).toBe(true)
        expect(Object.isFrozen(import('../contract-generator-domain').EMPTY_FIELDS)).toBe(true)
    })
})
