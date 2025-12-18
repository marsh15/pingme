"use client"

import { useUsername } from "@/hooks/use-username"
import { client } from "@/lib/client"
import { useRealtime } from "@/lib/realtime-client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Copy, Check, Send, Bomb, Clock, ChevronLeft, Shield } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"

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
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [hasJoined, setHasJoined] = useState(false)
  const queryClient = useQueryClient()

  // 1. Fetch TTL
  const { data: ttlData } = useQuery({
    queryKey: ["ttl", roomID],
    queryFn: async () => {
      const res = await client.api.room.ttl.get({ query: { roomID } })
      return res.data
    },
  })

  // 2. Sync TTL
  useEffect(() => {
    if (ttlData?.ttl !== undefined) setTimeRemaining(ttlData.ttl)
  }, [ttlData])

  // 3. Countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining < 0) return

    if (timeRemaining === 0) {
      router.push("/?destroyed=true")
      return
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeRemaining, router])

  // 4. Join
  useEffect(() => {
    const fn = async () => {
      if (roomID) {
        const { error } = await client.api.room.join.post({ roomID })
        if (!error) setHasJoined(true)
      }
    }
    fn()
  }, [roomID])

  // 5. Messages
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

  // 7. Send
  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      await client.api.messages.post({ sender: username, text }, { query: { roomID } })
      setInput("")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", roomID] })
    },
  })

  // 8. Realtime
  useRealtime({
    channels: [roomID],
    onData: (data: any) => {
      if (data.event === "chat.message") {
        refetch()
      }
      if (data.event === "chat.destroy") {
        router.push("/?destroyed=true")
      }
    },
  })

  // 9. Destroy
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
    if (input.trim()) {
      sendMessage({ text: input })
      inputRef.current?.focus()
    }
  }

  const isWarning = timeRemaining !== null && timeRemaining < 120
  const isCritical = timeRemaining !== null && timeRemaining < 60

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[var(--bg)] text-[var(--text)] selection:bg-[var(--primary)] selection:text-[var(--bg)] font-sans transition-colors duration-500">

      {/* HEADER */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)]/80 px-4 backdrop-blur-xl z-10 transition-colors duration-500">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/')} className="rounded-full p-2 hover:bg-[var(--elevated)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight">PINGME</span>
              <span className="rounded bg-[var(--primary)]/5 px-1.5 py-0.5 text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider">Secure</span>
            </div>
            <div onClick={copyLink} className="flex items-center gap-1.5 cursor-pointer group">
              <span className="text-xs font-mono text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors">ID: {roomID}</span>
              {copyStatus === "copied" ? <Check className="h-3 w-3 text-[var(--primary)]" /> : <Copy className="h-3 w-3 text-[var(--text-muted)] group-hover:text-[var(--text)]" />}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle className="relative h-9 w-9 border border-[var(--border)] bg-transparent shadow-none" />

          {/* Timer Badge */}
          <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 border transition-all duration-500 ${isCritical ? "bg-red-500/10 border-red-500/30 text-red-500 animate-pulse" :
            isWarning ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-500" :
              "bg-[var(--elevated)] border-[var(--border)] text-[var(--text-muted)]"
            }`}>
            <Clock className="h-3.5 w-3.5" />
            <span className="font-mono text-sm font-bold">
              {timeRemaining !== null ? formatTimeRemaining(timeRemaining) : "--:--"}
            </span>
          </div>

          <button
            onClick={() => destroyRoom()}
            disabled={isDestroying}
            className="group relative flex h-9 w-9 items-center justify-center rounded-full bg-[var(--elevated)] text-[var(--text-muted)] hover:bg-red-500 hover:text-white transition-all overflow-hidden"
            title="Destroy Room"
          >
            <div className="absolute inset-0 bg-red-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <Bomb className="h-4 w-4 relative z-10" />
          </button>
        </div>
      </header>

      {/* CHAT AREA */}
      <div className="relative flex-1 overflow-hidden">
        <div
          ref={scrollContainerRef}
          className="h-full overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-[var(--secondary)] scrollbar-track-transparent"
        >
          <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-end space-y-6">

            {/* Empty State */}
            {!isLoading && messages?.messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <Shield className="h-16 w-16 text-[var(--text-muted)] mb-4" />
                <p className="text-[var(--text-muted)] text-sm">No messages yet. Start the encrypted session.</p>
              </div>
            )}

            {isLoading && (
              <div className="flex justify-center p-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages?.messages.map((msg) => {
                const isMe = msg.isMe
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex max-w-[70%] flex-col ${isMe ? "items-end" : "items-start"}`}>
                      <div className="mb-1 flex items-center gap-2 px-1">
                        {!isMe && (
                          <span className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider">{msg.sender}</span>
                        )}
                      </div>

                      <div className={`relative px-4 py-3 text-[15px] leading-relaxed shadow-sm ${isMe
                        ? "rounded-[18px] rounded-br-[4px] bg-[var(--primary)] text-[var(--bg)]"
                        : "rounded-[18px] rounded-bl-[4px] bg-[var(--surface)] border border-[var(--border)] text-[var(--text)]"
                        }`}>
                        {msg.text}
                      </div>

                      <span className="mt-1 px-1 text-[10px] font-medium text-[var(--text-muted)]">
                        {format(msg.timeStamp, "HH:mm")}
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* INPUT AREA */}
      <div className="shrink-0 bg-[var(--surface)] p-4 border-t border-[var(--border)] transition-colors duration-500">
        <div className="mx-auto max-w-3xl">
          <div className="relative flex items-end gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-2 ring-1 ring-[var(--border)] focus-within:ring-[var(--primary)]/20 focus-within:border-[var(--primary)]/20 transition-all shadow-sm">
            <input
              ref={inputRef}
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend()
              }}
              placeholder="Type an encrypted message..."
              className="flex-1 bg-transparent px-4 py-3 text-sm text-[var(--text)] placeholder-[var(--text-muted)] outline-none"
              autoComplete="off"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isPending}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-[var(--bg)] shadow-lg shadow-[var(--shadow)] transition-all hover:scale-105 hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-2 text-center">
            <p className="flex items-center justify-center gap-1.5 text-[10px] text-[var(--text-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
              End-to-end encrypted connection
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

export default Page