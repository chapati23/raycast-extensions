import { describe, expect, it } from "vitest";
import { formatAddress, formatPercent, formatUsd } from "./format";

describe("formatUsd", () => {
  it("returns an em dash for undefined", () => {
    expect(formatUsd(undefined)).toBe("—");
  });

  it("returns an em dash for NaN", () => {
    expect(formatUsd(NaN)).toBe("—");
  });

  it("formats zero", () => {
    expect(formatUsd(0)).toBe("$0.00");
  });

  it("uses compact notation for millions", () => {
    expect(formatUsd(42_100_000)).toBe("$42.1M");
  });

  it("uses compact notation for billions", () => {
    expect(formatUsd(4_700_000_000)).toBe("$4.7B");
  });

  it("uses compact notation for thousands without a trailing .0", () => {
    expect(formatUsd(310_000)).toBe("$310K");
  });

  it("formats sub-thousand values with two decimals", () => {
    expect(formatUsd(999.99)).toBe("$999.99");
    expect(formatUsd(1.5)).toBe("$1.50");
  });

  it("keeps three significant digits for tiny prices", () => {
    expect(formatUsd(0.0000112)).toBe("$0.0000112");
  });

  it("keeps three significant digits for prices just under $1", () => {
    expect(formatUsd(0.1234)).toBe("$0.123");
  });

  it("formats negative values with a leading minus sign", () => {
    expect(formatUsd(-42_100_000)).toBe("-$42.1M");
    expect(formatUsd(-1.5)).toBe("-$1.50");
    expect(formatUsd(-0.0000112)).toBe("-$0.0000112");
  });
});

describe("formatPercent", () => {
  it("returns an em dash for undefined", () => {
    expect(formatPercent(undefined)).toBe("—");
  });

  it("returns an em dash for NaN", () => {
    expect(formatPercent(NaN)).toBe("—");
  });

  it("formats a positive fraction with a leading plus sign", () => {
    expect(formatPercent(0.04)).toBe("+4.0%");
  });

  it("formats a negative fraction with a leading minus sign", () => {
    expect(formatPercent(-0.082)).toBe("-8.2%");
  });

  it("formats zero as +0.0%", () => {
    expect(formatPercent(0)).toBe("+0.0%");
  });
});

describe("formatAddress", () => {
  it("returns an em dash for undefined", () => {
    expect(formatAddress(undefined)).toBe("—");
  });

  it("returns an em dash for an empty string", () => {
    expect(formatAddress("")).toBe("—");
  });

  it("truncates a long address to a leading and trailing chunk", () => {
    expect(formatAddress("0x69820D8f0ab9f9Ed19331111111111111933")).toBe("0x6982…1933");
  });

  it("returns short strings unchanged", () => {
    expect(formatAddress("0x1234")).toBe("0x1234");
  });
});
