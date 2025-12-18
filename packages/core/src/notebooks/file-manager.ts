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
 * Notebook File Manager
 *
 * Handles saving, loading, and exporting notebooks
 */

import type { Notebook, ExportFormat } from './types'
import { getIpcRenderer, isTauriRuntime } from '../main/tauri-bridge'

export class NotebookFileManager {
  private autoSaveInterval: number = 30000 // 30 seconds
  private autoSaveTimers: Map<string, NodeJS.Timeout> = new Map()

  /**
   * Save notebook to file
   */
  async save(notebook: Notebook, path?: string): Promise<string> {
    const filePath = path || await this.getDefaultPath(notebook)

    // Create backup before saving
    await this.createBackup(filePath)

    // Save notebook
    const content = JSON.stringify(notebook, null, 2)

    if (isTauriRuntime()) {
      const ipc = getIpcRenderer()
      await ipc.invoke('write_file', {
        path: filePath,
        contents: content
      })
    } else {
      // Browser mode - use localStorage
      localStorage.setItem(`notebook:${notebook.metadata.id}`, content)
    }

    return filePath
  }

  /**
   * Load notebook from file
   */
  async load(path: string): Promise<Notebook> {
    if (isTauriRuntime()) {
      const ipc = getIpcRenderer()
      const content = await ipc.invoke('read_file', { path })
      return JSON.parse(content as string)
    } else {
      // Browser mode - try localStorage
      const content = localStorage.getItem(`notebook:${path}`)
      if (!content) {
        throw new Error(`Notebook not found: ${path}`)
      }
      return JSON.parse(content)
    }
  }

  /**
   * Export notebook to various formats
   */
  async export(notebook: Notebook, format: ExportFormat, path: string): Promise<void> {
    let content: string

    switch (format) {
      case 'html':
        content = this.exportToHTML(notebook)
        break
      case 'markdown':
        content = this.exportToMarkdown(notebook)
        break
      case 'json':
        content = JSON.stringify(notebook, null, 2)
        break
      case 'pdf':
        // PDF export would require additional libraries
        throw new Error('PDF export not yet implemented')
      default:
        throw new Error(`Unknown export format: ${format}`)
    }

    if (isTauriRuntime()) {
      const ipc = getIpcRenderer()
      await ipc.invoke('write_file', {
        path,
        contents: content
      })
    } else {
      // Browser mode - trigger download
      this.downloadFile(path, content)
    }
  }

  /**
   * Enable auto-save for a notebook
   */
  enableAutoSave(notebook: Notebook, path: string): void {
    // Clear existing timer if any
    this.disableAutoSave(notebook.metadata.id)

    // Set up new timer
    const timer = setInterval(async () => {
      try {
        await this.save(notebook, path)
        console.log(`Auto-saved notebook: ${notebook.metadata.title}`)
      } catch (error) {
        console.error('Auto-save failed:', error)
      }
    }, this.autoSaveInterval)

    this.autoSaveTimers.set(notebook.metadata.id, timer)
  }

  /**
   * Disable auto-save for a notebook
   */
  disableAutoSave(notebookId: string): void {
    const timer = this.autoSaveTimers.get(notebookId)
    if (timer) {
      clearInterval(timer)
      this.autoSaveTimers.delete(notebookId)
    }
  }

