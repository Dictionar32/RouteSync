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
    extractResourceContract
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

    test('Transformation Flow: convertSingleResponseField maps SemanticType pattern matching', () => {
        const annotations = new ImmutableMap(new Map<string, string>([['kind', 'nullable_wrapper']]))
        const innerType: SemanticType = new PrimitiveType(PrimitiveKind.NUMBER)
        const properties = new ImmutableMap(new Map<string, SemanticType>([['__value', innerType]]))

        const nullableObject = new ObjectType(properties, new ImmutableSet(new Set(['__value'])), undefined, [], annotations)

        const parsed = convertSingleResponseField('score', nullableObject)

        expect(parsed.name).toBe('score')
        expect(parsed.type).toBe('number')
        expect(parsed.nullable).toBe(true)
    })
})
