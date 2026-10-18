import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { GitFork } from 'lucide-react';
import { NodeStatusBadge } from './NodeStatusBadge.js';
import type { FlowNodeData } from '../../types/flow.js';

export const SwitchNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as FlowNodeData;
  const rules = nodeData.rules && nodeData.rules.length > 0 ? nodeData.rules : [{ property: 'payload', operator: 'eq', value: '' }];
  const nodeHeight = Math.max(36, rules.length * 24);

  return (
    <div
      style={{ height: `${nodeHeight}px` }}
      className={`relative flex items-center min-w-[150px] rounded bg-[#e2d96e] border-2 shadow-sm transition-all text-gray-900 ${
        selected ? 'border-red-500 ring-2 ring-red-200' : 'border-[#9f9520] hover:border-gray-700'
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
        <GitFork size={13} className="text-yellow-900 shrink-0 rotate-90" />
        <span className="text-xs font-semibold truncate">
          {nodeData.label || 'switch'}
        </span>
      </div>

      {/* Multiple Output Ports */}
      {rules.map((rule, idx) => {
        const topPercent = ((idx + 1) / (rules.length + 1)) * 100;
        return (
          <Handle
            key={idx}
            type="source"
            position={Position.Right}
            id={`output_${idx}`}
            style={{ top: `${topPercent}%` }}
            title={`Output ${idx + 1}: ${rule.operator} ${rule.value}`}
            className="!w-3 !h-3 !bg-gray-800 !border-2 !border-white hover:!bg-blue-600 !-right-1.5 transition-colors"
          />
        );
      })}

      {/* Status indicator */}
      <NodeStatusBadge status={nodeData.status} />
    </div>
  );
};
