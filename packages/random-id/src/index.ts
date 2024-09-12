const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export default () => {
  let id = "";
  let length = 22;

  while (length) {
    crypto.getRandomValues(new Uint8Array(44)).forEach((byte) => {
      if (length && byte < 248) {
        id += chars[byte % 62];
        length--;
      }
    });
  }

  return id;
};
