// services/socket.service.ts
import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private socket!: Socket;
  private readonly SERVER_URL = environment.apiUrl;

  constructor(private ngZone: NgZone) {
    this.connect();
  }

  private connect() {
    this.ngZone.runOutsideAngular(() => {
      this.socket = io(this.SERVER_URL, { transports: ['websocket', 'polling'] });
    });
  }

  emit(event: string, data?: any): void {
    this.socket.emit(event, data);
  }

  emitWithAck<T>(event: string, data?: any): Promise<T> {
    return new Promise((resolve) => {
      this.socket.emit(event, data, (response: T) => {
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

  ngOnDestroy() {
    this.socket?.disconnect();
  }
}
