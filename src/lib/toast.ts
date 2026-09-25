export type ToastTone = "success" | "error" | "info";

export type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
  title?: string;
};

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
const listeners = new Set<Listener>();

function emit() {
  const snapshot = [...toasts];
  listeners.forEach((listener) => listener(snapshot));
}

function push(toast: Omit<ToastItem, "id">) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  toasts = [...toasts, { ...toast, id }];
  emit();

  window.setTimeout(() => {
    dismissToast(id);
  }, 4200);

  return id;
}

export function subscribeToasts(listener: Listener) {
  listeners.add(listener);
  listener([...toasts]);
  return () => {
    listeners.delete(listener);
  };
}

export function dismissToast(id: string) {
  toasts = toasts.filter((toast) => toast.id !== id);
  emit();
}

export const toast = {
  success(message: string, title = "Success") {
    return push({ tone: "success", message, title });
  },
  error(message: string, title = "Error") {
    return push({ tone: "error", message, title });
  },
  info(message: string, title = "Notice") {
    return push({ tone: "info", message, title });
  },
  fromError(err: unknown, fallback = "Something went wrong") {
    const message = err instanceof Error ? err.message : fallback;
    return toast.error(message);
  },
};
