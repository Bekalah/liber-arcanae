/*
  Minimal event bus that mirrors cathedral-core messages through a WebSocket bridge.
  Offline-first: listeners still fire locally even if the network route is unavailable.
*/
export type EventHandler<T = unknown> = (payload: T) => void;

export interface EventBusOptions {
  /** Custom endpoint for testing; defaults to cathedral-core. */
  endpoint?: string;
  /** Auto-connect flag; default false to respect offline-first canon. */
  autoConnect?: boolean;
  /** Dependency injection hook for WebSocket implementations (Node, browser, mocks). */
  WebSocketImpl?: WebSocketFactory;
}

export interface EventEnvelope {
  event: string;
  payload?: unknown;
}

export interface EventBus {
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, payload?: unknown) => void;
  on: (event: string, handler: EventHandler) => void;
  off: (event: string, handler: EventHandler) => void;
  status: () => "offline" | "connecting" | "online";
}

export interface WebSocketLike {
  addEventListener: (type: string, handler: (event: MessageEventLike) => void) => void;
  close: () => void;
  send: (data: string) => void;
}

export interface MessageEventLike {
  data?: unknown;
}

export type WebSocketFactory = new (url: string) => WebSocketLike;

const globalWebSocket = ((): WebSocketFactory | undefined => {
  if (typeof globalThis === "undefined") return undefined;
  const candidate = (globalThis as { WebSocket?: unknown }).WebSocket;
  return typeof candidate === "function" ? (candidate as WebSocketFactory) : undefined;
})();

const DEFAULT_ENDPOINT = "wss://cathedral-core.fly.dev/ws";

export function createEventBus(options: EventBusOptions = {}): EventBus {
  const listeners = new Map<string, Set<EventHandler>>();
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
  const WebSocketCtor = options.WebSocketImpl ?? globalWebSocket;

  let socket: WebSocketLike | undefined;
  let state: "offline" | "connecting" | "online" = "offline";

  const dispatchLocal = (event: string, payload?: unknown) => {
    const handlers = listeners.get(event);
    if (!handlers) return;
    handlers.forEach((handler) => handler(payload));
  };

  const connect = () => {
    if (state !== "offline" || !WebSocketCtor) {
      return;
    }
    state = "connecting";
    socket = new WebSocketCtor(endpoint);
    socket.addEventListener("open", () => {
      state = "online";
      dispatchLocal("bus:open");
    });
    socket.addEventListener("close", () => {
      state = "offline";
      dispatchLocal("bus:close");
    });
    socket.addEventListener("message", (event) => {
      const raw = (event && event.data) ?? null;
      if (typeof raw !== "string") {
        dispatchLocal("bus:error", new Error("Unsupported payload"));
        return;
      }
      try {
        const data = JSON.parse(raw) as EventEnvelope;
        if (data && data.event) {
          dispatchLocal(data.event, data.payload);
        }
      } catch (err) {
        dispatchLocal("bus:error", err);
      }
    });
    socket.addEventListener("error", (err) => {
      dispatchLocal("bus:error", err);
    });
  };

  const disconnect = () => {
    if (!socket) return;
    socket.close();
    socket = undefined;
    state = "offline";
  };

  const emit = (event: string, payload?: unknown) => {
    dispatchLocal(event, payload);
    if (socket && state === "online") {
      const envelope: EventEnvelope = { event, payload };
      socket.send(JSON.stringify(envelope));
    }
  };

  const on = (event: string, handler: EventHandler) => {
    const set = listeners.get(event) ?? new Set<EventHandler>();
    set.add(handler);
    listeners.set(event, set);
  };

  const off = (event: string, handler: EventHandler) => {
    const set = listeners.get(event);
    if (!set) return;
    set.delete(handler);
    if (set.size === 0) {
      listeners.delete(event);
    }
  };

  if (options.autoConnect) {
    connect();
  }

  return {
    connect,
    disconnect,
    emit,
    on,
    off,
    status: () => state,
  };
}
