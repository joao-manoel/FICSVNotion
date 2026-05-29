import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: ReactNode;
};

const variants = {
  primary: "bg-ink text-white hover:bg-black disabled:bg-neutral-400",
  secondary: "border border-line bg-white text-ink hover:bg-neutral-50",
  ghost: "text-muted hover:bg-neutral-100 hover:text-ink",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

export function Button({
  children,
  className = "",
  variant = "primary",
  icon,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      type={type}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
