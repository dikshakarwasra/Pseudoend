import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'method' | 'status' | 'env' | 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  method?: string;
  statusCode?: number;
  env?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  method,
  statusCode,
  env,
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.2' : 'text-[11px] px-2.5 py-0.5';

  if (method) {
    const m = method.toUpperCase();
    let methodColors = 'bg-white/10 text-white border-white/15';
    if (m === 'GET') methodColors = 'bg-[#0071e3]/15 text-[#2997ff] border-[#0071e3]/30';
    else if (m === 'POST') methodColors = 'bg-[#bf5af2]/15 text-[#bf5af2] border-[#bf5af2]/30';
    else if (m === 'PUT') methodColors = 'bg-[#ff9f0a]/15 text-[#ff9f0a] border-[#ff9f0a]/30';
    else if (m === 'PATCH') methodColors = 'bg-[#64d2ff]/15 text-[#64d2ff] border-[#64d2ff]/30';
    else if (m === 'DELETE') methodColors = 'bg-[#ff453a]/15 text-[#ff453a] border-[#ff453a]/30';

    return (
      <span
        className={`inline-flex items-center font-mono font-semibold rounded-full border ${methodColors} ${sizeClass} ${className}`}
        {...props}
      >
        {m}
      </span>
    );
  }

  if (statusCode !== undefined) {
    let statusColors = 'bg-white/10 text-[#a1a1a6] border-white/10';
    if (statusCode >= 200 && statusCode < 300) statusColors = 'bg-[#30d158]/15 text-[#30d158] border-[#30d158]/30';
    else if (statusCode >= 300 && statusCode < 400) statusColors = 'bg-[#64d2ff]/15 text-[#64d2ff] border-[#64d2ff]/30';
    else if (statusCode >= 400 && statusCode < 500) statusColors = 'bg-[#ff9f0a]/15 text-[#ff9f0a] border-[#ff9f0a]/30';
    else if (statusCode >= 500) statusColors = 'bg-[#ff453a]/15 text-[#ff453a] border-[#ff453a]/30';

    return (
      <span
        className={`inline-flex items-center font-mono font-medium rounded-full border ${statusColors} ${sizeClass} ${className}`}
        {...props}
      >
        {statusCode}
      </span>
    );
  }

  const variantStyles = {
    neutral: 'bg-white/10 text-[#f5f5f7] border-white/15',
    success: 'bg-[#30d158]/15 text-[#30d158] border-[#30d158]/30',
    warning: 'bg-[#ff9f0a]/15 text-[#ff9f0a] border-[#ff9f0a]/30',
    danger: 'bg-[#ff453a]/15 text-[#ff453a] border-[#ff453a]/30',
    info: 'bg-[#0071e3]/15 text-[#2997ff] border-[#0071e3]/30',
    method: 'bg-white/10 text-white border-white/15',
    status: 'bg-white/10 text-white border-white/15',
    env: 'bg-white/10 text-white border-white/15',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono rounded-full border ${variantStyles[variant]} ${sizeClass} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
