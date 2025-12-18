"use client"

import { useTheme } from "./theme-provider"
import { motion } from "framer-motion"
import { Sun, Moon } from "lucide-react"

export const ThemeToggle = ({ className }: { className?: string }) => {
    const { theme, toggleTheme } = useTheme()

    return (
        <button
            onClick={toggleTheme}
            className={`z-50 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-lg backdrop-blur-md transition-all hover:scale-110 hover:bg-[var(--elevated)] ${className || "fixed top-6 right-6"}`}
            title="Toggle Theme"
        >
            <motion.div
                key={theme}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
                {theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}
            </motion.div>
        </button>
    )
}
