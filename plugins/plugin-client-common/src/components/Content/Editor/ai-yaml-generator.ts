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
 * AI-Powered Natural Language to YAML Generator
 *
 * Allows users to generate Kubernetes YAML from natural language descriptions.
 * Integrates with Monaco editor as a command/action.
 */

import * as monaco from 'monaco-editor'

/**
 * AI provider interface
 */
interface AIProvider {
  complete(request: {
    prompt: string
    systemPrompt?: string
    temperature?: number
    maxTokens?: number
  }): Promise<{
    content: string
    model: string
    usage: { inputTokens: number; outputTokens: number }
  }>
  name: string
}

let aiProvider: AIProvider | null = null

/**
 * Get AI provider (shared with other AI features)
 */
async function getAIProvider(): Promise<AIProvider | null> {
  if (aiProvider) {
    return aiProvider
  }

  try {
    // @ts-expect-error - Dynamic import
    const configModule = await import('@kui-shell/plugin-kubectl-ai/utils/config-loader').catch(() => null)
    // @ts-expect-error - Dynamic import
    const providerModule = await import('@kui-shell/plugin-kubectl-ai/services/provider-factory').catch(() => null)

    if (!configModule || !providerModule) {
      return null
    }

    const config = await configModule.getAIConfig()
    if (!config || !config.apiKey) {
      return null
    }

    aiProvider = providerModule.ProviderFactory.getProvider(config)
    return aiProvider
  } catch (error) {
    console.warn('AI YAML generator not available:', error)
    return null
  }
}

/**
 * Generate Kubernetes YAML from natural language description
 */
async function generateYAMLFromDescription(description: string): Promise<string | null> {
  const provider = await getAIProvider()
  if (!provider) {
    return null
  }

  const systemPrompt = `You are a Kubernetes YAML generator assistant.
Your task is to convert natural language descriptions into valid Kubernetes YAML manifests.

Guidelines:
- Generate complete, valid Kubernetes YAML
- Include all required fields (apiVersion, kind, metadata, spec)
- Use best practices for resource naming and labels
- Include helpful comments for complex fields
- Follow Kubernetes API conventions
- Generate multiple resources if needed (use --- separator)

Always respond with ONLY valid YAML, no explanations or markdown.`

  const prompt = `Generate Kubernetes YAML for: ${description}

Requirements:
- Valid Kubernetes manifest format
- Include apiVersion, kind, metadata, spec
- Use appropriate resource types
- Follow naming conventions
- Add helpful comments

YAML:
`

  try {
    const response = await provider.complete({
      prompt,
      systemPrompt,
      temperature: 0.3,
      maxTokens: 2000
    })

    // Extract YAML from response (remove markdown code blocks if present)
    let yaml = response.content.trim()
    yaml = yaml.replace(/^```ya?ml\n?/i, '')
    yaml = yaml.replace(/\n?```$/, '')
    yaml = yaml.trim()

    return yaml || null
  } catch (error) {
    console.warn('AI YAML generation error:', error)
    return null
  }
}

/**
 * Validate generated YAML
 */
function validateYAML(yaml: string): { valid: boolean; error?: string } {
  try {
    // Basic validation: check for required Kubernetes fields
    const lines = yaml.split('\n')
    const hasApiVersion = lines.some(line => line.match(/^apiVersion:\s*\S+/))
    const hasKind = lines.some(line => line.match(/^kind:\s*\S+/))
    const hasMetadata = lines.some(line => line.match(/^metadata:/))

    if (!hasApiVersion) {
      return { valid: false, error: 'Missing apiVersion field' }
    }
    if (!hasKind) {
      return { valid: false, error: 'Missing kind field' }
    }
    if (!hasMetadata) {
      return { valid: false, error: 'Missing metadata field' }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: String(error) }
  }
}

/**
 * Format YAML with proper indentation
 */
function formatYAML(yaml: string): string {
  // Ensure consistent line endings
  return yaml.replace(/\r\n/g, '\n').trim() + '\n'
}

/**
 * Show input dialog for natural language description
 */
