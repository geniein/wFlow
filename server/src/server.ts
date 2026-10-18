import express from 'express';
import cors from 'cors';
import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { FlowEngine } from './engine/FlowEngine.js';
import { loadFlow, saveFlow } from './storage.js';
import { Flow } from './engine/types.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const engine = new FlowEngine();

// Broadcast event to all connected clients
function broadcast(data: any): void {
  const payload = JSON.stringify(data);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

// Wire engine events to WebSocket broadcast
engine.setEventCallback((event) => {
  broadcast(event);
});

// Load flow on startup
const initialFlow = loadFlow();
engine.deploy(initialFlow);

// WebSocket handling
wss.on('connection', (ws) => {
  console.log('[WS] Client connected');

  // Send initial flow
  ws.send(
    JSON.stringify({
      type: 'flow_state',
      flow: engine.getFlow(),
    })
  );

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === 'deploy' && data.flow) {
        console.log(`[WS] Deploying flow: ${data.flow.name || data.flow.id}`);
        saveFlow(data.flow);
        engine.deploy(data.flow);
        broadcast({
          type: 'flow_state',
          flow: data.flow,
        });
      } else if (data.type === 'inject_trigger' && data.nodeId) {
        console.log(`[WS] Inject trigger for node: ${data.nodeId}`);
        engine.triggerInject(data.nodeId);
      } else if (data.type === 'get_flow') {
        ws.send(
          JSON.stringify({
            type: 'flow_state',
            flow: engine.getFlow(),
          })
        );
      }
    } catch (err: any) {
      console.error('[WS] Message handling error:', err);
      ws.send(JSON.stringify({ type: 'error', message: err.message }));
    }
  });

  ws.on('close', () => {
    console.log('[WS] Client disconnected');
  });
});

// REST Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api/flow', (req, res) => {
  res.json(engine.getFlow() || loadFlow());
});

app.post('/api/deploy', (req, res) => {
  const flow: Flow = req.body;
  if (!flow || !flow.nodes) {
    return res.status(400).json({ error: 'Invalid flow payload' });
  }
  saveFlow(flow);
  engine.deploy(flow);
  broadcast({ type: 'flow_state', flow });
  res.json({ success: true });
});

app.post('/api/inject/:id', (req, res) => {
  const nodeId = req.params.id;
  engine.triggerInject(nodeId);
  res.json({ success: true, nodeId });
});

server.listen(PORT, () => {
  console.log(`🚀 wFlow Backend Engine running at http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server ready on ws://localhost:${PORT}`);
});
