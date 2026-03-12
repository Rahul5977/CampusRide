/* -----------------------------------------------------------------------
 * ToastContext — simple, zero-dependency toast notification system.
 *
 * Usage in any component:
 *   const { toast } = useToast();
 *   toast({ title: "Success!", variant: "success" });
 * ----------------------------------------------------------------------- */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { X } from "lucide-react";

type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastContextValue {
  toast: (input: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let toastId = 0;

const variantStyles: Record<ToastVariant, string> = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  error: "bg-red-50 border-red-200 text-red-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((input: ToastInput) => {
    const id = ++toastId;
    const newToast: Toast = {
      id,
      title: input.title,
      description: input.description,
      variant: input.variant ?? "info",
    };
    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}

      {/* Toast container — fixed bottom-right on desktop, bottom-center on mobile */}
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-xl border p-4 shadow-lg animate-in slide-in-from-bottom-2 transition-all ${variantStyles[t.variant]}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-sm">{t.title}</p>
                {t.description && (
                  <p className="text-xs mt-0.5 opacity-80">{t.description}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded-md p-0.5 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}
