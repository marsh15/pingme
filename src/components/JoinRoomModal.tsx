"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { ArrowRight, Loader2, ShieldAlert, CheckCircle } from "lucide-react"
import { client } from "@/lib/client"

interface JoinRoomModalProps {
    isOpen: boolean
    onClose: () => void
}

export function JoinRoomModal({ isOpen, onClose }: JoinRoomModalProps) {
    const router = useRouter()
    const [code, setCode] = useState("")
    const [isValid, setIsValid] = useState<boolean | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        if (isOpen) {
            setCode("")
            setIsValid(null)
            setError("")
            setLoading(false)
        }
    }, [isOpen])

    useEffect(() => {
        const validate = async () => {
            if (code.length === 6) {
                setLoading(true)
                setError("")
                try {
                    // @ts-ignore
                    const res = await client.api.room.exists.get({ query: { roomID: code } })
                    if (res.data && res.data.exists) {
                        setIsValid(true)
                    } else {
                        setIsValid(false)
                        setError("Room not found or expired")
                    }
                } catch (e) {
                    setIsValid(false)
                    setError("Connection error")
                } finally {
                    setLoading(false)
                }
            } else {
                setIsValid(null)
                setError("")
            }
        }

        const timer = setTimeout(validate, 500)
        return () => clearTimeout(timer)
    }, [code])

    const handleJoin = () => {
        if (isValid) {
            router.push(`/room/${code}`)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[var(--surface)]/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative w-full max-w-[500px] overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-2xl"
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-6 rounded-full bg-[var(--elevated)] p-4 text-[var(--primary)]">
                                <ArrowRight className="h-8 w-8" />
                            </div>

                            <h2 className="mb-2 text-2xl font-bold text-[var(--text)]">Join Secure Room</h2>
                            <p className="mb-8 text-[var(--text-muted)]">Enter the 6-character code shared with you.</p>

                            <div className="relative mb-2 w-full">
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
                                    placeholder="CODE"
                                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-6 py-5 text-center font-mono text-3xl font-bold tracking-[0.5em] text-[var(--text)] placeholder-[var(--text-muted)] outline-none transition-all focus:border-[var(--primary)] focus:bg-[var(--surface)]"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--primary)]">
                                    {loading && <Loader2 className="h-6 w-6 animate-spin" />}
                                    {!loading && isValid === true && <CheckCircle className="h-6 w-6 text-[var(--primary)]" />}
                                    {!loading && isValid === false && <ShieldAlert className="h-6 w-6 text-red-500" />}
                                </div>
                            </div>

                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-6 text-sm text-red-500 font-medium"
                                >
                                    {error}
                                </motion.p>
                            )}

                            <div className="h-4" />

                            <button
                                onClick={handleJoin}
                                disabled={!isValid || loading}
                                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--elevated)] py-4 font-bold text-[var(--text)] transition-all hover:bg-[var(--primary)] hover:text-[var(--bg)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Join Room
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
