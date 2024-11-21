const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const maxByteLength = 1000;
const uint8Array = new Uint8Array(maxByteLength);
const randomIdLength = 22;
let i = maxByteLength;

export const randomId = () => {
  let j = 0;
  let id = "";

  do {
    if (i === maxByteLength) {
      i = 0;
      crypto.getRandomValues(uint8Array);
    } else {
      i++;
    }

    const byte = uint8Array[i];

    if (byte < 248) {
      j++;
      id += chars[byte % 62];

      if (j === randomIdLength) {
        return id;
      }
    }
  } while (true);
};
