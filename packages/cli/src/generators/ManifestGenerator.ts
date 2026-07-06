import { ParsedRoute, RouteManifest, ParsedChannel } from '@routesync/core'
import fs from 'fs-extra'

export class ManifestGenerator {
  static generate(routes: ParsedRoute[], baseURL: string, channels?: ParsedChannel[]): RouteManifest {
    return {
      version: '1.0.0',
      baseURL,
      routes,
      channels: channels || [],
      generatedAt: new Date().toISOString()
    }
  }

  static async save(manifest: RouteManifest, outputPath: string): Promise<void> {
    const mergedManifest = { ...manifest }
    try {
      if (await fs.pathExists(outputPath)) {
        const existing = await fs.readJson(outputPath)
        if (existing && typeof existing === 'object') {
          if ('frontend' in existing) mergedManifest.frontend = existing.frontend
          if ('pages' in existing) mergedManifest.pages = existing.pages
        }
      }
    } catch (e) {
      // ignore
    }
    await fs.writeJson(outputPath, mergedManifest, { spaces: 2 })
  }
}
