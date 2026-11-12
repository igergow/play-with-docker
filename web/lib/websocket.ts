// WebSocket service maintaining existing event patterns from AngularJS
import ReconnectingWebSocket from 'reconnecting-websocket';
import type { Instance, InstanceStats } from './types';

type EventCallback = (...args: any[]) => void;

export class WebSocketService {
  private socket: ReconnectingWebSocket | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private sessionId: string | null = null;

  connect(sessionId: string) {
    if (this.socket) {
      this.disconnect();
    }

    this.sessionId = sessionId;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/sessions/${sessionId}/ws/`;

    this.socket = new ReconnectingWebSocket(wsUrl);

    this.socket.addEventListener('open', () => {
      this.emit('connected');
    });

    this.socket.addEventListener('close', () => {
      this.emit('disconnected');
    });

    this.socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    });

    this.socket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.listeners.clear();
  }

  private handleMessage(data: any) {
    // Handle different message types based on AngularJS app.js logic
    if (data.type) {
      switch (data.type) {
        case 'instance stats':
          this.emit('instance stats', data.stats as InstanceStats[]);
          break;
        case 'instance terminal out':
          this.emit('instance terminal out', data.instance, data.data);
          break;
        case 'instance new':
          this.emit('instance new', data.instance as Instance);
          break;
        case 'instance delete':
          this.emit('instance delete', data.instance_name);
          break;
        case 'instance port':
          this.emit('instance port', data.instance_name, data.port, data.service_port);
          break;
        case 'instance swarm port':
          this.emit('instance swarm port', data.instance_name, data.port, data.service_port);
          break;
        case 'session ready':
          this.emit('session ready');
          break;
        case 'session end':
          this.emit('session end');
          break;
        case 'session builder out':
          this.emit('session builder out', data.data);
          break;
        default:
          this.emit(data.type, data);
      }
    }
  }

  // Send events to server
  send(eventType: string, ...args: any[]) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send:', eventType);
      return;
    }

    const message = {
      type: eventType,
      ...args[0],
    };

    this.socket.send(JSON.stringify(message));
  }

  // Specific helper methods matching AngularJS socket.emit patterns
  resizeTerminal(cols: number, rows: number) {
    this.send('instance viewport resize', { cols, rows });
  }

  sendTerminalInput(instanceName: string, data: string) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send terminal input');
      return;
    }

    const message = {
      type: 'instance terminal in',
      instance: instanceName,
      data: data,
    };

    this.socket.send(JSON.stringify(message));
  }

  // Event listener management
  on(eventType: string, callback: EventCallback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
  }

  off(eventType: string, callback?: EventCallback) {
    if (!callback) {
      this.listeners.delete(eventType);
      return;
    }

    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  private emit(eventType: string, ...args: any[]) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in ${eventType} handler:`, error);
        }
      });
    }
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const wsService = new WebSocketService();

