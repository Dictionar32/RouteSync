import { describe, test, expect, expectTypeOf } from 'vitest'
import type { RequestTypesArtifact, RequestType } from '../../artifacts/RequestTypesArtifact'
import {
    PrimitiveKind,
    PrimitiveType,
    ReferenceType,
    ReadonlyCollectionType,
    CollectionKind,
    ObjectType,
    ErrorType,
    type SemanticType
} from '../../types/SemanticType'
import { ImmutableMap, ImmutableSet } from '../../utils/ImmutableCollections'
import {
    createContractGeneratorDependencies,
    extractRequestContracts,
    extractResponseSchemas,
    convertResponseFields,
    convertSingleResponseField,
    type ContractGeneratorDependencies,
    type ContractActionGeneratorLike,
    type ContractCodeBuilderLike,
    type ResponseActionBuilderLike,
    type ResponseFieldConversionResult
} from '../contract-generator-domain'
import { ContractSchemaMapper } from '../../generators/contract-generation/ContractSchemaMapper'
import { ContractActionGenerator } from '../../generators/contract-generation/ContractActionGenerator'
import { ContractCodeBuilder } from '../../generators/contract-generation/ContractCodeBuilder'
import { ResponseActionBuilder } from '../../generators/contract-generation/ResponseActionBuilder'
import { ResponseSchemaMapper } from '../../generators/contract-generation/ResponseSchemaMapper'

