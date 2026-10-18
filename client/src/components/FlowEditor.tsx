import React, { useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type OnConnect,
  useReactFlow,
  Panel,
} from '@xyflow/react';
import { Palette } from './Palette.js';
import { Header } from './Header.js';
import { NodeConfigDrawer } from './NodeConfigDrawer.js';
import { DebugPanel } from './DebugPanel.js';
import { InjectNode } from './nodes/InjectNode.js';
import { DebugNode } from './nodes/DebugNode.js';
import { FunctionNode } from './nodes/FunctionNode.js';
import { SwitchNode } from './nodes/SwitchNode.js';
import { DelayNode } from './nodes/DelayNode.js';
import { HttpRequestNode } from './nodes/HttpRequestNode.js';
import { FlowContext } from '../context/FlowContext.js';
import { useWebSocket } from '../hooks/useWebSocket.js';
import type { AppNode, AppEdge, Flow, FlowNodeData, NodeStatus } from '../types/flow.js';

const nodeTypes = {
  injectNode: InjectNode,
  debugNode: DebugNode,
  functionNode: FunctionNode,
  switchNode: SwitchNode,
  delayNode: DelayNode,
  httpRequestNode: HttpRequestNode,
};

const defaultEdgeOptions = {
  type: 'smoothstep',
  style: { strokeWidth: 2, stroke: '#64748b' },
};

export const FlowEditor: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<AppEdge>([]);
  const [selectedNode, setSelectedNode] = useState<AppNode | null>(null);
  const [isDebugOpen, setIsDebugOpen] = useState(true);
  const [isModified, setIsModified] = useState(false);
  const [flowMeta, setFlowMeta] = useState({ id: 'flow-1', name: 'Flow 1' });

  const { screenToFlowPosition } = useReactFlow();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status updates from backend
  const handleStatusUpdate = useCallback((nodeId: string, status: NodeStatus) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              status,
            },
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  // Wire pulse animation on message transmission
  const handleEdgePulse = useCallback((edgeId: string) => {
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === edgeId) {
          return {
            ...edge,
            className: 'pulsing-edge',
          };
        }
        return edge;
      })
    );

    setTimeout(() => {
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id === edgeId) {
            return {
              ...edge,
              className: '',
            };
          }
          return edge;
        })
      );
    }, 700);
  }, [setEdges]);

  // WebSocket hook
  const { isConnected, debugLogs, deployFlow, triggerInject, clearDebugLogs } = useWebSocket({
    onFlowReceived: (flow: Flow) => {
      if (flow) {
        setFlowMeta({ id: flow.id, name: flow.name });
        setNodes(flow.nodes || []);
        setEdges(flow.edges || []);
        setIsModified(false);
      }
    },
    onStatusUpdate: handleStatusUpdate,
    onEdgePulse: handleEdgePulse,
    onDeploySuccess: () => {
      setIsModified(false);
    },
  });

  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            ...defaultEdgeOptions,
          },
          eds
        )
      );
      setIsModified(true);
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const rawData = event.dataTransfer.getData('application/reactflow');
      if (!rawData) return;

      try {
        const { nodeType, defaultData } = JSON.parse(rawData);
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        const newNode: AppNode = {
          id: `${defaultData.type}-${Date.now().toString(36)}`,
          type: nodeType,
          position,
          data: defaultData,
        };

        setNodes((nds) => nds.concat(newNode));
        setIsModified(true);
      } catch (err) {
        console.error('Failed to parse dropped node data', err);
      }
    },
    [screenToFlowPosition, setNodes]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: AppNode) => {
    setSelectedNode(node);
  }, []);

  const handleSaveNodeData = useCallback(
    (nodeId: string, updatedData: FlowNodeData) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: updatedData,
            };
          }
          return node;
        })
      );
      setIsModified(true);
    },
    [setNodes]
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
      setIsModified(true);
      setSelectedNode(null);
    },
    [setNodes, setEdges]
  );

  const handleDeploy = () => {
    const flow: Flow = {
      id: flowMeta.id,
      name: flowMeta.name,
      nodes,
      edges,
    };
    deployFlow(flow);
  };

  const handleExport = () => {
    const flow: Flow = {
      id: flowMeta.id,
      name: flowMeta.name,
      nodes,
      edges,
    };
    const blob = new Blob([JSON.stringify(flow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flow-${flow.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const flow: Flow = JSON.parse(evt.target?.result as string);
        if (flow.nodes && flow.edges) {
          setFlowMeta({ id: flow.id || 'flow-1', name: flow.name || 'Imported Flow' });
          setNodes(flow.nodes || []);
          setEdges(flow.edges || []);
          setIsModified(true);
        }
      } catch (err) {
        alert('Invalid flow JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <FlowContext.Provider value={{ triggerInject }}>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-100 font-sans">
        {/* Hidden file input for import */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          className="hidden"
        />

        {/* Header */}
        <Header
          isConnected={isConnected}
          isModified={isModified}
          onDeploy={handleDeploy}
          onExport={handleExport}
          onImport={handleImport}
          activeTab={flowMeta.name}
        />

        {/* Main Workspace */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Left Palette */}
          <Palette />

          {/* Center Canvas */}
          <div className="flex-1 h-full relative" onDragOver={onDragOver} onDrop={onDrop}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={(changes) => {
                onNodesChange(changes);
                setIsModified(true);
              }}
              onEdgesChange={(changes) => {
                onEdgesChange(changes);
                setIsModified(true);
              }}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              defaultEdgeOptions={defaultEdgeOptions}
              fitView
              className="bg-[#fafbfc]"
            >
              <Background gap={18} size={1.2} color="#cbd5e1" />
              <Controls className="!bg-white !border !border-gray-300 !shadow-sm !rounded" />
              <MiniMap
                nodeStrokeColor="#64748b"
                nodeColor="#e2e8f0"
                maskColor="rgba(240, 242, 245, 0.7)"
                className="!border !border-gray-300 !rounded !shadow-sm"
              />
              <Panel position="bottom-left" className="bg-white/90 backdrop-blur border border-gray-300 rounded px-2.5 py-1 text-[11px] text-gray-500 shadow-sm pointer-events-none">
                Double-click or click node to edit • Click ▶ button on Inject node to trigger
              </Panel>
            </ReactFlow>
          </div>

          {/* Right Debug Panel */}
          <DebugPanel
            logs={debugLogs}
            onClear={clearDebugLogs}
            isOpen={isDebugOpen}
            onToggle={() => setIsDebugOpen((prev) => !prev)}
          />
        </div>

        {/* Node Config Drawer */}
        <NodeConfigDrawer
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onSave={handleSaveNodeData}
          onDelete={handleDeleteNode}
        />
      </div>
    </FlowContext.Provider>
  );
};
