import { describe, expect, it } from "vitest";

import { formatPrice, getImageUrl } from "./utils";

describe("utils", () => {
  it("formats ruble price without fractional digits", () => {
    expect(formatPrice(12000)).toContain("12");
    expect(formatPrice(12000)).toContain("₽");
  });

  it("builds image url from configured api base url", () => {
    expect(getImageUrl(42)).toBe("/api/v1/image/42");
    expect(getImageUrl(null)).toBeNull();
  });
});
