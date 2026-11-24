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
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-[11px] px-2.5 py-0.5';

  if (method) {
    const m = method.toUpperCase();
    let methodColors = 'bg-black/5 text-[#1d1d1f] border-black/10';
    if (m === 'GET') methodColors = 'bg-[#0071e3]/10 text-[#0071e3] border-[#0071e3]/20';
    else if (m === 'POST') methodColors = 'bg-[#af52de]/10 text-[#9333ea] border-[#af52de]/20';
    else if (m === 'PUT') methodColors = 'bg-[#ff9500]/10 text-[#d97706] border-[#ff9500]/20';
    else if (m === 'PATCH') methodColors = 'bg-[#06b6d4]/10 text-[#0891b2] border-[#06b6d4]/20';
    else if (m === 'DELETE') methodColors = 'bg-[#ff3b30]/10 text-[#dc2626] border-[#ff3b30]/20';

    return (
      <span
        className={`inline-flex items-center font-mono font-bold rounded-full border ${methodColors} ${sizeClass} ${className}`}
        {...props}
      >
        {m}
      </span>
    );
  }

  if (statusCode !== undefined) {
    let statusColors = 'bg-black/5 text-[#6e6e73] border-black/10';
    if (statusCode >= 200 && statusCode < 300) statusColors = 'bg-[#34c759]/10 text-[#15803d] border-[#34c759]/25 font-semibold';
    else if (statusCode >= 300 && statusCode < 400) statusColors = 'bg-[#0071e3]/10 text-[#0071e3] border-[#0071e3]/20 font-semibold';
    else if (statusCode >= 400 && statusCode < 500) statusColors = 'bg-[#ff9500]/10 text-[#d97706] border-[#ff9500]/25 font-semibold';
    else if (statusCode >= 500) statusColors = 'bg-[#ff3b30]/10 text-[#dc2626] border-[#ff3b30]/25 font-semibold';

    return (
      <span
        className={`inline-flex items-center font-mono rounded-full border ${statusColors} ${sizeClass} ${className}`}
        {...props}
      >
        {statusCode}
      </span>
    );
  }

  const variantStyles = {
    neutral: 'bg-black/5 text-[#1d1d1f] border-black/10',
    success: 'bg-[#34c759]/10 text-[#15803d] border-[#34c759]/25',
    warning: 'bg-[#ff9500]/10 text-[#d97706] border-[#ff9500]/25',
    danger: 'bg-[#ff3b30]/10 text-[#dc2626] border-[#ff3b30]/25',
    info: 'bg-[#0071e3]/10 text-[#0071e3] border-[#0071e3]/20',
    method: 'bg-black/5 text-[#1d1d1f] border-black/10',
    status: 'bg-black/5 text-[#1d1d1f] border-black/10',
    env: 'bg-black/5 text-[#1d1d1f] border-black/10',
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
