import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react";
import { initialPrototypeState, prototypeReducer, type PrototypeAction, type PrototypeState } from "@/lib/prototype-state";

const PrototypeContext = createContext<{ state: PrototypeState; dispatch: Dispatch<PrototypeAction> } | null>(null);
export function PrototypeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(prototypeReducer, initialPrototypeState);
  return <PrototypeContext.Provider value={{ state, dispatch }}>{children}</PrototypeContext.Provider>;
}
export function usePrototype() {
  const context = useContext(PrototypeContext);
  if (!context) throw new Error("PrototypeProvider is required");
  return context;
}
export function actionTime() {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}