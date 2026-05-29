import { Command } from 'commander'
import chalk from 'chalk'
import fs from 'fs-extra'
import path from 'path'

export const watchCommand = new Command('watch')
  .description('Watch routes file and re-sync on changes')
  .option('-i, --input <path>', 'Path to routes/api.php', 'routes/api.php')
  .option('-o, --output <path>', 'Output directory', 'src/api')
  .option('-b, --baseURL <url>', 'API base URL', 'http://localhost/api')
  .action(async (options) => {
    console.log(chalk.bold.blue('\n  routesync watch\n'))
    console.log(`  Watching: ${chalk.cyan(options.input)}`)
    console.log(chalk.gray('  Press Ctrl+C to stop\n'))

    let debounceTimer: NodeJS.Timeout

    const onChange = () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(async () => {
        console.log(chalk.yellow(`  [${new Date().toLocaleTimeString()}] Routes changed, syncing...`))
        try {
          const { execSync } = await import('child_process')
          execSync(
            `routesync sync --input ${options.input} --output ${options.output} --baseURL ${options.baseURL}`,
            { stdio: 'inherit' }
          )
        } catch {
          console.error(chalk.red('  Sync failed'))
        }
      }, 300)
    }

    if (!fs.existsSync(options.input)) {
      console.error(chalk.red(`  File not found: ${options.input}`))
      process.exit(1)
    }

    fs.watch(path.resolve(options.input), onChange)
  })
