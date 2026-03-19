// components/ThemeToggle.tsx
"use client";

import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch
    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    return (
        <Button
            variant="ghost"
            size="icon"
            className={'p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full transition-colors'}
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}

        >
            {theme === "light" ? <MoonIcon size={22} /> : <SunIcon size={22} />}
        </Button>
    );
}