import { Command } from 'commander'
import ora from 'ora'
import chalk from 'chalk'
import { SDKGenerator } from '../generators/SDKGenerator'
import { TypeGenerator } from '../generators/TypeGenerator'
import { HookGenerator } from '../generators/HookGenerator'
import { NextActionGenerator } from '../generators/NextActionGenerator'
import { MswGenerator } from '../generators/MswGenerator'
import { EchoGenerator } from '../generators/EchoGenerator'
import { IndexGenerator } from '../generators/IndexGenerator'
import { QueryKeyGenerator } from '../generators/QueryKeyGenerator'
import { ConstantsGenerator } from '../generators/ConstantsGenerator'
import path from 'path'
import fs from 'fs-extra'
import { RouteManifest } from '@routesync/core'
import { ModelGenerator } from '../generators/ModelGenerator'
import { RoutesGenerator } from '../generators/RoutesGenerator'
import { IntentResolver } from '../resolvers/IntentResolver'


export const generateCommand = new Command('generate')
  .description('Generate typed SDK, types, and hooks from route manifest')
  .option('-m, --manifest <path>', 'Path to route manifest', 'routesync.manifest.json')
  .option('-o, --output <path>', 'Output directory', 'src/api')
  .option('--no-hooks', 'Skip generating React hooks')
  .option('--next-actions', 'Generate Next.js Server Actions')
  .option('--msw', 'Generate MSW Mock Handlers')
  .option('--echo', 'Generate Laravel Echo Hooks')
  .option('--zod', 'Generate Zod schemas for validation')
  .action(async (options) => {
    const spinner = ora('Generating SDK...').start()

    try {
      if (!fs.existsSync(options.manifest)) {
        throw new Error(
          `Manifest not found: ${options.manifest}. Run 'routesync scan' first.`
        )
      }

      let manifest: RouteManifest = await fs.readJson(options.manifest)
      manifest = IntentResolver.resolve(manifest)
      await fs.writeJson(options.manifest, manifest, { spaces: 2 })
      await fs.ensureDir(options.output)

      spinner.text = 'Resolving and validating semantic types...'
      const { SemanticResolutionKernel } = require('@routesync/core')
      const { normalizeManifest } = require('../generators/normalizer')
      const kernel = new SemanticResolutionKernel()
      const normalizedManifest = normalizeManifest(manifest, kernel)

      spinner.text = 'Generating types...'

      // NEW: Generate via compiler path (Phase 3 Day 7)
      try {
        const { CompilerBridge } = await import('../generators/CompilerBridge')

        // Generate api-read.ts (resource types)
        const compilerOutput = await CompilerBridge.generateTypeScript(manifest)

        // Write compiler-generated types to api-read.ts
        const compilerTypesPath = path.join(options.output, 'types', 'api-read.ts')
        await fs.ensureDir(path.dirname(compilerTypesPath))
        await fs.writeFile(compilerTypesPath, compilerOutput.code)

        console.log(`  [CompilerBridge] Generated api-read.ts:`)
        console.log(`    - Types: ${compilerOutput.metadata.typeCount}`)
        console.log(`    - Interfaces: ${compilerOutput.metadata.interfaceCount}`)
        console.log(`    - LOC: ${compilerOutput.metadata.linesOfCode}`)
        if (compilerOutput.metadata.warnings.length > 0) {
          console.log(`    - Warnings: ${compilerOutput.metadata.warnings.length}`)
        }

        // Generate api-form.ts (form types from validation rules)
        spinner.text = 'Generating form types...'
        try {
          const formOutput = await CompilerBridge.generateFormTypes(manifest)

          // Write compiler-generated form types to api-form.ts
          const formTypesPath = path.join(options.output, 'forms', 'api-form.ts')
          await fs.ensureDir(path.dirname(formTypesPath))
          await fs.writeFile(formTypesPath, formOutput.code)

          console.log(`  [CompilerBridge] Generated api-form.ts:`)
          console.log(`    - Form Types: ${formOutput.metadata.formTypeCount}`)
          console.log(`    - Total Actions: ${formOutput.metadata.totalActions}`)
          console.log(`    - LOC: ${formOutput.metadata.linesOfCode}`)
          if (formOutput.metadata.warnings.length > 0) {
            console.log(`    - Warnings: ${formOutput.metadata.warnings.length}`)
          }
        } catch (formError) {
          console.warn(`  [CompilerBridge] Warning: Form generation failed - ${formError instanceof Error ? formError.message : String(formError)}`)
        }

        // Generate api-contract.ts (Zod schemas for runtime validation)
        spinner.text = 'Generating contract types...'
        try {
          const contractOutput = await CompilerBridge.generateContractTypes(manifest)

          // Write compiler-generated contract to api-contract.ts
          const contractPath = path.join(options.output, 'contracts', 'api-contract.ts')
          await fs.ensureDir(path.dirname(contractPath))
          await fs.writeFile(contractPath, contractOutput.code)

          console.log(`  [CompilerBridge] Generated api-contract.ts:`)
          console.log(`    - Contracts: ${contractOutput.metadata.contractCount}`)
          console.log(`    - Total Actions: ${contractOutput.metadata.totalActions}`)
          console.log(`    - Zod Schemas: ${contractOutput.metadata.zodSchemasCount}`)
          console.log(`    - Validators: ${contractOutput.metadata.validatorsCount}`)
          console.log(`    - LOC: ${contractOutput.metadata.linesOfCode}`)
          if (contractOutput.metadata.warnings.length > 0) {
            console.log(`    - Warnings: ${contractOutput.metadata.warnings.length}`)
          }
        } catch (contractError) {
          console.warn(`  [CompilerBridge] Warning: Contract generation failed - ${contractError instanceof Error ? contractError.message : String(contractError)}`)
        }
      } catch (compilerError) {
        console.warn(`  [CompilerBridge] Warning: ${compilerError instanceof Error ? compilerError.message : String(compilerError)}`)
        console.warn(`  Falling back to legacy generator...`)
      }

      // Keep existing generator (parallel execution for validation)
      await TypeGenerator.generate(manifest, options.output)
      spinner.text = 'Generating SDK...'
      await SDKGenerator.generate(manifest, options.output, options)

      if (options.hooks !== false) {
        spinner.text = 'Generating query keys...'
        await QueryKeyGenerator.generate(manifest, options.output)
        spinner.text = 'Generating hooks...'
        await HookGenerator.generate(manifest, options.output)
      }

      if (options.nextActions) {
        spinner.text = 'Generating Server Actions...'
        await NextActionGenerator.generate(manifest, options.output)
      }

      if (options.msw) {
        spinner.text = 'Generating MSW Mocks...'
        await MswGenerator.generate(manifest, options.output)
      }

      if (options.echo && manifest.channels) {
        spinner.text = 'Generating Echo Hooks...'
        await EchoGenerator.generate(manifest.channels, options.output)
      }

      if (manifest.models) {
        spinner.text = 'Generating DB Models...'
        await ModelGenerator.generate(manifest, options.output)
      }

      if (options.zod) {
        spinner.text = 'Generating Zod Tier (Contract, Types, Mappers)...'
        const { ZodTierGenerator } = require('../generators/ZodTierGenerator')
        await ZodTierGenerator.generate(manifest, options.output)
      } else {
        spinner.text = 'Generating legacy schemas.ts...'
        const { SchemaGenerator } = require('../generators/SchemaGenerator')
        await SchemaGenerator.generate(manifest, options.output)
      }

      // Generate routes.ts if pages exists in manifest
      spinner.text = 'Generating Frontend Routes...'
      const routesGenerated = await RoutesGenerator.generate(manifest, options.output)

      spinner.text = 'Generating Constants and Enums...'
      await ConstantsGenerator.generate(manifest, options.output)

      spinner.text = 'Generating Index Files...'
      await IndexGenerator.generate(manifest, options.output, { ...options, routesGenerated })

      spinner.succeed(chalk.green(`SDK generated → ${options.output}`))
      console.log(`  ${chalk.cyan('api.ts')}     Typed API client`)
      console.log(`  ${chalk.cyan('types.ts')}   Response/request types`)
      if (options.hooks !== false) {
        console.log(`  ${chalk.cyan('hooks.ts')}   React Query hooks`)
      }
      if (options.nextActions) {
        console.log(`  ${chalk.cyan('actions.ts')} Next.js Server Actions`)
      }
      if (options.msw) {
        console.log(`  ${chalk.cyan('mocks.ts')}   MSW Mock Handlers`)
      }
      if (options.echo && manifest.channels) {
        console.log(`  ${chalk.cyan('echo.ts')}    Laravel Echo Hooks`)
      }
      if (manifest.models && manifest.models.length > 0) {
        console.log(`  ${chalk.cyan('models.ts')}  Eloquent Database Models`)
      }
    } catch (err: any) {
      spinner.fail(chalk.red(`Generate failed: ${err.message}`))
      console.error(err.stack)
      process.exit(1)
    }
  })
