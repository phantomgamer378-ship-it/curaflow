import type { ButtonHTMLAttributes } from "react";
import { cn } from "./utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn("ui-button", `ui-button--${variant}`, className)}
      type={type}
      {...props}
    />
  );
}
