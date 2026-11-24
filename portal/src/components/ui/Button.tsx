import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'subtle';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-full select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

  const sizeStyles = {
    xs: 'text-[11px] px-3 py-1 gap-1 h-6',
    sm: 'text-xs px-3.5 py-1.5 gap-1.5 h-8',
    md: 'text-xs px-4 py-2 gap-2 h-9',
    lg: 'text-sm px-5 py-2.5 gap-2.5 h-10',
  };

  const variantStyles = {
    primary: 'bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-apple-blue font-semibold',
    secondary: 'bg-[#e8e8ed] hover:bg-[#dedee3] text-[#1d1d1f]',
    outline: 'bg-white hover:bg-[#f5f5f7] text-[#0071e3] border border-[#0071e3]/30 hover:border-[#0071e3]',
    ghost: 'bg-transparent hover:bg-black/5 text-[#6e6e73] hover:text-[#1d1d1f]',
    danger: 'bg-[#ff3b30]/10 hover:bg-[#ff3b30]/15 text-[#dc2626] border border-[#ff3b30]/20',
    subtle: 'bg-[#0071e3]/10 hover:bg-[#0071e3]/15 text-[#0071e3] border border-[#0071e3]/20 font-semibold',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-3.5 w-3.5 text-current" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
