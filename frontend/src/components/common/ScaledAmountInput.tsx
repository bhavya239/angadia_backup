import React, { useState, useEffect } from 'react';
import { formatScaledCurrency, unscaleAmount } from '../../utils/numberScale';

interface ScaledAmountInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number; // The actual backend value (unscaled)
  onChange: (value: number) => void;
  label?: string;
  error?: string;
  hint?: string;
}

export const ScaledAmountInput = React.forwardRef<HTMLInputElement, ScaledAmountInputProps>(
  ({ value, onChange, label, error, hint, className = '', ...props }, ref) => {
    // We maintain a local string state for the display value since the user can type commas or dots
    const [displayValue, setDisplayValue] = useState<string>('');

    // Sync external value to display value on load or pure external change.
    // Avoid updating internal visual state if the user is currently focused to prevent cursor jump or override.
    useEffect(() => {
      if (document.activeElement !== document.getElementById(props.id || '')) {
        if (value || value === 0) {
          // Format visually with commas but without the currency symbol
          const formatted = formatScaledCurrency(value, { showSymbol: false }).replace(/\.00$/, '');
          setDisplayValue(value === 0 ? '' : formatted); 
        } else {
          setDisplayValue('');
        }
      }
    }, [value, props.id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Allow user to type numbers, comma, dot freely
      const val = e.target.value;
      
      // Basic restriction to digit, dot, comma
      if (val !== '' && !/^[0-9.,]+$/.test(val)) return;

      setDisplayValue(val);
      
      // Compute unscaled dynamically to propagate up quickly (for reactive previews)
      const numericVal = parseFloat(val.replace(/,/g, ''));
      if (!isNaN(numericVal)) {
        onChange(unscaleAmount(numericVal));
      } else {
        onChange(0);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Format fully on blur to give a correct comma-separated Indian numbering
      const numericVal = parseFloat(displayValue.replace(/,/g, ''));
      if (!isNaN(numericVal)) {
        const unscaled = unscaleAmount(numericVal);
        onChange(unscaled);
        // Update representation beautifully
        setDisplayValue(formatScaledCurrency(unscaled, { showSymbol: false, decimals: 2 }));
      } else {
        onChange(0);
        setDisplayValue('');
      }
      
      if (props.onBlur) props.onBlur(e);
    };

    return (
      <div className="space-y-1.5 flex-1">
        {label && (
          <label className="block text-sm font-semibold text-slate-700">
            {label} {props.required && <span className="text-red-400">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            id={props.id}
            ref={ref}
            type="text"
            className={`w-full px-4 py-2.5 bg-white border ${
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20'
            } rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 transition-all ${className}`}
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-500 mt-1 font-medium flex items-center gap-1">⚠ {error}</p>}
        {hint && !error && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
      </div>
    );
  }
);

ScaledAmountInput.displayName = 'ScaledAmountInput';
