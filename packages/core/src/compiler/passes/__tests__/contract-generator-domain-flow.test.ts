import { describe, test, expect } from 'vitest'
import type { RequestTypesArtifact } from '../../artifacts/RequestTypesArtifact'
import {
    PrimitiveKind,
    PrimitiveType,
    ReferenceType,
    ObjectType,
    type SemanticType
} from '../../types/SemanticType'
import { ImmutableMap, ImmutableSet } from '../../utils/ImmutableCollections'
import {
    extractRequestContracts,
    extractResponseSchemas,
    formatContractFile,
    buildContractArtifact,
    convertSingleResponseField,
    convertResponseFields,
    mapContractField,
    generateContractAction,
    extractResourceContract,
    buildResourceResponseSchemas,
    extractSingleResourceResponseSchemas,
    partitionFieldResults,
    extractItemType,
    resolveNullableWrapper,
    convertObjectType,
    extractRequestTypeResponseSchemas,
    partitionResponseSchemaResults,
    extractResponseDataSchemas
} from '../contract-generator-domain'
import { ContractActionGenerator } from '../../generators/contract-generation/ContractActionGenerator'
import { ContractSchemaMapper } from '../../generators/contract-generation/ContractSchemaMapper'
import { ResponseActionBuilder } from '../../generators/contract-generation/ResponseActionBuilder'
import { ResponseSchemaMapper } from '../../generators/contract-generation/ResponseSchemaMapper'
import { ContractCodeBuilder } from '../../generators/contract-generation/ContractCodeBuilder'

