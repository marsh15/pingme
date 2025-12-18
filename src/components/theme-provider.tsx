"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark"

const ThemeContext = createContext<{
    theme: Theme
    toggleTheme: () => void
}>({ theme: "light", toggleTheme: () => { } })

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    // Default to light as per "minimalist pure" initial vibe, but respect system/storage
    const [theme, setTheme] = useState<Theme>("light")
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const saved = localStorage.getItem("theme") as Theme
        if (saved) {
            setTheme(saved)
        } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
            setTheme("dark")
        }
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!mounted) return
        const root = window.document.documentElement
        root.classList.remove("light", "dark")
        root.classList.add(theme)
        localStorage.setItem("theme", theme)
    }, [theme, mounted])

    const toggleTheme = () => {
        setTheme((prev) => (prev === "light" ? "dark" : "light"))
    }

    // Prevent flash by rendering nothing until mounted? Or allow render with default?
    // For landing page, it's better to render default to avoid layout shift, but colors might snap.
    // We'll return children always, but effect handles the class.
    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => useContext(ThemeContext)
