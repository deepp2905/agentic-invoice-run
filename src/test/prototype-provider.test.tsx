import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PrototypeProvider, usePrototype } from "@/components/PrototypeProvider";
import { getPrototypeContext } from "@/components/prototype-context";

describe("Prototype context lifecycle", () => {
  it("starts a fresh root mount with default data and no user actions", () => {
    const first = renderHook(() => usePrototype(), { wrapper: PrototypeProvider });
    act(() => {
      first.result.current.dispatch({ type: "pause", time: "a" });
      first.result.current.dispatch({ type: "rule", rule: "combined", time: "b" });
    });
    expect(first.result.current.state.log).toHaveLength(2);
    first.unmount();
    const fresh = renderHook(() => usePrototype(), { wrapper: PrototypeProvider });
    expect(fresh.result.current.state.paused).toBe(false);
    expect(fresh.result.current.state.rule).toBe("exact");
    expect(fresh.result.current.state.log).toHaveLength(0);
  });
  it("retains the same context identity across live module replacements", () => {
    const cache = {};
    const mounted = getPrototypeContext(cache);
    expect(getPrototypeContext(cache)).toBe(mounted);
    expect(getPrototypeContext({})).not.toBe(mounted);
  });

  it("keeps saved rule and pause state available to newly mounted consumers", () => {
    const { result, rerender } = renderHook(() => usePrototype(), { wrapper: PrototypeProvider });
    act(() => {
      result.current.dispatch({ type: "rule", rule: "combined", time: "09:14" });
      result.current.dispatch({ type: "pause", time: "09:15" });
      expect(result.current.getCurrentState().rule).toBe("combined");
    });
    rerender();
    expect(result.current.state.rule).toBe("combined");
    expect(result.current.state.paused).toBe(true);
    expect(result.current.getCurrentState().log).toHaveLength(2);
  });
});