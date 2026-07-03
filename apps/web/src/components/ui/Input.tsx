import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from "react";

const BASE_CLASS =
  "w-full rounded border border-border bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-fast focus:border-accent focus:outline-none disabled:opacity-40";

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string };

export function Input({ label, error, className = "", id, ...rest }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={inputId} className="text-xs text-text-secondary">{label}</label>}
      <input id={inputId} className={`${BASE_CLASS} ${error ? "border-status-danger" : ""} ${className}`} {...rest} />
      {error && <p className="text-xs text-status-danger">{error}</p>}
    </div>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string };

export function Textarea({ label, error, className = "", id, ...rest }: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={inputId} className="text-xs text-text-secondary">{label}</label>}
      <textarea id={inputId} className={`${BASE_CLASS} resize-none ${error ? "border-status-danger" : ""} ${className}`} {...rest} />
      {error && <p className="text-xs text-status-danger">{error}</p>}
    </div>
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string; children: ReactNode };

export function Select({ label, error, className = "", id, children, ...rest }: SelectProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={inputId} className="text-xs text-text-secondary">{label}</label>}
      <select id={inputId} className={`${BASE_CLASS} ${error ? "border-status-danger" : ""} ${className}`} {...rest}>
        {children}
      </select>
      {error && <p className="text-xs text-status-danger">{error}</p>}
    </div>
  );
}
