import { createContext, useCallback, useContext, useReducer, useRef, type Dispatch, type ReactNode } from "react";
import { initialPrototypeState, prototypeReducer, type PrototypeAction, type PrototypeState } from "@/lib/prototype-state";

const PrototypeContext = createContext<{ state: PrototypeState; dispatch: Dispatch<PrototypeAction>; getCurrentState: () => PrototypeState } | null>(null);
export function PrototypeProvider({ children }: { children: ReactNode }) {
  const [state, reducerDispatch] = useReducer(prototypeReducer, initialPrototypeState);
  const current = useRef(state);
  const dispatch = useCallback((action: PrototypeAction) => {
    current.current = prototypeReducer(current.current, action);
    reducerDispatch(action);
  }, []);
  const getCurrentState = useCallback(() => current.current, []);
  return <PrototypeContext.Provider value={{ state, dispatch, getCurrentState }}>{children}</PrototypeContext.Provider>;
}
export function usePrototype() {
  const context = useContext(PrototypeContext);
  if (!context) throw new Error("PrototypeProvider is required");
  return context;
}
export function actionTime() {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