describe('ContractGenerator Domain Stage-by-Stage Flow Boundary Tests', () => {

    const sampleArtifact: RequestTypesArtifact = {
        typeId: 'RequestTypes',
        metadata: { hash: 'hash123', producer: 'test', dependencies: [], timestamp: Date.now(), revision: '1.0' },
        requestTypes: [
            {
                resourceName: 'User',
                formTypeName: 'UserForm',
                actions: [
                    {
                        name: 'create',
                        fields: [
                            {
                                originalName: 'username',
                                transformedName: 'username',
                                type: new PrimitiveType(PrimitiveKind.STRING),
                                required: true,
                                nullable: false
                            }
                        ]
                    }
                ],
                responseData: {
                    resourceName: 'User',
                    fields: {
                        id: new PrimitiveType(PrimitiveKind.NUMBER),
                        name: new PrimitiveType(PrimitiveKind.STRING)
                    }
                }
            }
        ]
    }

    test('Granular Flow 1a: mapContractField maps RequestField -> ContractField', () => {
        const field: import('../../artifacts/RequestTypesArtifact').RequestField = {
            originalName: 'email_address',
            transformedName: 'emailAddress',
            type: new PrimitiveType(PrimitiveKind.STRING),
            required: true,
            nullable: false
        }

        const contractField = mapContractField(field)

        expect(contractField.name).toBe('email_address')
        expect(contractField.required).toBe(true)
        expect(contractField.nullable).toBe(false)
    })

    test('Granular Flow 1b: generateContractAction maps FormAction -> GeneratedContractAction', () => {
        const actionGenerator = new ContractActionGenerator(new ContractSchemaMapper())
        const action: import('../../artifacts/RequestTypesArtifact').FormAction = {
            name: 'create',
            fields: [
                {
                    originalName: 'username',
                    transformedName: 'username',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: true,
                    nullable: false
                }
            ]
        }

        const generatedAction = generateContractAction(action, actionGenerator)

        expect(generatedAction.name).toBe('create')
        expect(generatedAction.fieldCount).toBe(1)
    })

    test('Granular Flow 1c: extractResourceContract maps RequestType -> ResourceContract', () => {
        const actionGenerator = new ContractActionGenerator(new ContractSchemaMapper())
        const requestType = sampleArtifact.requestTypes[0]

        const resourceContract = extractResourceContract(requestType, actionGenerator)

        expect(resourceContract.resourceName).toBe('User')
        expect(resourceContract.actions).toHaveLength(1)
    })

    test('Stage 1: extractRequestContracts transforms RequestTypesArtifact -> ResourceContractCollection', () => {
        const actionGenerator = new ContractActionGenerator(new ContractSchemaMapper())
        const contracts = extractRequestContracts(sampleArtifact, actionGenerator)

        expect(contracts.fields).toHaveLength(1)
        expect(contracts.fields[0].resourceName).toBe('User')
        expect(contracts.fields[0].actions).toHaveLength(1)
        expect(contracts.fields[0].actions[0].name).toBe('create')
    })

    test('Granular Flow 2a: buildResourceResponseSchemas builds pure [showSchema, indexSchema] tuple without try-catch', () => {
        const responseBuilder = new ResponseActionBuilder(new ResponseSchemaMapper())
        const parsedFields = [
            { name: 'id', kind: 'primitive' as const, type: 'number', nullable: false, optional: false },
            { name: 'name', kind: 'primitive' as const, type: 'string', nullable: false, optional: false }
        ]

        const schemas = buildResourceResponseSchemas('Product', parsedFields, responseBuilder)

        expect(schemas).toHaveLength(2)
        expect(schemas[0].schemaName).toBe('productShowSchema')
        expect(schemas[1].schemaName).toBe('productIndexSchema')
    })

    test('Granular Flow 2b: extractSingleResourceResponseSchemas maps ResponseData -> ResourceResponseSchemasResult', () => {
        const responseBuilder = new ResponseActionBuilder(new ResponseSchemaMapper())
        const responseData = sampleArtifact.requestTypes[0].responseData!

        const result = extractSingleResourceResponseSchemas(responseData, responseBuilder)

        expect(result.schemas).toHaveLength(2)
        expect(result.schemas[0].schemaName).toBe('userShowSchema')
        expect(result.schemas[1].schemaName).toBe('userIndexSchema')
        expect(result.warnings).toEqual([])
    })

    test('Stage 2: extractResponseSchemas transforms RequestTypesArtifact -> ExtractedResponseSchemaResult', () => {
        const responseBuilder = new ResponseActionBuilder(new ResponseSchemaMapper())
        const result = extractResponseSchemas(sampleArtifact, responseBuilder)

        expect(result.fields.fields).toHaveLength(2) // show & index schemas
        expect(result.fields.fields[0].schemaName).toBe('userShowSchema')
        expect(result.fields.fields[1].schemaName).toBe('userIndexSchema')
        expect(result.warnings).toEqual([])
    })

    test('Stage 3: formatContractFile transforms collections -> GeneratedContractCode', () => {
        const actionGenerator = new ContractActionGenerator(new ContractSchemaMapper())
        const responseBuilder = new ResponseActionBuilder(new ResponseSchemaMapper())
        const codeBuilder = new ContractCodeBuilder()

        const contracts = extractRequestContracts(sampleArtifact, actionGenerator)
        const responseResult = extractResponseSchemas(sampleArtifact, responseBuilder)

        const builtCode = formatContractFile(contracts, responseResult.fields, codeBuilder)

        expect(builtCode.code).toContain('export const UserContractSchema')
        expect(builtCode.code).toContain('export const userShowSchema')
        expect(builtCode.contractCount).toBe(1) // 1 request contract resource
        expect(builtCode.lineCount).toBeGreaterThan(0)
    })

    test('Stage 4: buildContractArtifact packages GeneratedContractCode -> GeneratedContractArtifact', () => {
        const actionGenerator = new ContractActionGenerator(new ContractSchemaMapper())
        const responseBuilder = new ResponseActionBuilder(new ResponseSchemaMapper())
        const codeBuilder = new ContractCodeBuilder()

        const contracts = extractRequestContracts(sampleArtifact, actionGenerator)
        const responseResult = extractResponseSchemas(sampleArtifact, responseBuilder)
        const builtCode = formatContractFile(contracts, responseResult.fields, codeBuilder)

        const artifact = buildContractArtifact(builtCode, contracts, responseResult.fields, 'ContractGenerator', responseResult.warnings)

        expect(artifact.typeId).toBe('GeneratedContract')
        expect(artifact.code).toBe(builtCode.code)
        expect(artifact.metadata.producer).toBe('ContractGenerator')
        expect(artifact.generationMetadata.contractCount).toBe(builtCode.contractCount)
    })

    test('Transformation Flow: convertSingleResponseField maps valid SemanticType to success result', () => {
        const annotations = new ImmutableMap(new Map<string, string>([['kind', 'nullable_wrapper']]))
        const innerType: SemanticType = new PrimitiveType(PrimitiveKind.NUMBER)
        const properties = new ImmutableMap(new Map<string, SemanticType>([['__value', innerType]]))

        const nullableObject = new ObjectType(properties, new ImmutableSet(new Set(['__value'])), undefined, [], annotations)

        const result = convertSingleResponseField('score', nullableObject)

        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.field.name).toBe('score')
            expect(result.field.type).toBe('number')
            expect(result.field.nullable).toBe(true)
        }
    })

    test('Transformation Flow: convertSingleResponseField returns failure result with observable warning for unsupported kind', () => {
        const unsupportedType = new (class extends (new PrimitiveType(PrimitiveKind.STRING).constructor as any) {
            readonly kind = 'unsupported_custom_kind'
        })()

        const result = convertSingleResponseField('badField', unsupportedType as any)

        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.warning).toContain('badField')
            expect(result.warning).toContain('unsupported_custom_kind')
        }
    })

    test('Transformation Flow: partitionFieldResults partitions SingleResponseFieldResult[] into fields and warnings via switch', () => {
        const results: readonly import('../contract-generator-domain').SingleResponseFieldResult[] = [
            {
                success: true,
                field: { name: 'id', kind: 'primitive', type: 'number', nullable: false, optional: false }
            },
            {
                success: false,
                warning: "Skipped field 'bad': unsupported"
            }
        ]

        const partitioned = partitionFieldResults(results)

        expect(partitioned.fields).toHaveLength(1)
        expect(partitioned.fields[0].name).toBe('id')
        expect(partitioned.warnings).toHaveLength(1)
        expect(partitioned.warnings[0]).toContain('bad')
    })

    test('Transformation Flow: extractItemType extracts field on success and undefined on failure without ternary', () => {
        const successRes: import('../contract-generator-domain').SingleResponseFieldResult = {
            success: true,
            field: { name: 'item', kind: 'primitive', type: 'string', nullable: false, optional: false }
        }
        const failRes: import('../contract-generator-domain').SingleResponseFieldResult = {
            success: false,
            warning: 'fail'
        }

        expect(extractItemType(successRes)).toEqual(successRes.field)
        expect(extractItemType(failRes)).toBeUndefined()
    })

    test('Transformation Flow: resolveNullableWrapper maps nullable_wrapper annotation to NullableWrapperResult via switch', () => {
        const annotations = new ImmutableMap(new Map<string, string>([['kind', 'nullable_wrapper']]))
        const innerType: SemanticType = new PrimitiveType(PrimitiveKind.STRING)
        const properties = new ImmutableMap(new Map<string, SemanticType>([['__value', innerType]]))

        const nullableObject = new ObjectType(properties, new ImmutableSet(new Set(['__value'])), undefined, [], annotations)

        const result = resolveNullableWrapper(nullableObject)
        expect(result.isNullableWrapper).toBe(true)
        if (result.isNullableWrapper) {
            expect(result.field.type).toBe('string')
            expect(result.field.nullable).toBe(true)
        }

        const plainObject = new ObjectType(new ImmutableMap(new Map()), new ImmutableSet(new Set()), undefined, [], undefined)
        const plainResult = resolveNullableWrapper(plainObject)
        expect(plainResult.isNullableWrapper).toBe(false)
    })

    test('Transformation Flow: convertObjectType converts nested object properties via map and partitionFieldResults without for-loop or if', () => {
        const prop1: SemanticType = new PrimitiveType(PrimitiveKind.NUMBER)
        const prop2: SemanticType = new PrimitiveType(PrimitiveKind.STRING)
        const properties = new ImmutableMap(new Map<string, SemanticType>([
            ['id', prop1],
            ['title', prop2]
        ]))

        const objectType = new ObjectType(properties, new ImmutableSet(new Set(['id', 'title'])))

        const result = convertObjectType('meta', objectType)
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.field.name).toBe('meta')
            expect(result.field.kind).toBe('object')
            expect(result.field.fields).toHaveLength(2)
        }
    })

    test('Origin Flow: ObjectType constructor resolves empty annotations by default without || or ??', () => {
        const objectType = new ObjectType(new ImmutableMap(new Map()), new ImmutableSet(new Set()))
        expect(objectType.annotations).toBeDefined()
        expect(objectType.annotations.get('kind')).toBeUndefined()
    })

    test('Stage 2 Flow: extractRequestTypeResponseSchemas maps RequestType with responseData to hasResponse true via switch without if', () => {
        const responseBuilder = new ResponseActionBuilder(new ResponseSchemaMapper())
        const requestTypeWithData: import('../../artifacts/RequestTypesArtifact').RequestType = {
            resourceName: 'User',
            formTypeName: 'UserForm',
            actions: [],
            responseData: {
                resourceName: 'User',
                fields: { id: new PrimitiveType(PrimitiveKind.NUMBER) }
            }
        }

        const result = extractRequestTypeResponseSchemas(requestTypeWithData, responseBuilder)
        expect(result.hasResponse).toBe(true)
        if (result.hasResponse) {
            expect(result.schemas).toHaveLength(2)
            expect(result.warnings).toHaveLength(0)
        }

        const requestTypeWithoutData: import('../../artifacts/RequestTypesArtifact').RequestType = {
            resourceName: 'User',
            formTypeName: 'UserForm',
            actions: []
        }
        const noDataResult = extractRequestTypeResponseSchemas(requestTypeWithoutData, responseBuilder)
        expect(noDataResult.hasResponse).toBe(false)
    })

    test('Stage 2 Flow: partitionResponseSchemaResults partitions RequestTypeResponseSchemasResult[] into schemas and warnings via switch without for-loop or if', () => {
        const responseBuilder = new ResponseActionBuilder(new ResponseSchemaMapper())
        const res1 = extractRequestTypeResponseSchemas({
            resourceName: 'User',
            formTypeName: 'UserForm',
            actions: [],
            responseData: { resourceName: 'User', fields: { id: new PrimitiveType(PrimitiveKind.NUMBER) } }
        }, responseBuilder)

        const res2: import('../contract-generator-domain').RequestTypeResponseSchemasResult = { hasResponse: false }

        const partitioned = partitionResponseSchemaResults([res1, res2])
        expect(partitioned.fields.fields).toHaveLength(2)
        expect(partitioned.warnings).toHaveLength(0)
    })

    test('Stage 2 Flow: extractResponseDataSchemas maps ResponseData | undefined directly via switch without !== comparison', () => {
        const responseBuilder = new ResponseActionBuilder(new ResponseSchemaMapper())
        const responseData = { resourceName: 'User', fields: { id: new PrimitiveType(PrimitiveKind.NUMBER) } }

        const result = extractResponseDataSchemas(responseData, responseBuilder)
        expect(result.hasResponse).toBe(true)

        const undefinedResult = extractResponseDataSchemas(undefined, responseBuilder)
        expect(undefinedResult.hasResponse).toBe(false)
    })
})
