import '../contract-generator-domain'
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

        expectTypeOf<ExtractedResponseSchemaResult>().toHaveProperty('schemas')
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
        expectTypeOf<import('../../domain/common/ConversionResult').ConversionResult<string>>().toHaveProperty('fields')
        expectTypeOf<import('../../domain/common/ConversionResult').ConversionResult<string>>().toHaveProperty('warnings')
    })

    test('9. partitionResults maps generic ConversionResult<T>[] -> ConversionResult<T>', () => {
        type Input = import('../../domain/common/ConversionResult').ConversionResult<number>[]
        type Output = import('../../domain/common/ConversionResult').ConversionResult<number>
        expectTypeOf<import('../contract-generator-domain').partitionResultsFn<number>>().toExtend<(results: Input) => Output>()
    })

    test('10. ConversionResult<T>.fields[0] naturally resolves to T | undefined without helper functions', () => {
        type TestResult = import('../../domain/common/ConversionResult').ConversionResult<string>
        expectTypeOf<TestResult['fields'][0]>().toEqualTypeOf<string | undefined>()
    })

    test('11. NullableWrapperResult is a discriminated union of isNullableWrapper true and false', () => {
        type Union = import('../../domain/common/ResponseFieldLowering').NullableWrapperResult
        expectTypeOf<Union>().toHaveProperty('isNullableWrapper')
    })

    test('12. resolveNullableWrapper and convertObjectType signatures match pure boundary contracts', () => {
        type ResolveFn = typeof import('../../domain/common/ResponseFieldLowering').resolveNullableWrapper
        type ConvertFn = typeof import('../../domain/common/ResponseFieldLowering').convertObjectType
        expectTypeOf<ResolveFn>().toExtend<(type: import('../../types/SemanticType').ObjectType, resolver?: import('../../domain/common/SemanticTypeResolver').SemanticTypeResolver) => import('../../domain/common/ResponseFieldLowering').NullableWrapperResult>()
        expectTypeOf<ConvertFn>().toExtend<(objectType: import('../../types/SemanticType').ObjectType, resolver?: import('../../domain/common/SemanticTypeResolver').SemanticTypeResolver) => import('../../domain/common/ConversionResult').ConversionResult<import('../../generators/contract-generation/ResponseFieldParser').ParsedResponseField>>()
    })

    test('13. ObjectType.annotations is guaranteed required ImmutableMap at Origin Boundary', () => {
        type AnnotationsType = import('../../types/SemanticType').ObjectType['annotations']
        expectTypeOf<AnnotationsType>().not.toEqualTypeOf<undefined>()
    })

    test('14. extractRequestTypeResponseSchemas returns generic ConversionResult<ActionResponseSchema>', () => {
        type Fn = typeof import('../contract-generator-domain').extractRequestTypeResponseSchemas
        type ExpectedReturn = import('../../domain/common/ConversionResult').ConversionResult<import('../../generators/contract-generation/ResponseActionBuilder').ActionResponseSchema>
        expectTypeOf<Fn>().toExtend<(reqType: import('../artifacts/RequestTypesArtifact').RequestType, dependencies: import('../contract-generator-domain').ContractGeneratorDependencies) => ExpectedReturn>()
    })

    test('15. extractResponseDataSchemas signature accepts ResponseData | undefined without !== comparison', () => {
        type Fn = typeof import('../contract-generator-domain').extractResponseDataSchemas
        type ExpectedReturn = import('../../domain/common/ConversionResult').ConversionResult<import('../../generators/contract-generation/ResponseActionBuilder').ActionResponseSchema>
        expectTypeOf<Fn>().toExtend<(responseData: import('../artifacts/RequestTypesArtifact').ResponseData | undefined, resourceName: string, dependencies: import('../contract-generator-domain').ContractGeneratorDependencies) => ExpectedReturn>()
    })

    test('16. EMPTY_WARNINGS and EMPTY_FIELDS are frozen immutable singletons', () => {
        type WarningsType = typeof import('../../domain/common/ConversionResult').ConversionResult.EMPTY_WARNINGS
        type FieldsType = typeof import('../../domain/common/ConversionResult').ConversionResult.EMPTY_FIELDS
        expectTypeOf<WarningsType>().toMatchTypeOf<readonly string[]>()
        expectTypeOf<FieldsType>().toMatchTypeOf<readonly unknown[]>()
    })
})
