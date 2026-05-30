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
    await fs.writeJson(outputPath, manifest, { spaces: 2 })
  }
}
