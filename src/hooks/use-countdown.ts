import { useEffect, useState, useRef } from 'react'

export const useCountdown = (initialSeconds: number | null) => {
    const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
    const endTimeRef = useRef<number | null>(null)

    useEffect(() => {
        if (initialSeconds === null) return

        // If we don't have an end time yet, calculate it.
        // We only recalculate if the new initialSeconds is drastically different (e.g. > 2s diff) 
        // to avoid jitter from server re-fetches.
        const now = Date.now()
        const prospectiveEndTime = now + initialSeconds * 1000

        if (!endTimeRef.current || Math.abs(prospectiveEndTime - endTimeRef.current) > 2000) {
            endTimeRef.current = prospectiveEndTime
            setSecondsLeft(initialSeconds)
        }

        const interval = setInterval(() => {
            if (!endTimeRef.current) return

            const now = Date.now()
            const diff = endTimeRef.current - now
            const left = Math.ceil(diff / 1000)

            setSecondsLeft(left > 0 ? left : 0)

            if (left <= 0) {
                clearInterval(interval)
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [initialSeconds])

    return secondsLeft
}
