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
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-full select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

  const sizeStyles = {
    xs: 'text-[11px] px-2.5 py-1 gap-1 h-6',
    sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
    md: 'text-xs px-4 py-2 gap-2 h-9',
    lg: 'text-sm px-5 py-2.5 gap-2.5 h-10',
  };

  const variantStyles = {
    primary: 'bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-apple-sm',
    secondary: 'bg-[#2c2c2e] hover:bg-[#3a3a3c] text-[#f5f5f7] border border-white/10',
    outline: 'bg-white/5 hover:bg-white/10 text-[#f5f5f7] border border-white/15 hover:border-white/25',
    ghost: 'bg-transparent hover:bg-white/10 text-[#a1a1a6] hover:text-[#f5f5f7]',
    danger: 'bg-red-500/15 hover:bg-red-500/25 text-[#ff453a] border border-red-500/30',
    subtle: 'bg-[#0071e3]/15 hover:bg-[#0071e3]/25 text-[#2997ff] border border-[#0071e3]/30',
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