async function showDescriptionDialog(): Promise<string | null> {
  return new Promise(resolve => {
    // Create modal overlay
    const overlay = document.createElement('div')
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `

    // Create dialog
    const dialog = document.createElement('div')
    dialog.style.cssText = `
      background: var(--color-base01, #1e1e1e);
      color: var(--color-text-01, #cccccc);
      border-radius: 8px;
      padding: 24px;
      max-width: 600px;
      width: 90%;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    `

    // Title
    const title = document.createElement('h3')
    title.textContent = '✨ Generate Kubernetes YAML from Description'
    title.style.cssText = `
      margin: 0 0 16px 0;
      font-size: 18px;
      font-weight: 600;
    `

    // Description
    const desc = document.createElement('p')
    desc.textContent = 'Describe what you want to create in plain English:'
    desc.style.cssText = `
      margin: 0 0 12px 0;
      font-size: 14px;
      opacity: 0.8;
    `

    // Input
    const input = document.createElement('textarea')
    input.placeholder = 'e.g., "Create a nginx deployment with 3 replicas and a service"'
    input.style.cssText = `
      width: 100%;
      min-height: 100px;
      padding: 12px;
      font-family: var(--font-monospace, monospace);
      font-size: 14px;
      background: var(--color-base02, #2d2d2d);
      color: var(--color-text-01, #cccccc);
      border: 1px solid var(--color-base03, #3c3c3c);
      border-radius: 4px;
      resize: vertical;
      margin-bottom: 16px;
    `

    // Buttons
    const buttonContainer = document.createElement('div')
    buttonContainer.style.cssText = `
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    `

    const cancelButton = document.createElement('button')
    cancelButton.textContent = 'Cancel'
    cancelButton.style.cssText = `
      padding: 8px 16px;
      font-size: 14px;
      background: var(--color-base03, #3c3c3c);
      color: var(--color-text-01, #cccccc);
      border: none;
      border-radius: 4px;
      cursor: pointer;
    `

    const generateButton = document.createElement('button')
    generateButton.textContent = 'Generate YAML'
    generateButton.style.cssText = `
      padding: 8px 16px;
      font-size: 14px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
    `

    // Event handlers
    const close = (value: string | null) => {
      overlay.remove()
      resolve(value)
    }

    cancelButton.onclick = () => close(null)
    generateButton.onclick = () => {
      const value = input.value.trim()
      if (value) {
        close(value)
      }
    }

    input.onkeydown = (e) => {
      if (e.key === 'Escape') {
        close(null)
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        const value = input.value.trim()
        if (value) {
          close(value)
        }
      }
    }

    // Assemble dialog
    buttonContainer.appendChild(cancelButton)
    buttonContainer.appendChild(generateButton)
    dialog.appendChild(title)
    dialog.appendChild(desc)
    dialog.appendChild(input)
    dialog.appendChild(buttonContainer)
    overlay.appendChild(dialog)
    document.body.appendChild(overlay)

    // Focus input
    setTimeout(() => input.focus(), 100)
  })
}

/**
 * Show loading indicator
 */
function showLoadingIndicator(): () => void {
  const overlay = document.createElement('div')
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10001;
  `

  const spinner = document.createElement('div')
  spinner.textContent = '✨ Generating YAML...'
  spinner.style.cssText = `
    background: var(--color-base01, #1e1e1e);
    color: var(--color-text-01, #cccccc);
    padding: 24px 32px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  `

  overlay.appendChild(spinner)
  document.body.appendChild(overlay)

  return () => overlay.remove()
}

/**
 * Show error message
 */
function showError(message: string): void {
  const overlay = document.createElement('div')
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `

  const dialog = document.createElement('div')
  dialog.style.cssText = `
    background: var(--color-base01, #1e1e1e);
    color: var(--color-text-01, #cccccc);
    border-radius: 8px;
    padding: 24px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  `

  const title = document.createElement('h3')
  title.textContent = '❌ Error'
  title.style.cssText = `
    margin: 0 0 12px 0;
    font-size: 18px;
    font-weight: 600;
    color: #f56565;
  `

  const text = document.createElement('p')
  text.textContent = message
  text.style.cssText = `
    margin: 0 0 16px 0;
    font-size: 14px;
  `

  const button = document.createElement('button')
  button.textContent = 'Close'
  button.style.cssText = `
    padding: 8px 16px;
    font-size: 14px;
    background: var(--color-base03, #3c3c3c);
    color: var(--color-text-01, #cccccc);
    border: none;
    border-radius: 4px;
    cursor: pointer;
  `

  button.onclick = () => overlay.remove()

  dialog.appendChild(title)
  dialog.appendChild(text)
  dialog.appendChild(button)
  overlay.appendChild(dialog)
  document.body.appendChild(overlay)
}

/**
 * Generate YAML from user description and insert into editor
 */
async function handleGenerateYAML(editor: monaco.editor.IStandaloneCodeEditor): Promise<void> {
  // Check if AI provider is available
  const provider = await getAIProvider()
  if (!provider) {
    showError(
      'AI provider not available. Please configure kubectl-ai plugin with an API key.'
    )
    return
  }

  // Show input dialog
  const description = await showDescriptionDialog()
  if (!description) {
    return // User cancelled
  }

  // Show loading
  const hideLoading = showLoadingIndicator()

  try {
    // Generate YAML
    const yaml = await generateYAMLFromDescription(description)
    hideLoading()

    if (!yaml) {
      showError('Failed to generate YAML. Please try again.')
      return
    }

    // Validate YAML
    const validation = validateYAML(yaml)
    if (!validation.valid) {
      showError(`Generated YAML is invalid: ${validation.error}`)
      return
    }

    // Format YAML
    const formattedYAML = formatYAML(yaml)

    // Insert into editor
    const model = editor.getModel()
    if (model) {
      const position = editor.getPosition()
      const range = new monaco.Range(
        position.lineNumber,
        1,
        position.lineNumber,
        1
      )

      editor.executeEdits('ai-yaml-generator', [
        {
          range,
          text: formattedYAML,
          forceMoveMarkers: true
        }
      ])

      // Set language to YAML if not already
      if (model.getLanguageId() !== 'yaml') {
        monaco.editor.setModelLanguage(model, 'yaml')
      }

      // Format the document
      editor.getAction('editor.action.formatDocument')?.run()
    }
  } catch (error) {
    hideLoading()
    showError(`Error generating YAML: ${String(error)}`)
  }
}

/**
 * Add AI YAML generator command to a Monaco editor instance
 *
 * Registers keyboard shortcut: Cmd/Ctrl+Shift+G
 */
export function addAIYAMLGeneratorAction(editor: monaco.editor.IStandaloneCodeEditor): void {
  // Add keyboard command
  editor.addCommand(
    monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyG,
    () => {
      handleGenerateYAML(editor)
    }
  )
}

/**
 * Register AI YAML generator - now just exports the function for per-editor registration
 */
export function registerAIYAMLGenerator(): monaco.IDisposable[] {
  // No global registration needed - each editor instance will call addAIYAMLGeneratorAction
  return []
}

/**
 * Check if AI YAML generator is available
 */
export async function isAIYAMLGeneratorAvailable(): Promise<boolean> {
  const provider = await getAIProvider()
  return provider !== null
}
