import { createContext, useCallback, useContext, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

const TYPES = {
  success: { Icon: CheckCircle2, tone: "text-emerald-700", bar: "bg-emerald-500" },
  error: { Icon: AlertTriangle, tone: "text-red-700", bar: "bg-red-500" },
  warning: { Icon: AlertTriangle, tone: "text-amber-500", bar: "bg-amber-500" },
  info: { Icon: Info, tone: "text-navy-500", bar: "bg-navy-500" },
};

let seq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message, options = {}) => {
      const id = ++seq;
      const type = options.type || "success";
      setToasts((list) => [...list.slice(-2), { id, message, type, title: options.title }]);
      setTimeout(() => dismiss(id), options.duration ?? 3200);
      return id;
    },
    [dismiss]
  );

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(4.9rem+env(safe-area-inset-bottom))] z-[400] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:items-end sm:px-0"
      >
        {toasts.map((t) => {
          const { Icon, tone, bar } = TYPES[t.type] || TYPES.info;
          return (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto relative flex w-full max-w-sm animate-rise items-start gap-3 overflow-hidden rounded-2xl border border-navy/[0.06] bg-white/95 p-3.5 pr-2.5 shadow-lift backdrop-blur"
            >
              <span className={`absolute left-0 top-0 h-full w-1 ${bar}`} aria-hidden="true" />
              <Icon size={18} className={`mt-0.5 shrink-0 ${tone}`} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                {t.title && <p className="text-sm font-bold text-navy">{t.title}</p>}
                <p className="text-sm leading-snug text-navy/70">{t.message}</p>
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Tutup notifikasi"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-navy/65 transition hover:bg-navy/5 hover:text-navy active:scale-90"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
