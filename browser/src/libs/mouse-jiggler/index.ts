import { device } from '@/libs/device';
import { MouseReportRelative } from '@/libs/mouse';

const MOUSE_JIGGLER_INTERVAL = 100;
const MOUSE_JIGGLER_TIMEOUT = 1000;

class MouseJiggler {
  private lastMoveTime: number;
  private timer: number | null;
  private mode: 'enable' | 'disable';
  private mouseReport: MouseReportRelative;

  constructor() {
    this.lastMoveTime = Date.now();
    this.timer = null;
    this.mode = 'disable';
    this.mouseReport = new MouseReportRelative();
  }

  // enable or disable mouse jiggler
  setMode(mode: 'enable' | 'disable'): void {
    this.mode = mode;
    if (mode === 'disable' && this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    } else if (mode === 'enable' && this.timer === null) {
      this.timer = setInterval(() => {
        this.timeoutCallback();
      }, MOUSE_JIGGLER_INTERVAL);
    }
  }

  // addEventListener to canvas on 'mousemove' event
  moveEventCallback(): void {
    if (this.mode === 'enable') {
      this.lastMoveTime = Date.now();
    }
  }

  timeoutCallback(): void {
    if (Date.now() - this.lastMoveTime > MOUSE_JIGGLER_TIMEOUT) {
      this.lastMoveTime = Date.now();
      this.sendJiggle();
    }
  }

  async sendJiggle(): Promise<void> {
    const report1 = this.mouseReport.buildReport(Math.random() * 2 - 1, Math.random() * 2 - 1, 0);
    await device.sendMouseData([0x01, ...report1]);
  }
}

export const mouseJiggler = new MouseJiggler();
