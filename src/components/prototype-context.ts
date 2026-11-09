import { createContext, type Context, type Dispatch } from "react";
import type { PrototypeAction, PrototypeState } from "@/lib/prototype-state";

export type PrototypeContextValue = {
  state: PrototypeState;
  dispatch: Dispatch<PrototypeAction>;
  getCurrentState: () => PrototypeState;
};

type ContextCache = { prototypeContext?: Context<PrototypeContextValue | null> };

// A replaced consumer must still read the context used by the mounted root provider.
export function getPrototypeContext(cache: ContextCache) {
  return cache.prototypeContext ??= createContext<PrototypeContextValue | null>(null);
}

export const PrototypeContext = getPrototypeContext(import.meta.hot?.data ?? {});
