"use client";

import React, { useState, useEffect } from "react";
import { X, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type, 
  onClose, 
  duration = 4000 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClick = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  // Function to wrap text at 70 characters
  const wrapText = (text: string, maxLength: number = 70) => {
    if (text.length <= maxLength) return text;
    
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      if ((currentLine + word).length <= maxLength) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  const wrappedMessage = wrapText(message);

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all duration-300 max-w-md",
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
        type === "success" 
          ? "border-green-200 bg-green-50 text-green-800" 
          : "border-red-200 bg-red-50 text-red-800"
      )}
    >
      {type === "success" ? (
        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
      ) : (
        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        {Array.isArray(wrappedMessage) ? (
          <div className="space-y-1">
            {wrappedMessage.map((line, index) => (
              <span key={index} className="text-sm font-medium block">
                {line}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-sm font-medium">{wrappedMessage}</span>
        )}
      </div>
      <button
        onClick={handleClick}
        className="rounded p-1 hover:bg-black/10 transition-colors flex-shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

interface ToastContextType {
  showToast: (message: string, type: "success" | "error") => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [toast, setToast] = useState<{
    id: string;
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToast({ id, message, type });
  };

  const removeToast = () => {
    setToast(null);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={removeToast}
          />
        )}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}; 