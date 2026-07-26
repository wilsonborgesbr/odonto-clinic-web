import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
  required?: boolean;
}

export const TextField = ({
  label,
  error,
  hint,
  containerClassName = '',
  required,
  className = '',
  ...rest
}: TextFieldProps) => (
  <label className={`block ${containerClassName}`}>
    <span className="block text-xs font-medium text-slate-700 mb-1">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </span>
    <input
      {...rest}
      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:bg-slate-50 disabled:text-slate-500 ${
        error ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'
      } ${className}`}
    />
    {error ? (
      <span className="block text-xs text-red-600 mt-1">{error}</span>
    ) : hint ? (
      <span className="block text-xs text-slate-400 mt-1">{hint}</span>
    ) : null}
  </label>
);

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  containerClassName?: string;
}

export const TextArea = ({
  label,
  error,
  containerClassName = '',
  className = '',
  ...rest
}: TextAreaProps) => (
  <label className={`block ${containerClassName}`}>
    <span className="block text-xs font-medium text-slate-700 mb-1">{label}</span>
    <textarea
      {...rest}
      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 ${
        error ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'
      } ${className}`}
    />
    {error && <span className="block text-xs text-red-600 mt-1">{error}</span>}
  </label>
);
