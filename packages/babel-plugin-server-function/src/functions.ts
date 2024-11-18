export type Functions = { [hash: string]: (...args: any[]) => Promise<any> };

// @ts-expect-error functions is set to a value by Babel
export const functions: Functions = (globalThis.__SERVER_FUNCTIONS__ ??= Object.create(null));
