interface KeepTrackOptions {
  /** Track scrollbar width as --scrollbar-width on :root (default: true) */
  scrollbarWidth?: boolean;
  /** Track scrollbar height as --scrollbar-height on :root (default: false) */
  scrollbarHeight?: boolean;
  /** Debounce delay in ms for resize and DOM changes (default: 250) */
  debounceTime?: number;
  /** Enable requestAnimationFrame polling for non-layout changes (default: false) */
  poll?: boolean;
  /** Detect when sticky elements become stuck (default: false) */
  detectSticky?: boolean;
  /** Update sticky top values every frame (default: false) */
  stickyTopDynamic?: boolean;
  /** Callback when a tracked value changes */
  onChange?: ((el: HTMLElement, prop: string, value: string) => void) | null;
}

interface KeepTrackInstance {
  /** Re-initialize with new options. Cleans up the previous instance first. */
  init(options?: KeepTrackOptions): void;
  /** Remove all event listeners, observers, CSS variables and attributes. */
  destroy(): void;
  /** Manually trigger a recalculation of all tracked elements and scrollbar dimensions. */
  recalculate(): void;
  /** Programmatically start tracking an element. */
  observe(el: HTMLElement): void;
  /** Stop tracking an element and clean up its CSS variables. */
  unobserve(el: HTMLElement): void;
}

declare function KeepTrack(options?: KeepTrackOptions): KeepTrackInstance;

export default KeepTrack;
export { KeepTrack, KeepTrackOptions, KeepTrackInstance };
