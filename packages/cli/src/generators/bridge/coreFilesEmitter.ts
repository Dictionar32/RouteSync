/**
 * coreFilesEmitter.ts
 *
 * Emits core compiler output files (api-read, api-form, api-contract, api-field, api-mapper).
 *
 * @module generators/bridge/coreFilesEmitter
 */

import path from 'path'
import fs from 'fs-extra'
import type { CompilerEmitter, CompilerEmitContext } from './bridgeTypes'

export const CoreFilesEmitter: CompilerEmitter = {
    name: 'CoreFilesEmitter',
    async emit(context: CompilerEmitContext): Promise<readonly string[]> {
        const { contractsBundle, outputDir } = context
        const writtenPaths: string[] = []

        const readTypesPath = path.join(outputDir, 'types', 'api-read.ts')
        await fs.ensureDir(path.dirname(readTypesPath))
        await fs.writeFile(readTypesPath, contractsBundle.readTypes.code)
        writtenPaths.push(readTypesPath)

        const formTypesPath = path.join(outputDir, 'forms', 'api-form.ts')
        await fs.ensureDir(path.dirname(formTypesPath))
        await fs.writeFile(formTypesPath, contractsBundle.formTypes.code)
        writtenPaths.push(formTypesPath)

        const contractPath = path.join(outputDir, 'contracts', 'api-contract.ts')
        await fs.ensureDir(path.dirname(contractPath))
        await fs.writeFile(contractPath, contractsBundle.contracts.code)
        writtenPaths.push(contractPath)

        const apiFieldPath = path.join(outputDir, 'contracts', 'api-field.ts')
        await fs.ensureDir(path.dirname(apiFieldPath))
        await fs.writeFile(apiFieldPath, contractsBundle.apiFields.code)
        writtenPaths.push(apiFieldPath)

        const mapperPath = path.join(outputDir, 'mappers', 'api-mapper.ts')
        await fs.ensureDir(path.dirname(mapperPath))
        await fs.writeFile(mapperPath, contractsBundle.mappers.code)
        writtenPaths.push(mapperPath)

        return writtenPaths
    }
}
