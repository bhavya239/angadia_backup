import { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success' | 'warning';
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  children,
  variant = 'primary',
  isLoading = false,
  size = 'md',
  className = '',
  disabled,
  ...props
}: ButtonProps) {

  const baseStyles = `
    inline-flex items-center justify-center font-semibold rounded-xl
    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed select-none
  `;

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  };

  const variants = {
    primary: `
      bg-gradient-to-br from-indigo-500 to-indigo-600 text-white
      hover:from-indigo-600 hover:to-indigo-700 hover:shadow-lg hover:shadow-indigo-500/30
      focus:ring-indigo-500 active:scale-[0.98]
    `,
    secondary: `
      bg-white text-slate-700 border border-slate-200
      hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm
      focus:ring-slate-400 active:scale-[0.98]
    `,
    outline: `
      bg-transparent text-indigo-600 border border-indigo-300
      hover:bg-indigo-50 hover:border-indigo-400
      focus:ring-indigo-500 active:scale-[0.98]
    `,
    danger: `
      bg-gradient-to-br from-red-500 to-red-600 text-white
      hover:from-red-600 hover:to-red-700 hover:shadow-lg hover:shadow-red-500/30
      focus:ring-red-500 active:scale-[0.98]
    `,
    success: `
      bg-gradient-to-br from-emerald-500 to-emerald-600 text-white
      hover:from-emerald-600 hover:to-emerald-700 hover:shadow-lg hover:shadow-emerald-500/30
      focus:ring-emerald-500 active:scale-[0.98]
    `,
    warning: `
      bg-gradient-to-br from-amber-400 to-amber-500 text-white
      hover:from-amber-500 hover:to-amber-600 hover:shadow-lg hover:shadow-amber-500/25
      focus:ring-amber-400 active:scale-[0.98]
    `,
    ghost: `
      text-slate-600 hover:bg-slate-100 hover:text-slate-900
      px-3 py-1.5 text-sm focus:ring-slate-400 active:scale-[0.98]
    `,
  };

  return (
    <button
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
