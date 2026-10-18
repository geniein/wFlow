import React from 'react';
import type { NodeStatus } from '../../types/flow.js';

interface NodeStatusBadgeProps {
  status?: NodeStatus;
}

const FILL_COLORS: Record<string, string> = {
  green: 'bg-emerald-500',
  red: 'bg-rose-500',
  yellow: 'bg-amber-500',
  blue: 'bg-sky-500',
  grey: 'bg-gray-400',
};

const RING_CLASSES: Record<string, string> = {
  green: 'border-2 border-emerald-500 bg-transparent',
  red: 'border-2 border-rose-500 bg-transparent',
  yellow: 'border-2 border-amber-500 bg-transparent',
  blue: 'border-2 border-sky-500 bg-transparent',
  grey: 'border-2 border-gray-400 bg-transparent',
};

export const NodeStatusBadge: React.FC<NodeStatusBadgeProps> = ({ status }) => {
  if (!status || !status.text) return null;

  const isRing = status.shape === 'ring';
  const colorClass = isRing
    ? RING_CLASSES[status.fill] || RING_CLASSES.grey
    : FILL_COLORS[status.fill] || FILL_COLORS.grey;

  return (
    <div className="absolute -bottom-6 left-0 right-0 flex items-center justify-center pointer-events-none">
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/95 shadow-sm border border-gray-200 text-[10px] text-gray-700 max-w-[200px]">
        <span className={`w-2 h-2 rounded-full shrink-0 ${colorClass}`} />
        <span className="truncate font-mono">{status.text}</span>
      </div>
    </div>
  );
};
