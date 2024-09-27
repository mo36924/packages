export const createObject: {
  <T0 = any>(source0?: T0): T0;
  <T0, T1>(source0: T0, source1: T1): T0 & T1;
} = (...sources: any[]) => Object.assign(Object.create(null), ...sources);

export const memoize2 = <T extends (a1: any, a2: any) => any>(fn: T): T => {
  const cache0 = new WeakMap();
  return ((a1: any, a2: any): any => {
    let cache1 = cache0.get(a1);

    if (cache1 === undefined) {
      cache1 = new Map();
      cache0.set(a1, cache1);
    }

    if (cache1.has(a2)) {
      return cache1.get(a2);
    }

    const fnResult = fn(a1, a2);
    cache1.set(a2, fnResult);

    return fnResult;
  }) as any;
};

export const memoize3 = <T extends (a1: any, a2: any, a3: any) => any>(fn: T): T => {
  const cache0 = new WeakMap();
  return ((a1: any, a2: any, a3: any): any => {
    let cache1 = cache0.get(a1);

    if (cache1 === undefined) {
      cache1 = new Map();
      cache0.set(a1, cache1);
    }

    let cache2 = cache1.get(a2);

    if (cache2 === undefined) {
      cache2 = new Map();
      cache1.set(a2, cache2);
    }

    if (cache2.has(a3)) {
      return cache2.get(a3);
    }

    const fnResult = fn(a1, a2, a3);
    cache2.set(a3, fnResult);

    return fnResult;
  }) as any;
};
