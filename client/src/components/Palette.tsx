import React from 'react';
import { Play, Bug, Code2, GitFork, Clock, Globe } from 'lucide-react';

interface PaletteItem {
  type: string;
  reactFlowType: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  bgColor: string;
  borderColor: string;
  textColor: string;
  defaultData: any;
}

const PALETTE_CATEGORIES: { name: string; items: PaletteItem[] }[] = [
  {
    name: 'common',
    items: [
      {
        type: 'inject',
        reactFlowType: 'injectNode',
        label: 'inject',
        icon: Play,
        bgColor: '#a6bbcf',
        borderColor: '#627d98',
        textColor: '#102a43',
        defaultData: {
          label: 'timestamp',
          type: 'inject',
          payloadType: 'date',
          payload: '',
          topic: '',
          repeat: 0,
          once: false,
        },
      },
      {
        type: 'debug',
        reactFlowType: 'debugNode',
        label: 'debug',
        icon: Bug,
        bgColor: '#87a980',
        borderColor: '#4e7d45',
        textColor: '#193b14',
        defaultData: {
          label: 'msg.payload',
          type: 'debug',
          complete: false,
          active: true,
        },
      },
    ],
  },
  {
    name: 'function',
    items: [
      {
        type: 'function',
        reactFlowType: 'functionNode',
        label: 'function',
        icon: Code2,
        bgColor: '#fdd0a2',
        borderColor: '#d9822b',
        textColor: '#5a2d0c',
        defaultData: {
          label: 'function',
          type: 'function',
          code: '// Access and modify msg\nmsg.payload = msg.payload;\nreturn msg;',
        },
      },
      {
        type: 'switch',
        reactFlowType: 'switchNode',
        label: 'switch',
        icon: GitFork,
        bgColor: '#e2d96e',
        borderColor: '#9f9520',
        textColor: '#423c04',
        defaultData: {
          label: 'switch',
          type: 'switch',
          rules: [
            { property: 'payload', operator: 'eq', value: '' },
          ],
        },
      },
      {
        type: 'delay',
        reactFlowType: 'delayNode',
        label: 'delay',
        icon: Clock,
        bgColor: '#e6e0f8',
        borderColor: '#9c82d4',
        textColor: '#331d68',
        defaultData: {
          label: '1s delay',
          type: 'delay',
          delayMs: 1000,
        },
      },
    ],
  },
  {
    name: 'network',
    items: [
      {
        type: 'httpRequest',
        reactFlowType: 'httpRequestNode',
        label: 'http request',
        icon: Globe,
        bgColor: '#ffcdd2',
        borderColor: '#e57373',
        textColor: '#5c1d24',
        defaultData: {
          label: 'GET request',
          type: 'httpRequest',
          method: 'GET',
          url: 'https://jsonplaceholder.typicode.com/todos/1',
        },
      },
    ],
  },
];

export const Palette: React.FC = () => {
  const onDragStart = (event: React.DragEvent, item: PaletteItem) => {
    event.dataTransfer.setData(
      'application/reactflow',
      JSON.stringify({
        nodeType: item.reactFlowType,
        defaultData: item.defaultData,
      })
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-56 bg-gray-50 border-r border-gray-200 flex flex-col h-full select-none shrink-0 shadow-inner">
      <div className="p-3 border-b border-gray-200 bg-gray-100 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
          Palette
        </span>
        <span className="text-[10px] text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
          Drag & Drop
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {PALETTE_CATEGORIES.map((category) => (
          <div key={category.name}>
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-2">
              {category.name}
            </div>
            <div className="space-y-1.5">
              {category.items.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.type}
                    draggable
                    onDragStart={(e) => onDragStart(e, item)}
                    style={{
                      backgroundColor: item.bgColor,
                      borderColor: item.borderColor,
                      color: item.textColor,
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-medium cursor-grab active:cursor-grabbing hover:opacity-90 active:scale-95 transition-all shadow-sm"
                  >
                    <IconComponent size={13} className="shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
