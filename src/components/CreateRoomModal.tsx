"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Copy, Check, ArrowRight, Loader2, Shield, User } from "lucide-react"
import { client } from "@/lib/client"
import { useUsername } from "@/hooks/use-username"

interface CreateRoomModalProps {
    isOpen: boolean
    onClose: () => void
}

export function CreateRoomModal({ isOpen, onClose }: CreateRoomModalProps) {
    const router = useRouter()
    const username = useUsername()
    const [step, setStep] = useState<"identity" | "create" | "key">("identity")
    const [roomId, setRoomId] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (!isOpen) {
            // Reset state when closed
            setStep("identity")
            setRoomId(null)
            setError("")
            setLoading(false)
        }
    }, [isOpen])

    const createRoom = async () => {
        setLoading(true)
        setError("")
        try {
            const { data, error } = await client.api.room.create.post()
            if (data && !error) {
                setRoomId(data.roomID)
                setStep("key")
            } else {
                throw error
            }
        } catch (e) {
            console.error(e)
            setError("Secure link generation failed.")
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
                        className="absolute inset-0 bg-[var(--surface)]/90 backdrop-blur-md"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 30, filter: "blur(10px)" }}
                        animate={{ scale: 1, opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ scale: 0.95, opacity: 0, y: 30, filter: "blur(10px)" }}
                        transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                        className="relative w-full max-w-[480px] overflow-hidden rounded-[2.5rem] border border-[var(--border)] bg-[var(--surface)] p-12 shadow-2xl shadow-[var(--primary)]/5"
                    >
                        <div className="flex flex-col items-center text-center">

                            {/* Step 1: Identity Confirmation */}
                            {step === "identity" && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="w-full flex flex-col items-center"
                                >
                                    <div className="mb-8 h-20 w-20 flex items-center justify-center rounded-full bg-[var(--elevated)] text-[var(--primary)] border border-[var(--border)] shadow-md">
                                        <User className="h-10 w-10" />
                                    </div>
                                    <h2 className="mb-2 text-3xl font-bold text-[var(--text)] tracking-tight">PingMe Identity</h2>
                                    <p className="mb-8 text-[var(--text-secondary)] text-sm font-medium">
                                        You will enter the secure channel as:
                                    </p>

                                    <div className="w-full bg-[var(--bg)] border border-[var(--border-strong)] rounded-2xl p-6 mb-8">
                                        <p className="font-mono text-center text-lg font-bold text-[var(--primary)] break-all">
                                            {username || "Loading..."}
                                        </p>
                                    </div>

                                    <button
                                        onClick={createRoom}
                                        disabled={!username || loading}
                                        className="group flex w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] py-5 font-bold text-[var(--bg)] text-lg transition-all hover:bg-[var(--primary-hover)] hover:shadow-lg hover:shadow-[var(--primary)]/20 active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "CREATE NEW ROOM"}
                                    </button>
                                </motion.div>
                            )}

                            {/* Step 2: Key Generation (Existing Logic) */}
                            {step === "key" && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="w-full flex flex-col items-center"
                                >
                                    <div className="mb-8 h-16 w-16 flex items-center justify-center rounded-2xl bg-[var(--elevated)] text-[var(--primary)] shadow-inner border border-[var(--border)]">
                                        <Shield className="h-8 w-8" />
                                    </div>

                                    <h2 className="mb-2 text-3xl font-bold text-[var(--text)] tracking-tight">Channel Key Generated</h2>
                                    <p className="mb-10 text-[var(--text-secondary)] text-sm font-medium">
                                        Share this 6-character key.
                                    </p>

                                    <div className="relative mb-8 w-full">
                                        <div className="flex w-full items-center justify-between rounded-2xl border border-[var(--border-strong)] bg-[var(--bg)] px-6 py-6 transition-colors hover:border-[var(--primary)]/30 group">
                                            <div className="font-mono text-4xl font-bold tracking-[0.2em] text-[var(--text)] text-center w-full">
                                                {roomId || "......"}
                                            </div>
                                            <button
                                                onClick={handleCopy}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--primary)] hover:bg-[var(--elevated)] transition-all active:scale-95"
                                                title="Copy Key"
                                            >
                                                {copied ? <Check className="h-4 w-4 text-[var(--primary)]" /> : <Copy className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleContinue}
                                        className="group flex w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] py-5 font-bold text-[var(--bg)] text-lg transition-all hover:bg-[var(--primary-hover)] hover:shadow-lg hover:shadow-[var(--primary)]/20 active:scale-[0.98]"
                                    >
                                        ENTER CHANNEL
                                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
