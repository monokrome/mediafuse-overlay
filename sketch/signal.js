export function signal(initial) {
  let value = initial;
  const subs = new Set();
  return {
    get() { return value; },
    set(next) {
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
