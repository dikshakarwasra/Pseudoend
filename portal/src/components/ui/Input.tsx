import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-[#1d1d1f]">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3.5 text-[#86868b] pointer-events-none flex items-center">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full bg-white border rounded-xl py-2 text-xs text-[#1d1d1f] placeholder-[#86868b] transition-all focus:outline-none focus:ring-4 focus:ring-[#0071e3]/15 focus:border-[#0071e3] disabled:opacity-40 disabled:bg-[#f5f5f7] shadow-sm ${
            leftIcon ? 'pl-9' : 'pl-3.5'
          } ${rightIcon ? 'pr-9' : 'pr-3.5'} ${
            error ? 'border-[#ff3b30] text-[#dc2626]' : 'border-[#d2d2d7] hover:border-[#86868b]'
          } ${className}`}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3.5 text-[#86868b] flex items-center">
            {rightIcon}
          </span>
        )}
      </div>
      {error && <p className="text-[11px] text-[#dc2626] font-medium">{error}</p>}
      {helperText && !error && <p className="text-[11px] text-[#86868b]">{helperText}</p>}
    </div>
  );
});

Input.displayName = 'Input';
