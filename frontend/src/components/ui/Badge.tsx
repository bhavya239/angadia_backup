interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'purple' | 'indigo';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export function Badge({ children, variant = 'default', size = 'sm', dot = false }: BadgeProps) {
  const variants = {
    default:  'bg-slate-100 text-slate-600 border border-slate-200',
    success:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
    danger:   'bg-red-50 text-red-600 border border-red-200',
    warning:  'bg-amber-50 text-amber-700 border border-amber-200',
    info:     'bg-sky-50 text-sky-700 border border-sky-200',
    purple:   'bg-purple-50 text-purple-700 border border-purple-200',
    indigo:   'bg-indigo-50 text-indigo-700 border border-indigo-200',
  };

  const dotColors = {
    default: 'bg-slate-400',
    success: 'bg-emerald-500',
    danger:  'bg-red-500',
    warning: 'bg-amber-500',
    info:    'bg-sky-500',
    purple:  'bg-purple-500',
    indigo:  'bg-indigo-500',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full ${variants[variant]} ${sizeClasses[size]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
}
