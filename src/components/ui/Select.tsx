import type { SelectHTMLAttributes } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
  containerClassName?: string;
  required?: boolean;
}

export const Select = ({
  label,
  options,
  error,
  placeholder,
  containerClassName = '',
  required,
  className = '',
  ...rest
}: SelectProps) => (
  <label className={`block ${containerClassName}`}>
    <span className="block text-xs font-medium text-slate-700 mb-1">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </span>
    <select
      {...rest}
      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:bg-slate-50 ${
        error ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'
      } ${className}`}
    >
      {placeholder && (
        <option value="">{placeholder}</option>
      )}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
    {error && <span className="block text-xs text-red-600 mt-1">{error}</span>}
  </label>
);
