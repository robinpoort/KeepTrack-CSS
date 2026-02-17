import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load the UMD source and execute it with a local module.exports
const source = readFileSync(resolve(__dirname, '..', 'src', 'keepTrack.js'), 'utf8');

function loadKeepTrack() {
  const mod = { exports: {} };
  const fn = new Function('module', 'exports', 'window', 'document', source);
  fn(mod, mod.exports, window, document);
  return mod.exports;
}

// happy-dom's getComputedStyle only returns values set via inline style.
// All test elements need inline styles so the library can read computed values.

describe('KeepTrack', () => {
  let KeepTrack;
  let tracker;

  beforeEach(() => {
    document.documentElement.removeAttribute('style');
    document.body.innerHTML = '';
    KeepTrack = loadKeepTrack();
  });

  afterEach(() => {
    if (tracker) {
      tracker.destroy();
      tracker = null;
    }
  });

  it('factory returns object with init/destroy/recalculate/observe/unobserve', () => {
    tracker = KeepTrack();
    expect(typeof tracker.init).toBe('function');
    expect(typeof tracker.destroy).toBe('function');
    expect(typeof tracker.recalculate).toBe('function');
    expect(typeof tracker.observe).toBe('function');
    expect(typeof tracker.unobserve).toBe('function');
  });

  it('init() sets --scrollbar-width on :root', () => {
    tracker = KeepTrack();
    const value = document.documentElement.style.getPropertyValue('--scrollbar-width');
    expect(value).toBeTruthy();
    expect(value).toMatch(/^\d+px$/);
  });

  it('destroy() cleans up CSS vars and attributes', () => {
    document.body.innerHTML = '<div id="box" data-keeptrack="height" style="height: 50px"></div>';
    tracker = KeepTrack();
    expect(document.documentElement.style.getPropertyValue('--box-height')).toBe('50px');
    expect(document.documentElement.style.getPropertyValue('--scrollbar-width')).toBeTruthy();

    tracker.destroy();
    expect(document.documentElement.style.getPropertyValue('--box-height')).toBe('');
    expect(document.documentElement.style.getPropertyValue('--scrollbar-width')).toBe('');
    tracker = null; // already destroyed
  });

  it('re-init cleans up previous instance', () => {
    document.body.innerHTML = '<div id="box" data-keeptrack="height" style="height: 50px"></div>';
    tracker = KeepTrack();
    expect(document.documentElement.style.getPropertyValue('--box-height')).toBe('50px');

    // Remove the element and re-init
    document.body.innerHTML = '';
    tracker.init();
    expect(document.documentElement.style.getPropertyValue('--box-height')).toBe('');
  });

  it('element without id sets --height on element itself', () => {
    document.body.innerHTML = '<div data-keeptrack="height" style="height: 100px"></div>';
    tracker = KeepTrack();
    const el = document.querySelector('[data-keeptrack]');
    expect(el.style.getPropertyValue('--height')).toBe('100px');
  });

  it('element with id sets --myid-height on :root', () => {
    document.body.innerHTML = '<div id="myid" data-keeptrack="height" style="height: 200px"></div>';
    tracker = KeepTrack();
    expect(document.documentElement.style.getPropertyValue('--myid-height')).toBe('200px');
  });

  it('element with data-keeptrack-id sets prefixed var on :root', () => {
    document.body.innerHTML = '<div data-keeptrack="height" data-keeptrack-id="mytoken" style="height: 120px"></div>';
    tracker = KeepTrack();
    expect(document.documentElement.style.getPropertyValue('--mytoken-height')).toBe('120px');
  });

  it('data-keeptrack-id takes precedence over id', () => {
    document.body.innerHTML = '<div id="realid" data-keeptrack="height" data-keeptrack-id="alias" style="height: 90px"></div>';
    tracker = KeepTrack();
    expect(document.documentElement.style.getPropertyValue('--alias-height')).toBe('90px');
    expect(document.documentElement.style.getPropertyValue('--realid-height')).toBe('');
  });

  it('data-keeptrack-target-parent overrides :root placement for id-prefixed vars', () => {
    document.body.innerHTML = '<div id="parent"><div id="realid" data-keeptrack="height" data-keeptrack-target-parent="1" style="height: 44px"></div></div>';
    tracker = KeepTrack();
    const parent = document.getElementById('parent');
    expect(parent.style.getPropertyValue('--realid-height')).toBe('44px');
    expect(document.documentElement.style.getPropertyValue('--realid-height')).toBe('');
  });

  it('data-keeptrack-target-parent overrides :root placement for data-keeptrack-id vars', () => {
    document.body.innerHTML = '<div id="parent"><div data-keeptrack="height" data-keeptrack-id="alias" data-keeptrack-target-parent="1" style="height: 55px"></div></div>';
    tracker = KeepTrack();
    const parent = document.getElementById('parent');
    expect(parent.style.getPropertyValue('--alias-height')).toBe('55px');
    expect(document.documentElement.style.getPropertyValue('--alias-height')).toBe('');
  });

  it('data-keeptrack-target-parent="1" sets var on parent', () => {
    document.body.innerHTML = '<div id="parent"><div data-keeptrack="height" data-keeptrack-target-parent="1" style="height: 30px"></div></div>';
    tracker = KeepTrack();
    const parent = document.getElementById('parent');
    expect(parent.style.getPropertyValue('--height')).toBe('30px');
  });

  it('comma-separated properties are all set', () => {
    document.body.innerHTML = '<div id="multi" data-keeptrack="height, width" style="height: 10px; width: 20px"></div>';
    tracker = KeepTrack();
    expect(document.documentElement.style.getPropertyValue('--multi-height')).toBe('10px');
    expect(document.documentElement.style.getPropertyValue('--multi-width')).toBe('20px');
  });

  it('observe() starts tracking, unobserve() stops and cleans up', () => {
    tracker = KeepTrack();
    const el = document.createElement('div');
    el.id = 'dynamic';
    el.setAttribute('data-keeptrack', 'height');
    el.style.height = '40px';
    document.body.appendChild(el);

    tracker.observe(el);
    expect(document.documentElement.style.getPropertyValue('--dynamic-height')).toBe('40px');

    tracker.unobserve(el);
    expect(document.documentElement.style.getPropertyValue('--dynamic-height')).toBe('');
  });

  it('scrollbar width can be disabled', () => {
    tracker = KeepTrack({ scrollbarWidth: false });
    expect(document.documentElement.style.getPropertyValue('--scrollbar-width')).toBe('');
  });

  it('scrollbar height can be enabled', () => {
    tracker = KeepTrack({ scrollbarHeight: true });
    const value = document.documentElement.style.getPropertyValue('--scrollbar-height');
    expect(value).toBeTruthy();
    expect(value).toMatch(/^\d+px$/);
  });

  it('recalculate() does not throw', () => {
    document.body.innerHTML = '<div data-keeptrack="height" style="height: 10px"></div>';
    tracker = KeepTrack();
    expect(() => tracker.recalculate()).not.toThrow();
  });

  it('onChange callback fires during initialization', () => {
    document.body.innerHTML = '<div id="cb" data-keeptrack="height" style="height: 75px"></div>';
    const calls = [];
    tracker = KeepTrack({
      onChange: (el, prop, value) => {
        calls.push({ id: el.id, prop, value });
      }
    });
    expect(calls.length).toBeGreaterThan(0);
    expect(calls.some((c) => c.id === 'cb' && c.prop === 'height' && c.value === '75px')).toBe(true);
  });

  it('destroy() removes data-keeptrack-stuck attribute', () => {
    document.body.innerHTML = '<div id="sticky" data-keeptrack="height" style="height: 50px"></div>';
    tracker = KeepTrack({ detectSticky: true });
    const el = document.getElementById('sticky');
    // Manually set attribute to simulate stuck state
    el.setAttribute('data-keeptrack-stuck', '');
    tracker.destroy();
    expect(el.hasAttribute('data-keeptrack-stuck')).toBe(false);
    tracker = null;
  });
});
