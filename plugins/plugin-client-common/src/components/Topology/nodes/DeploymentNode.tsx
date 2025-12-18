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

interface DeploymentNodeProps {
  data: NodeData
}

export function DeploymentNode({ data }: DeploymentNodeProps) {
  const { resource, status, label } = data
  const replicas = resource?.spec?.replicas || 0
  const available = resource?.status?.availableReplicas || 0

  return (
    <div className={`topology-node deployment-node status-${status}`}>
      <Handle type="target" position={Position.Top} />

      <div className="node-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/>
        </svg>
      </div>

      <div className="node-content">
        <div className="node-label" title={label}>{label}</div>
        <div className="node-meta">Deployment</div>
        <div className="node-replicas">
          {available}/{replicas} replicas
        </div>
      </div>

      <div className={`node-status-indicator status-${status}`} />

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
