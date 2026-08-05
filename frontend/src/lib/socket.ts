/**
 * socket.ts — Singleton Socket.IO client for CampusConnect.
 *
 * Why a singleton?
 *   Creating `io(...)` inside a React component means a new socket is born on
 *   every render/remount, duplicating listeners and leaking connections.
 *   This module holds ONE socket instance for the entire app lifetime.
 *
 * Usage:
 *   import { connectSocket, getSocket, disconnectSocket } from './socket';
 *
 *   // After login:
 *   connectSocket(token);
 *
 *   // Anywhere:
 *   const socket = getSocket();
 *   socket?.on('new-message', handler);
 *
 *   // After logout:
 *   disconnectSocket();
 */

import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from './api';

const SOCKET_URL = new URL(API_BASE_URL).origin;

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

let socket: Socket | null = null;
let connectionStatus: ConnectionStatus = 'disconnected';
const statusListeners: Array<(status: ConnectionStatus) => void> = [];

function setStatus(status: ConnectionStatus) {
  connectionStatus = status;
  statusListeners.forEach((fn) => fn(status));
}

/**
 * Connect (or re-use) the singleton socket with the supplied JWT.
 * The token is passed in `socket.handshake.auth.token` so the backend
 * `socketAuth` middleware can verify it.
 */
export function connectSocket(token: string): Socket {
  // If already connected with the same socket, reuse it.
  if (socket && socket.connected) {
    return socket;
  }

  // Tear down a stale disconnected socket before creating a new one.
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  setStatus('connecting');

  socket = io(SOCKET_URL, {
    auth: { token }, // <-- verified by socketAuthMiddleware on the backend
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
    setStatus('connected');
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
    setStatus('disconnected');
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
    setStatus('disconnected');
  });

  socket.io.on('reconnect_attempt', () => {
    setStatus('reconnecting');
  });

  socket.io.on('reconnect', () => {
    setStatus('connected');
  });

  return socket;
}

/** Return the existing socket instance (may be null if never connected). */
export function getSocket(): Socket | null {
  return socket;
}

/** Gracefully disconnect and clean up the singleton. */
export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  setStatus('disconnected');
}

/** Subscribe to connection status changes. Returns an unsubscribe function. */
export function onStatusChange(fn: (status: ConnectionStatus) => void): () => void {
  statusListeners.push(fn);
  // Fire immediately with current status so the caller can initialize its state.
  fn(connectionStatus);
  return () => {
    const idx = statusListeners.indexOf(fn);
    if (idx !== -1) statusListeners.splice(idx, 1);
  };
}

/** Get the current connection status synchronously. */
export function getConnectionStatus(): ConnectionStatus {
  return connectionStatus;
}
