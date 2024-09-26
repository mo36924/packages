const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const uint8Array = new Uint8Array(65536);
let i = 0;

export const randomId = () => {
  let id = "";
  let j = 21;

  do {
    if (i) {
      i--;
    } else {
      crypto.getRandomValues(uint8Array);
      i = 65535;
    }

    const byte = uint8Array[i];

    if (byte < 248) {
      id += chars[byte % 62];

      if (j) {
        j--;
      } else {
        return id;
      }
    }
  } while (true);
};
