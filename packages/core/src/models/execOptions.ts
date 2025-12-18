/*
 * Copyright 2017 The Kubernetes Authors
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

import { ExecType } from './command'
import { Tab } from '../webapp/tab'
import { Stream, Streamable, StreamableFactory } from './streamable'
import { Block } from '../webapp/models/block'
import { Job } from '../core/jobs/job'
import type { Writable } from 'stream'
import type { Entity } from './entity'

export interface ExecOptions {
  /** force execution in a given tab? */
  tab?: Tab

  /** execution UUID */
  execUUID?: string

  /** pass through uninterpreted data - can be primitives, objects, streams, or entities */
  data?: boolean | number | string | Buffer | Writable | Entity | Record<string, unknown>

  /** pass watch state variables to subcommands being watched  */
  watch?: {
    iteration: number
    accumulator: Record<string, unknown>
  }

  /** cwd? */
  cwd?: string

  /** environment variable map */
  env?: Record<string, string>

  /** true, if you wish a qexec to return rendered HTML; default is false, meaning you get the model back on qexec */
  render?: boolean

  isProxied?: boolean
  noDelegation?: boolean
  delegationOk?: boolean

  leaveBottomStripeAlone?: boolean

  /** Filter function for resource selection */
  filter?: <T>(resource: T) => boolean
  contextChangeOK?: boolean
  credentials?: Record<string, unknown>

  /** Custom user-defined options passed through to command handlers */
  custom?: Record<string, unknown>
  rawResponse?: boolean
  isDrilldown?: boolean
  block?: Block
  nextBlock?: HTMLElement
  placeholder?: string
  replSilence?: boolean
  quiet?: boolean
  intentional?: boolean
  noHistory?: boolean
  noCoreRedirect?: boolean // controller wants to handle redirect
  pip?: { container: string; returnTo: string }
  history?: number
  echo?: boolean
  nested?: boolean
  failWithUsage?: boolean
  rethrowErrors?: boolean
  reportErrors?: boolean
  preserveBackButton?: boolean
  type?: ExecType

  exec?: 'pexec' | 'qexec' | 'rexec'

  container?: Element
  raw?: boolean
  createOnly?: boolean
  noHeader?: boolean
  noStatus?: boolean
  noSidecarHeader?: boolean
  noRetry?: boolean
  showHeader?: boolean
  alreadyWatching?: boolean
  insertIdx?: number // insert the command to a particular block

  createErrorStream?: StreamableFactory
  createOutputStream?: StreamableFactory
  stdout?: (str: Streamable) => void | Promise<void>
  stderr?: (str: string) => void | Promise<void>
  pipeStdin?: boolean

  /** on job init, pass the job, and get back a stdout; i.e. just before the PTY is brought up */
  onInit?: (job: Job) => Stream | Promise<Stream>

  /** on job ready, i.e. after the PTY is up, but before any data has been processed */
  onReady?: (job: Job) => void | Promise<void>

  /** on job exit, pass the exitCode */
  onExit?: (exitCode: number) => void

  /** Command parameters for internal use */
  parameters?: Record<string, unknown>

  /** Entity associated with the command execution */
  entity?: Record<string, unknown>

  /** Masquerade as if we executed this command line */
  masquerade?: string
}

/** Transform the `execUUID` field of `ExecOptions` to be required.  */
export type ExecOptionsWithUUID = Exclude<ExecOptions, 'execUUID'> & Required<Pick<ExecOptions, 'execUUID'>>

export interface LanguageBearing extends ExecOptions {
  /** navigator.language */
  language: string
}

export function hasLanguage(execOptions: ExecOptions): execOptions is LanguageBearing {
  return (execOptions as LanguageBearing).language !== undefined
}

export function withLanguage(execOptions: ExecOptions): LanguageBearing {
  if (hasLanguage(execOptions)) {
    return execOptions
  } else {
    return Object.assign({}, execOptions, { language: typeof navigator !== 'undefined' && navigator.language })
  }
}

export class DefaultExecOptions implements ExecOptions {
  public readonly type: ExecType
  public readonly language: string

  public constructor(type: ExecType = ExecType.TopLevel) {
    this.type = type
    this.language = typeof navigator !== 'undefined' && navigator.language
  }
}

export class DefaultExecOptionsForTab extends DefaultExecOptions {
  public readonly tab: Tab
  public readonly block: Block

  /**
   * @param execUUID this parameter supports command re-execution; see
   * https://github.com/IBM/kui/issues/5814
   *
   */
  public constructor(tab: Tab, block: Block, public readonly execUUID?: string) {
    super()
    this.tab = tab
    this.block = block
  }
}

export default ExecOptions
