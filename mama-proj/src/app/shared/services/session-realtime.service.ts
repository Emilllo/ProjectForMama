import { Injectable } from '@angular/core';
import { getWsBaseUrl } from '../api-config';

export interface SessionRealtimeMessage {
  type: string;
  session_id: number;
}

export interface SessionRealtimeConnection {
  close(): void;
}

const MAX_RECONNECT_DELAY_MS = 10000;

class SessionRealtimeHandle implements SessionRealtimeConnection {
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private hasConnectedBefore = false;
  private closedByCaller = false;

  constructor(
    private readonly url: string,
    private readonly onSessionUpdated: () => void
  ) {
    this.open();
  }

  close(): void {
    this.closedByCaller = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.socket?.close();
    this.socket = null;
  }

  private open(): void {
    const socket = new WebSocket(this.url);
    this.socket = socket;

    socket.onopen = () => {
      this.reconnectAttempt = 0;

      if (this.hasConnectedBefore) {
        // Reconnected after a drop: state may be stale, refresh it.
        this.onSessionUpdated();
      }

      this.hasConnectedBefore = true;
    };

    socket.onmessage = event => {
      try {
        const message = JSON.parse(event.data) as SessionRealtimeMessage;

        if (message.type === 'session_updated') {
          this.onSessionUpdated();
        }
      } catch (error) {
        console.error('Invalid WebSocket message', error);
      }
    };

    socket.onerror = error => {
      console.error('WebSocket error', error);
    };

    socket.onclose = () => {
      if (this.closedByCaller) {
        return;
      }

      this.scheduleReconnect();
    };
  }

  private scheduleReconnect(): void {
    const delay = Math.min(1000 * 2 ** this.reconnectAttempt, MAX_RECONNECT_DELAY_MS);
    this.reconnectAttempt++;

    this.reconnectTimer = setTimeout(() => {
      if (!this.closedByCaller) {
        this.open();
      }
    }, delay);
  }
}

@Injectable({
  providedIn: 'root'
})
export class SessionRealtimeService {
  connectToSession(
    sessionId: number,
    onSessionUpdated: () => void
  ): SessionRealtimeConnection {
    return new SessionRealtimeHandle(
      this.getSessionWebSocketUrl(sessionId),
      onSessionUpdated
    );
  }

  close(connection: SessionRealtimeConnection | null): void {
    connection?.close();
  }

  private getSessionWebSocketUrl(sessionId: number): string {
    return `${getWsBaseUrl()}/ws/sessions/${sessionId}`;
  }
}
