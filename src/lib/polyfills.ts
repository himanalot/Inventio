/**
 * Polyfill for Promise.withResolvers
 * This is needed because Next.js static rendering doesn't support this feature yet.
 */

// Polyfill for Promise.withResolvers for older Node.js versions
if (typeof Promise.withResolvers !== 'function') {
  Promise.withResolvers = function withResolvers() {
    let resolve!: (value: any) => void;
    let reject!: (reason?: any) => void;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

export {};