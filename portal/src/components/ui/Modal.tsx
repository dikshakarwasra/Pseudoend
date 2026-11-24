import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'xl',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-xl overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full ${maxWidthClasses[maxWidth]} bg-[#1c1c1e] border border-white/10 rounded-2xl shadow-apple-md overflow-hidden p-6 relative animate-scale-in my-auto`}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[#86868b] hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {(title || description) && (
          <div className="mb-5 pr-8">
            {title && (
              <h3 className="text-base font-semibold text-[#f5f5f7] tracking-tight flex items-center gap-2">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-[#a1a1a6] mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        )}

        <div>{children}</div>
      </div>
    </div>
  );
};
