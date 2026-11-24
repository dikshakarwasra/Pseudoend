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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full ${maxWidthClasses[maxWidth]} bg-white border border-black/[0.08] rounded-[28px] shadow-apple-lg overflow-hidden p-6 sm:p-7 relative animate-scale-in my-auto text-[#1d1d1f]`}
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-[#86868b] hover:text-[#1d1d1f] p-1.5 rounded-full hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {(title || description) && (
          <div className="mb-6 pr-8">
            {title && (
              <h3 className="text-lg font-bold text-[#1d1d1f] tracking-tight flex items-center gap-2">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-[#6e6e73] mt-1.5 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );
};
