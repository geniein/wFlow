import { v4 as uuidv4 } from 'uuid';
import vm from 'node:vm';
import { FlowNode, Msg, NodeStatus } from './types.js';
import type { FlowEngine } from './FlowEngine.js';

export interface NodeRunner {
  init?(): void;
  onInput?(msg: Msg, inputPort?: string): Promise<void> | void;
  destroy?(): void;
}

export class InjectRunner implements NodeRunner {
  private timer: NodeJS.Timeout | null = null;
  private onceTimer: NodeJS.Timeout | null = null;

  constructor(private node: FlowNode, private engine: FlowEngine) {}

  init(): void {
    const { repeat, once } = this.node.data;
    if (once) {
      this.onceTimer = setTimeout(() => {
        this.trigger();
      }, 300);
    }
    if (repeat && repeat > 0) {
      this.timer = setInterval(() => {
        this.trigger();
      }, repeat * 1000);
    }
  }

  trigger(): void {
    const { payloadType = 'date', payload, topic = '' } = this.node.data;
    let actualPayload: any;

    try {
      if (payloadType === 'date') {
        actualPayload = Date.now();
      } else if (payloadType === 'num') {
        actualPayload = Number(payload ?? 0);
      } else if (payloadType === 'json') {
        actualPayload = typeof payload === 'string' ? JSON.parse(payload) : payload;
      } else {
        actualPayload = payload !== undefined ? String(payload) : 'hello';
      }
    } catch (e: any) {
      actualPayload = payload;
    }

    const msg: Msg = {
      _msgid: uuidv4(),
      topic,
      payload: actualPayload,
    };

    const preview = typeof actualPayload === 'object'
      ? JSON.stringify(actualPayload)
      : String(actualPayload);

    this.engine.updateStatus(this.node.id, {
      fill: 'green',
      shape: 'dot',
      text: preview.length > 20 ? preview.slice(0, 17) + '...' : preview,
    });

    this.engine.sendMessage(this.node.id, 0, msg);
  }

  destroy(): void {
    if (this.timer) clearInterval(this.timer);
    if (this.onceTimer) clearTimeout(this.onceTimer);
  }
}

export class DebugRunner implements NodeRunner {
  constructor(private node: FlowNode, private engine: FlowEngine) {}

  onInput(msg: Msg): void {
    const active = this.node.data.active !== false;
    if (!active) return;

    const complete = !!this.node.data.complete;
    const displayText = typeof msg.payload === 'object'
      ? JSON.stringify(msg.payload)
      : String(msg.payload);

    this.engine.updateStatus(this.node.id, {
      fill: 'green',
      shape: 'dot',
      text: displayText.length > 20 ? displayText.slice(0, 17) + '...' : displayText,
    });

    this.engine.sendDebug(
      this.node.id,
      this.node.data.label || 'debug',
      msg,
      complete
    );
  }
}

export class FunctionRunner implements NodeRunner {
  constructor(private node: FlowNode, private engine: FlowEngine) {}

  async onInput(msg: Msg): Promise<void> {
    const code = this.node.data.code || 'return msg;';

    this.engine.updateStatus(this.node.id, {
      fill: 'blue',
      shape: 'dot',
      text: 'running...',
    });

    try {
      // Create isolated sandbox
      const sandbox = {
        msg: structuredClone(msg),
        console: {
          log: (...args: any[]) => {
            this.engine.sendDebug(
              this.node.id,
              (this.node.data.label || 'function') + ' [log]',
              { _msgid: msg._msgid, payload: args.join(' ') },
              false
            );
          },
        },
        env: {},
        Date,
        Math,
        JSON,
      };

      const wrappedCode = `(async function() {
        ${code}
      })()`;

      const script = new vm.Script(wrappedCode);
      const context = vm.createContext(sandbox);
      const result = await script.runInContext(context, { timeout: 2000 });

      if (result === null || result === undefined) {
        this.engine.updateStatus(this.node.id, {
          fill: 'grey',
          shape: 'ring',
          text: 'stopped',
        });
        return;
      }

      this.engine.updateStatus(this.node.id, {
        fill: 'green',
        shape: 'dot',
        text: 'success',
      });

      if (Array.isArray(result)) {
        result.forEach((outMsg, idx) => {
          if (outMsg) {
            this.engine.sendMessage(this.node.id, idx, outMsg);
          }
        });
      } else {
        this.engine.sendMessage(this.node.id, 0, result);
      }
    } catch (err: any) {
      this.engine.updateStatus(this.node.id, {
        fill: 'red',
        shape: 'dot',
        text: err.message || 'Script error',
      });
      this.engine.sendDebug(
        this.node.id,
        this.node.data.label || 'function error',
        { _msgid: msg._msgid, payload: err.message, error: true },
        true
      );
    }
  }
}

