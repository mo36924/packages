const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export default () => {
  let id = "";

  while (id.length < 22) {
    crypto.getRandomValues(new Uint8Array(44)).forEach((byte) => {
      if (id.length < 22 && byte < 248) {
        id += chars[byte % 62];
      }
    });
  }

  return id;
};
