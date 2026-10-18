import { v4 as uuidv4 } from 'uuid';
import { Flow, FlowNode, Msg, NodeStatus, DebugLog } from './types.js';
import {
  NodeRunner,
  InjectRunner,
  DebugRunner,
  FunctionRunner,
  SwitchRunner,
  DelayRunner,
  HttpRequestRunner,
} from './runners.js';

export type EngineEventCallback = (event: any) => void;

export class FlowEngine {
  private currentFlow: Flow | null = null;
  private runners = new Map<string, NodeRunner>();
  private nodeMap = new Map<string, FlowNode>();
  private eventCallback: EngineEventCallback | null = null;

  constructor(eventCallback?: EngineEventCallback) {
    if (eventCallback) {
      this.eventCallback = eventCallback;
    }
  }

  setEventCallback(callback: EngineEventCallback): void {
    this.eventCallback = callback;
  }

  private emit(event: any): void {
    if (this.eventCallback) {
      this.eventCallback(event);
    }
  }

  getFlow(): Flow | null {
    return this.currentFlow;
  }

  deploy(flow: Flow): void {
    // 1. Destroy existing node runners
    this.stop();

    this.currentFlow = flow;
    this.nodeMap.clear();

    // 2. Index nodes
    for (const node of flow.nodes) {
      this.nodeMap.set(node.id, node);
    }

    // 3. Create runners
    for (const node of flow.nodes) {
      const runner = this.createRunner(node);
      if (runner) {
        this.runners.set(node.id, runner);
      }
    }

    // 4. Initialize runners (e.g. interval timers, start-once injects)
    for (const runner of this.runners.values()) {
      try {
        runner.init?.();
      } catch (err: any) {
        console.error('Error initializing node runner:', err);
      }
    }

    this.emit({
      type: 'deploy_success',
      timestamp: Date.now(),
      flowId: flow.id,
      nodeCount: flow.nodes.length,
      edgeCount: flow.edges.length,
    });
  }

  stop(): void {
    for (const runner of this.runners.values()) {
      try {
        runner.destroy?.();
      } catch (err) {
        console.error('Error destroying node runner:', err);
      }
    }
    this.runners.clear();
  }

  triggerInject(nodeId: string): void {
    const runner = this.runners.get(nodeId);
    if (runner instanceof InjectRunner) {
      runner.trigger();
    } else {
      console.warn(`Node ${nodeId} is not an Inject node`);
    }
  }

  sendMessage(sourceNodeId: string, outputPortIndex: number, msg: Msg): void {
    if (!this.currentFlow) return;

    const expectedHandle = `output_${outputPortIndex}`;

    // Find all outgoing edges from this node and output handle
    const matchingEdges = this.currentFlow.edges.filter((edge) => {
      if (edge.source !== sourceNodeId) return false;
      if (!edge.sourceHandle && outputPortIndex === 0) return true;
      return edge.sourceHandle === expectedHandle;
    });

    for (const edge of matchingEdges) {
      // Notify UI to animate wire
      this.emit({
        type: 'edge_pulse',
        edgeId: edge.id,
        timestamp: Date.now(),
      });

      const targetRunner = this.runners.get(edge.target);
      if (targetRunner && targetRunner.onInput) {
        // Asynchronously deliver clone of message
        queueMicrotask(async () => {
          try {
            await targetRunner.onInput!(structuredClone(msg), edge.targetHandle || undefined);
          } catch (err) {
            console.error(`Error processing node ${edge.target}:`, err);
          }
        });
      }
    }
  }

  updateStatus(nodeId: string, status: NodeStatus): void {
    this.emit({
      type: 'node_status',
      nodeId,
      status,
    });
  }

  sendDebug(nodeId: string, nodeName: string, msg: any, complete: boolean = false): void {
    const log: DebugLog = {
      id: uuidv4(),
      timestamp: Date.now(),
      nodeId,
      nodeName,
      topic: msg?.topic,
      msg: complete ? msg : (msg?.payload !== undefined ? msg.payload : msg),
    };

    this.emit({
      type: 'debug_log',
      log,
    });
  }

  private createRunner(node: FlowNode): NodeRunner | null {
    const nodeType = node.data?.type || node.type;

    switch (nodeType) {
      case 'inject':
        return new InjectRunner(node, this);
      case 'debug':
        return new DebugRunner(node, this);
      case 'function':
        return new FunctionRunner(node, this);
      case 'switch':
        return new SwitchRunner(node, this);
      case 'delay':
        return new DelayRunner(node, this);
      case 'httpRequest':
        return new HttpRequestRunner(node, this);
      default:
        console.warn(`Unknown node type: ${nodeType}`);
        return null;
    }
  }
}
