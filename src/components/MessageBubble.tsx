import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, CheckCheck, MoreHorizontal, Trash2, Smile, Plus } from "lucide-react"
import { format } from "date-fns"
import { client } from "@/lib/client"
import { useQueryClient } from "@tanstack/react-query"
import type { Message } from "@/lib/schemas"

interface MessageBubbleProps {
    message: Message
    isMe: boolean
    username: string
    roomId: string
}

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"]

export function MessageBubble({ message, isMe, username, roomId }: MessageBubbleProps) {
    const [showMenu, setShowMenu] = useState(false)
    const [showReactor, setShowReactor] = useState(false)
    const queryClient = useQueryClient()

    const handleReact = async (emoji: string) => {
        setShowReactor(false)
        setShowMenu(false)
        await client.api.messages.react.post({
            messageId: message.id,
            emoji
        }, { query: { roomID: roomId } })

        // Optimistic update could go here, but we rely on realtime/invalidation for now
        queryClient.invalidateQueries({ queryKey: ["messages", roomId] })
    }

    const handleDelete = async () => {
        if (!confirm("Delete this message?")) return
        setShowMenu(false)
        await client.api.messages.delete.delete({
            messageId: message.id
        }, { query: { roomID: roomId } })
        queryClient.invalidateQueries({ queryKey: ["messages", roomId] })
    }

    // Group reactions by emoji
    const reactionCounts = message.reactions?.reduce((acc, curr) => {
        acc[curr.emoji] = (acc[curr.emoji] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    if (message.deleted) {
        return (
            <div className={`flex w-full ${isMe ? "justify-end" : "justify-start"} mb-4`}>
                <div className="text-xs italic text-[var(--text-muted)] border border-[var(--border)] px-4 py-2 rounded-xl opacity-50">
                    Message deleted
                </div>
            </div>
        )
    }

    return (
        <div
            className={`group relative flex w-full ${isMe ? "justify-end" : "justify-start"} mb-6`}
            onMouseLeave={() => { setShowMenu(false); setShowReactor(false) }}
        >
            <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>

                {/* Metadata Header */}
                <div className={`flex items-center gap-2 mb-1 text-[11px] font-bold tracking-wide text-[var(--text-muted)] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                    <span className={isMe ? "text-[var(--primary)]" : "text-[var(--text)]"}>
                        {isMe ? "YOU" : message.sender}
                    </span>
                    <span className="opacity-50">
                        {format(message.timeStamp, "HH:mm")}
                    </span>
                    {isMe && (
                        <span className="text-[var(--primary)] opacity-70" title="Delivered">
                            <CheckCheck className="h-3 w-3" />
                        </span>
                    )}
                </div>

                {/* Bubble Container with Relative Menu */}
                <div className="relative">

                    {/* Menu Trigger */}
                    <div
                        className={`absolute top-0 ${isMe ? "-left-10" : "-right-10"} h-full flex items-center opacity-0 group-hover:opacity-100 transition-opacity`}
                    >
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-1.5 rounded-full hover:bg-[var(--elevated)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Popover Menu */}
                    <AnimatePresence>
                        {showMenu && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={`absolute z-20 bottom-full mb-2 ${isMe ? "right-0 origin-bottom-right" : "left-0 origin-bottom-left"} bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl p-1.5 flex gap-1 min-w-[200px] items-center`}
                            >
                                {!showReactor ? (
                                    <>
                                        <div className="flex gap-1 p-1 bg-[var(--bg)]/50 rounded-xl">
                                            {REACTIONS.map(emoji => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => handleReact(emoji)}
                                                    className="hover:scale-125 transition-transform p-1 text-lg"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => setShowReactor(true)}
                                                className="p-1.5 rounded-lg hover:bg-[var(--elevated)] text-[var(--text-muted)]"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </button>
                                        </div>
                                        {isMe && (
                                            <>
                                                <div className="w-px h-6 bg-[var(--border)] mx-1" />
                                                <button
                                                    onClick={handleDelete}
                                                    className="p-2 rounded-xl hover:bg-red-500/10 text-red-500 hover:text-red-600 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <div className="p-2 text-xs text-center w-full text-[var(--text-muted)]">
                                        More emojis coming soon...
                                        <button onClick={() => setShowReactor(false)} className="block w-full text-[var(--primary)] mt-1">Back</button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>


                    {/* Message Bubble */}
                    <div className={`relative px-5 py-3 text-[15px] leading-relaxed shadow-sm transition-all ${isMe
                        ? "rounded-[20px] rounded-tr-[4px] bg-[var(--primary)] text-[var(--bg)]"
                        : "rounded-[20px] rounded-tl-[4px] bg-[var(--surface)] border border-[var(--border)] text-[var(--text)]"
                        }`}>
                        {message.text}
                    </div>

                    {/* Reactions Display */}
                    {message.reactions && message.reactions.length > 0 && (
                        <div className={`absolute -bottom-5 ${isMe ? "right-0" : "left-0"} flex gap-1`}>
                            {Object.entries(reactionCounts || {}).map(([emoji, count]) => (
                                <motion.div
                                    key={emoji}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="bg-[var(--surface)] border border-[var(--border)] rounded-full px-1.5 py-0.5 text-[10px] font-bold shadow-sm flex items-center gap-1 cursor-pointer hover:border-[var(--primary)] transition-colors"
                                    onClick={() => handleReact(emoji)}
                                >
                                    <span>{emoji}</span>
                                    {count > 1 && <span className="text-[var(--text-muted)]">{count}</span>}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
