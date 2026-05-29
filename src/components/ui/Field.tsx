import type { InputHTMLAttributes, ReactNode } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: ReactNode;
};

export function Field({ label, hint, className = "", ...props }: FieldProps) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-ink">{label}</span>
      <input
        className={`h-10 rounded-lg border border-line bg-white/85 px-3 text-sm text-ink outline-none transition placeholder:text-neutral-400 focus:border-accent focus:ring-2 focus:ring-accent/20 ${className}`}
        {...props}
      />
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}
