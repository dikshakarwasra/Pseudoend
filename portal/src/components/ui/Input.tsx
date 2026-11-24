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
        <label htmlFor={inputId} className="block text-xs font-medium text-[#a1a1a6]">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3 text-[#86868b] pointer-events-none flex items-center">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full bg-[#1c1c1e] border rounded-xl py-2 text-xs text-[#f5f5f7] placeholder-[#6e6e73] transition-all focus:outline-none focus:ring-2 focus:ring-[#0071e3]/60 focus:border-[#0071e3] disabled:opacity-40 disabled:bg-[#161617] ${
            leftIcon ? 'pl-9' : 'pl-3'
          } ${rightIcon ? 'pr-9' : 'pr-3'} ${
            error ? 'border-red-500/60 text-red-200' : 'border-white/10 hover:border-white/20'
          } ${className}`}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 text-[#86868b] flex items-center">
            {rightIcon}
          </span>
        )}
      </div>
      {error && <p className="text-[11px] text-[#ff453a]">{error}</p>}
      {helperText && !error && <p className="text-[11px] text-[#86868b]">{helperText}</p>}
    </div>
  );
});

Input.displayName = 'Input';
