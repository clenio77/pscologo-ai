import React from 'react';
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import type { Toast, ToastType } from '../context/ToastContext';
import './ToastContainer.css';

interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="toast-icon" size={18} />;
      case 'warning':
        return <AlertTriangle className="toast-icon" size={18} />;
      case 'error':
        return <AlertCircle className="toast-icon" size={18} />;
      case 'info':
      default:
        return <Info className="toast-icon" size={18} />;
    }
  };

  return (
    <div className="toast-container-wrapper">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-item toast-${toast.type} animate-slide-in`}>
          <div className="toast-content-body">
            {getIcon(toast.type)}
            <span className="toast-message">{toast.message}</span>
          </div>
          <button className="toast-close-btn" onClick={() => removeToast(toast.id)}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
