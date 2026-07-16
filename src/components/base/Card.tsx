import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'ghost' | 'gradient';
  hover?: boolean;
}

export default function Card({
  children,
  className = '',
  variant = 'default',
  hover = true,
}: CardProps) {
  const baseStyles = 'rounded-xl transition-all duration-300';

  const variantStyles: Record<string, string> = {
    default: 'bg-slate-800/50 border border-slate-700/50',
    elevated: 'bg-slate-800 border border-slate-700 shadow-lg shadow-black/50',
    ghost: 'bg-transparent border border-slate-700/30',
    gradient: 'bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50',
  };

  const hoverStyles = hover ? 'hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10' : '';

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${hoverStyles} ${className}`}>
      {children}
    </div>
  );
}
