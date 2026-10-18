import { useEffect, useRef, useState, useCallback } from 'react';
import type { Flow, NodeStatus, DebugLog } from '../types/flow.js';

interface UseWebSocketOptions {
  onFlowReceived?: (flow: Flow) => void;
  onStatusUpdate?: (nodeId: string, status: NodeStatus) => void;
  onEdgePulse?: (edgeId: string) => void;
  onDeploySuccess?: () => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const connect = useCallback(() => {
    if (!isMountedRef.current) return;
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const host = window.location.hostname || 'localhost';
    const wsUrl = `ws://${host}:3001`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!isMountedRef.current) {
        ws.close();
        return;
      }
      console.log('Connected to wFlow backend engine');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      if (!isMountedRef.current) return;
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'flow_state':
            if (data.flow && optionsRef.current.onFlowReceived) {
              optionsRef.current.onFlowReceived(data.flow);
            }
            break;
          case 'node_status':
            if (data.nodeId && data.status && optionsRef.current.onStatusUpdate) {
              optionsRef.current.onStatusUpdate(data.nodeId, data.status);
            }
            break;
          case 'edge_pulse':
            if (data.edgeId && optionsRef.current.onEdgePulse) {
              optionsRef.current.onEdgePulse(data.edgeId);
            }
            break;
          case 'debug_log':
            if (data.log) {
              setDebugLogs((prev) => {
                // Deduplicate by log.id to prevent duplicate React keys
                if (prev.some((item) => item.id === data.log.id)) {
                  return prev;
                }
                return [data.log, ...prev.slice(0, 199)];
              });
            }
            break;
          case 'deploy_success':
            if (optionsRef.current.onDeploySuccess) {
              optionsRef.current.onDeploySuccess();
            }
            break;
          default:
            break;
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message', err);
      }
    };

    ws.onclose = () => {
      if (!isMountedRef.current) return;
      console.log('Disconnected from wFlow backend, retrying in 2s...');
      setIsConnected(false);
      wsRef.current = null;
      if (!reconnectTimeoutRef.current) {
        reconnectTimeoutRef.current = setTimeout(connect, 2000);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      ws.close();
    };
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const deployFlow = useCallback((flow: Flow) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'deploy', flow }));
    } else {
      console.warn('Cannot deploy: WebSocket not connected');
    }
  }, []);

  const triggerInject = useCallback((nodeId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'inject_trigger', nodeId }));
    } else {
      console.warn('Cannot trigger inject: WebSocket not connected');
    }
  }, []);

  const clearDebugLogs = useCallback(() => {
    setDebugLogs([]);
  }, []);

  return {
    isConnected,
    debugLogs,
    deployFlow,
    triggerInject,
    clearDebugLogs,
  };
}
