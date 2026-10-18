import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Code2 } from 'lucide-react';
import { NodeStatusBadge } from './NodeStatusBadge.js';
import type { FlowNodeData } from '../../types/flow.js';

export const FunctionNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as FlowNodeData;

  return (
    <div
      className={`relative flex items-center min-w-[150px] h-9 rounded bg-[#fdd0a2] border-2 shadow-sm transition-all text-gray-900 ${
        selected ? 'border-red-500 ring-2 ring-red-200' : 'border-[#d9822b] hover:border-gray-700'
      }`}
    >
      {/* Input Port */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !bg-gray-800 !border-2 !border-white hover:!bg-blue-600 !-left-1.5 transition-colors"
      />

      <div className="flex items-center gap-2 px-3 py-1 flex-1 select-none truncate">
        <Code2 size={13} className="text-amber-900 shrink-0" />
        <span className="text-xs font-semibold truncate">
          {nodeData.label || 'function'}
        </span>
      </div>

      {/* Output Port */}
      <Handle
        type="source"
        position={Position.Right}
        id="output_0"
        className="!w-3 !h-3 !bg-gray-800 !border-2 !border-white hover:!bg-blue-600 !-right-1.5 transition-colors"
      />

      {/* Status indicator */}
      <NodeStatusBadge status={nodeData.status} />
    </div>
  );
};
