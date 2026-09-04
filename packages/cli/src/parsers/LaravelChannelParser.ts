import fs from 'fs-extra'
import { ParsedChannel, ScannedRouteParameterDescriptor, ScannedBroadcastChannelDescriptor } from '@routesync/core'

export class LaravelChannelParser {
  async parse(channelFilePath: string = 'routes/channels.php'): Promise<ParsedChannel[]> {
    if (!fs.existsSync(channelFilePath)) {
      return []
    }

    const content = await fs.readFile(channelFilePath, 'utf-8')
    const channels: ParsedChannel[] = []

    const regex = /Broadcast::channel\(\s*['"]([^'"]+)['"]/g
    let match: RegExpExecArray | null

    while ((match = regex.exec(content)) !== null) {
      const pattern = match[1]
      const paramMatches = Array.from(pattern.matchAll(/\{([^}]+)\}/g))
      const parameters = paramMatches.map(m => new ScannedRouteParameterDescriptor({ name: m[1] }))

      channels.push(new ScannedBroadcastChannelDescriptor({
        name: pattern,
        pattern,
        parameters
      }))
    }

    return channels
  }
}
