"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import Toast, { ToastType } from "./Toast";

interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((type: ToastType, title: string, message?: string, duration = 8000) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);
  }, []);

  const success = useCallback((title: string, message?: string) => {
    showToast("success", title, message, 8000);
  }, [showToast]);

  const error = useCallback((title: string, message?: string) => {
    showToast("error", title, message, 10000);
  }, [showToast]);

  const warning = useCallback((title: string, message?: string) => {
    showToast("warning", title, message, 8000);
  }, [showToast]);

  const info = useCallback((title: string, message?: string) => {
    showToast("info", title, message, 8000);
  }, [showToast]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
