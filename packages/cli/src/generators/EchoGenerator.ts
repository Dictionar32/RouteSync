import fs from 'fs-extra'
import path from 'path'
import { BroadcastChannelDescriptor, BROADCAST_CHANNEL_REGISTRY, ROUTE_PARAMETER_TYPE_REGISTRY } from '@routesync/core'
import { toTypeName } from './names'

export class EchoGenerator {
  static async generate(channels: readonly BroadcastChannelDescriptor[], outputDir?: string): Promise<string> {
    switch (channels.length === 0) {
      case true:
        return ''
      case false:
        break
    }

    const lines: string[] = []

    lines.push(`// Auto-generated Laravel Echo Hooks. Do not edit manually.`)
    lines.push(`import { useEffect } from 'react'`)
    lines.push(`import Echo from 'laravel-echo'`)
    lines.push(``)
    lines.push(`// Ensure you have configured window.Echo somewhere in your app`)
    lines.push(``)

    for (const channel of channels) {
      const nameParts = channel.name.replace(/\{[^}]+\}/g, '').split('.').filter(Boolean)
      const hookName = 'useListen' + toTypeName(nameParts.join(' ')) + 'Channel'

      const parameters = channel.parameters ?? []
      const paramArgs = parameters.length > 0
        ? parameters.map(p => {
            const tsType = (p.type && ROUTE_PARAMETER_TYPE_REGISTRY[p.type])
              ? ROUTE_PARAMETER_TYPE_REGISTRY[p.type].tsType
              : (p.type === 'number' ? 'number' : 'string')
            const propName = p.propertyName || p.name
            return `${propName}: ${tsType}`
          }).join(', ') + ', '
        : ''

      const runtimeChannelName = channel.runtimePattern || (channel.name || '').replace(/\{([^}]+)\}/g, '${$1}')
      const channelMethod = BROADCAST_CHANNEL_REGISTRY[channel.kind].echoMethod

      lines.push(`/**`)
      lines.push(` * Broadcast Channel: ${channel.name} (${channel.kind})`)
      lines.push(` * @provenance BroadcastChannel: routes/channels.php (${channel.name})`)
      lines.push(` * @see routes/channels.php`)
      lines.push(` */`)
      lines.push(`export function ${hookName}<TEvent = unknown>(${paramArgs}eventName: string, callback: (event: TEvent) => void) {`)
      lines.push(`  useEffect(() => {`)
      lines.push(`    if (typeof window === 'undefined' || !(window as unknown as { Echo?: Echo }).Echo) return`)
      lines.push(`    `)
      lines.push(`    const echo: Echo = (window as unknown as { Echo: Echo }).Echo`)
      lines.push(`    const channelInstance = echo.${channelMethod}(\`${runtimeChannelName}\`)`)
      lines.push(`    channelInstance.listen(eventName, callback as (event: unknown) => void)`)
      lines.push(`    `)
      lines.push(`    return () => {`)
      lines.push(`      channelInstance.stopListening(eventName, callback as (event: unknown) => void)`)
      lines.push(`    }`)
      
      const deps = parameters.map(p => p.propertyName).join(', ')
      const allDeps = deps ? `[${deps}, eventName, callback]` : '[eventName, callback]'
      
      lines.push(`  }, ${allDeps})`)
      lines.push(`}`)
      lines.push(``)
    }

    const output = lines.join('\n')
    if (outputDir) {
      await fs.writeFile(path.join(outputDir, 'echo.ts'), output)
    }
    return output
  }
}
