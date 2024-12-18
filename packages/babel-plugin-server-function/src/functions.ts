const functions: {
  [hash: string]: { (...args: any[]): Promise<any>; _: { key: string; path: string; name: string } };
} = Object.create(null);

export default new Proxy(functions, {
  get(_, key: string) {
    const fn = functions[key];

    if (!fn) {
      return;
    }

    return Object.assign(
      async (...args: any[]) => {
        const data = await import(fn._.path);
        return data[fn._.name](...args);
      },
      { _: fn._ },
    );
  },
});
