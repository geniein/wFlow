export interface Msg {
  _msgid: string;
  payload: any;
  topic?: string;
  [key: string]: any;
}

export type NodeStatusFill = 'green' | 'red' | 'yellow' | 'blue' | 'grey';
export type NodeStatusShape = 'dot' | 'ring';

export interface NodeStatus {
  fill: NodeStatusFill;
  shape: NodeStatusShape;
  text: string;
}

export interface FlowNodeData {
  label: string;
  type: 'inject' | 'debug' | 'function' | 'switch' | 'delay' | 'httpRequest';
  // Node specific configurations
  payloadType?: 'date' | 'str' | 'num' | 'json';
  payload?: any;
  topic?: string;
  repeat?: number; // seconds
  once?: boolean;
  code?: string;
  rules?: Array<{
    property: string;
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'contains' | 'else';
    value: string;
  }>;
  delayMs?: number;
  method?: 'GET' | 'POST';
  url?: string;
  complete?: boolean;
  active?: boolean;
  [key: string]: any;
}

export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: FlowNodeData;
}

export interface FlowEdge {
  id: string;
  source: string;
  sourceHandle?: string | null;
  target: string;
  targetHandle?: string | null;
}

export interface Flow {
  id: string;
  name: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface DebugLog {
  id: string;
  timestamp: number;
  nodeId: string;
  nodeName: string;
  topic?: string;
  msg: any;
}
