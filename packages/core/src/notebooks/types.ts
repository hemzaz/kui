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
 * Notebook Mode Type Definitions
 *
 * Based on Jupyter notebook format with Kui-specific extensions
 */

export interface Notebook {
  version: string // Format version (e.g., "1.0.0")
  metadata: NotebookMetadata
  cells: Cell[]
}

export interface NotebookMetadata {
  id: string
  title: string
  description?: string
  author?: string
  created: number // Unix timestamp
  modified: number // Unix timestamp
  tags: string[]
  kubernetesContext?: {
    cluster: string
    namespace: string
  }
}

export interface Cell {
  id: string
  type: CellType
  content: string
  metadata: CellMetadata
  outputs?: CellOutput[]
  executionCount?: number
}

export enum CellType {
  Code = 'code',
  Markdown = 'markdown',
  Raw = 'raw'
}

export interface CellMetadata {
  collapsed: boolean
  scrollable: boolean
  language?: string // For code cells: 'shell', 'yaml', 'json'
  tags: string[]
}

export interface CellOutput {
  type: OutputType
  data: any
  timestamp: number
  executionTime?: number // milliseconds
}

export enum OutputType {
  Text = 'text',
  Table = 'table',
  JSON = 'json',
  YAML = 'yaml',
  Error = 'error',
  HTML = 'html'
}

export interface ExecutionContext {
  notebook: Notebook
  kubernetesContext?: {
    cluster: string
    namespace: string
  }
  environment: Map<string, string>
  workingDirectory: string
}

export enum ExportFormat {
  HTML = 'html',
  Markdown = 'markdown',
  PDF = 'pdf',
  JSON = 'json'
}
