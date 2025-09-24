export class CanvasContextMock {
  constructor() {
    this.ops = [];
    this.stateStack = [];
    // drawing state
    this.fillStyle = null;
    this.strokeStyle = null;
    this.globalAlpha = 1;
    this.lineWidth = 1;
    this.font = '';
    this.textAlign = 'start';
    this.textBaseline = 'alphabetic';
  }

  record(name, args = []) {
    this.ops.push({ name, args: Array.from(args), snapshot: this.snapshot() });
  }

  snapshot() {
    return {
      fillStyle: this.fillStyle,
      strokeStyle: this.strokeStyle,
      globalAlpha: this.globalAlpha,
      lineWidth: this.lineWidth,
      font: this.font,
      textAlign: this.textAlign,
      textBaseline: this.textBaseline,
    };
  }

  // State
  save() { this.stateStack.push(this.snapshot()); this.record('save'); }
  restore() {
    const s = this.stateStack.pop();
    if (s) {
      this.fillStyle = s.fillStyle;
      this.strokeStyle = s.strokeStyle;
      this.globalAlpha = s.globalAlpha;
      this.lineWidth = s.lineWidth;
      this.font = s.font;
      this.textAlign = s.textAlign;
      this.textBaseline = s.textBaseline;
    }
    this.record('restore');
  }

  // Pathing/drawing
  beginPath() { this.record('beginPath'); }
  moveTo(x, y) { this.record('moveTo', [x, y]); }
  lineTo(x, y) { this.record('lineTo', [x, y]); }
  arc(x, y, r, sAngle, eAngle) { this.record('arc', [x, y, r, sAngle, eAngle]); }
  stroke() { this.record('stroke'); }
  fill() { this.record('fill'); }
  fillRect(x, y, w, h) { this.record('fillRect', [x, y, w, h]); }
  fillText(text, x, y) { this.record('fillText', [text, x, y]); }

  // Properties interceptors for tracking
  setFillStyle(val) { this.fillStyle = val; this.record('set fillStyle', [val]); }
  setStrokeStyle(val) { this.strokeStyle = val; this.record('set strokeStyle', [val]); }
  setGlobalAlpha(val) { this.globalAlpha = val; this.record('set globalAlpha', [val]); }
  setLineWidth(val) { this.lineWidth = val; this.record('set lineWidth', [val]); }
  setFont(val) { this.font = val; this.record('set font', [val]); }
  setTextAlign(val) { this.textAlign = val; this.record('set textAlign', [val]); }
  setTextBaseline(val) { this.textBaseline = val; this.record('set textBaseline', [val]); }

  // Proxy property setters through custom methods to record changes
  set fillStyle(val) { this._fillStyle = val; }
  get fillStyle() { return this._fillStyle; }
  set strokeStyle(val) { this._strokeStyle = val; }
  get strokeStyle() { return this._strokeStyle; }
  set globalAlpha(val) { this._globalAlpha = val; }
  get globalAlpha() { return this._globalAlpha; }
  set lineWidth(val) { this._lineWidth = val; }
  get lineWidth() { return this._lineWidth; }
  set font(val) { this._font = val; }
  get font() { return this._font; }
  set textAlign(val) { this._textAlign = val; }
  get textAlign() { return this._textAlign; }
  set textBaseline(val) { this._textBaseline = val; }
  get textBaseline() { return this._textBaseline; }
}