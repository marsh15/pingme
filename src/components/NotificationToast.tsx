"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"

export function NotificationToast() {
    const searchParams = useSearchParams()
    const [notification, setNotification] = useState<string | null>(null)

    useEffect(() => {
        const error = searchParams.get('error')
        const destroyed = searchParams.get('destroyed')

        if (error === 'room-full') {
            setNotification('Room is at capacity (2 users max). Please try another room.')
        } else if (error === 'room-not-found') {
            setNotification('Room not found or expired. Create a new one.')
        } else if (destroyed === 'true') {
            setNotification('Room destroyed. All data has been permanently erased.')
        }

        if (error || destroyed) {
            setTimeout(() => setNotification(null), 8000)
        }
    }, [searchParams])

    return (
        <AnimatePresence>
            {notification && (
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] max-w-md w-full mx-4"
                >
                    <div className="glass rounded-2xl p-4 shadow-2xl flex items-start gap-3">
                        <div className="flex-1 text-sm text-[var(--text)]">
                            {notification}
                        </div>
                        <button
                            onClick={() => setNotification(null)}
                            className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
