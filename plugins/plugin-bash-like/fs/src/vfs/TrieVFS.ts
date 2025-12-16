/*
 * Copyright 2020 The Kubernetes Authors
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

import TrieSearch from 'trie-search'
import micromatch from 'micromatch'

import type { Arguments, CodedError } from '@kui-shell/core'
import type { FStat, VFS, GlobStats } from '..'

import { basename, dirname, join } from './posix'

const uid = -1
const gid = -1
const username = ''

export interface BaseEntry {
  mountPath: string
  isDirectory?: boolean
  isExecutable?: boolean
}

export type Directory = BaseEntry

export interface Leaf<D> {
  mountPath: string
  isExecutable?: boolean
  data: D
}

export abstract class TrieVFS<D, L extends Leaf<D> = Leaf<D>> implements VFS {
  public readonly isLocal = false
  public readonly isVirtual = true
  public readonly tags?: string[]

  protected readonly prefix: RegExp

   
  public constructor(public readonly mountPath = '/kui', protected readonly trie = new TrieSearch<Directory | L>()) {
    this.prefix = new RegExp(`^${this.mountPath}\\/?`)
  }

  protected abstract loadAsString(leaf: L): string | Promise<string>

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected nameForDisplay(name: string, entry: Directory | L): string | Promise<string> {
    return name
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected viewer(leaf: Leaf<D>) {
    return 'open'
  }

  protected isLeaf(entry: Directory | L): entry is L {
    return (entry as L).data !== undefined
  }

  /** Turn an ls-style glob into a nodejs-style regexp */
  private glob2RegExp(filepath: string): string {
    return filepath.replace(/\//g, '\\/').replace(/\*/g, '.*')
  }

  private dirPattern(filepath: string): RegExp {
    // /kui/kubernetes -> /\/kui\/kubernetes/[^/]+$/
    if (filepath.charAt(filepath.length - 1) === '/') {
      return new RegExp(`^${this.glob2RegExp(filepath)}[^/]+\\/?$`)
    } else {
      return this.dirPattern(filepath + '/')
    }
  }

  protected trieGet(filepath: string): BaseEntry[] {
    return this.trie.get(filepath)
  }

  /** Looks in the trie for any matches for the given filepath, handling the "contents of directory" case */
  private find(filepath: string, dashD = false, exact = false): (Directory | L)[] {
    const dirPattern = this.dirPattern(filepath)
    const matches = this.trieGet(filepath.replace(/[*{].*$/, '')) // trim off trailing globby bits when looking up in the trie
    const flexMatches = matches.filter(_ =>
      exact ? _.mountPath === filepath : micromatch.isMatch(_.mountPath, filepath) || dirPattern.test(_.mountPath)
    )

    if (dashD) {
      return matches.filter(_ => _.mountPath === filepath || _.mountPath === filepath + '/')
    } else if (exact) {
      return flexMatches
    } else {
      return flexMatches.filter(_ => !_.isDirectory || _.mountPath !== filepath)
    }
  }

  /** ls */
  public async ls(opts: { parsedOptions }, filepaths: string[]): Promise<GlobStats[]> {
    const entries = await Promise.all(
      filepaths.map(async filepath => {
        const entries = this.find(filepath.replace(this.prefix, ''), opts.parsedOptions.d)

        return {
          path: filepath,
          filepaths: await Promise.all(entries.map(_ => this.nameForDisplay(_.mountPath, _))),
          entries: await Promise.all(
            entries.map(async entry => {
              const nameForDisplay = await this.nameForDisplay(entry.mountPath, entry)
              const isDirectory = this.isLeaf(entry) ? false : !!entry.isDirectory
              const isFile = !isDirectory
              const stats: GlobStats = {
                name: basename(entry.mountPath),
                path: this.mountPath + entry.mountPath,
                nameForDisplay,
                viewer: this.isLeaf(entry) ? this.viewer(entry) : 'open',
                stats: {
                  size: 0,
                  mtimeMs: 0,
                  uid,
                  gid,
                  mode: entry.isExecutable ? 0o755 : 0o644
                },
                dirent: {
                  isFile,
                  isDirectory,
                  isSymbolicLink: false,
                  isSpecial: false,
                  isExecutable: !!entry.isExecutable,
                  permissions: (isDirectory ? 'd' : '-') + (entry.isExecutable ? 'rwxr-xr-x' : 'rw-r--r--'),
                  username,
                  mount: {
                    isLocal: this.isLocal,
                    tags: this.tags,
                    mountPath: this.mountPath
                  }
                }
              }
              return stats
            })
          )
        }
      })
    )

    return entries.filter(_ => _.entries.length > 0).flatMap(_ => _.entries)
  }

  public async fstat(opts: Arguments<{ parsedOptions }>, filepath: string, withData: boolean, enoentOk: boolean): Promise<FStat> {
    const matches = this.find(filepath.replace(this.prefix, ''), false, true)
    if (matches.length === 0) {
      if (enoentOk) {
        return undefined
      } else {
        const error: CodedError = new Error(`File not found: ${filepath}`)
        error.code = 404
        throw error
      }
    } else {
      const entry = matches[0]
      const mountPath = entry.mountPath
      return {
        viewer: this.isLeaf(entry) ? this.viewer(entry) : 'open',
        filepath: mountPath,
        fullpath: this.mountPath + mountPath,
        isDirectory: this.isLeaf(entry) ? false : !!entry.isDirectory,
        isExecutable: entry.isExecutable,
        size: 0,
        data: withData && this.isLeaf(entry) ? await this.loadAsString(entry) : undefined
      }
    }
  }

  public grep() {
    return Promise.resolve([])
  }

  public async grepdir(opts: Arguments, filepaths: string[], pattern: string) {
    const leafMatches = (
      await Promise.all(
        filepaths.map(async filepath => {
          const entries = this.find(filepath.replace(this.prefix, ''))
          return entries
            .filter(_ => this.isLeaf(_))
            .map(async (entry): Promise<L | undefined> => {
              const content = await this.loadAsString(entry as L)
              return content.match(new RegExp(pattern)) ? (entry as L) : undefined
            })
        })
      )
    ).flat()

    const matches = (await Promise.all(leafMatches)).filter((entry): entry is NonNullable<typeof entry> => entry !== undefined) as L[]

    return Promise.all(
      matches.map(entry => ({
        path: this.mountPath + entry.mountPath,
        stats: {
          size: 0
        }
      }))
    )
  }

  /** Insert filepath into directory */
  public cp(_, srcFilepaths: string[], dstFilepath: string): Promise<string> {
    return Promise.all(
      srcFilepaths.map(async srcFilepath => {
        const match1 = srcFilepath.match(/^plugin:\/\/plugin-(.*)\/notebooks\/(.*)\.(md|json)$/)
        const match2 = srcFilepath.match(/^plugin:\/\/client\/notebooks\/(.*)\.(md|json|yml|yaml|txt|py)$/)
        const match3 = srcFilepath.match(/^plugin:\/\/client\/(.*)\.(md|json)$/)
        const match = match1 || match2 || match3
        if (match) {
          const dir = dirname(dstFilepath)
          if (!this.trieGet(dir)) {
            throw new Error(`Directory does not exist: ${dir}`)
          } else {
            const file = match1 ? match1[2] : match2 ? match2[1] : match3[1]
            const extension = '.' + (match1 ? match1[3] : match2 ? match2[2] : match3[2])
            const mountPath = join(dstFilepath, file + extension)
            // Cast to any to work around TrieSearch type limitations
            ;(this.trie as any).map(mountPath, { mountPath, data: { srcFilepath } })
          }
        } else {
          throw new Error(`Unable to copy given source into the VFS: ${srcFilepath}`)
        }
      })
    ).then(() => 'ok')
  }

  /** remove filepath */
  public async rm(_, filepath: string): Promise<string> {
    // Cast to any to work around TrieSearch type limitations
    ;(this.trie as any).remove(filepath.replace(this.prefix, ''))
    return 'ok'
  }

  public async fwrite(_, filepath: string, _data: string | Buffer): Promise<void> {
    const match = filepath.match(/([^/]+)\.([^.]+)$/)
    if (match) {
      const srcFilepath = `plugin://client/notebooks/${match[1]}.${match[2]}`
      const mountPath = filepath.replace(this.prefix, '')
      // Cast to any to work around TrieSearch type limitations
      ;(this.trie as any).map(mountPath, { mountPath, data: { srcFilepath } })
    } else {
      throw new Error('Invalid filepath for writing to VFS: ' + filepath)
    }
  }

  public async mkdir(_, filepath: string): Promise<void> {
    const mountPath = filepath.replace(this.prefix, '')
    // Cast to any to work around TrieSearch type limitations
    ;(this.trie as any).map(mountPath, { mountPath, isDirectory: true })
  }

  public async rmdir(_, filepath: string): Promise<void> {
    await this.rm(_, filepath)
  }

  public async fslice(filename: string, offset: number, length: number): Promise<string> {
    const matches = this.find(filename.replace(this.prefix, ''), false, true)
    if (matches.length > 0 && this.isLeaf(matches[0])) {
      const content = await this.loadAsString(matches[0] as L)
      return content.slice(offset, offset + length)
    }
    return ''
  }
}
