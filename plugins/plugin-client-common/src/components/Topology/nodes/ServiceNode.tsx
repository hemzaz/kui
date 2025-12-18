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

import React from 'react'
import { Handle, Position } from 'reactflow'
import type { NodeData } from '@kui-shell/core/src/topology'

interface ServiceNodeProps {
  data: NodeData
}

export function ServiceNode({ data }: ServiceNodeProps) {
  const { resource, status, label } = data
  const serviceType = resource?.spec?.type || 'ClusterIP'
  const ports = resource?.spec?.ports || []

  const portsList = ports
    .slice(0, 2)
    .map((p: any) => `${p.port}:${p.targetPort}`)
    .join(', ')

  return (
    <div className={`topology-node service-node type-${serviceType.toLowerCase()} status-${status}`}>
      <Handle type="target" position={Position.Top} />

      <div className="node-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z"/>
        </svg>
      </div>

      <div className="node-content">
        <div className="node-label" title={label}>{label}</div>
        <div className="node-meta">{serviceType}</div>
        {portsList && <div className="node-ports">{portsList}</div>}
      </div>

      <div className={`node-status-indicator status-${status}`} />

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
