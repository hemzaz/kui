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

import React, { useState, useRef, useCallback, useImperativeHandle, forwardRef, memo } from 'react'

import { eventBus } from '@kui-shell/core/mdist/api/Events'
import { Tab as KuiTab } from '@kui-shell/core/mdist/api/Tab'

import Width from '../../Sidecar/width'
import SplitPosition from '../SplitPosition'
import Input, { InputOptions } from './Input'
import Output from './Output'
import {
  BlockModel,
  isActive,
  isEmpty,
  isFinished,
  isMaximized,
  isOutputOnly,
  isProcessing,
  isReplay,
  isAnnouncement,
  hideOutput,
  hasUUID
} from './BlockModel'
import { MutabilityContext } from '../../../Client/MutabilityContext'

export type BlockViewTraits = {
  /** number of splits currently in this tab */
  nSplits?: number

  isExperimental?: boolean
  isFocused?: boolean
  isWidthConstrained?: boolean

  /** Handler for: User clicked to focus on this block */
  willFocusBlock?: (evt: React.SyntheticEvent) => void

  /** Handler for <li> focus */
  onFocus?: (evt: React.FocusEvent) => void
}

export interface BlockOperationTraits {
  /** Remove the enclosing block */
  willRemove?: (evt: React.SyntheticEvent, idx?: number) => void

  /** Is the block executable? e.g. re-editable and re-runable */
  isExecutable?: boolean
}

type Props = InputOptions &
  React.PropsWithChildren<{
    /** block ordinal index */
    idx: number

    /** block ordinal index to be displayed to the user */
    displayedIdx?: number

    /** block model */
    model: BlockModel

    /** tab UUID */
    uuid: string

    /** tab model */
    tab: KuiTab

    noActiveInput?: boolean

    /** Position of the enclosing split. Default: SplitPosition.default */
    splitPosition?: SplitPosition

    noOutput?: boolean
    onOutputRender?: () => void
    willUpdateCommand?: (idx: number, command: string) => void
  }> &
  BlockViewTraits

export interface BlockHandle {
  doFocus: () => void
  inputValue: () => string | undefined
  state: {
    _block: HTMLElement | null
  }
  props: {
    model: BlockModel
  }
}

const Block = forwardRef<BlockHandle, Props>((props, ref) => {
  const [blockElement, setBlockElement] = useState<HTMLElement | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [maximizedState, setMaximizedState] = useState(false)
  const inputRef = useRef<Input>(null)

  // Expose public methods and state via ref for compatibility with class component usage
  useImperativeHandle(ref, () => ({
    doFocus: () => {
      inputRef.current?.doFocus()
    },
    inputValue: () => {
      return inputRef.current?.value()
    },
    state: {
      _block: blockElement
    },
    props: {
      model: props.model
    }
  }), [blockElement, props.model])

  // Handler for size changes
  const handleChangeSize = useCallback((width: Width) => {
    setMaximizedState(width === Width.Maximized)
    setTimeout(() => {
      eventBus.emitTabLayoutChange(props.tab.uuid)
      if (blockElement) {
        blockElement.scrollIntoView(true)
      }
    })
  }, [blockElement, props.tab.uuid])

  // Handler for output render
  const handleOutputRender = useCallback(() => {
    if (props.onOutputRender) {
      props.onOutputRender()
    }
  }, [props.onOutputRender])

  // Render output component
  const renderOutput = useCallback(() => {
    if (isActive(props.model) || isFinished(props.model) || isProcessing(props.model)) {
      return (
        <Output
          key={isEmpty(props.model) ? undefined : props.model.execUUID}
          uuid={props.uuid}
          tab={props.tab}
          idx={props.idx}
          model={props.model}
          splitPosition={props.splitPosition}
          willRemove={props.willRemove}
          willChangeSize={handleChangeSize}
          onRender={handleOutputRender}
          willUpdateCommand={props.willUpdateCommand}
          isWidthConstrained={props.isWidthConstrained}
          willFocusBlock={props.willFocusBlock}
        />
      )
    }
    return null
  }, [
    props.model,
    props.uuid,
    props.tab,
    props.idx,
    props.splitPosition,
    props.willRemove,
    props.willUpdateCommand,
    props.isWidthConstrained,
    props.willFocusBlock,
    handleChangeSize,
    handleOutputRender
  ])

  // Render custom input if provided
  const renderCustomInput = useCallback(() => {
    if (props.children && React.isValidElement(props.children)) {
      return React.cloneElement(
        props.children as React.ReactElement<Pick<Props, 'idx' | 'tab' | 'uuid'> & { block: HTMLElement }>,
        {
          idx: props.idx,
          tab: props.tab,
          uuid: props.uuid,
          block: blockElement
        }
      )
    }
    return null
  }, [props.children, props.idx, props.tab, props.uuid, blockElement])

  // Render input component
  const renderInput = useCallback(() => {
    const customInput = renderCustomInput()
    if (customInput) {
      return customInput
    }

    if (!blockElement) {
      return null
    }

    return (
      <Input
        key={props.uuid}
        uuid={props.uuid}
        tab={props.tab}
        model={props.model}
        isExperimental={props.isExperimental}
        {...props}
        willFocusBlock={props.willFocusBlock}
        _block={blockElement}
        ref={inputRef}
      >
        {props.children}
      </Input>
    )
  }, [blockElement, props, renderCustomInput])

  // Don't render if noActiveInput and block is active
  if (props.noActiveInput && isActive(props.model)) {
    return null
  }

  const hideOut = hideOutput(props.model)
  const output = renderOutput()
  const input = renderInput()

  return (
    <MutabilityContext.Consumer>
      {value => (
        <li
          className={'repl-block ' + (hideOut ? '' : props.model.state.toString())}
          data-is-executable={value.executable || undefined}
          data-is-editable={value.editable || undefined}
          data-is-maximized={maximizedState || isMaximized(props.model) || undefined}
          data-is-output-only={isOutputOnly(props.model) || undefined}
          data-is-empty={isEmpty(props.model) || undefined}
          data-announcement={isAnnouncement(props.model) || undefined}
          data-uuid={hasUUID(props.model) && props.model.execUUID}
          data-scrollback-uuid={props.uuid}
          data-input-count={props.idx}
          data-is-focused={props.isFocused || undefined}
          data-is-replay={isReplay(props.model) || undefined}
          ref={setBlockElement}
          tabIndex={isActive(props.model) ? -1 : 1}
          onClick={props.willFocusBlock}
          onFocus={props.onFocus}
        >
          {isAnnouncement(props.model) || isOutputOnly(props.model) ? (
            output
          ) : isEmpty(props.model) ? (
            input
          ) : (
            <>
              {input}
              {!hideOut && output}
            </>
          )}
        </li>
      )}
    </MutabilityContext.Consumer>
  )
})

Block.displayName = 'Block'

const MemoizedBlock = memo(Block)

// Export both the component and its types for compatibility
export default MemoizedBlock
export type BlockComponent = React.ElementRef<typeof MemoizedBlock>
// BlockHandle is already exported via the interface declaration above
