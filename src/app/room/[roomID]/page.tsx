"use client"

import { useUsername } from "@/hooks/use-username"
import { useCountdown } from "@/hooks/use-countdown"
import { client } from "@/lib/client"
import { useRealtime } from "@/lib/realtime-client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Copy, Check, Send, Bomb, Clock, ChevronLeft, Shield, Lock } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"
import { MessageBubble } from "@/components/MessageBubble"

function formatTimeRemaining(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

const Page = () => {
  const params = useParams()
  const roomID = params.roomID as string
  const router = useRouter()

  const username = useUsername()
  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const [copyStatus, setCopyStatus] = useState("idle")
  const [hasJoined, setHasJoined] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [lastConnection, setLastConnection] = useState<{ user: string, action: string } | null>(null)
  const queryClient = useQueryClient()

  const { data: ttlData } = useQuery({
    queryKey: ["ttl", roomID],
    queryFn: async () => {
      const res = await client.api.room.ttl.get({ query: { roomID } })
      if (res.error) throw res.error
      return res.data
    },
    enabled: hasJoined,
    retry: 2,
    refetchOnWindowFocus: true,
    refetchInterval: 5000
  })

  const timeRemaining = useCountdown(
    ttlData?.ttl !== undefined ? ttlData.ttl : null
  )

  useEffect(() => {
    if (timeRemaining === null) return
    if (timeRemaining <= 0) {
      router.push("/?destroyed=true")
    }
  }, [timeRemaining, router])

  const joinedRef = useRef(false)
  useEffect(() => {
    const fn = async () => {
      if (roomID && !joinedRef.current) {
        joinedRef.current = true
        // Initial join ensures status is active and timer starts
        const { data, error } = await client.api.room.join.post({
          roomID,
          username
        })
        if (!error && data) {
          setHasJoined(true)
        } else {
          console.error("Join failed:", error)
          if ((error?.status as unknown as number) === 404) {
            router.push("/?error=room-not-found")
          } else if ((error?.status as unknown as number) === 409) {
            router.push("/?error=room-full")
          }
        }
      }
    }
    if (roomID) fn()
  }, [roomID, router])

  const { data: messages, refetch, isLoading } = useQuery({
    queryKey: ["messages", roomID],
    queryFn: async () => {
      const { data, error } = await client.api.messages.get({ query: { roomID } })
      if (error) throw error
      return data
    },
    enabled: hasJoined,
    refetchInterval: false
  })

  useEffect(() => {
    if (messages?.messages) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      await client.api.messages.post({ sender: username, text }, { query: { roomID } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", roomID] })
    },
  })

  useRealtime({
    channels: [roomID],
    onData: (data: any) => {
      if (data.event === "chat.message") {
        refetch()
      }
      if (data.event === "chat.destroy") {
        router.push("/?destroyed=true")
      }
      if (data.event === "chat.typing") {
        const { username: typer, isTyping } = data
        if (typer === username) return

        setTypingUsers(prev => {
          if (isTyping && !prev.includes(typer)) return [...prev, typer]
          if (!isTyping) return prev.filter(u => u !== typer)
          return prev
        })
      }
      if (data.event === "chat.connection") {
        const { username: connectedUser, action } = data
        if (connectedUser !== username) {
          setLastConnection({ user: connectedUser, action })
          setTimeout(() => setLastConnection(null), 3000)
        }
      }
    },
  })

  // Typing debounce logic
  useEffect(() => {
    if (!hasJoined) return
    const timeout = setTimeout(() => {
      client.api.messages.typing.post({ isTyping: input.length > 0, username }, { query: { roomID } })
    }, 300)
    return () => clearTimeout(timeout)
  }, [input, hasJoined, username, roomID])

  const { mutate: destroyRoom, isPending: isDestroying } = useMutation({
    mutationFn: async () => {
      await client.api.room.delete(null, { query: { roomID } })
    },
  })

  const copyLink = () => {
    navigator.clipboard.writeText(roomID)
    setCopyStatus("copied")
    setTimeout(() => setCopyStatus("idle"), 2000)
  }

  const handleSend = () => {
    if (input.trim() && !isPending) {
      const messageText = input.trim()
      setInput("")
      sendMessage({ text: messageText })
      inputRef.current?.focus()
    }
  }

  const isWarning = timeRemaining !== null && timeRemaining < 120
  const isCritical = timeRemaining !== null && timeRemaining < 60

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[var(--bg)] text-[var(--text)] selection:bg-[var(--primary)] selection:text-[var(--bg)] font-sans transition-colors duration-500">

      {/* HEADER */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)]/80 px-4 backdrop-blur-xl z-20 transition-colors duration-500 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="rounded-full p-2 hover:bg-[var(--elevated)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors active:scale-95"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-sm md:text-base">PINGME</span>
              <div className="flex items-center gap-1 rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider border border-[var(--primary)]/20">
                <Lock className="h-2.5 w-2.5" />
                <span>E2EE</span>
              </div>
            </div>

            {/* Green ID Style */}
            <div
              onClick={copyLink}
              className="flex items-center gap-1.5 cursor-pointer group mt-1 bg-[#10b981]/10 px-2 py-0.5 rounded-lg border border-[#10b981]/20 hover:bg-[#10b981]/20 transition-all"
            >
              <span className="text-xs font-mono font-bold text-[#10b981] tracking-widest">{roomID}</span>
              {copyStatus === "copied" ? <Check className="h-3 w-3 text-[#10b981]" /> : <Copy className="h-3 w-3 text-[#10b981] opacity-50 group-hover:opacity-100" />}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <ThemeToggle className="relative h-9 w-9 border border-[var(--border)] bg-transparent shadow-none" />
          </div>

          {/* Yellow Timer Badge */}
          <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 border transition-all duration-500 font-mono text-sm font-bold shadow-sm ${isCritical ? "bg-red-500/10 border-red-500/30 text-red-500 animate-pulse ring-1 ring-red-500/50" :
            // Default to Yellow/Orange as requested
            "bg-[#f59e0b]/10 border-[#f59e0b]/30 text-[#f59e0b]"
            }`}>
            <Clock className={`h-3.5 w-3.5 ${isPending || !hasJoined ? "animate-pulse opacity-50" : ""}`} />
            <span>
              {timeRemaining !== null ? formatTimeRemaining(timeRemaining) : "--:--"}
            </span>
          </div>

          <button
            onClick={() => destroyRoom()}
            disabled={isDestroying}
            className="group relative flex h-9 w-9 items-center justify-center rounded-full bg-[var(--elevated)] text-[var(--text-muted)] hover:bg-red-500 hover:text-white transition-all overflow-hidden border border-[var(--border)] hover:border-red-600 shadow-sm active:scale-95"
            title="Self-Destruct Protocol"
          >
            <Bomb className="h-4 w-4 relative z-10 transition-transform group-hover:shake" />
          </button>
        </div>
      </header>

      {/* CHAT AREA */}
      <div className="relative flex-1 overflow-hidden bg-cover bg-center">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at center, var(--text) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        <div
          ref={scrollContainerRef}
          className="h-full overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-[var(--border)] scrollbar-track-transparent"
        >
          <div className="mx-auto flex min-h-full max-w-4xl flex-col justify-end space-y-6">

            {/* System Info */}
            <div className="flex justify-center mb-8">
              <div className="flex flex-col items-center gap-2 max-w-xs text-center">
                <div className="h-10 w-10 rounded-full bg-[var(--elevated)] flex items-center justify-center text-[var(--primary)] border border-[var(--border)] shadow-sm">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="text-xs font-medium text-[var(--text-muted)] bg-[var(--surface)]/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-[var(--border)]">
                  Messages are end-to-end encrypted. No trace logs.
                </div>
              </div>
            </div>

            {/* Connection Notification */}
            <AnimatePresence>
              {lastConnection && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-center mb-4"
                >
                  <div className="text-xs font-bold text-[var(--text-muted)] bg-[var(--elevated)]/80 backdrop-blur px-3 py-1 rounded-full border border-[var(--border)] flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    {lastConnection.user} established uplink
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {isLoading && (
              <div className="flex justify-center p-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
              </div>
            )}

            {/* Messages */}
            <AnimatePresence initial={false}>
              {messages?.messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="w-full"
                >
                  <MessageBubble
                    message={msg}
                    isMe={msg.isMe}
                    username={username}
                    roomId={roomID}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* INPUT AREA */}
      <div className="shrink-0 bg-[var(--surface)]/90 backdrop-blur-xl p-4 md:p-6 border-t border-[var(--border)] z-20">
        <div className="mx-auto max-w-3xl">
          <div className="relative flex items-end gap-2 rounded-[1.5rem] border border-[var(--border-strong)] bg-[var(--bg)] p-1.5 pl-4 shadow-sm transition-all duration-300 focus-within:border-[var(--primary)] focus-within:ring-1 focus-within:ring-[var(--primary)]/20 focus-within:shadow-md">
            <input
              ref={inputRef}
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !isPending) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Type an encrypted message..."
              className="flex-1 bg-transparent py-3.5 text-sm md:text-base text-[var(--text)] placeholder-[var(--text-muted)] outline-none min-h-[48px]"
              autoComplete="off"
              disabled={isPending}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isPending}
              className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--bg)] shadow-sm transition-all hover:scale-105 hover:bg-[var(--primary-hover)] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
            >
              <Send className="h-5 w-5 ml-0.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>

          <div className="mt-3 flex justify-between items-center px-2">
            <div className="h-4">
              <AnimatePresence>
                {typingUsers.length > 0 && (
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs font-bold text-[var(--primary)] flex items-center gap-1"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-bounce delay-75" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-bounce delay-150" />
                    <span className="ml-1 opacity-80">{typingUsers.join(", ")} is typing...</span>
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[var(--text-muted)] opacity-60 font-semibold">
              <Lock className="h-2.5 w-2.5" />
              Secure Tunnel Active
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

export default Page