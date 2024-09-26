import { expect, it } from "vitest";
import { randomId } from "./index";

it("random-id", () => {
  const ids = Array.from({ length: 1000 }).map(randomId);
  const invalidId = ids.find((id) => !/^[A-Z0-9]{22}$/i.test(id));
  expect(invalidId).toBe(undefined);
});
