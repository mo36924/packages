export const textToHex = (text: string) => {
  const bytes = new TextEncoder().encode(text);
  const hex = [...bytes].map((x) => x.toString(16).padStart(2, "0")).join("");
  return hex;
};

export const hexToText = (hex: string) => {
  const bytes = new Uint8Array(hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
  const text = new TextDecoder().decode(bytes);
  return text;
};

export const toServerFunctionId = (path: string, index: number): string => {
  const serverFunctionId = `_${textToHex(path)}_${index}`;
  return serverFunctionId;
};