  /**
   * List available notebooks
   */
  async listNotebooks(): Promise<string[]> {
    if (isTauriRuntime()) {
      const ipc = getIpcRenderer()
      const notebooksDir = await this.getNotebooksDirectory()
      const entries = await ipc.invoke('read_dir', { path: notebooksDir })
      return (entries as any[])
        .filter(e => e.name.endsWith('.kui.json'))
        .map(e => e.path)
    } else {
      // Browser mode - list from localStorage
      const keys: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('notebook:')) {
          keys.push(key)
        }
      }
      return keys
    }
  }

  /**
   * Delete notebook
   */
  async delete(path: string): Promise<void> {
    if (isTauriRuntime()) {
      const ipc = getIpcRenderer()
      await ipc.invoke('remove_file', { path })
    } else {
      localStorage.removeItem(path)
    }
  }

  // Private methods

  private async getNotebooksDirectory(): Promise<string> {
    if (isTauriRuntime()) {
      const ipc = getIpcRenderer()
      const homeDir = await ipc.invoke('path_home_dir')
      return `${homeDir}/.kui/notebooks`
    }
    return 'notebooks'
  }

  private async getDefaultPath(notebook: Notebook): Promise<string> {
    const dir = await this.getNotebooksDirectory()
    const sanitized = notebook.metadata.title
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
    return `${dir}/${sanitized}-${notebook.metadata.id}.kui.json`
  }

  private async createBackup(path: string): Promise<void> {
    if (!isTauriRuntime()) return

    try {
      const ipc = getIpcRenderer()
      const exists = await ipc.invoke('path_exists', { path })
      if (exists) {
        const content = await ipc.invoke('read_file', { path })
        await ipc.invoke('write_file', {
          path: `${path}.backup`,
          contents: content
        })
      }
    } catch (error) {
      console.warn('Failed to create backup:', error)
    }
  }

  private exportToHTML(notebook: Notebook): string {
    const cells = notebook.cells.map(cell => {
      if (cell.type === 'markdown') {
        // Simple markdown to HTML conversion (could use a library)
        return `<div class="cell markdown-cell">${this.markdownToHTML(cell.content)}</div>`
      } else {
        const outputs = (cell.outputs || []).map(out => {
          return `<div class="output">${this.formatOutput(out)}</div>`
        }).join('')

        return `
          <div class="cell code-cell">
            <div class="cell-input">
              <pre><code>${this.escapeHTML(cell.content)}</code></pre>
            </div>
            ${outputs}
          </div>
        `
      }
    }).join('\n')

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${this.escapeHTML(notebook.metadata.title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; }
    .cell { margin-bottom: 20px; border: 1px solid #e1e4e8; border-radius: 6px; }
    .cell-input { background: #f6f8fa; padding: 16px; }
    .cell-input pre { margin: 0; }
    .output { padding: 16px; border-top: 1px solid #e1e4e8; }
    .markdown-cell { padding: 16px; }
  </style>
</head>
<body>
  <h1>${this.escapeHTML(notebook.metadata.title)}</h1>
  ${cells}
</body>
</html>
    `.trim()
  }

  private exportToMarkdown(notebook: Notebook): string {
    let md = `# ${notebook.metadata.title}\n\n`

    if (notebook.metadata.description) {
      md += `${notebook.metadata.description}\n\n`
    }

    md += `---\n\n`

    for (const cell of notebook.cells) {
      if (cell.type === 'markdown') {
        md += `${cell.content}\n\n`
      } else {
        md += `\`\`\`${cell.metadata.language || 'shell'}\n${cell.content}\n\`\`\`\n\n`

        if (cell.outputs && cell.outputs.length > 0) {
          md += `**Output:**\n\n\`\`\`\n`
          for (const output of cell.outputs) {
            md += `${this.formatOutputText(output)}\n`
          }
          md += `\`\`\`\n\n`
        }
      }
    }

    return md
  }

  private markdownToHTML(markdown: string): string {
    // Very basic markdown conversion - in production use a proper library
    return markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\n/gim, '<br>')
  }

  private formatOutput(output: any): string {
    switch (output.type) {
      case 'text':
        return `<pre>${this.escapeHTML(output.data)}</pre>`
      case 'table':
        return this.tableToHTML(output.data)
      case 'json':
        return `<pre>${this.escapeHTML(JSON.stringify(output.data, null, 2))}</pre>`
      case 'error':
        return `<div style="color: red;"><pre>${this.escapeHTML(output.data)}</pre></div>`
      default:
        return `<pre>${this.escapeHTML(String(output.data))}</pre>`
    }
  }

  private formatOutputText(output: any): string {
    if (typeof output.data === 'string') {
      return output.data
    }
    return JSON.stringify(output.data, null, 2)
  }

  private tableToHTML(data: any): string {
    // Basic table rendering
    return '<table><tr><td>Table data</td></tr></table>'
  }

  private escapeHTML(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  private downloadFile(filename: string, content: string): void {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }
}

// Singleton instance
export const notebookFileManager = new NotebookFileManager()
