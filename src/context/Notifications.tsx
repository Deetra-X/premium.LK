import React, { createContext, useCallback, useMemo, useState } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

type Toast = {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  timeout?: number;
};

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: 'danger' | 'default';
};

type NotificationsContextValue = {
  notify: (toast: Omit<Toast, 'id'>) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<
    (ConfirmOptions & { open: boolean; resolve?: (v: boolean) => void }) | null
  >(null);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback<NotificationsContextValue['notify']>((toast) => {
    const id = Math.random().toString(36).slice(2);
    const timeout = toast.timeout ?? 4000;
    setToasts((prev) => [...prev, { id, ...toast, timeout }]);
    if (timeout > 0) {
      setTimeout(() => removeToast(id), timeout);
    }
  }, [removeToast]);

  const success = useCallback((message: string, title?: string) => notify({ type: 'success', message, title }), [notify]);
  const error = useCallback((message: string, title?: string) => notify({ type: 'error', message, title, timeout: 6000 }), [notify]);
  const info = useCallback((message: string, title?: string) => notify({ type: 'info', message, title }), [notify]);
  const warning = useCallback((message: string, title?: string) => notify({ type: 'warning', message, title }), [notify]);

  const confirm = useCallback<NotificationsContextValue['confirm']>((options) => {
    return new Promise((resolve) => {
      setConfirmState({ open: true, ...options, resolve });
    });
  }, []);

  const value = useMemo<NotificationsContextValue>(() => ({ notify, success, error, info, warning, confirm }), [notify, success, error, info, warning, confirm]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[1000] space-y-2 w-[90vw] max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              `rounded-md border px-4 py-3 shadow-md text-sm transition-all ` +
              (t.type === 'success' ? 'bg-emerald-900/30 border-emerald-600 text-emerald-200' : '') +
              (t.type === 'error' ? 'bg-red-900/30 border-red-600 text-red-200' : '') +
              (t.type === 'info' ? 'bg-slate-800 border-slate-600 text-slate-200' : '') +
              (t.type === 'warning' ? 'bg-yellow-900/30 border-yellow-600 text-yellow-100' : '')
            }
          >
            {t.title && <div className="font-semibold mb-1">{t.title}</div>}
            <div className="flex items-start justify-between gap-3">
              <div className="whitespace-pre-wrap">{t.message}</div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-xs opacity-70 hover:opacity-100"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirm Dialog */}
      {confirmState?.open && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-slate-800 border border-slate-700 rounded-lg w-[90vw] max-w-md p-5 text-slate-100 shadow-xl">
            <div className="text-lg font-semibold mb-2">{confirmState.title ?? 'Please Confirm'}</div>
            <div className="text-sm text-slate-300 mb-4 whitespace-pre-wrap">{confirmState.message}</div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  confirmState.resolve?.(false);
                  setConfirmState(null);
                }}
                className="px-3 py-2 text-sm rounded-md bg-slate-700 hover:bg-slate-600 border border-slate-600"
              >
                {confirmState.cancelText ?? 'Cancel'}
              </button>
              <button
                onClick={() => {
                  confirmState.resolve?.(true);
                  setConfirmState(null);
                }}
                className={
                  'px-3 py-2 text-sm rounded-md border ' +
                  (confirmState.tone === 'danger'
                    ? 'bg-red-600 hover:bg-red-500 border-red-500'
                    : 'bg-blue-600 hover:bg-blue-500 border-blue-500')
                }
              >
                {confirmState.confirmText ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationsContext.Provider>
  );
};

export const NotificationsContextRef = NotificationsContext;
