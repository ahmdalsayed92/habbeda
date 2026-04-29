// services/timer.service.ts
import { Injectable, signal, computed, OnDestroy } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TimerService implements OnDestroy {
  private intervalId: any;
  timeLeft = signal<number>(0);
  totalTime = signal<number>(45);

  progress = computed(() => {
    const total = this.totalTime();
    const left = this.timeLeft();
    return total > 0 ? (left / total) * 100 : 0;
  });

  isUrgent = computed(() => this.timeLeft() <= 10);

  start(endTimestamp: number, duration: number) {
    this.totalTime.set(duration);
    this.tick(endTimestamp);
    this.intervalId = setInterval(() => this.tick(endTimestamp), 500);
  }

  private tick(endTimestamp: number) {
    const left = Math.max(0, Math.ceil((endTimestamp - Date.now()) / 1000));
    this.timeLeft.set(left);
    if (left === 0) this.stop();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  ngOnDestroy() { this.stop(); }
}
