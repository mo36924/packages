import { assert, expect, it } from "vitest";
import { parse, stringify } from "./index";

it("json", () => {
  const data = {
    a: 1,
    b: [2, 3],
    c: new Date(0),
    d: [0, "aaa"],
    e: [1, "1970-01-01T00:00:00.000Z"],
    f: [0, [0, new Date(0)]],
  };

  const json = stringify(data);
  const _data = parse(json);
  assert.deepEqual(data, _data);

  expect(JSON.stringify(JSON.parse(json), null, 2)).toMatchInlineSnapshot(`
    "{
      "a": 1,
      "b": [
        2,
        3
      ],
      "c": "11970-01-01T00:00:00.000Z",
      "d": [
        0,
        "0aaa"
      ],
      "e": [
        1,
        "01970-01-01T00:00:00.000Z"
      ],
      "f": [
        0,
        [
          0,
          "11970-01-01T00:00:00.000Z"
        ]
      ]
    }"
  `);
});
