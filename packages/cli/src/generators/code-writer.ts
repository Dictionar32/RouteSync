import fs from 'fs-extra'

/**
 * Emission Boundary Code Writer.
 *
 * Encapsulates the output mechanics (buffering, formatting, file serialization)
 * so that lowerers remain pure generators yielding Iterable<string>
 * with zero intermediate staging array copies.
 */
export class CodeWriter {
  private readonly lines: string[] = []

  writeLine(line: string = ''): void {
    this.lines.push(line)
  }

  write(lines: Iterable<string>): void {
    for (const line of lines) {
      this.lines.push(line)
    }
  }

  toString(): string {
    return this.lines.join('\n')
  }

  async writeToFile(filePath: string): Promise<void> {
    await fs.writeFile(filePath, this.toString())
  }
}
