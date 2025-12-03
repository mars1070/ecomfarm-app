"use client";

import { useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

export default function Toast({ id, type, title, message, duration = 8000, onClose }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const config = {
    success: {
      icon: CheckCircle,
      bgColor: "bg-green-50",
      borderColor: "border-green-500",
      iconColor: "text-green-500",
      titleColor: "text-green-900",
      messageColor: "text-green-700",
    },
    error: {
      icon: AlertCircle,
      bgColor: "bg-red-50",
      borderColor: "border-red-500",
      iconColor: "text-red-500",
      titleColor: "text-red-900",
      messageColor: "text-red-700",
    },
    warning: {
      icon: AlertTriangle,
      bgColor: "bg-orange-50",
      borderColor: "border-orange-500",
      iconColor: "text-orange-500",
      titleColor: "text-orange-900",
      messageColor: "text-orange-700",
    },
    info: {
      icon: Info,
      bgColor: "bg-blue-50",
      borderColor: "border-blue-500",
      iconColor: "text-blue-500",
      titleColor: "text-blue-900",
      messageColor: "text-blue-700",
    },
  };

  const { icon: Icon, bgColor, borderColor, iconColor, titleColor, messageColor } = config[type];

  return (
    <div
      className={`${bgColor} ${borderColor} border-l-4 rounded-lg shadow-lg p-4 mb-3 animate-slide-in-right max-w-md`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <p className={`font-semibold ${titleColor}`}>{title}</p>
          {message && <p className={`text-sm ${messageColor} mt-1`}>{message}</p>}
        </div>
        <button
          onClick={() => onClose(id)}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
