import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

const ConfirmCtx = createContext(null);
export const useConfirm = () => useContext(ConfirmCtx);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setState({
          title: "Konfirmasi",
          message: "",
          confirmLabel: "Ya, lanjutkan",
          cancelLabel: "Batal",
          danger: false,
          ...options,
        });
      }),
    []
  );

  const close = useCallback((result) => {
    resolver.current?.(result);
    resolver.current = null;
    setState(null);
  }, []);

  useEffect(() => {
    if (!state) return;
    const onKey = (e) => {
      if (e.key === "Escape") close(false);
      if (e.key === "Enter") close(true);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [state, close]);

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {state && (
        <div
          className="fixed inset-0 z-[350] flex items-end justify-center bg-navy-900/50 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => close(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm animate-pop rounded-3xl bg-white p-6 shadow-lift"
          >
            <span
              className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${
                state.danger ? "bg-red-50 text-red-700" : "bg-accent-50 text-accent-600"
              }`}
            >
              <AlertTriangle size={20} />
            </span>
            <h3 id="confirm-title" className="text-lg font-extrabold">
              {state.title}
            </h3>
            {state.message && <p className="mt-1.5 text-sm leading-relaxed text-navy/65">{state.message}</p>}
            <div className="mt-6 flex gap-2">
              <button type="button" onClick={() => close(false)} className="btn-ghost flex-1">
                {state.cancelLabel}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => close(true)}
                className={`flex-1 ${state.danger ? "btn-accent" : "btn-primary"}`}
              >
                {state.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  );
}
