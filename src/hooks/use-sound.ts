"use client"

import { useRef, useCallback, useEffect } from "react"

export function useSound(soundPath: string) {
    const audioRef = useRef<HTMLAudioElement | null>(null)

    // Initialize or update audio when path changes
    useEffect(() => {
        audioRef.current = new Audio(soundPath)
        audioRef.current.volume = 0.5
    }, [soundPath])

    const play = useCallback(() => {
        const audio = audioRef.current
        if (!audio) return

        audio.currentTime = 0
        audio.play().catch(() => {
            // User interaction requirement might block auto-play or rapid play
        })
    }, [])

    return play
}