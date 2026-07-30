import { Command } from 'commander'
import ora from 'ora'
import chalk from 'chalk'
import path from 'path'
import fs from 'fs-extra'
import { RouteManifest } from '@routesync/core'
import { ContractGenerator } from '../generators/ContractGenerator'
import { ManifestEnricher } from '../generators/layers/utils/manifest-enricher'

export const generateV2Command = new Command('generate-v2')
    .description('Generate typed SDK using new Contract IR Architecture (v2)')
    .option('-m, --manifest <path>', 'Path to route manifest', 'routesync.manifest.json')
    .option('-o, --output <path>', 'Output directory', 'src/api')
    .option('--dump-contract-ir', 'Save Contract IR to file for debugging')
    .option('--verbose', 'Show detailed generation process')
    .action(async (options) => {
        const spinner = ora('Starting Contract IR Generation...').start()

        try {
            // Check manifest exists
            if (!fs.existsSync(options.manifest)) {
                throw new Error(
                    `Manifest not found: ${options.manifest}. Run 'routesync scan' or 'routesync sync' first.`
                )
            }

            // Load manifest
            spinner.text = 'Loading manifest...'
            const manifest: RouteManifest = await fs.readJson(options.manifest)

            if (options.verbose) {
                console.log(chalk.dim(`\n  Loaded manifest: ${manifest.routes?.length || 0} routes, ${manifest.resources?.length || 0} resources, ${manifest.models?.length || 0} models`))
            }

            // CRITICAL: Enrich manifest dengan missing Resources & Models
            spinner.text = 'Enriching manifest dengan Resources & Models data...'
            let enrichedManifest: any
            try {
                enrichedManifest = ManifestEnricher.enrich(manifest)
            } catch (enrichError: any) {
                spinner.fail(chalk.red(`Manifest enrichment failed: ${enrichError.message}`))
                if (options.verbose) {
                    console.error(chalk.dim(enrichError.stack))
                }
                process.exit(1)
            }

            if (options.verbose) {
                console.log(chalk.dim(`\n  Enriched manifest: ${enrichedManifest.routes?.length || 0} routes, ${enrichedManifest.resources?.length || 0} resources, ${enrichedManifest.models?.length || 0} models`))
                console.log(chalk.dim(`  Enrichment: ${enrichedManifest.enrichmentMetadata.resourcesFound} resources, ${enrichedManifest.enrichmentMetadata.modelsInferred} models inferred`))
            }

            // Ensure output directory exists
            await fs.ensureDir(options.output)

            // Initialize ContractGenerator
            spinner.text = 'Initializing Contract IR Architecture...'
            const generator = new ContractGenerator()

            if (options.verbose) {
                console.log(chalk.dim('  Contract IR Engine initialized'))
            }

            // Generate using new architecture
            spinner.text = 'Building Contract IR and generating files...'
            const startTime = performance.now()

            const result = await generator.generate(enrichedManifest)

            const totalTime = performance.now() - startTime

            // Write files to disk
            spinner.text = 'Writing generated files...'
            const writtenFiles: string[] = []

            for (const file of result.files) {
                const filePath = path.join(options.output, file.path)
                await fs.ensureDir(path.dirname(filePath))
                await fs.writeFile(filePath, file.content, 'utf8')
                writtenFiles.push(file.path)

                if (options.verbose) {
                    console.log(chalk.dim(`  ✓ ${file.path} (${file.content.length} chars)`))
                }
            }

            // Optionally dump Contract IR for debugging
            if (options.dumpContractIr) {
                const contractIrPath = path.resolve('routesync.contract-ir.json')
                const contractIrContent = {
                    metadata: {
                        generatedAt: new Date().toISOString(),
                        generator: 'ContractGenerator v2',
                        stats: result.metadata?.stats || {},
                        performance: result.metadata?.performance || {}
                    },
                    // Note: We would need to expose the IR from generator to dump it
                    // This is a placeholder for the enhancement
                    note: "Contract IR dump requires generator modification to expose internal IR"
                }

                await fs.writeJson(contractIrPath, contractIrContent, { spaces: 2 })
                console.log(chalk.yellow(`\n  Contract IR dumped to: ${contractIrPath}`))
            }

            spinner.succeed(chalk.green(`Generation complete in ${totalTime.toFixed(2)}ms`))

            // Success summary
            console.log(chalk.bold.green('\n  ✨ Contract IR Architecture Generation Complete!\n'))
            console.log(`  Output: ${chalk.cyan(options.output)}`)
            console.log(`  Files generated: ${chalk.white(result.files.length)}`)
            console.log(`  Resources processed: ${chalk.white(result.metadata?.stats?.resourceCount || 0)}`)
            console.log(`  Endpoints processed: ${chalk.white(result.metadata?.stats?.endpointCount || 0)}`)
            console.log(`  Generation time: ${chalk.white(totalTime.toFixed(2))}ms\n`)

            // List generated files
            console.log(chalk.bold('Generated Files:'))
            writtenFiles.forEach((filePath, index) => {
                const fileType = getFileTypeDescription(filePath)
                console.log(`  ${chalk.cyan(`${index + 1}.`)} ${chalk.white(filePath)} ${chalk.dim(`(${fileType})`)}`)
            })

            console.log(chalk.dim('\n  Architecture: Semantic IR → Declaration IR → Thin Emitters'))
            console.log(chalk.dim('  Benefits: Type-safe, modular, consistent field transformations\n'))

        } catch (err: any) {
            spinner.fail(chalk.red(`Generation failed: ${err.message}`))

            if (options.verbose && err.stack) {
                console.error(chalk.dim(err.stack))
            }

            console.log(chalk.yellow('\nTroubleshooting:'))
            console.log(chalk.dim('1. Ensure manifest file exists and is valid JSON'))
            console.log(chalk.dim('2. Check that all required fields are present in manifest'))
            console.log(chalk.dim('3. Verify output directory is writable'))
            console.log(chalk.dim('4. Try running with --verbose for more details'))

            process.exit(1)
        }
    })

function getFileTypeDescription(filePath: string): string {
    if (filePath.includes('api-contract')) return 'Zod schemas & validators'
    if (filePath.includes('api-read')) return 'TypeScript interfaces'
    if (filePath.includes('api-mapper')) return 'Transform functions'
    if (filePath.includes('api-form')) return 'Form type definitions'
    if (filePath.includes('api-schema')) return 'Schema structures'
    if (filePath.includes('api-field')) return 'Field lookup table'
    return 'Generated code'
}