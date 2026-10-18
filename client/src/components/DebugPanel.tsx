import React from 'react';
import { Trash2, Bug } from 'lucide-react';
import type { DebugLog } from '../types/flow.js';

interface DebugPanelProps {
  logs: DebugLog[];
  onClear: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  logs,
  onClear,
  isOpen,
  onToggle,
}) => {
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-lg shadow-lg hover:bg-gray-800 cursor-pointer text-xs font-semibold"
      >
        <Bug size={14} className="text-emerald-400" />
        <span>Debug ({logs.length})</span>
      </button>
    );
  }

  return (
    <div className="w-80 bg-gray-900 border-l border-gray-800 text-gray-200 flex flex-col h-full shrink-0 z-20 shadow-xl select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-800 bg-gray-950">
        <div className="flex items-center gap-2">
          <Bug size={14} className="text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
            Debug Messages
          </span>
          <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded-full font-mono">
            {logs.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onClear}
            className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-gray-200 cursor-pointer"
            title="Clear all messages"
          >
            <Trash2 size={13} />
          </button>
          <button
            onClick={onToggle}
            className="text-[11px] text-gray-400 hover:text-gray-200 px-1.5 py-0.5 hover:bg-gray-800 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 font-mono text-[11px]">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 text-center px-4">
            <Bug size={24} className="mb-2 opacity-30" />
            <p className="text-xs">No debug messages yet</p>
            <p className="text-[10px] mt-1 text-gray-600">
              Trigger an inject node to see messages flow through debug nodes
            </p>
          </div>
        ) : (
          logs.map((log, index) => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString();
            return (
              <div
                key={`${log.id}-${index}`}
                className="p-2.5 rounded bg-gray-950/80 border border-gray-800 space-y-1.5 hover:border-gray-700 transition-colors"
              >
                {/* Meta info */}
                <div className="flex items-center justify-between text-[10px] text-gray-400">
                  <span className="bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800 font-semibold truncate max-w-[150px]">
                    {log.nodeName}
                  </span>
                  <span className="text-gray-500">{timeStr}</span>
                </div>

                {log.topic && (
                  <div className="text-[10px] text-sky-400 truncate">
                    topic: <span className="text-gray-300">{log.topic}</span>
                  </div>
                )}

                {/* Payload content */}
                <div className="bg-gray-900 p-2 rounded border border-gray-800 overflow-x-auto text-emerald-300">
                  {typeof log.msg === 'object' && log.msg !== null ? (
                    <pre className="text-[11px] leading-tight">
                      {JSON.stringify(log.msg, null, 2)}
                    </pre>
                  ) : (
                    <span className="font-semibold text-emerald-400">
                      {String(log.msg)}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
