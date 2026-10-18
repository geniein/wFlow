import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Play } from 'lucide-react';
import { NodeStatusBadge } from './NodeStatusBadge.js';
import type { FlowNodeData } from '../../types/flow.js';
import { useFlowContext } from '../../context/FlowContext.js';

export const InjectNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const nodeData = data as FlowNodeData;
  const { triggerInject } = useFlowContext();

  const handleInjectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerInject(id);
  };

  return (
    <div
      className={`relative flex items-center min-w-[150px] h-9 rounded bg-[#a6bbcf] border-2 shadow-sm transition-all text-gray-800 ${
        selected ? 'border-red-500 ring-2 ring-red-200' : 'border-[#627d98] hover:border-gray-600'
      }`}
    >
      {/* Quick trigger button on left edge */}
      <button
        onClick={handleInjectClick}
        title="Inject message now"
        className="flex items-center justify-center w-7 h-full bg-[#829ab1] hover:bg-[#627d98] active:bg-[#486581] text-white rounded-l border-r border-[#627d98] cursor-pointer transition-colors"
      >
        <Play size={12} className="fill-current" />
      </button>

      {/* Node label */}
      <div className="flex-1 px-3 py-1 text-xs font-semibold select-none truncate">
        {nodeData.label || 'inject'}
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
