import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Bug } from 'lucide-react';
import { NodeStatusBadge } from './NodeStatusBadge.js';
import type { FlowNodeData } from '../../types/flow.js';

export const DebugNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as FlowNodeData;
  const isActive = nodeData.active !== false;

  return (
    <div
      className={`relative flex items-center min-w-[150px] h-9 rounded bg-[#87a980] border-2 shadow-sm transition-all text-gray-900 ${
        selected ? 'border-red-500 ring-2 ring-red-200' : 'border-[#4e7d45] hover:border-gray-700'
      } ${!isActive ? 'opacity-60 grayscale' : ''}`}
    >
      {/* Input Port */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !bg-gray-800 !border-2 !border-white hover:!bg-blue-600 !-left-1.5 transition-colors"
      />

      <div className="flex items-center gap-2 px-3 py-1 flex-1 select-none truncate">
        <Bug size={13} className="text-gray-800 shrink-0" />
        <span className="text-xs font-semibold truncate">
          {nodeData.label || 'msg.payload'}
        </span>
      </div>

      {/* Status indicator */}
      <NodeStatusBadge status={nodeData.status} />
    </div>
  );
};
