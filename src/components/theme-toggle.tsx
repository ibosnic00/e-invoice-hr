"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="flex items-center gap-2"
    >
      {theme === "light" ? (
        <>
          <Moon className="h-4 w-4" />
          Tamni način
        </>
      ) : (
        <>
          <Sun className="h-4 w-4" />
          Svijetli način
        </>
      )}
    </Button>
  );
} 