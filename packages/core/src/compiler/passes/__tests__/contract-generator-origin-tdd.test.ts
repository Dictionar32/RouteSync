import { describe, test, expect, expectTypeOf } from 'vitest'
import {
    createContractGeneratorDependencies,
    type ContractGeneratorDependencies
} from '../contract-generator-domain'
import { ContractSchemaMapper } from '../../generators/contract-generation/ContractSchemaMapper'
import { ContractActionGenerator } from '../../generators/contract-generation/ContractActionGenerator'
import { ContractCodeBuilder } from '../../generators/contract-generation/ContractCodeBuilder'
import { ResponseActionBuilder } from '../../generators/contract-generation/ResponseActionBuilder'
import { ResponseSchemaMapper } from '../../generators/contract-generation/ResponseSchemaMapper'

describe('ContractGenerator Dependency Origin TDD Specification', () => {
    test('1. Type Contract Assertion: ContractGeneratorDependencies properties are 100% required (no optionality)', () => {
        expectTypeOf<ContractGeneratorDependencies>().toHaveProperty('schemaMapper')
        expectTypeOf<ContractGeneratorDependencies>().toHaveProperty('actionGenerator')
        expectTypeOf<ContractGeneratorDependencies>().toHaveProperty('codeBuilder')
        expectTypeOf<ContractGeneratorDependencies>().toHaveProperty('responseActionBuilder')

        // Assert no property is assignable to undefined
        expectTypeOf<ContractGeneratorDependencies['schemaMapper']>().not.toEqualTypeOf<undefined>()
        expectTypeOf<ContractGeneratorDependencies['actionGenerator']>().not.toEqualTypeOf<undefined>()
        expectTypeOf<ContractGeneratorDependencies['codeBuilder']>().not.toEqualTypeOf<undefined>()
        expectTypeOf<ContractGeneratorDependencies['responseActionBuilder']>().not.toEqualTypeOf<undefined>()
    })

    test('2. Default Origin Resolution: createContractGeneratorDependencies() without arguments produces Complete Contract', () => {
        const deps = createContractGeneratorDependencies()

        expect(deps.schemaMapper).toBeInstanceOf(ContractSchemaMapper)
        expect(deps.actionGenerator).toBeInstanceOf(ContractActionGenerator)
        expect(deps.codeBuilder).toBeInstanceOf(ContractCodeBuilder)
        expect(deps.responseActionBuilder).toBeInstanceOf(ResponseActionBuilder)
    })

    test('3. Partial Override Resolution: custom schemaMapper is injected into default actionGenerator', () => {
        const customMapper = new ContractSchemaMapper()
        const deps = createContractGeneratorDependencies({ schemaMapper: customMapper })

        expect(deps.schemaMapper).toBe(customMapper)
        expect(deps.actionGenerator).toBeInstanceOf(ContractActionGenerator)
    })

    test('4. Full Custom Injection: respects all custom dependency overrides 100%', () => {
        const customMapper = new ContractSchemaMapper()
        const customGenerator = new ContractActionGenerator(customMapper)
        const customCodeBuilder = new ContractCodeBuilder()
        const customResponseBuilder = new ResponseActionBuilder(new ResponseSchemaMapper())

        const deps = createContractGeneratorDependencies({
            schemaMapper: customMapper,
            actionGenerator: customGenerator,
            codeBuilder: customCodeBuilder,
            responseActionBuilder: customResponseBuilder
        })

        expect(deps.schemaMapper).toBe(customMapper)
        expect(deps.actionGenerator).toBe(customGenerator)
        expect(deps.codeBuilder).toBe(customCodeBuilder)
        expect(deps.responseActionBuilder).toBe(customResponseBuilder)
    })
})
