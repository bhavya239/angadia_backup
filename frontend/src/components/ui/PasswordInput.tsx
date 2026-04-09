import { InputHTMLAttributes, forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, hint, className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="space-y-1.5 w-full">
        <label className="block text-sm font-semibold text-slate-700">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
        <div className="relative">
          <input
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            className={`
              w-full px-3.5 py-2.5 bg-white border rounded-xl text-slate-900 placeholder-slate-400
              focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500
              transition-all duration-200 disabled:bg-slate-50 disabled:text-slate-400 text-sm
              pr-10
              ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : 'border-slate-300'}
              ${className}
            `}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
            tabIndex={-1}
            title={showPassword ? "Hide password" : "Show password"}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
        {error && <p className="text-xs text-red-500 flex items-center gap-1">⚠ {error}</p>}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
