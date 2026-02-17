(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], function () {
      return factory(root);
    });
  } else if (typeof exports === 'object') {
    module.exports = factory(root);
  } else {
    root.KeepTrack = factory(root);
  }
})(typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this, function (window) {

  const defaults = {
    scrollbarWidth: true,
    scrollbarHeight: false,
    debounceTime: 250,
    poll: false,
    detectSticky: false,
    stickyTopDynamic: false,
    onChange: null
  };

  function debounce(fn, delay) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        requestAnimationFrame(() => fn.apply(this, args));
      }, delay);
    };
  }

  function getTarget(el, value) {
    if (!value) return false;

    const level = parseInt(value, 10);
    if (!isNaN(level) && level > 0) {
      let node = el;
      for (let i = 0; i < level; i++) {
        if (!node.parentElement) return false;
        node = node.parentElement;
      }
      return node;
    }

    try {
      return el.closest(value) || document.querySelector(value) || false;
    } catch (e) {
      return false;
    }
  }

  function getStickyContainer(el) {
    let parent = el.parentElement;
    while (parent && parent !== document.documentElement) {
      if (window.getComputedStyle(parent).display !== 'contents') return parent;
      parent = parent.parentElement;
    }
    return document.documentElement;
  }

  function measureUnstuckDocTop(el) {
    const prevPosition = el.style.getPropertyValue('position');
    const prevPositionPriority = el.style.getPropertyPriority('position');
    const prevTop = el.style.getPropertyValue('top');
    const prevTopPriority = el.style.getPropertyPriority('top');
    el.style.setProperty('position', 'static', 'important');
    el.style.setProperty('top', 'auto', 'important');
    const top = el.getBoundingClientRect().top + window.scrollY;
    if (prevPosition) {
      el.style.setProperty('position', prevPosition, prevPositionPriority || '');
    } else {
      el.style.removeProperty('position');
    }
    if (prevTop) {
      el.style.setProperty('top', prevTop, prevTopPriority || '');
    } else {
      el.style.removeProperty('top');
    }
    return top;
  }

  function getContainerDocTop(container) {
    if (container === document.documentElement) return 0;
    const computed = window.getComputedStyle(container);
    const needsUnstuck = computed.position === 'sticky' || computed.position === 'fixed';
    if (needsUnstuck) {
      return measureUnstuckDocTop(container);
    }
    const rect = container.getBoundingClientRect();
    return rect.top + window.scrollY;
  }

  function createTopMeasurerTools() {
    const topMeasurers = new WeakMap();
    function getTopMeasurer(container) {
      let measurer = topMeasurers.get(container);
      if (!measurer) {
        measurer = document.createElement('div');
        measurer.style.position = 'absolute';
        measurer.style.left = '0';
        measurer.style.width = '0';
        measurer.style.height = '0';
        measurer.style.margin = '0';
        measurer.style.padding = '0';
        measurer.style.border = '0';
        measurer.style.visibility = 'hidden';
        measurer.style.pointerEvents = 'none';
        container.appendChild(measurer);
        topMeasurers.set(container, measurer);
      }
      return measurer;
    }
    return { getTopMeasurer, topMeasurers };
  }

  function resolveTopPxWithMeasurer(el, topValue, usedContainers, getTopMeasurer) {
    const container = getStickyContainer(el);
    if (usedContainers) usedContainers.add(container);
    const measurer = getTopMeasurer(container);
    measurer.style.top = topValue;
    const computed = window.getComputedStyle(measurer).top;
    const value = parseFloat(computed);
    return isNaN(value) ? null : value;
  }

  function getStickyTopPx(el, usedContainers, getTopMeasurer) {
    const computedStyle = window.getComputedStyle(el);
    const topValue = computedStyle.top.trim();
    if (!topValue) return null;
    if (topValue === 'auto') return null;
    if (topValue.endsWith('%')) {
      const pct = parseFloat(topValue);
      if (isNaN(pct)) return null;
      const container = getStickyContainer(el);
      return container.getBoundingClientRect().height * (pct / 100);
    }
    if (topValue.endsWith('rem')) {
      const rem = parseFloat(topValue);
      if (isNaN(rem)) return null;
      const rootFont = parseFloat(window.getComputedStyle(document.documentElement).fontSize);
      if (isNaN(rootFont)) return null;
      return rem * rootFont;
    }
    if (topValue.endsWith('em')) {
      const em = parseFloat(topValue);
      if (isNaN(em)) return null;
      const fontSize = parseFloat(computedStyle.fontSize);
      if (isNaN(fontSize)) return null;
      return em * fontSize;
    }
    if (topValue.includes('(')) {
      if (typeof el.computedStyleMap === 'function') {
        try {
          const map = el.computedStyleMap();
          const v = map.get('top');
          if (v) {
            if (typeof v.to === 'function') {
              const px = v.to('px');
              if (px && typeof px.value === 'number') return px.value;
            }
            if (v.unit === 'px' && typeof v.value === 'number') return v.value;
          }
        } catch (e) {
          // fall through to measurer
        }
      }
      return resolveTopPxWithMeasurer(el, topValue, usedContainers, getTopMeasurer);
    }
    const value = parseFloat(topValue);
    return isNaN(value) ? null : value;
  }

  function cleanupStickyState(el, idOverride) {
    const id = idOverride || getNamePrefix(el);
    if (id) {
      document.documentElement.style.removeProperty(`--${id}-stuck`);
    }
    el.style.removeProperty('--stuck');
    el.removeAttribute('data-keeptrack-stuck');
  }

  function normalizeNamePrefix(value) {
    if (!value) return false;
    const trimmed = value.trim();
    return trimmed || false;
  }

  function getNamePrefix(el) {
    const fromData = normalizeNamePrefix(el.getAttribute('data-keeptrack-id'));
    if (fromData) return fromData;
    return normalizeNamePrefix(el.id);
  }

  function getOldNamePrefix(el, attributeName, oldValue) {
    if (attributeName === 'data-keeptrack-id') {
      return normalizeNamePrefix(oldValue) || normalizeNamePrefix(el.id);
    }
    if (attributeName === 'id') {
      return normalizeNamePrefix(el.getAttribute('data-keeptrack-id')) || normalizeNamePrefix(oldValue);
    }
    return normalizeNamePrefix(oldValue);
  }

  function sameTypes(a, b) {
    if (a === b) return true;
    if (!a || !b || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  return function (options) {
    const publicAPIs = {};
    let settings;
    let resizeHandler;
    let resizeObserver;
    let observer;
    let pollId;
    let scrollHandler;
    let anchorHandler;
    let hashNavHandler;
    let scrollTicking = false;
    let trackedElements = [];
    const trackedSet = new Set();
    const { getTopMeasurer, topMeasurers } = createTopMeasurerTools();

    // Per-instance state
    const valueCache = new WeakMap();
    const appliedConfig = new WeakMap();
    let configCache = new WeakMap();
    let stickyTopCache = new WeakMap();
    let lastScrollbarWidth;
    let lastScrollbarHeight;
    let lastScrollPaddingTop;
    let anchorScrollLock = false;
    let anchorScrollFallback;
    const usedMeasurerContainers = new Set();

    function getElementConfig(el) {
      if (configCache.has(el)) return configCache.get(el);

      const raw = el.getAttribute('data-keeptrack');
      if (!raw) return null;
      const types = raw.split(',').map((s) => s.trim()).filter(Boolean);
      const id = getNamePrefix(el);
      const target = getTarget(el, el.getAttribute('data-keeptrack-target-parent'));

      const config = { types, id, target };
      configCache.set(el, config);
      return config;
    }

    function invalidateConfigCache() {
      configCache = new WeakMap();
    }

    function invalidateStickyTopCache() {
      stickyTopCache = new WeakMap();
    }

    function getStickyTopPxCached(el) {
      if (settings && settings.stickyTopDynamic) return getStickyTopPx(el, usedMeasurerContainers, getTopMeasurer);
      if (stickyTopCache.has(el)) return stickyTopCache.get(el);
      const value = getStickyTopPx(el, usedMeasurerContainers, getTopMeasurer);
      stickyTopCache.set(el, value);
      return value;
    }

    function calculateScrollbars() {
      if (settings.scrollbarWidth) {
        const value = `${window.innerWidth - document.documentElement.clientWidth}px`;
        if (value !== lastScrollbarWidth) {
          lastScrollbarWidth = value;
          document.documentElement.style.setProperty('--scrollbar-width', value);
        }
      }
      if (settings.scrollbarHeight) {
        const value = `${window.innerHeight - document.documentElement.clientHeight}px`;
        if (value !== lastScrollbarHeight) {
          lastScrollbarHeight = value;
          document.documentElement.style.setProperty('--scrollbar-height', value);
        }
      }
    }

    function cleanupElement(el, configOverride) {
      const config = configOverride || appliedConfig.get(el) || configCache.get(el);
      if (config) {
        const { types, id, target } = config;
        for (const prop of types) {
          const name = id ? `--${id}-${prop}` : `--${prop}`;
          if (target) {
            target.style.removeProperty(name);
          } else if (id) {
            document.documentElement.style.removeProperty(name);
          } else {
            el.style.removeProperty(name);
          }
        }
      }
      cleanupStickyState(el, config && config.id ? config.id : undefined);
      valueCache.delete(el);
      configCache.delete(el);
      appliedConfig.delete(el);
    }

    function calculateElement(el) {
      const config = getElementConfig(el);
      if (!config || !config.types || config.types.length === 0) {
        if (appliedConfig.has(el)) cleanupElement(el);
        return;
      }
      const { types, id, target } = config;
      const prev = appliedConfig.get(el);
      if (prev && (!sameTypes(prev.types, types) || prev.id !== id || prev.target !== target)) {
        cleanupElement(el, prev);
      }
      const computed = window.getComputedStyle(el);

      if (!valueCache.has(el)) valueCache.set(el, {});
      const elCache = valueCache.get(el);

      for (const prop of types) {
        const style = computed.getPropertyValue(prop);
        if (elCache[prop] === style) continue;
        elCache[prop] = style;
        const name = id ? `--${id}-${prop}` : `--${prop}`;
        if (target) {
          target.style.setProperty(name, style);
        } else if (id) {
          document.documentElement.style.setProperty(name, style);
        } else {
          el.style.setProperty(name, style);
        }
        if (settings.onChange) {
          settings.onChange(el, prop, style);
        }
      }
      appliedConfig.set(el, { types, id, target });
    }

    function isStickyElement(el) {
      return window.getComputedStyle(el).position === 'sticky';
    }

    function unlockScrollPadding() {
      anchorScrollLock = false;
      clearTimeout(anchorScrollFallback);
      calculateScrollPadding();
    }

    function calculateScrollPadding() {
      // Don't override predicted scroll-padding during anchor navigation
      if (anchorScrollLock) return;

      let top = 0;
      let hasAny = false;
      for (const el of trackedElements) {
        if (!el.hasAttribute('data-keeptrack-scroll-padding')) continue;
        if (settings.detectSticky) {
          const isSticky = isStickyElement(el);
          if (isSticky && !el.hasAttribute('data-keeptrack-stuck')) continue;
        }
        hasAny = true;
        top += el.getBoundingClientRect().height;
      }
      if (!hasAny) {
        if (lastScrollPaddingTop) {
          document.documentElement.style.removeProperty('scroll-padding-top');
          lastScrollPaddingTop = undefined;
        }
        return;
      }
      const value = `${top}px`;
      if (value !== lastScrollPaddingTop) {
        lastScrollPaddingTop = value;
        document.documentElement.style.setProperty('scroll-padding-top', value);
      }
    }

    function checkStickyElements() {
      for (const el of trackedElements) {
        if (!el.hasAttribute('data-keeptrack') && !el.hasAttribute('data-keeptrack-scroll-padding')) continue;
        const config = getElementConfig(el) || {};
        if (config.isSticky === undefined) {
          config.isSticky = isStickyElement(el);
        }
        if (!config.isSticky) continue;

        const rect = el.getBoundingClientRect();
        const stickyTop = getStickyTopPxCached(el);
        if (stickyTop === null) continue;

        const stuck = Math.abs(rect.top - stickyTop) < 1.5;
        const wasStuck = el.hasAttribute('data-keeptrack-stuck');

        if (stuck === wasStuck) continue;

        if (stuck) {
          el.setAttribute('data-keeptrack-stuck', '');
        } else {
          el.removeAttribute('data-keeptrack-stuck');
        }

        const id = getNamePrefix(el);
        const stuckValue = stuck ? '1' : '0';
        if (id) {
          document.documentElement.style.setProperty(`--${id}-stuck`, stuckValue);
        } else {
          el.style.setProperty('--stuck', stuckValue);
        }

        if (settings.onChange) {
          settings.onChange(el, 'stuck', stuckValue);
        }
      }
    }

    function updateScrollPaddingForTarget(target) {
      const targetTop = target.getBoundingClientRect().top + window.scrollY;
      const candidates = [];
      for (const el of trackedElements) {
        if (!el.hasAttribute('data-keeptrack-scroll-padding')) continue;
        const isSticky = isStickyElement(el);
        const rect = el.getBoundingClientRect();
        const height = rect.height;
        if (!isSticky) {
          candidates.push({ sticky: false, height });
          continue;
        }
        const stickyTop = getStickyTopPxCached(el);
        if (stickyTop === null) continue;
        const elDocTop = measureUnstuckDocTop(el);
        const container = getStickyContainer(el);
        const containerTop = getContainerDocTop(container);
        const containerBottom = containerTop + container.offsetHeight;
        candidates.push({
          sticky: true,
          height,
          stickyTop,
          minScroll: elDocTop - stickyTop,
          maxScroll: containerBottom - height - stickyTop
        });
      }

      let padding = 0;
      let hasAny = false;

      // Iterative convergence: scroll position depends on padding, padding depends on which
      // sticky elements are stuck, which depends on scroll position. Max 5 iterations to converge.
      for (let i = 0; i < 5; i++) {
        const scrollTop = targetTop - padding;
        let nextPadding = 0;
        let nextHasAny = false;
        for (const item of candidates) {
          if (!item.sticky) {
            nextHasAny = true;
            nextPadding += item.height;
            continue;
          }
          if (scrollTop >= item.minScroll && scrollTop <= item.maxScroll) {
            nextHasAny = true;
            nextPadding += item.height;
          }
        }
        if (nextPadding === padding) {
          padding = nextPadding;
          hasAny = nextHasAny;
          break;
        }
        padding = nextPadding;
        hasAny = nextHasAny;
      }

      if (hasAny) {
        const value = `${padding}px`;
        lastScrollPaddingTop = value;
        document.documentElement.style.setProperty('scroll-padding-top', value);
      } else if (lastScrollPaddingTop) {
        document.documentElement.style.removeProperty('scroll-padding-top');
        lastScrollPaddingTop = undefined;
      }

      // Lock scroll-padding until the browser finishes scrolling to the anchor.
      // Uses scrollend event when available, with a generous fallback timeout.
      anchorScrollLock = true;
      clearTimeout(anchorScrollFallback);
      if ('onscrollend' in window) {
        window.addEventListener('scrollend', unlockScrollPadding, { once: true });
      }
      const startScrollY = window.scrollY;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (window.scrollY === startScrollY) {
            unlockScrollPadding();
          }
        });
      });
      anchorScrollFallback = setTimeout(unlockScrollPadding, 5000);
    }

    function refreshElements() {
      const nextElements = Array.from(document.querySelectorAll('[data-keeptrack], [data-keeptrack-scroll-padding]'));
      const nextSet = new Set(nextElements);
      for (const el of trackedElements) {
        if (!nextSet.has(el)) {
          if (resizeObserver) resizeObserver.unobserve(el);
          cleanupElement(el);
        }
      }
      if (resizeObserver) {
        for (const el of nextElements) {
          if (!trackedSet.has(el)) {
            resizeObserver.observe(el);
          }
        }
      }
      trackedElements = nextElements;
      trackedSet.clear();
      for (const el of nextElements) trackedSet.add(el);
    }

    publicAPIs.init = function (opts) {
      publicAPIs.destroy();

      settings = Object.assign({}, defaults, opts || {});

      if (!document.body) {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => {
            publicAPIs.init(opts);
          }, { once: true });
        }
        return;
      }

      // Viewport resize → scrollbar dimensions
      resizeHandler = debounce(() => {
        calculateScrollbars();
        invalidateConfigCache();
        invalidateStickyTopCache();
      }, settings.debounceTime);
      window.addEventListener('resize', resizeHandler);

      // Element resize → recalculate that element
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            calculateElement(entry.target);
          }
          calculateScrollPadding();
        });
      } else {
        resizeObserver = null;
      }

      // DOM changes → observe new elements if relevant
      const debouncedMutation = debounce(() => {
        invalidateConfigCache();
        invalidateStickyTopCache();
        refreshElements();
        trackedElements.forEach((el) => calculateElement(el));
        calculateScrollPadding();
      }, settings.debounceTime);

      observer = new MutationObserver((mutations) => {
        let relevant = false;
        for (const mutation of mutations) {
          if (mutation.type === 'attributes') {
            const el = mutation.target;
            if (mutation.attributeName === 'data-keeptrack') {
              if (el.hasAttribute('data-keeptrack')) {
                relevant = true;
              } else {
                cleanupElement(el);
                relevant = true;
              }
            } else if (mutation.attributeName === 'data-keeptrack-scroll-padding') {
              if (!el.hasAttribute('data-keeptrack-scroll-padding')) {
                cleanupStickyState(el);
              }
              relevant = true;
            } else if (mutation.attributeName === 'id' || mutation.attributeName === 'data-keeptrack-id') {
              const oldPrefix = getOldNamePrefix(el, mutation.attributeName, mutation.oldValue);
              const newPrefix = getNamePrefix(el);
              if (oldPrefix && oldPrefix !== newPrefix && el.hasAttribute('data-keeptrack-scroll-padding') && !el.hasAttribute('data-keeptrack')) {
                cleanupStickyState(el, oldPrefix);
              }
              if (el.hasAttribute('data-keeptrack')) {
                cleanupElement(el);
                invalidateConfigCache();
                calculateElement(el);
                calculateScrollPadding();
              }
              relevant = true;
            } else if (el.hasAttribute('data-keeptrack')) {
              cleanupElement(el);
              invalidateConfigCache();
              calculateElement(el);
              calculateScrollPadding();
            }
            continue;
          }
          if (!relevant) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === 1 &&
                (node.matches('[data-keeptrack]') ||
                  node.matches('[data-keeptrack-scroll-padding]') ||
                  node.querySelector('[data-keeptrack]') ||
                  node.querySelector('[data-keeptrack-scroll-padding]'))) {
                relevant = true;
                break;
              }
            }
          }
          if (!relevant) {
            for (const node of mutation.removedNodes) {
              if (node.nodeType === 1 &&
                (node.matches('[data-keeptrack]') ||
                  node.matches('[data-keeptrack-scroll-padding]') ||
                  node.querySelector('[data-keeptrack]') ||
                  node.querySelector('[data-keeptrack-scroll-padding]'))) {
                relevant = true;
                break;
              }
            }
          }
        }
        if (relevant) debouncedMutation();
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeOldValue: true,
        attributeFilter: ['data-keeptrack', 'data-keeptrack-target-parent', 'data-keeptrack-scroll-padding', 'data-keeptrack-id', 'id']
      });

      // Sticky detection on scroll
      if (settings.detectSticky) {
        scrollHandler = function () {
          if (!scrollTicking) {
            scrollTicking = true;
            requestAnimationFrame(() => {
              checkStickyElements();
              calculateScrollPadding();
              scrollTicking = false;
            });
          }
        };
        window.addEventListener('scroll', scrollHandler, { passive: true });
      }

      // Predict scroll-padding-top on anchor link clicks
      anchorHandler = function (e) {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const targetNode = e.target && e.target.nodeType === 1 ? e.target : e.target && e.target.parentElement;
        if (!targetNode || !targetNode.closest) return;
        const anchor = targetNode.closest('a[href^="#"]');
        if (!anchor) return;
        const targetId = anchor.getAttribute('href').slice(1);
        if (!targetId) return;
        const target = document.getElementById(targetId);
        if (!target) return;
        updateScrollPaddingForTarget(target);
      };
      document.addEventListener('click', anchorHandler);

      // Predict scroll-padding-top on hash changes (programmatic, manual, or back/forward)
      hashNavHandler = function () {
        const targetId = window.location.hash ? window.location.hash.slice(1) : '';
        if (!targetId) return;
        const target = document.getElementById(targetId);
        if (!target) return;
        updateScrollPaddingForTarget(target);
      };
      window.addEventListener('hashchange', hashNavHandler);
      window.addEventListener('popstate', hashNavHandler);

      // Poll for non-resize computed style changes (sticky detection is handled by the scroll listener)
      if (settings.poll) {
        (function poll() {
          trackedElements.forEach((el) => calculateElement(el));
          calculateScrollPadding();
          pollId = requestAnimationFrame(poll);
        })();
      }

      // Initial calculation
      calculateScrollbars();
      refreshElements();
      trackedElements.forEach((el) => calculateElement(el));
      if (settings.detectSticky) {
        checkStickyElements();
      }
      calculateScrollPadding();
      if (window.location.hash && window.location.hash.length > 1) {
        const target = document.getElementById(window.location.hash.slice(1));
        if (target) updateScrollPaddingForTarget(target);
      }
    };

    publicAPIs.observe = function (el) {
      if (trackedSet.has(el)) return;
      trackedElements.push(el);
      trackedSet.add(el);
      if (resizeObserver) resizeObserver.observe(el);
      calculateElement(el);
      calculateScrollPadding();
    };

    publicAPIs.unobserve = function (el) {
      if (!trackedSet.has(el)) return;
      cleanupElement(el);
      trackedSet.delete(el);
      const index = trackedElements.indexOf(el);
      if (index !== -1) trackedElements.splice(index, 1);
      if (resizeObserver) resizeObserver.unobserve(el);
      calculateScrollPadding();
    };

    publicAPIs.recalculate = function () {
      calculateScrollbars();
      invalidateStickyTopCache();
      trackedElements.forEach((el) => calculateElement(el));
      if (settings.detectSticky) {
        checkStickyElements();
      }
      calculateScrollPadding();
    };

    publicAPIs.destroy = function () {
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
        resizeHandler = null;
      }
      if (scrollHandler) {
        window.removeEventListener('scroll', scrollHandler);
        scrollHandler = null;
      }
      if (anchorHandler) {
        document.removeEventListener('click', anchorHandler);
        anchorHandler = null;
      }
      if (hashNavHandler) {
        window.removeEventListener('hashchange', hashNavHandler);
        window.removeEventListener('popstate', hashNavHandler);
        hashNavHandler = null;
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (pollId) {
        cancelAnimationFrame(pollId);
        pollId = null;
      }
      window.removeEventListener('scrollend', unlockScrollPadding);

      // Clean up CSS variables and attributes
      trackedElements.forEach(cleanupElement);

      if (lastScrollbarWidth) {
        document.documentElement.style.removeProperty('--scrollbar-width');
        lastScrollbarWidth = undefined;
      }
      if (lastScrollbarHeight) {
        document.documentElement.style.removeProperty('--scrollbar-height');
        lastScrollbarHeight = undefined;
      }
      if (lastScrollPaddingTop) {
        document.documentElement.style.removeProperty('scroll-padding-top');
        lastScrollPaddingTop = undefined;
      }

      trackedElements = [];
      trackedSet.clear();
      scrollTicking = false;
      anchorScrollLock = false;
      clearTimeout(anchorScrollFallback);
      for (const container of usedMeasurerContainers) {
        const measurer = topMeasurers.get(container);
        if (measurer && measurer.parentNode) {
          measurer.parentNode.removeChild(measurer);
        }
        topMeasurers.delete(container);
      }
      usedMeasurerContainers.clear();
      stickyTopCache = new WeakMap();
    };

    publicAPIs.init(options);

    return publicAPIs;
  };
});
