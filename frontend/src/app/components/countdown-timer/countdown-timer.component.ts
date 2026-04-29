// countdown-timer.component.ts
import { Component, Input, computed, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-countdown-timer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './countdown-timer.component.html',
  styleUrls: ['./countdown-timer.component.scss'],
})
export class CountdownTimerComponent implements OnInit, OnDestroy {
  @Input() endTimestamp = 0;   // ms epoch from server
  @Input() duration = 60;      // total seconds

  timeLeft = signal(60);
  private intervalId: any;

  readonly RADIUS = 52;
  readonly CIRCUMFERENCE = 2 * Math.PI * this.RADIUS; // ≈ 326.7

  ngOnInit() {
    this.tick();
    this.intervalId = setInterval(() => this.tick(), 250);
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }

  private tick() {
    const left = Math.max(0, Math.ceil((this.endTimestamp - Date.now()) / 1000));
    this.timeLeft.set(left);
  }

  get progress(): number {
    // 1 → full circle, 0 → empty (drains clockwise)
    const t = this.timeLeft();
    return this.duration > 0 ? t / this.duration : 0;
  }

  get dashOffset(): number {
    // SVG stroke-dashoffset: 0 = full ring drawn; CIRCUMFERENCE = nothing drawn
    return this.CIRCUMFERENCE * (1 - this.progress);
  }

  get isUrgent(): boolean {
    return this.timeLeft() <= 10;
  }

  get colorClass(): string {
    const t = this.timeLeft();
    if (t <= 10) return 'urgent';
    if (t <= 20) return 'warning';
    return 'normal';
  }
}
