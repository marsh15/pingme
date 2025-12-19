import { redis } from "@/lib/redis"
import { Elysia } from "elysia"
import { z } from "zod"
import { nanoid, customAlphabet } from "nanoid"
import { authMiddleware } from "./auth"

import { Message, realtime } from "@/lib/realtime"

const ROOM_TTL_SECONDS = 60 * 10
const PENDING_TTL_SECONDS = 60 * 60 // 1 hour pending time

const generateRoomID = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6)

const rooms = new Elysia({ prefix: "/room" })
    .post("/create", async () => {
        const roomID = generateRoomID()

        await redis.hset(`meta:${roomID}`, {
            connected: [],
            createdAt: Date.now(),
            status: "pending", // Initial state
        })

        await redis.expire(`meta:${roomID}`, PENDING_TTL_SECONDS)

        return { roomID }
    })
    .post('/join', async ({ body: requestBody, cookie, set }) => {
        const { roomID, username } = requestBody

        const exists = await redis.exists(`meta:${roomID}`)
        if (!exists) {
            set.status = 404
            return "Room not found"
        }

        const existingToken = cookie["x-auth-token"]?.value
        if (existingToken) {
            const isMember = await redis.sismember(`connected:${roomID}`, existingToken)
            if (isMember) {
                return { token: existingToken }
            }
        }

        const count = await redis.scard(`connected:${roomID}`)
        if (count >= 50) {
            set.status = 409
            return "Room is full"
        }

        const token = nanoid()

        // Check for pending status to activate room
        const meta = await redis.hgetall(`meta:${roomID}`) as Record<string, string>
        let validTTL: number

        if (meta && meta.status === "pending") {
            // Activate the room
            await redis.hset(`meta:${roomID}`, {
                status: "active",
                startedAt: Date.now(),
            })
            // Set the actual game TTL
            await redis.expire(`meta:${roomID}`, ROOM_TTL_SECONDS)
            validTTL = ROOM_TTL_SECONDS
        } else {
            const ttl = await redis.ttl(`meta:${roomID}`)
            validTTL = ttl > 0 ? ttl : ROOM_TTL_SECONDS
        }

        await redis.sadd(`connected:${roomID}`, token)
        await redis.expire(`connected:${roomID}`, validTTL)

        // Emit connection event
        const joinedUsername = username || "Anonymous"
        await realtime.channel(roomID).emit("chat.connection", {
            username: joinedUsername,
            action: "joined",
            timestamp: Date.now()
        })

        cookie["x-auth-token"].set({
            value: token,
            path: "/",
            httpOnly: true,
            maxAge: validTTL,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        })

        return { token }
    }, {
        body: z.object({
            roomID: z.string(),
            username: z.string().optional()
        })
    })
    .get(
        "/exists",
        async ({ query }) => {
            const exists = await redis.exists(`meta:${query.roomID}`)
            return { exists: exists === 1 }
        },
        { query: z.object({ roomID: z.string() }) }
    )
    .use(authMiddleware)
    .get(
        "/ttl",
        async ({ auth }) => {
            const ttl = await redis.ttl(`meta:${auth.roomID}`)
            return { ttl: ttl > 0 ? ttl : 0 }
        },
        { query: z.object({ roomID: z.string() }) }
    )

    .delete(
        "/",
        async ({ auth }) => {
            await realtime.channel(auth.roomID).emit("chat.destroy", { isDestroyed: true })

            await Promise.all([
                redis.del(auth.roomID),
                redis.del(`meta:${auth.roomID}`),
                redis.del(`messages:${auth.roomID}`),
                redis.del(`connected:${auth.roomID}`),
                redis.del(`history:${auth.roomID}`),
            ])
            return { success: true }
        },
        { query: z.object({ roomID: z.string() }) }
    )

