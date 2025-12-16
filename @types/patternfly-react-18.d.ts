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
 * Global type augmentation for PatternFly v4 components to support React 18+ pointer event types.
 *
 * React 18+ added onPointerEnterCapture and onPointerLeaveCapture to HTML element types,
 * but PatternFly v4 (which predates React 18) doesn't include them in component prop types.
 *
 * This file provides a compatibility layer by extending PatternFly component interfaces
 * to include these optional properties, allowing them to be passed through without type errors.
 *
 * This file is placed at the project root to be accessible by all packages and plugins.
 */

import type * as React from 'react'

// Pointer capture event handler types from React 18+
type PointerEventHandler = React.PointerEventHandler<any>

// PatternFly React Core - Tabs components
declare module '@patternfly/react-core/dist/esm/components/Tabs' {
  export interface TabProps {
    onPointerEnterCapture?: PointerEventHandler | undefined
    onPointerLeaveCapture?: PointerEventHandler | undefined
  }

  export interface TabsProps {
    onPointerEnterCapture?: PointerEventHandler | undefined
    onPointerLeaveCapture?: PointerEventHandler | undefined
  }
}

// PatternFly React Table - Table Composable components
declare module '@patternfly/react-table/dist/esm/components/TableComposable' {
  export interface TableComposableProps {
    onPointerEnterCapture?: PointerEventHandler | undefined
    onPointerLeaveCapture?: PointerEventHandler | undefined
  }

  export interface TheadProps {
    onPointerEnterCapture?: PointerEventHandler | undefined
    onPointerLeaveCapture?: PointerEventHandler | undefined
  }

  export interface TbodyProps {
    onPointerEnterCapture?: PointerEventHandler | undefined
    onPointerLeaveCapture?: PointerEventHandler | undefined
  }

  export interface TrProps {
    onPointerEnterCapture?: PointerEventHandler | undefined
    onPointerLeaveCapture?: PointerEventHandler | undefined
  }

  export interface ThProps {
    onPointerEnterCapture?: PointerEventHandler | undefined
    onPointerLeaveCapture?: PointerEventHandler | undefined
  }

  export interface TdProps {
    onPointerEnterCapture?: PointerEventHandler | undefined
    onPointerLeaveCapture?: PointerEventHandler | undefined
  }
}
