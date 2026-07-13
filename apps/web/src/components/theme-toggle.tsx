"use client";

import { useTheme } from "@/components/theme-provider";
import { Moon, Sun } from "lucide-react";

interface ThemeToggleProps {
  /** Extra CSS class to apply to the button. */
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
      className={className}
      style={{
        alignItems: "center",
        background: "none",
        border: "1px solid var(--line)",
        borderRadius: "50%",
        color: "var(--muted)",
        cursor: "pointer",
        display: "inline-flex",
        height: "36px",
        justifyContent: "center",
        transition: "background 160ms ease, color 160ms ease, border-color 160ms ease",
        width: "36px",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "var(--mint)";
        (e.currentTarget as HTMLButtonElement).style.color = "var(--brand)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--brand)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "none";
        (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--line)";
      }}
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
