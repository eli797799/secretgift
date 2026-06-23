export class ScratchSound {
  private ctx: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  start() {
    if (this.source) return;

    const ctx = this.getContext();
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 900;
    filter.Q.value = 0.7;

    const gain = ctx.createGain();
    gain.gain.value = 0.06;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(0);

    this.source = source;
    this.gain = gain;
    this.filter = filter;
  }

  update(speed: number) {
    if (!this.gain || !this.filter || !this.ctx) return;

    const t = this.ctx.currentTime;
    const volume = Math.min(0.14, 0.05 + speed * 0.0015);
    this.gain.gain.setTargetAtTime(volume, t, 0.02);
    this.filter.frequency.setTargetAtTime(500 + Math.min(speed * 2, 2000), t, 0.02);
  }

  stop() {
    if (!this.source || !this.gain || !this.ctx) return;

    const t = this.ctx.currentTime;
    this.gain.gain.setTargetAtTime(0, t, 0.04);

    const source = this.source;
    this.source = null;
    this.gain = null;
    this.filter = null;

    window.setTimeout(() => {
      try {
        source.stop();
      } catch {
        // already stopped
      }
    }, 60);
  }
}