export class SwitchRunner implements NodeRunner {
  constructor(private node: FlowNode, private engine: FlowEngine) {}

  onInput(msg: Msg): void {
    const rules = this.node.data.rules || [];
    let matchedCount = 0;

    rules.forEach((rule, index) => {
      let isMatch = false;
      const propPath = rule.property || 'payload';
      const actualVal = (msg as any)[propPath];
      const targetVal = rule.value;

      switch (rule.operator) {
        case 'eq':
          isMatch = String(actualVal) === String(targetVal);
          break;
        case 'neq':
          isMatch = String(actualVal) !== String(targetVal);
          break;
        case 'gt':
          isMatch = Number(actualVal) > Number(targetVal);
          break;
        case 'lt':
          isMatch = Number(actualVal) < Number(targetVal);
          break;
        case 'contains':
          isMatch = String(actualVal).includes(String(targetVal));
          break;
        case 'else':
          isMatch = matchedCount === 0;
          break;
        default:
          isMatch = true;
      }

      if (isMatch) {
        matchedCount++;
        this.engine.sendMessage(this.node.id, index, msg);
      }
    });

    this.engine.updateStatus(this.node.id, {
      fill: matchedCount > 0 ? 'green' : 'grey',
      shape: 'dot',
      text: `matched: ${matchedCount}`,
    });
  }
}

export class DelayRunner implements NodeRunner {
  private activeTimeouts = new Set<NodeJS.Timeout>();

  constructor(private node: FlowNode, private engine: FlowEngine) {}

  onInput(msg: Msg): void {
    const delayMs = this.node.data.delayMs || 1000;

    this.engine.updateStatus(this.node.id, {
      fill: 'blue',
      shape: 'dot',
      text: `delay ${delayMs}ms`,
    });

    const timer = setTimeout(() => {
      this.activeTimeouts.delete(timer);
      this.engine.updateStatus(this.node.id, {
        fill: 'grey',
        shape: 'ring',
        text: 'ready',
      });
      this.engine.sendMessage(this.node.id, 0, msg);
    }, delayMs);

    this.activeTimeouts.add(timer);
  }

  destroy(): void {
    for (const timer of this.activeTimeouts) {
      clearTimeout(timer);
    }
    this.activeTimeouts.clear();
  }
}

export class HttpRequestRunner implements NodeRunner {
  constructor(private node: FlowNode, private engine: FlowEngine) {}

  async onInput(msg: Msg): Promise<void> {
    const method = this.node.data.method || 'GET';
    const url = this.node.data.url || msg.url || 'https://jsonplaceholder.typicode.com/todos/1';

    this.engine.updateStatus(this.node.id, {
      fill: 'blue',
      shape: 'dot',
      text: `${method} requesting...`,
    });

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(msg.headers || {}),
        },
        body: method !== 'GET' ? JSON.stringify(msg.payload) : undefined,
      });

      let responseData: any;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      const outMsg: Msg = {
        ...msg,
        statusCode: response.status,
        payload: responseData,
      };

      this.engine.updateStatus(this.node.id, {
        fill: response.ok ? 'green' : 'yellow',
        shape: 'dot',
        text: `${response.status} ${response.statusText}`,
      });

      this.engine.sendMessage(this.node.id, 0, outMsg);
    } catch (err: any) {
      this.engine.updateStatus(this.node.id, {
        fill: 'red',
        shape: 'dot',
        text: err.message || 'Fetch failed',
      });
      this.engine.sendDebug(
        this.node.id,
        this.node.data.label || 'http request',
        { _msgid: msg._msgid, error: err.message },
        true
      );
    }
  }
}
