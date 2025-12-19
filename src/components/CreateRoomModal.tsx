"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Copy, Check, ArrowRight, Loader2 } from "lucide-react"
import { client } from "@/lib/client"

interface CreateRoomModalProps {
    isOpen: boolean
    onClose: () => void
}

export function CreateRoomModal({ isOpen, onClose }: CreateRoomModalProps) {
    const router = useRouter()
    const [roomId, setRoomId] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)

    // Generate room on open
    const createRoom = async () => {
        setLoading(true)
        try {
            const { data, error } = await client.api.room.create.post()
            if (data && !error) {
                setRoomId(data.roomID)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleCopy = () => {
        if (roomId) {
            navigator.clipboard.writeText(roomId)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleContinue = () => {
        if (roomId) {
            router.push(`/room/${roomId}`)
        }
    }

    useEffect(() => {
        if (isOpen && !roomId && !loading) {
            createRoom()
        }
    }, [isOpen])

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[var(--surface)]/80 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative w-full max-w-[500px] overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-2xl"
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-6 rounded-full bg-[var(--elevated)] p-4 text-[var(--primary)]">
                                {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : <div className="h-8 w-8" />}
                            </div>

                            <h2 className="mb-2 text-2xl font-bold text-[var(--text)]">Secure Room Created</h2>
                            <p className="mb-8 text-[var(--text-muted)]">Share this code to invite others completely anonymously.</p>

                            {/* Code Display */}
                            <div className="relative mb-8 w-full">
                                <div className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg)] px-6 py-5">
                                    <div className="font-mono text-3xl font-bold tracking-widest text-[var(--text)]">
                                        {roomId || "......"}
                                    </div>
                                    <button
                                        onClick={handleCopy}
                                        className="group flex items-center gap-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--elevated)]"
                                    >
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        {copied ? "Copied" : "Copy"}
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleContinue}
                                disabled={!roomId}
                                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] py-4 font-bold text-[var(--bg)] transition-all hover:bg-[var(--primary-hover)] active:scale-[0.98] disabled:opacity-50"
                            >
                                Continue to Room
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
