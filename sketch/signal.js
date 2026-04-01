export function signal(initial) {
  let value = initial;
  const subs = new Set();

  return {
    get value() { return value; },
    set value(next) {
      if (next === value) return;
      value = next;
      for (const fn of subs) fn(value);
    },
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}

export function reactive(defaults) {
  const state = {};
  const signals = {};

  for (const [key, val] of Object.entries(defaults)) {
    if (val && typeof val === "object" && "subscribe" in val) {
      signals[key] = val;
    } else {
      signals[key] = signal(val);
    }

    Object.defineProperty(state, key, {
      get() { return signals[key].value; },
      set(next) { signals[key].value = next; },
      enumerable: true,
    });
  }

  state.subscribe = function (key, fn) {
    return signals[key].subscribe(fn);
  };

  return state;
}
