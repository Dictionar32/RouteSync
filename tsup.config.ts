import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Options } from 'tsup'

const outDir = 'dist'

const internalTypes = {
  '@routesync/core': './core',
  '@routesync/sdk': './sdk',
  '@routesync/react': './react',
  '@routesync/vue': './vue'
}

async function rewriteDeclarationImports() {
  if (!fs.existsSync(outDir)) return

  for (const fileName of fs.readdirSync(outDir)) {
    if (!fileName.endsWith('.d.ts') && !fileName.endsWith('.d.mts')) continue

    const filePath = path.join(outDir, fileName)
    let content = fs.readFileSync(filePath, 'utf8')

    for (const [packageName, localName] of Object.entries(internalTypes)) {
      content = content
        .replaceAll(`from '${packageName}'`, `from '${localName}'`)
        .replaceAll(`from "${packageName}"`, `from "${localName}"`)
    }

    fs.writeFileSync(filePath, content)
  }
}

const shared = {
  outDir,
  dts: true,
  clean: false,
  external: [
    'axios',
    'chalk',
    'commander',
    'fs-extra',
    'ora',
    'react',
    'vue',
    '@tanstack/react-query',
    '@tanstack/vue-query',
    'zod'
  ],
  sourcemap: false,
  tsconfig: 'tsconfig.json',
  onSuccess: rewriteDeclarationImports
} satisfies Options

const cliShared = {
  ...shared,
  external: ['axios', 'react', 'vue', '@tanstack/react-query', '@tanstack/vue-query', 'zod'],
  noExternal: ['chalk', 'commander', 'fs-extra', 'ora']
} satisfies Options

export default defineConfig([
  {
    ...shared,
    entry: {
      core: 'packages/core/src/index.ts'
    },
    format: ['esm', 'cjs']
  },
  {
    ...shared,
    entry: {
      sdk: 'packages/sdk/src/index.ts'
    },
    format: ['esm', 'cjs']
  },
  {
    ...shared,
    entry: {
      react: 'packages/react/src/index.ts'
    },
    format: ['esm', 'cjs']
  },
  {
    ...shared,
    entry: {
      vue: 'packages/vue/src/index.ts'
    },
    format: ['esm', 'cjs']
  },
  {
    ...cliShared,
    entry: {
      cli: 'packages/cli/src/index.ts'
    },
    format: ['cjs']
  }
])
