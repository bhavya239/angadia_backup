import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        <label className="block text-sm font-semibold text-slate-700">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
        <input
          ref={ref}
          className={`
            w-full px-3.5 py-2.5 bg-white border rounded-xl text-slate-900 placeholder-slate-400
            focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500
            transition-all duration-200 disabled:bg-slate-50 disabled:text-slate-400 text-sm
            ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : 'border-slate-300'}
            ${className}
          `}
          {...props}
        />
        {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
        {error && <p className="text-xs text-red-500 flex items-center gap-1">⚠ {error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
