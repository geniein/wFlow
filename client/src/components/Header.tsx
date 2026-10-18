import React from 'react';
import { Play, Download, Upload, Cpu } from 'lucide-react';

interface HeaderProps {
  isConnected: boolean;
  isModified: boolean;
  onDeploy: () => void;
  onExport: () => void;
  onImport: () => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({
  isConnected,
  isModified,
  onDeploy,
  onExport,
  onImport,
  activeTab,
}) => {
  return (
    <header className="h-12 bg-[#8f0000] text-white flex items-center justify-between px-4 select-none shrink-0 shadow-md">
      {/* Brand & Tabs */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-white text-[#8f0000] flex items-center justify-center font-black text-sm shadow">
            wF
          </div>
          <span className="font-bold text-sm tracking-wide">wFlow</span>
          <span className="text-[10px] bg-red-950/60 px-1.5 py-0.5 rounded text-red-200">
            Node-RED in React Flow
          </span>
        </div>

        {/* Tab */}
        <div className="flex items-center">
          <div className="bg-[#b30000] px-3 py-1 rounded-t text-xs font-semibold flex items-center gap-1.5 border-b-2 border-white">
            <Cpu size={12} />
            <span>{activeTab}</span>
          </div>
        </div>
      </div>

      {/* Actions & Connection status */}
      <div className="flex items-center gap-3">
        {/* Connection status */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/20 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
            }`}
          />
          <span className="text-[11px] text-gray-200 font-mono">
            {isConnected ? 'Engine Connected' : 'Engine Disconnected'}
          </span>
        </div>

        {/* Export / Import */}
        <div className="flex items-center gap-1 border-r border-red-900 pr-3">
          <button
            onClick={onExport}
            title="Export Flow as JSON"
            className="p-1.5 hover:bg-red-800 rounded text-red-100 hover:text-white transition-colors cursor-pointer"
          >
            <Download size={15} />
          </button>
          <button
            onClick={onImport}
            title="Import Flow JSON"
            className="p-1.5 hover:bg-red-800 rounded text-red-100 hover:text-white transition-colors cursor-pointer"
          >
            <Upload size={15} />
          </button>
        </div>

        {/* Deploy Button */}
        <button
          onClick={onDeploy}
          disabled={!isConnected}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-bold transition-all shadow cursor-pointer ${
            isModified
              ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
              : 'bg-red-800 hover:bg-red-700 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Play size={13} className="fill-current" />
          <span>Deploy</span>
        </button>
      </div>
    </header>
  );
};
