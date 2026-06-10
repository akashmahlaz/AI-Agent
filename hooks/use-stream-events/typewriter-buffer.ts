/**
 * TypewriterBuffer — smooths out large text chunks into character-by-character rendering.
 *
 * Anthropic's API sends large chunks (20-200 chars) vs OpenAI's tiny chunks (3-15 chars).
 * Without buffering, Anthropic responses "jump" in paragraph-sized increments.
 * With buffering, text appears 2-3 characters at a time — smooth like Claude.ai.
 *
 * Usage:
 *   const buf = new TypewriterBuffer((text) => appendTextDelta(text), 3);
 *   buf.push(chunk);        // add text
 *   buf.flush();            // on stream end
 *   buf.destroy();          // cleanup
 */
export class TypewriterBuffer {
  private pending = "";
  private rafId: number | null = null;
  private onFlush: (text: string) => void;
  private charsPerFrame: number;
  private destroyed = false;

  /**
   * @param onFlush - called with text chunks as they drain
   * @param charsPerFrame - chars emitted per animation frame (3 for Anthropic, 8+ for OpenAI)
   */
  constructor(onFlush: (text: string) => void, charsPerFrame = 3) {
    this.onFlush = onFlush;
    this.charsPerFrame = charsPerFrame;
  }

  /** Add text to the buffer. Drains gradually via requestAnimationFrame. */
  push(text: string) {
    if (this.destroyed || !text) return;
    this.pending += text;
    if (!this.rafId) this.startDrain();
  }

  private startDrain() {
    const drain = () => {
      if (this.destroyed || this.pending.length === 0) {
        this.rafId = null;
        return;
      }
      // Adaptive batch: drain faster when queue is large to prevent drift
      const batch =
        this.pending.length > 200
          ? Math.ceil(this.pending.length / 5)
          : this.pending.length > 50
          ? Math.ceil(this.pending.length / 3)
          : this.charsPerFrame;

      const chunk = this.pending.slice(0, batch);
      this.pending = this.pending.slice(batch);
      this.onFlush(chunk);

      if (this.pending.length > 0) {
        this.rafId = requestAnimationFrame(drain);
      } else {
        this.rafId = null;
      }
    };
    this.rafId = requestAnimationFrame(drain);
  }

  /** Flush all remaining text immediately. Call on stream end. */
  flush() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.pending) {
      this.onFlush(this.pending);
      this.pending = "";
    }
  }

  /** Returns true if there is pending text not yet flushed. */
  get hasPending(): boolean {
    return this.pending.length > 0;
  }

  /** Destroy the buffer, cancelling any pending animation frames. */
  destroy() {
    this.destroyed = true;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.pending = "";
  }
}
