import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Flow } from './engine/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FLOWS_FILE = path.resolve(__dirname, '../flows.json');

const DEFAULT_FLOW: Flow = {
  id: 'flow-1',
  name: 'Flow 1',
  nodes: [
    {
      id: 'inject-1',
      type: 'injectNode',
      position: { x: 100, y: 150 },
      data: {
        label: 'timestamp',
        type: 'inject',
        payloadType: 'date',
        payload: '',
        topic: 'demo/timestamp',
        repeat: 0,
        once: false,
      },
    },
    {
      id: 'function-1',
      type: 'functionNode',
      position: { x: 380, y: 150 },
      data: {
        label: 'format payload',
        type: 'function',
        code: `// Modify msg properties
msg.payload = {
  receivedTime: new Date(msg.payload).toLocaleTimeString(),
  message: "Hello from Node-RED in React Flow!",
  randomScore: Math.floor(Math.random() * 100)
};
return msg;`,
      },
    },
    {
      id: 'switch-1',
      type: 'switchNode',
      position: { x: 680, y: 150 },
      data: {
        label: 'check score',
        type: 'switch',
        rules: [
          { property: 'payload.randomScore', operator: 'gt', value: '50' },
          { property: 'payload.randomScore', operator: 'else', value: '' },
        ],
      },
    },
    {
      id: 'debug-high',
      type: 'debugNode',
      position: { x: 980, y: 100 },
      data: {
        label: 'score > 50 (High)',
        type: 'debug',
        complete: false,
        active: true,
      },
    },
    {
      id: 'debug-low',
      type: 'debugNode',
      position: { x: 980, y: 220 },
      data: {
        label: 'score <= 50 (Low)',
        type: 'debug',
        complete: false,
        active: true,
      },
    },
  ],
  edges: [
    {
      id: 'e-inject-func',
      source: 'inject-1',
      sourceHandle: 'output_0',
      target: 'function-1',
      targetHandle: 'input',
    },
    {
      id: 'e-func-switch',
      source: 'function-1',
      sourceHandle: 'output_0',
      target: 'switch-1',
      targetHandle: 'input',
    },
    {
      id: 'e-switch-debug1',
      source: 'switch-1',
      sourceHandle: 'output_0',
      target: 'debug-high',
      targetHandle: 'input',
    },
    {
      id: 'e-switch-debug2',
      source: 'switch-1',
      sourceHandle: 'output_1',
      target: 'debug-low',
      targetHandle: 'input',
    },
  ],
};

export function loadFlow(): Flow {
  try {
    if (fs.existsSync(FLOWS_FILE)) {
      const content = fs.readFileSync(FLOWS_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn('Failed to read flows.json, using default flow', err);
  }
  saveFlow(DEFAULT_FLOW);
  return DEFAULT_FLOW;
}

export function saveFlow(flow: Flow): void {
  try {
    fs.writeFileSync(FLOWS_FILE, JSON.stringify(flow, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save flows.json', err);
  }
}
