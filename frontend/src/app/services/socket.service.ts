// services/socket.service.ts
import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private socket!: Socket;
  private readonly SERVER_URL = environment.apiUrl;

  // Fires every time socket reconnects (after background/disconnect)
  readonly reconnected$ = new Subject<void>();

  constructor(private ngZone: NgZone) {
    this.connect();
    this.listenForVisibilityChange();
  }

  private connect() {
    this.ngZone.runOutsideAngular(() => {
      this.socket = io(this.SERVER_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        this.ngZone.run(() => {
          console.log('[Socket] connected:', this.socket.id);
          this.reconnected$.next();
        });
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[Socket] disconnected:', reason);
      });
    });
  }

  // When user comes back from another app, force reconnect
  private listenForVisibilityChange() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        if (!this.socket.connected) {
          console.log('[Socket] tab visible again — reconnecting...');
          this.socket.connect();
        }
      }
    });
  }

  emit(event: string, data?: any): void {
    this.socket.emit(event, data);
  }

  emitWithAck<T>(event: string, data?: any): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('ack timeout')), 5000);
      this.socket.emit(event, data, (response: T) => {
        clearTimeout(timeout);
        this.ngZone.run(() => resolve(response));
      });
    });
  }

  on<T>(event: string): Observable<T> {
    return new Observable<T>((observer) => {
      this.socket.on(event, (data: T) => {
        this.ngZone.run(() => observer.next(data));
      });
      return () => this.socket.off(event);
    });
  }

  get socketId(): string {
    return this.socket?.id ?? '';
  }

  get connected(): boolean {
    return this.socket?.connected ?? false;
  }

  ngOnDestroy() {
    this.socket?.disconnect();
  }
}
