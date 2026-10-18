import type { Node, Edge } from '@xyflow/react';

export type NodeStatusFill = 'green' | 'red' | 'yellow' | 'blue' | 'grey';
export type NodeStatusShape = 'dot' | 'ring';

export interface NodeStatus {
  fill: NodeStatusFill;
  shape: NodeStatusShape;
  text: string;
}

export interface Rule {
  property: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'contains' | 'else';
  value: string;
}

export interface FlowNodeData {
  label: string;
  type: 'inject' | 'debug' | 'function' | 'switch' | 'delay' | 'httpRequest';
  payloadType?: 'date' | 'str' | 'num' | 'json';
  payload?: any;
  topic?: string;
  repeat?: number;
  once?: boolean;
  code?: string;
  rules?: Rule[];
  delayMs?: number;
  method?: 'GET' | 'POST';
  url?: string;
  complete?: boolean;
  active?: boolean;
  status?: NodeStatus;
  [key: string]: any;
}

export type AppNode = Node<FlowNodeData>;
export type AppEdge = Edge;

export interface Flow {
  id: string;
  name: string;
  nodes: AppNode[];
  edges: AppEdge[];
}

export interface DebugLog {
  id: string;
  timestamp: number;
  nodeId: string;
  nodeName: string;
  topic?: string;
  msg: any;
}
