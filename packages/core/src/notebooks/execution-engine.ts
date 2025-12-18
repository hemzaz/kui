/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Notebook Execution Engine
 *
 * Executes notebook cells and captures outputs
 */

import type { Cell, CellOutput, ExecutionContext, OutputType } from './types'
import { exec } from '../repl/exec'

export class NotebookExecutionEngine {
  private cellOutputs: Map<string, any> = new Map()

  /**
   * Execute a single cell
   */
  async executeCell(cell: Cell, context: ExecutionContext): Promise<CellOutput[]> {
    const startTime = Date.now()

    try {
      // Handle different cell types
      if (cell.type === 'markdown') {
        // Markdown cells don't execute
        return []
      }

      // Parse cell content for variable references
      const processedContent = this.processVariables(cell.content)

      // Execute the command
      const result = await exec(processedContent, {
        tab: {
          REPL: {} as any
        }
      })

      // Capture output
      const executionTime = Date.now() - startTime
      const outputs = this.captureOutput(result, executionTime)

      // Store output for variable references
      if (outputs.length > 0) {
        this.cellOutputs.set(cell.id, outputs[0].data)
      }

      return outputs
    } catch (error) {
      // Capture error
      const executionTime = Date.now() - startTime
      return [
        {
          type: 'error' as OutputType,
          data: error instanceof Error ? error.message : String(error),
          timestamp: Date.now(),
          executionTime
        }
      ]
    }
  }

  /**
   * Execute multiple cells sequentially
   */
  async executeCells(
    cells: Cell[],
    context: ExecutionContext
  ): Promise<Map<string, CellOutput[]>> {
    const results = new Map<string, CellOutput[]>()

    for (const cell of cells) {
      const outputs = await this.executeCell(cell, context)
      results.set(cell.id, outputs)
    }

    return results
  }

  /**
   * Execute all cells in order
   */
  async executeAll(cells: Cell[], context: ExecutionContext): Promise<Map<string, CellOutput[]>> {
    return this.executeCells(cells, context)
  }

  /**
   * Interrupt cell execution
   */
  interrupt(cellId: string): void {
    // TODO: Implement execution interruption
    console.warn('Cell interruption not yet implemented')
  }

  /**
   * Clear execution state
   */
  clear(): void {
    this.cellOutputs.clear()
  }

  // Private methods

  /**
   * Process variable references in cell content
   * Syntax: $cellN or ${cellN} references output of cell N
   */
  private processVariables(content: string): string {
    return content.replace(/\$\{?cell(\d+)\}?/g, (match, cellNum) => {
      const cellId = `cell-${cellNum}`
      const output = this.cellOutputs.get(cellId)
      if (output) {
        return typeof output === 'string' ? output : JSON.stringify(output)
      }
      return match
    })
  }

  /**
   * Capture and format command output
   */
  private captureOutput(result: any, executionTime: number): CellOutput[] {
    const outputs: CellOutput[] = []

    // Determine output type and format
    const outputType = this.detectOutputType(result)
    const data = this.formatOutput(result, outputType)

    outputs.push({
      type: outputType,
      data,
      timestamp: Date.now(),
      executionTime
    })

    return outputs
  }

  /**
   * Detect the type of output
   */
  private detectOutputType(result: any): OutputType {
    if (!result) return 'text'

    // Check for Kui response types
    if (result.kind === 'Table') return 'table'
    if (result.kind === 'JSON') return 'json'
    if (result.kind === 'YAML') return 'yaml'
    if (result.kind === 'HTML') return 'html'

    // Check for error
    if (result instanceof Error) return 'error'

    // Default to text
    return 'text'
  }

  /**
   * Format output based on type
   */
  private formatOutput(result: any, type: OutputType): any {
    switch (type) {
      case 'table':
        return this.formatTableOutput(result)
      case 'json':
        return this.formatJSONOutput(result)
      case 'yaml':
        return this.formatYAMLOutput(result)
      case 'html':
        return result.content || result
      case 'error':
        return result instanceof Error ? result.message : String(result)
      case 'text':
      default:
        return typeof result === 'string' ? result : JSON.stringify(result, null, 2)
    }
  }

  private formatTableOutput(result: any): any {
    if (result.body && Array.isArray(result.body)) {
      return {
        headers: result.header?.cells || [],
        rows: result.body.map((row: any) => row.cells || row)
      }
    }
    return result
  }

  private formatJSONOutput(result: any): any {
    try {
      return typeof result === 'string' ? JSON.parse(result) : result
    } catch {
      return result
    }
  }

  private formatYAMLOutput(result: any): string {
    return typeof result === 'string' ? result : JSON.stringify(result, null, 2)
  }
}

// Singleton instance
export const notebookExecutionEngine = new NotebookExecutionEngine()
