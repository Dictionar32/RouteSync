import fs from 'fs-extra'
import { ParsedChannel } from '@routesync/core'

export class LaravelChannelParser {
  async parse(channelFilePath: string = 'routes/channels.php'): Promise<ParsedChannel[]> {
    if (!fs.existsSync(channelFilePath)) {
      return []
    }

    const content = await fs.readFile(channelFilePath, 'utf-8')
    const channels: ParsedChannel[] = []

    // regex to find Broadcast::channel('channel-name', function() { ... })
    const regex = /Broadcast::channel\\(\\s*['"]([^'"]+)['"]/g
    let match

    while ((match = regex.exec(content)) !== null) {
      const name = match[1]
      // Simple heuristic: if the channel name has {id} or requires auth, we can assume it's private.
      // Laravel Echo actually listens to .private('name') or .presence('name') but the channel definition name is just 'name'.
      // For generation, we will just pass the raw name and let the user decide if it's private or not in the hook.
      channels.push({
        name,
        isPrivate: true, // we default to private for now as most channels are authenticated
        isPresence: false
      })
    }

    return channels
  }
}
