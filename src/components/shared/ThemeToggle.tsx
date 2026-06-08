import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle({ size = "md" }: { size?: "sm" | "md" }) {
  const { theme, toggleTheme } = useTheme();
  const dim = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const icon = size === "sm" ? "h-4 w-4" : "h-[18px] w-[18px]";
  return (
    <button
      onClick={toggleTheme}
      title={theme === "dark" ? "Modo claro" : "Modo escuro"}
      className={`${dim} flex items-center justify-center rounded-lg border border-border bg-muted/30 text-muted-foreground transition hover:bg-accent hover:text-gold`}
    >
      {theme === "dark" ? <Sun className={icon} /> : <Moon className={icon} />}
    </button>
  );
}
