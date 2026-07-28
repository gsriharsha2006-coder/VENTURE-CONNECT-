import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "dark";
  size?: "sm" | "md" | "lg";
};

const variants = {
  primary:
    "bg-primary text-white shadow-sm hover:bg-primary-deep active:bg-blue-800 focus-visible:outline-primary",
  secondary:
    "border border-slate-300 bg-white text-slate-800 shadow-sm hover:border-blue-300 hover:bg-blue-50 active:bg-blue-100",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
  dark: "bg-slate-950 text-white shadow-sm hover:bg-slate-800 active:bg-slate-700 focus-visible:outline-slate-950"
};

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base"
};

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