describe('Comprehensive TDD Test Suite for 5 Audit Findings', () => {

    // ========================================================================
    // AUDIT 1: || [] Contract Guarantee Audit
    // ========================================================================
    describe('Audit 1: RequestTypesArtifact Contract Guarantee', () => {
        test('RequestTypesArtifact.requestTypes is guaranteed required (not optional)', () => {
            expectTypeOf<RequestTypesArtifact['requestTypes']>().not.toEqualTypeOf<undefined>()
            expectTypeOf<RequestTypesArtifact['requestTypes']>().toEqualTypeOf<readonly RequestType[]>()
        })

        test('extractRequestContracts processes artifact directly without requiring || [] defensive fallback', () => {
            const artifact: RequestTypesArtifact = {
                typeId: 'RequestTypes',
                metadata: { hash: 'hash1', producer: 'test', dependencies: [], timestamp: Date.now(), revision: '1.0' },
                requestTypes: [
                    {
                        resourceName: 'User',
                        formTypeName: 'UserForm',
                        actions: [
                            {
                                name: 'create',
                                fields: [
                                    {
                                        originalName: 'email',
                                        transformedName: 'email',
                                        type: new PrimitiveType(PrimitiveKind.STRING),
                                        required: true,
                                        nullable: false
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }

            const actionGenerator = new ContractActionGenerator(new ContractSchemaMapper())
            const result = extractRequestContracts(artifact, actionGenerator)

            expect(result.fields).toHaveLength(1)
            expect(result.fields[0].resourceName).toBe('User')
            expect(result.fields[0].actions).toHaveLength(1)
        })
    })

    // ========================================================================
    // AUDIT 2: Eliminating Silent catch {} & Observable Conversion Result
    // ========================================================================
    describe('Audit 2: Observable ResponseFieldConversionResult (No Silent catch {})', () => {
        test('convertResponseFields returns explicit ResponseFieldConversionResult with fields and warnings', () => {
            const fields: Record<string, SemanticType> = {
                id: new PrimitiveType(PrimitiveKind.NUMBER),
                name: new PrimitiveType(PrimitiveKind.STRING)
            }

            const result: ResponseFieldConversionResult = convertResponseFields(fields)

            expect(result).toHaveProperty('fields')
            expect(result).toHaveProperty('warnings')
            expect(result.fields).toHaveLength(2)
            expect(result.warnings).toHaveLength(0)
        })

        test('convertResponseFields captures warnings explicitly instead of silently swallowing errors', () => {
            const fields: Record<string, SemanticType> = {
                validField: new PrimitiveType(PrimitiveKind.STRING),
                invalidField: new ErrorType('Field type could not be resolved')
            }

            const result = convertResponseFields(fields)

            expect(result.fields).toHaveLength(1)
            expect(result.fields[0].name).toBe('validField')
            expect(result.warnings.length).toBeGreaterThan(0)
            expect(result.warnings[0]).toContain('invalidField')
        })

        test('extractResponseSchemas returns observable warnings when schema extraction encounters skipped fields', () => {
            const requestTypesArtifact: RequestTypesArtifact = {
                typeId: 'RequestTypes',
                metadata: { hash: 'hash1', producer: 'test', dependencies: [], timestamp: Date.now(), revision: '1.0' },
                requestTypes: [
                    {
                        resourceName: 'Product',
                        formTypeName: 'ProductForm',
                        actions: [],
                        responseData: {
                            resourceName: 'Product',
                            fields: {
                                validField: new PrimitiveType(PrimitiveKind.STRING),
                                invalidField: new ErrorType('Field type could not be resolved')
                            }
                        }
                    }
                ]
            }

            const responseBuilder = new ResponseActionBuilder(new ResponseSchemaMapper())
            const result = extractResponseSchemas(requestTypesArtifact, responseBuilder)

            expect(result.fields.fields).toHaveLength(2)
            expect(result.warnings.length).toBeGreaterThan(0)
            expect(result.warnings[0]).toContain('invalidField')
        })
    })

    // ========================================================================
    // AUDIT 3: convertSingleResponseField Pattern Matching on SemanticType.kind
    // ========================================================================
    describe('Audit 3: convertSingleResponseField Pattern Matching on SemanticType.kind', () => {
        test('matches "primitive" kind correctly', () => {
            const semanticType: SemanticType = new PrimitiveType(PrimitiveKind.STRING)
            const result = convertSingleResponseField('title', semanticType)

            expect(result.fields).toHaveLength(1)
            expect(result.fields[0].name).toBe('title')
            expect(result.fields[0].kind).toBe('primitive')
            expect(result.fields[0].type).toBe('string')
            expect(result.fields[0].nullable).toBe(false)
            expect(result.warnings).toHaveLength(0)
        })

        test('matches "nullable_wrapper" object annotation correctly', () => {
            const annotations = new ImmutableMap(new Map<string, string>([['kind', 'nullable_wrapper']]))
            const innerType: SemanticType = new PrimitiveType(PrimitiveKind.NUMBER)
            const properties = new ImmutableMap(new Map<string, SemanticType>([['__value', innerType]]))

            const semanticType = new ObjectType(
                properties,
                new ImmutableSet(new Set(['__value'])),
                undefined,
                [],
                annotations
            )
            const result = convertSingleResponseField('age', semanticType)

            expect(result.fields).toHaveLength(1)
            expect(result.fields[0].name).toBe('age')
            expect(result.fields[0].type).toBe('number')
            expect(result.fields[0].nullable).toBe(true)
            expect(result.warnings).toHaveLength(0)
        })

        test('matches "readonly_collection" / "mutable_collection" array kind correctly', () => {
            const semanticType: SemanticType = new ReadonlyCollectionType(
                CollectionKind.ARRAY,
                new PrimitiveType(PrimitiveKind.STRING)
            )

            const result = convertSingleResponseField('tags', semanticType)

            expect(result.fields).toHaveLength(1)
            expect(result.fields[0].name).toBe('tags')
            expect(result.fields[0].kind).toBe('array')
            expect(result.fields[0].type).toBe('array')
            expect(result.fields[0].itemType).toBeDefined()
            expect(result.fields[0].itemType?.type).toBe('string')
            expect(result.warnings).toHaveLength(0)
        })

        test('matches "reference" kind correctly', () => {
            const semanticType: SemanticType = new ReferenceType('App\\Http\\Resources', 'CategoryResource')
            const result = convertSingleResponseField('category', semanticType)

            expect(result.fields).toHaveLength(1)
            expect(result.fields[0].name).toBe('category')
            expect(result.fields[0].kind).toBe('primitive')
            expect(result.fields[0].type).toBe('CategoryResource')
            expect(result.warnings).toHaveLength(0)
        })
    })

    // ========================================================================
    // AUDIT 4: Capability Interfaces for Dependency Inversion
    // ========================================================================
    describe('Audit 4: Capability Interfaces Decoupling', () => {
        test('ContractGeneratorDependencies works with mock objects implementing capability interfaces', () => {
            const mockActionGenerator: ContractActionGeneratorLike = {
                generateAction: (actionName, fields) => ({
                    name: actionName,
                    schemaLines: ['z.object({})'],
                    typeLines: ['export type X = {}'],
                    fieldCount: fields.length
                })
            }

            const mockCodeBuilder: ContractCodeBuilderLike = {
                buildContractFile: (contracts, schemas) => ({
                    code: '// mock code',
                    contractCount: contracts.length,
                    lineCount: 1
                })
            }

            const mockResponseBuilder: ResponseActionBuilderLike = {
                buildShowSchema: (res) => ({
                    resourceName: res,
                    schemaName: `${res}ShowSchema`,
                    zodSchema: 'z.object({})',
                    action: 'show',
                    schemaCode: ''
                }),
                buildIndexSchema: (res, show) => ({
                    resourceName: res,
                    schemaName: `${res}IndexSchema`,
                    zodSchema: 'z.object({})',
                    action: 'index',
                    schemaCode: ''
                })
            }

            const deps: ContractGeneratorDependencies = createContractGeneratorDependencies({
                actionGenerator: mockActionGenerator,
                codeBuilder: mockCodeBuilder,
                responseActionBuilder: mockResponseBuilder
            })

            expect(deps.actionGenerator).toBe(mockActionGenerator)
            expect(deps.codeBuilder).toBe(mockCodeBuilder)
            expect(deps.responseActionBuilder).toBe(mockResponseBuilder)
        })
    })

    // ========================================================================
    // AUDIT 5: Dependency Graph Resolution (schemaMapper -> actionGenerator)
    // ========================================================================
    describe('Audit 5: Dependency Graph Origin Resolution', () => {
        test('custom schemaMapper is supplied to actionGenerator during origin resolution', () => {
            const customMapper = new ContractSchemaMapper()
            const deps = createContractGeneratorDependencies({ schemaMapper: customMapper })

            expect(deps.schemaMapper).toBe(customMapper)
            expect(deps.actionGenerator).toBeInstanceOf(ContractActionGenerator)
        })
    })
})
