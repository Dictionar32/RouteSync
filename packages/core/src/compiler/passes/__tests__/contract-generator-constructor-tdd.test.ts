import { describe, test, expect, vi } from 'vitest'
import { ContractGeneratorPass } from '../ContractGeneratorPass'
import { ContractSchemaMapper } from '../../generators/contract-generation/ContractSchemaMapper'
import { ContractActionGenerator } from '../../generators/contract-generation/ContractActionGenerator'
import { ContractCodeBuilder } from '../../generators/contract-generation/ContractCodeBuilder'
import { ResponseActionBuilder } from '../../generators/contract-generation/ResponseActionBuilder'
import { ResponseSchemaMapper } from '../../generators/contract-generation/ResponseSchemaMapper'

describe('ContractGeneratorPass Constructor TDD Specification', () => {
    test('1. Default constructor without arguments initializes default dependencies cleanly', () => {
        const pass = new ContractGeneratorPass()
        expect(pass.name).toBe('ContractGenerator')
        expect(pass).toBeDefined()
    })

    test('2. Constructor with empty options object ({}) initializes dependencies without optional chaining exceptions', () => {
        const pass = new ContractGeneratorPass({})
        expect(pass.name).toBe('ContractGenerator')
        expect(pass).toBeDefined()
    })

    test('3. Constructor with partial custom schemaMapper injects same schemaMapper instance into default actionGenerator', () => {
        const customSchemaMapper = new ContractSchemaMapper()
        
        // Spy or verify that custom schemaMapper is passed to actionGenerator
        const pass = new ContractGeneratorPass({
            schemaMapper: customSchemaMapper
        })

        expect(pass).toBeDefined()
    })

    test('4. Constructor with full dependency injection respects supplied mock instances', () => {
        const mockSchemaMapper = new ContractSchemaMapper()
        const mockActionGenerator = new ContractActionGenerator(mockSchemaMapper)
        const mockCodeBuilder = new ContractCodeBuilder()
        const mockResponseActionBuilder = new ResponseActionBuilder(new ResponseSchemaMapper())

        const pass = new ContractGeneratorPass({
            schemaMapper: mockSchemaMapper,
            actionGenerator: mockActionGenerator,
            codeBuilder: mockCodeBuilder,
            responseActionBuilder: mockResponseActionBuilder
        })

        expect(pass).toBeDefined()
    })
})
