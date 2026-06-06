import { RouteManifest } from '@routesync/core'
import path from 'path'
import fs from 'fs-extra'
import { buildGeneratedRoutes } from './names'

export class IndexGenerator {
  static async generate(manifest: RouteManifest, outputDir: string, options: Record<string, unknown>): Promise<void> {
    const grouped = buildGeneratedRoutes(manifest.routes)
    
    // Group-level index is skipped to prevent overwriting user's SOT index.ts

    // Generate root index.ts
    const rootLines: string[] = []
    rootLines.push(`// Auto-generated. Do not edit.`)
    rootLines.push(`export * from './api'`)
    rootLines.push(`export * from './types'`)
    if (options.zod) {
      rootLines.push(`export * from './contract/api-contract'`)
      rootLines.push(`export * from './contract/api-schema'`)
      rootLines.push(`export * from './contract/api-field'`)
      rootLines.push(`export * from './types/api-read'`)
      rootLines.push(`export * from './types/api-form'`)
      rootLines.push(`export * from './mappers/api-mapper'`)
    }
    if (options.hooks !== false) {
      rootLines.push(`export * from './hooks'`)
      rootLines.push(`export * from './query-key'`)
    }
    if (options.nextActions) rootLines.push(`export * from './actions'`)
    
    await fs.writeFile(path.join(outputDir, 'index.ts'), rootLines.join('\n'))
  }
}
