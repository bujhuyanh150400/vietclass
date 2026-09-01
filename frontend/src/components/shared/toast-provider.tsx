"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  Toast,
  ToastDescription,
  ToastProvider as ToastPrimitiveProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

/** Which outcome a toast reports, which is all that decides how it looks. */
export type ToastVariant = "success" | "error";

/** What a caller says when it wants an outcome announced. */
export type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
};

/** One queued toast, with the identity and open state the viewport needs. */
type QueuedToast = ToastInput & { id: number; open: boolean };

/** How many toasts stay on screen at once before the oldest is dropped. */
const MAX_VISIBLE = 3;

/** How long a closing toast stays mounted so its exit animation can finish. */
const REMOVE_DELAY_MS = 200;

const ToastContext = createContext<((toast: ToastInput) => void) | null>(null);

/**
 * Holds the toast queue for the whole app and renders it above every route.
 *
 * It sits in the root providers rather than in any screen, so an outcome raised
 * just before a redirect — "teacher created", then straight to the list — is
 * still on screen after the navigation instead of unmounting with the form.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<QueuedToast[]>([]);
  const nextId = useRef(0);
  const removalTimers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  /** Queues one outcome, dropping the oldest when the stack is already full. */
  const showToast = useCallback((toast: ToastInput) => {
    nextId.current += 1;
    const queued: QueuedToast = { ...toast, id: nextId.current, open: true };

    setToasts((previous) => [...previous, queued].slice(-MAX_VISIBLE));
  }, []);

  /** Closes one toast, then unmounts it once its exit animation has played. */
  const dismissToast = useCallback((id: number) => {
    setToasts((previous) =>
      previous.map((toast) => (toast.id === id ? { ...toast, open: false } : toast)),
    );

    if (removalTimers.current.has(id)) {
      return;
    }

    removalTimers.current.set(
      id,
      setTimeout(() => {
        removalTimers.current.delete(id);
        setToasts((previous) => previous.filter((toast) => toast.id !== id));
      }, REMOVE_DELAY_MS),
    );
  }, []);

  useEffect(() => {
    const timers = removalTimers.current;

    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }

      timers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      <ToastPrimitiveProvider>
        {children}

        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            variant={toast.variant ?? "success"}
            open={toast.open}
            onOpenChange={(open) => (open ? undefined : dismissToast(toast.id))}
          >
            <ToastTitle>{toast.title}</ToastTitle>
            {toast.description === undefined ? null : (
              <ToastDescription>{toast.description}</ToastDescription>
            )}
          </Toast>
        ))}

        <ToastViewport />
      </ToastPrimitiveProvider>
    </ToastContext.Provider>
  );
}

/**
 * Gives a screen the one function it needs to announce an outcome, and fails
 * loudly when it is called outside the provider rather than dropping the notice.
 */
export function useToast(): (toast: ToastInput) => void {
  const showToast = useContext(ToastContext);

  if (showToast === null) {
    throw new Error("useToast phải được dùng bên trong <ToastProvider>.");
  }

  return showToast;
}
