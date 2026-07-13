"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { flushSync } from "react-dom";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggle: () => {},
});

const STORAGE_KEY = "curaflow_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start with "light" to avoid SSR mismatch; real value applied after mount.
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // On mount: read localStorage → fall back to system preference.
    let resolved: Theme = "light";
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (stored === "dark" || stored === "light") {
        resolved = stored;
      } else {
        resolved = window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      }
    } catch {
      // private mode or no localStorage
    }
    setTheme(resolved);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme, mounted]);

  const toggle = useCallback((e?: React.MouseEvent | MouseEvent) => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    
    // Fallback if View Transitions API is not supported
    // @ts-ignore - startViewTransition is standard but typescript might not have it in all versions
    if (!document.startViewTransition || !e) {
      setTheme(nextTheme);
      return;
    }
    
    const x = e.clientX ?? window.innerWidth / 2;
    const y = e.clientY ?? window.innerHeight / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // @ts-ignore
    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setTheme(nextTheme);
      });
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];
      
      const isDark = nextTheme === "dark";
      
      document.documentElement.animate(
        {
          clipPath: isDark ? clipPath : [...clipPath].reverse(),
        },
        {
          duration: 600,
          easing: "cubic-bezier(0.85, 0, 0.15, 1)",
          pseudoElement: isDark ? "::view-transition-new(root)" : "::view-transition-old(root)",
        }
      );
    });
  }, [theme]);

  // Prevent flash: apply theme synchronously before first paint via inline script.
  // The inline script below is rendered server-side and runs before React hydrates.
  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      <script
        // biome-ignore lint: this must run before hydration
        dangerouslySetInnerHTML={{
          __html: `
(function(){
  try{
    var s=localStorage.getItem('${STORAGE_KEY}');
    var t=s==='dark'||s==='light'?s:window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';
    document.documentElement.setAttribute('data-theme',t);
  }catch(e){}
})();
          `.trim(),
        }}
      />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
