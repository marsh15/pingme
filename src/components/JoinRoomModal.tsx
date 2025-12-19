"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { ArrowRight, Loader2, ShieldAlert, CheckCircle, Key, User } from "lucide-react"
import { client } from "@/lib/client"
import { useUsername } from "@/hooks/use-username"

interface JoinRoomModalProps {
    isOpen: boolean
    onClose: () => void
}

export function JoinRoomModal({ isOpen, onClose }: JoinRoomModalProps) {
    const router = useRouter()
    const username = useUsername()
    const [step, setStep] = useState<"identity" | "input">("identity")
    const [code, setCode] = useState("")
    const [isValid, setIsValid] = useState<boolean | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        if (!isOpen) {
            setStep("identity")
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
                    const res = await client.api.room.exists.get({ query: { roomID: code } })
                    if (res.error) throw res.error

                    if (res.data && res.data.exists) {
                        setIsValid(true)
                    } else {
                        setIsValid(false)
                        setError("Invalid or expired key")
                    }
                } catch (e: any) {
                    setIsValid(false)
                    if (e?.status === 404) setError("Channel does not exist")
                    else if (e?.status === 429) setError("Too many attempts")
                    else setError("Handshake failed. Retry.")
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
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[var(--surface)]/90 backdrop-blur-md"
                    />

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
                                        onClick={() => setStep("input")}
                                        disabled={!username}
                                        className="group flex w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] py-5 font-bold text-[var(--bg)] text-lg transition-all hover:bg-[var(--primary-hover)] hover:shadow-lg hover:shadow-[var(--primary)]/20 active:scale-[0.98] disabled:opacity-50"
                                    >
                                        CONTINUE TO JOIN
                                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                    </button>
                                </motion.div>
                            )}

                            {/* Step 2: Input Code (Existing Logic) */}
                            {step === "input" && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="w-full flex flex-col items-center"
                                >
                                    <div className="mb-8 h-16 w-16 flex items-center justify-center rounded-2xl bg-[var(--elevated)] text-[var(--primary)] shadow-inner border border-[var(--border)]">
                                        <Key className="h-8 w-8" />
                                    </div>

                                    <h2 className="mb-2 text-3xl font-bold text-[var(--text)] tracking-tight">Access Secure Channel</h2>
                                    <p className="mb-10 text-[var(--text-secondary)] text-sm font-medium">
                                        Authentication Required. Enter 6-digit access token.
                                    </p>

                                    <div className="relative mb-2 w-full group">
                                        <input
                                            type="text"
                                            value={code}
                                            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
                                            placeholder="KEY"
                                            className="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--bg)] px-6 py-6 text-center font-mono text-4xl font-bold tracking-[0.5em] text-[var(--text)] placeholder-[var(--text-muted)] outline-none transition-all duration-300 focus:border-[var(--primary)] focus:bg-[var(--surface)] focus:shadow-lg focus:shadow-[var(--primary)]/5"
                                            autoFocus
                                        />
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[var(--primary)]">
                                            {loading && <Loader2 className="h-6 w-6 animate-spin" />}
                                            {!loading && isValid === true && <CheckCircle className="h-6 w-6 text-[var(--primary)]" />}
                                            {!loading && isValid === false && <ShieldAlert className="h-6 w-6 text-[var(--error)]" />}
                                        </div>
                                    </div>

                                    <div className="h-8 flex items-center justify-center w-full mb-6">
                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-xs font-bold text-[var(--error)] bg-[var(--error)]/5 px-4 py-1.5 rounded-full border border-[var(--error)]/10"
                                            >
                                                {error}
                                            </motion.div>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleJoin}
                                        disabled={!isValid || loading}
                                        className="group flex w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] py-5 font-bold text-[var(--bg)] text-lg transition-all hover:bg-[var(--primary-hover)] hover:shadow-lg hover:shadow-[var(--primary)]/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
                                    >
                                        ESTABLISH UPLINK
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
