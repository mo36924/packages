export const escapeAttribute = (value: string) => {
  let iQuot = value.indexOf('"');
  let iAmp = value.indexOf("&");

  if (iQuot < 0 && iAmp < 0) {
    return value;
  }

  let left = 0;
  let out = "";

  while (iQuot >= 0 && iAmp >= 0) {
    if (iQuot < iAmp) {
      if (left < iQuot) {
        out += value.substring(left, iQuot);
      }

      out += "&quot;";
      left = iQuot + 1;
      iQuot = value.indexOf('"', left);
    } else {
      if (left < iAmp) {
        out += value.substring(left, iAmp);
      }

      out += "&amp;";
      left = iAmp + 1;
      iAmp = value.indexOf("&", left);
    }
  }

  if (iQuot >= 0) {
    do {
      if (left < iQuot) {
        out += value.substring(left, iQuot);
      }

      out += "&quot;";
      left = iQuot + 1;
      iQuot = value.indexOf('"', left);
    } while (iQuot >= 0);
  } else {
    while (iAmp >= 0) {
      if (left < iAmp) {
        out += value.substring(left, iAmp);
      }

      out += "&amp;";
      left = iAmp + 1;
      iAmp = value.indexOf("&", left);
    }
  }

  return left < value.length ? out + value.substring(left) : out;
};

export const escapeText = (value: string) => {
  let iLt = value.indexOf("<");
  let iAmp = value.indexOf("&");

  if (iLt < 0 && iAmp < 0) {
    return value;
  }

  let left = 0;
  let out = "";

  while (iLt >= 0 && iAmp >= 0) {
    if (iLt < iAmp) {
      if (left < iLt) {
        out += value.substring(left, iLt);
      }

      out += "&lt;";
      left = iLt + 1;
      iLt = value.indexOf("<", left);
    } else {
      if (left < iAmp) {
        out += value.substring(left, iAmp);
      }

      out += "&amp;";
      left = iAmp + 1;
      iAmp = value.indexOf("&", left);
    }
  }

  if (iLt >= 0) {
    do {
      if (left < iLt) {
        out += value.substring(left, iLt);
      }

      out += "&lt;";
      left = iLt + 1;
      iLt = value.indexOf("<", left);
    } while (iLt >= 0);
  } else {
    while (iAmp >= 0) {
      if (left < iAmp) {
        out += value.substring(left, iAmp);
      }

      out += "&amp;";
      left = iAmp + 1;
      iAmp = value.indexOf("&", left);
    }
  }

  return left < value.length ? out + value.substring(left) : out;
};