const messages = new Elysia({ prefix: "/messages" })
    .use(authMiddleware)
    .post(
        "/",
        async ({ body, auth }) => {
            const { sender, text } = body
            const { roomID } = auth

            const roomExists = await redis.exists(`meta:${roomID}`)

            if (!roomExists) {
                throw new Error("Room does not exist")
            }

            const message: Message = {
                id: nanoid(),
                sender,
                text,
                timeStamp: Date.now(),
                roomID,
            }


            await redis.rpush(`messages:${roomID}`, { ...message, token: auth.token })
            await realtime.channel(roomID).emit("chat.message", message)

            const remaining = await redis.ttl(`meta:${roomID}`)

            await redis.expire(`messages:${roomID}`, remaining)
            await redis.expire(`history:${roomID}`, remaining)
            await redis.expire(roomID, remaining)
        },
        {
            query: z.object({ roomID: z.string() }),
            body: z.object({
                sender: z.string().max(100),
                text: z.string().max(1000),
            }),
        }
    )
    .get(
        "/",
        async ({ auth }) => {
            const messages = await redis.lrange<Message>(`messages:${auth.roomID}`, 0, -1)

            return {
                messages: messages.map((m) => ({
                    ...m,
                    isMe: m.token === auth.token,
                })),
            }
        },
        { query: z.object({ roomID: z.string() }) }
    )
    .post(
        "/react",
        async ({ body, auth }) => {
            const { messageId, emoji } = body
            const { roomID } = auth

            const messages = await redis.lrange<Message>(`messages:${roomID}`, 0, -1)
            const index = messages.findIndex((m) => m.id === messageId)

            if (index === -1) {
                throw new Error("Message not found")
            }

            const message = messages[index]
            const updatedReactions = message.reactions || []

            // Check if user already reacted with this emoji
            const existingReactionIndex = updatedReactions.findIndex(
                (r) => r.emoji === emoji && r.username === auth.token
            )

            if (existingReactionIndex > -1) {
                // Remove reaction (toggle)
                updatedReactions.splice(existingReactionIndex, 1)
            } else {
                // Add reaction
                updatedReactions.push({
                    emoji,
                    username: auth.token || "anon",
                    timestamp: Date.now(),
                })
            }

            const updatedMessage = { ...message, reactions: updatedReactions }
            await redis.lset(`messages:${roomID}`, index, updatedMessage)

            await realtime.channel(roomID).emit("chat.message", updatedMessage)
        },
        {
            query: z.object({ roomID: z.string() }),
            body: z.object({
                messageId: z.string(),
                emoji: z.string(),
            }),
        }
    )
    .delete(
        "/delete",
        async ({ body, auth }) => {
            const { messageId } = body
            const { roomID } = auth

            const messages = await redis.lrange<Message>(`messages:${roomID}`, 0, -1)
            const index = messages.findIndex((m) => m.id === messageId)

            if (index === -1) {
                throw new Error("Message not found")
            }

            const message = messages[index]

            // Only allow deletion if sender matches token
            if (message.token !== auth.token) {
                throw new Error("Unauthorized")
            }

            const updatedMessage = { ...message, deleted: true, text: "This message was deleted." }
            await redis.lset(`messages:${roomID}`, index, updatedMessage)

            await realtime.channel(roomID).emit("chat.message", updatedMessage)
        },
        {
            query: z.object({ roomID: z.string() }),
            body: z.object({
                messageId: z.string(),
            }),
        }
    )
    .post(
        "/typing",
        async ({ body, auth }) => {
            const { isTyping, username } = body
            const { roomID } = auth

            await realtime.channel(roomID).emit("chat.typing", {
                username,
                isTyping
            })
        },
        {
            query: z.object({ roomID: z.string() }),
            body: z.object({
                isTyping: z.boolean(),
                username: z.string()
            })
        }
    )

const app = new Elysia({ prefix: "/api" }).use(rooms).use(messages)

export const GET = app.handle
export const POST = app.handle
export const DELETE = app.handle

export type App = typeof app
