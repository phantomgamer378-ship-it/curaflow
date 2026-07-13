"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

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

  const toggle = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

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
