#!/usr/bin/env node
import { Command } from 'commander'
import { scanCommand } from './commands/scan'
import { generateCommand } from './commands/generate'
import { syncCommand } from './commands/sync'
import { watchCommand } from './commands/watch'
import { annotateCommand } from './commands/annotate'
import { explainCommand } from './commands/explain'
import { auditCommand } from './commands/audit'
const program = new Command()

program
  .name('routesync')
  .description('Laravel routes to typed frontend SDKs')
  .version('1.0.0')

program.addCommand(scanCommand)
program.addCommand(generateCommand)
program.addCommand(syncCommand)
program.addCommand(watchCommand)
program.addCommand(annotateCommand)
program.addCommand(explainCommand)
program.addCommand(auditCommand)

program.parse(process.argv)
